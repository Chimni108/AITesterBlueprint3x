"""Stage 2 (Chat) pipeline: question -> rewrite -> embed -> dense + sparse
search -> RRF fuse -> rerank -> generate -> grounded answer.

Like ingestion.run_ingestion, `run_chat` is a generator so app.py can stream
each stage to the UI over SSE as it completes.
"""

import time

from . import config, embeddings, llm, mode_detect, reranker, vectorstore


def _merge_points(point_lists, top_k):
    """Dedupe ScoredPoints across multiple query-variant searches, keeping the
    best score seen for each point id."""
    best = {}
    for points in point_lists:
        for point in points:
            if point.id not in best or point.score > best[point.id].score:
                best[point.id] = point
    ranked = sorted(best.values(), key=lambda p: p.score, reverse=True)
    return ranked[:top_k]


def _preview_points(points, n=10):
    return [
        {"id": p.id, "score": round(p.score, 4), "text": (p.payload or {}).get("text", "")[:160], "payload": p.payload}
        for p in points[:n]
    ]


def _preview_candidates(candidates, score_key, n=10):
    return [
        {"id": c["id"], "score": round(c.get(score_key, 0.0), 4), "text": c["text"][:160]}
        for c in candidates[:n]
    ]


def run_chat(question: str):
    t0 = time.time()

    mode = mode_detect.detect_mode(question)
    yield {"stage": "mode", "status": "done", "mode": mode}

    client = vectorstore.get_client()
    if not vectorstore.collection_exists(client, config.COLLECTION_NAME):
        yield {"stage": "error", "status": "done", "message": "No data has been ingested yet - upload a file first."}
        return

    yield {"stage": "rewrite", "status": "start"}
    rewrites = llm.rewrite_query(question) if config.REWRITE_ENABLED else [question]
    yield {"stage": "rewrite", "status": "done", "rewrites": rewrites}

    query_variants = [question] + [r for r in rewrites if r.strip().lower() != question.strip().lower()]

    yield {"stage": "embed", "status": "start", "query_count": len(query_variants)}
    query_vecs = [embeddings.embed_query(q) for q in query_variants]
    primary = query_vecs[0]
    yield {"stage": "embed", "status": "done", "query_count": len(query_variants)}

    yield {"stage": "search", "status": "start"}
    dense_top = vectorstore.dense_search(client, config.COLLECTION_NAME, primary["dense"], config.TOP_N_HYBRID)
    sparse_top = vectorstore.sparse_search(client, config.COLLECTION_NAME, primary["sparse"], config.TOP_N_HYBRID)

    fused_per_variant = [
        vectorstore.hybrid_rrf_search(
            client, config.COLLECTION_NAME, vec["dense"], vec["sparse"], config.TOP_N_HYBRID, config.RRF_K
        )
        for vec in query_vecs
    ]
    fused_top = _merge_points(fused_per_variant, config.TOP_N_HYBRID)

    yield {
        "stage": "search",
        "status": "done",
        "dense_top": _preview_points(dense_top),
        "sparse_top": _preview_points(sparse_top),
        "fused_top": _preview_points(fused_top),
    }

    yield {"stage": "rerank", "status": "start", "candidate_count": len(fused_top)}
    candidates = [
        {"id": p.id, "text": (p.payload or {}).get("text", ""), "payload": p.payload, "pre_score": p.score}
        for p in fused_top
    ]
    reranked = reranker.rerank(question, candidates)
    top_k = reranked[: config.TOP_K_RERANK]
    yield {
        "stage": "rerank",
        "status": "done",
        "before": _preview_candidates(candidates, "pre_score"),
        "after": _preview_candidates(top_k, "rerank_score"),
    }

    yield {"stage": "generate", "status": "start", "mode": mode}
    try:
        if mode == "generate":
            answer = llm.generate_test_case(question, top_k)
        else:
            answer = llm.generate_answer(question, top_k)
    except llm.LLMError as exc:
        yield {"stage": "error", "status": "done", "message": str(exc)}
        return

    yield {
        "stage": "generate",
        "status": "done",
        "mode": mode,
        "answer": answer,
        "citations": [{"n": i + 1, "id": c["id"], "payload": c["payload"]} for i, c in enumerate(top_k)],
        "used_chunk_ids": [c["id"] for c in top_k],
        "elapsed_total": round(time.time() - t0, 2),
    }
