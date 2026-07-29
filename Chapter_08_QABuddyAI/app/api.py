"""QABuddy.ai chatbot API — FastAPI with an SSE streaming /chat endpoint."""
import json

from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.config import PROJECT_ROOT
from app.llm import stream_answer
from app.retrieval import retrieve
from app.vectorstore import get_store

app = FastAPI(title="QABuddy.ai")


class ChatRequest(BaseModel):
    question: str


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@app.get("/")
def index():
    return FileResponse(PROJECT_ROOT / "static" / "index.html")


@app.get("/health")
def health():
    return {"status": "ok", "indexed_chunks": get_store().count()}


@app.post("/chat")
def chat(req: ChatRequest):
    contexts = retrieve(req.question)

    def event_stream():
        yield _sse(
            {
                "type": "sources",
                "sources": [
                    {"n": i + 1, "citation": c["citation"], "source": c["source"]}
                    for i, c in enumerate(contexts)
                ],
            }
        )
        try:
            for delta in stream_answer(req.question, contexts):
                yield _sse({"type": "delta", "text": delta})
        except Exception as exc:  # surface API errors to the UI instead of dying silently
            yield _sse({"type": "error", "message": str(exc)})
        yield _sse({"type": "done"})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
