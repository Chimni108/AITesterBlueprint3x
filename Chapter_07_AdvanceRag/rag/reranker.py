"""bge-reranker-v2-m3 cross-encoder: re-scores (query, chunk) pairs directly,
which is slower but far more precise than vector similarity alone. Applied
only to the small top-N shortlist that survives hybrid retrieval + RRF."""

from . import config

_reranker = None


def get_reranker():
    global _reranker
    if _reranker is None:
        from FlagEmbedding import FlagReranker

        _reranker = FlagReranker(config.RERANK_MODEL_NAME, use_fp16=config.BGE_USE_FP16)
    return _reranker


def rerank(query: str, candidates: list[dict]) -> list[dict]:
    """candidates: list of dicts each containing a "text" key. Returns the same
    dicts (copied) with a "rerank_score" key added, sorted best-first."""
    if not candidates:
        return []

    reranker = get_reranker()
    pairs = [[query, c["text"]] for c in candidates]
    scores = reranker.compute_score(pairs, normalize=True)
    if isinstance(scores, float):
        scores = [scores]

    scored = []
    for candidate, score in zip(candidates, scores):
        item = dict(candidate)
        item["rerank_score"] = float(score)
        scored.append(item)

    scored.sort(key=lambda item: item["rerank_score"], reverse=True)
    return scored
