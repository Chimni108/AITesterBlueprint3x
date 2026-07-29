"""Hybrid retrieval: embed the query both ways, RRF-fused search, citation assembly."""
from app.embedding import get_embedder
from app.vectorstore import get_store


def _citation(payload: dict) -> str:
    cite = payload.get("path", "unknown")
    if payload.get("ticket_key"):
        cite = payload["ticket_key"]
    if payload.get("page"):
        cite += f" (page {payload['page']})"
    if payload.get("row"):
        cite += f" (row {payload['row']})"
    return cite


def retrieve(question: str, top_k: int | None = None) -> list[dict]:
    dense_q, sparse_q = get_embedder().embed_query(question)
    kwargs = {"top_k": top_k} if top_k else {}
    points = get_store().hybrid_search(dense_q, sparse_q, **kwargs)
    results = []
    for point in points:
        p = point.payload or {}
        results.append(
            {
                "text": p.get("text", ""),
                "citation": _citation(p),
                "source": p.get("source", ""),
                "title": p.get("title", ""),
                "score": point.score,
            }
        )
    return results
