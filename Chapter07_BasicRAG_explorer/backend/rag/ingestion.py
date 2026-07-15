"""Ingestion pipeline: PDF -> pages -> chunks -> Nomic embeddings -> ChromaDB.

A generator so main.py can stream each stage over SSE as it happens - the
generator *is* the progress bar. Always rebuilds the collection from scratch
so re-ingesting after a chunking-parameter change never leaves stale chunks
behind.
"""

import time

from . import chunking, config, embeddings, pdf_loader, vectorstore
from .sse_utils import call_with_heartbeat


def run_ingestion():
    t0 = time.time()

    yield {"stage": "read", "status": "start"}
    pages = pdf_loader.load_pdf_pages(config.PDF_PATH)
    yield {
        "stage": "read",
        "status": "done",
        "page_count": len(pages),
        "total_chars": sum(len(p["text"]) for p in pages),
        "elapsed": round(time.time() - t0, 2),
    }

    yield {"stage": "chunk", "status": "start"}
    chunks = chunking.chunk_pages(pages, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
    lengths = [len(c["text"]) for c in chunks] or [0]
    yield {
        "stage": "chunk",
        "status": "done",
        "chunk_count": len(chunks),
        "avg_chars": round(sum(lengths) / len(lengths), 1),
        "min_chars": min(lengths),
        "max_chars": max(lengths),
        "sample": chunks[:3],
    }

    yield {"stage": "embed", "status": "start", "total": len(chunks)}
    yield from call_with_heartbeat(embeddings.get_embedder, "embed")
    yield {"stage": "embed", "status": "progress", "total": len(chunks), "note": "model ready, encoding chunks"}
    vectors = embeddings.embed_documents([c["text"] for c in chunks])
    yield {
        "stage": "embed",
        "status": "done",
        "total": len(chunks),
        "dim": len(vectors[0]) if vectors else 0,
        "preview": vectors[0][:8] if vectors else [],
    }

    yield {"stage": "store", "status": "start"}
    client = vectorstore.get_client()
    collection = vectorstore.reset_collection(client)
    vectorstore.upsert_chunks(collection, chunks, vectors)
    yield {
        "stage": "store",
        "status": "done",
        "points_stored": vectorstore.count(collection),
        "elapsed_total": round(time.time() - t0, 2),
    }
