"""Basic RAG Explorer API - FastAPI backend.

Routes:
  GET  /api/status         whether the PDF has been ingested, and with what config
  GET  /api/ingest/stream  SSE: read PDF -> chunk -> embed -> store
  GET  /api/query/stream   SSE: embed query -> retrieve top K -> generate answer
  GET  /api/chunks         everything currently stored in ChromaDB
"""

import json
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from rag import config, ingestion, query_pipeline, vectorstore

app = FastAPI(title="Basic RAG Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@app.get("/api/status")
def status():
    client = vectorstore.get_client()
    exists = vectorstore.collection_exists(client)
    chunk_count = 0
    if exists:
        chunk_count = vectorstore.count(vectorstore.get_collection(client))
    return {
        "ingested": exists and chunk_count > 0,
        "chunk_count": chunk_count,
        "pdf_name": os.path.basename(config.PDF_PATH),
        "pdf_exists": os.path.exists(config.PDF_PATH),
        "top_k": config.TOP_K,
        "chunk_size": config.CHUNK_SIZE,
        "chunk_overlap": config.CHUNK_OVERLAP,
        "embed_model": config.EMBED_MODEL_NAME,
        "groq_model": config.GROQ_MODEL,
    }


@app.get("/api/ingest/stream")
def ingest_stream():
    def generate():
        try:
            for event in ingestion.run_ingestion():
                yield sse(event)
        except Exception as exc:
            yield sse({"stage": "error", "status": "done", "message": str(exc)})

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.get("/api/query/stream")
def query_stream(q: str = ""):
    def generate():
        question = q.strip()
        if not question:
            yield sse({"stage": "error", "status": "done", "message": "Empty question."})
            return
        try:
            for event in query_pipeline.run_query(question):
                yield sse(event)
        except Exception as exc:
            yield sse({"stage": "error", "status": "done", "message": str(exc)})

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.get("/api/chunks")
def list_chunks():
    client = vectorstore.get_client()
    if not vectorstore.collection_exists(client):
        return {"chunks": []}
    return {"chunks": vectorstore.get_all_chunks(vectorstore.get_collection(client))}


if __name__ == "__main__":
    # reload=True would watch this whole directory for changes - including
    # chroma_data/, which ChromaDB writes into on every ingest. That makes
    # uvicorn "detect a change" and restart mid-request, killing the SSE
    # stream. Use `uvicorn main:app --reload --reload-exclude 'chroma_data/*'`
    # by hand if you want hot-reload while editing backend code.
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=False)
