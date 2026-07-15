"""Query pipeline: question -> embed -> retrieve top K -> generate grounded answer.

A generator so main.py can stream each stage over SSE, mirroring ingestion.py.
"""

import time

from . import config, embeddings, llm, vectorstore
from .sse_utils import call_with_heartbeat


def run_query(question: str):
    t0 = time.time()

    client = vectorstore.get_client()
    if not vectorstore.collection_exists(client):
        yield {"stage": "error", "status": "done", "message": "No data has been ingested yet - ingest the PDF first."}
        return

    collection = vectorstore.get_collection(client)
    if vectorstore.count(collection) == 0:
        yield {"stage": "error", "status": "done", "message": "The collection is empty - ingest the PDF first."}
        return

    yield {"stage": "embed", "status": "start"}
    yield from call_with_heartbeat(embeddings.get_embedder, "embed")  # no-op if already loaded
    query_vector = embeddings.embed_query(question)
    yield {"stage": "embed", "status": "done"}

    yield {"stage": "retrieve", "status": "start", "top_k": config.TOP_K}
    hits = vectorstore.query(collection, query_vector, config.TOP_K)
    yield {
        "stage": "retrieve",
        "status": "done",
        "hits": [
            {
                "id": h["id"],
                "page": h["metadata"]["page"],
                "similarity": round(h["similarity"], 4),
                "text": h["text"],
            }
            for h in hits
        ],
    }

    yield {"stage": "generate", "status": "start"}
    try:
        answer = llm.generate_answer(question, hits)
    except llm.LLMError as exc:
        yield {"stage": "error", "status": "done", "message": str(exc)}
        return

    yield {
        "stage": "generate",
        "status": "done",
        "answer": answer,
        "citations": [{"n": i + 1, "page": h["metadata"]["page"], "id": h["id"]} for i, h in enumerate(hits)],
        "elapsed_total": round(time.time() - t0, 2),
    }
