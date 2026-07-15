"""Advanced RAG Explorer - Flask app.

Routes:
  /upload         upload a CSV/XLSX or use the bundled VWO dataset, pick columns
  /ingest         live SSE stage tracker for Stage 1 (Ingest)
  /chunks         paginated + searchable/filterable viewer over the Qdrant collection
  /chat           live SSE stage tracker for Stage 2 (Chat), grounded Q&A + test-case generation
"""

import json
import math
import os

from flask import Flask, Response, flash, redirect, render_template, request, session, stream_with_context, url_for
from werkzeug.utils import secure_filename

from rag import chat_pipeline, config, embeddings, ingestion, vectorstore

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

# Chat streams over SSE (GET, so a Flask session write mid-stream would arrive
# too late to be saved into the response's Set-Cookie header). This app is a
# single-user local teaching tool, so a plain module-level global is simpler
# and more honest than fighting that timing with extra machinery.
_last_used_chunk_ids: list = []


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _table_preview(path: str) -> dict:
    df = ingestion.read_table(path)
    return {
        "columns": list(df.columns),
        "row_count": len(df),
        "preview_rows": df.head(5).to_dict(orient="records"),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }


def _scroll_all(client, search, priority, module, jira_id, cap=10000):
    all_points = []
    offset = None
    while True:
        batch, offset = vectorstore.scroll_chunks(
            client,
            config.COLLECTION_NAME,
            limit=250,
            offset=offset,
            search=search,
            priority=priority,
            module=module,
            jira_id=jira_id,
        )
        all_points.extend(batch)
        if offset is None or len(all_points) >= cap:
            break
    return all_points


@app.route("/")
def index():
    return redirect(url_for("upload_view"))


@app.route("/upload", methods=["GET", "POST"])
def upload_view():
    if request.method == "POST":
        if request.form.get("use_default"):
            path = config.DEFAULT_DATASET_PATH
        else:
            file = request.files.get("file")
            if not file or file.filename == "":
                flash("Choose a .csv, .xlsx, or .xls file first.", "error")
                return redirect(url_for("upload_view"))
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                flash(f"Unsupported file type '{ext}'. Use .csv, .xlsx, or .xls.", "error")
                return redirect(url_for("upload_view"))
            filename = secure_filename(file.filename)
            path = os.path.join(UPLOAD_DIR, filename)
            file.save(path)

        try:
            info = _table_preview(path)
        except Exception as exc:
            flash(f"Could not read file: {exc}", "error")
            return redirect(url_for("upload_view"))

        session["upload_path"] = path
        session.pop("ingest_path", None)
        flash(f"Loaded {info['row_count']} rows from {os.path.basename(path)}.", "success")
        return redirect(url_for("upload_view"))

    path = session.get("upload_path")
    info = None
    if path and os.path.exists(path):
        try:
            info = _table_preview(path)
        except Exception as exc:
            flash(f"Could not re-read the previously loaded file: {exc}", "error")
            session.pop("upload_path", None)
            path = None

    return render_template(
        "upload.html",
        info=info,
        path=path,
        default_text_cols=config.DEFAULT_TEXT_COLS,
        default_meta_cols=config.DEFAULT_META_COLS,
        default_dataset_path=config.DEFAULT_DATASET_PATH,
    )


@app.route("/ingest/start", methods=["POST"])
def ingest_start():
    path = session.get("upload_path")
    if not path:
        flash("Upload a file first.", "error")
        return redirect(url_for("upload_view"))

    text_cols = request.form.getlist("text_cols")
    meta_cols = request.form.getlist("meta_cols")
    if not text_cols:
        flash("Pick at least one text column to embed.", "error")
        return redirect(url_for("upload_view"))

    session["ingest_path"] = path
    session["ingest_text_cols"] = text_cols
    session["ingest_meta_cols"] = meta_cols
    return redirect(url_for("ingest_view"))


@app.route("/ingest")
def ingest_view():
    ready = bool(session.get("ingest_path") and session.get("ingest_text_cols"))
    return render_template(
        "ingest.html",
        ready=ready,
        path=session.get("ingest_path"),
        text_cols=session.get("ingest_text_cols", []),
        meta_cols=session.get("ingest_meta_cols", []),
    )


@app.route("/ingest/stream")
def ingest_stream():
    path = session.get("ingest_path")
    text_cols = session.get("ingest_text_cols")
    meta_cols = session.get("ingest_meta_cols", [])

    def generate():
        if not path or not text_cols:
            yield sse_event({"stage": "error", "status": "done", "message": "No file/columns selected - go back to Upload."})
            return
        try:
            for event in ingestion.run_ingestion(path, text_cols, meta_cols):
                yield sse_event(event)
        except Exception as exc:
            yield sse_event({"stage": "error", "status": "done", "message": str(exc)})

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/chunks")
def chunks_view():
    client = vectorstore.get_client()
    exists = vectorstore.collection_exists(client, config.COLLECTION_NAME)

    page = max(1, request.args.get("page", 1, type=int))
    search = (request.args.get("search") or "").strip() or None
    priority = (request.args.get("priority") or "").strip() or None
    module = (request.args.get("module") or "").strip() or None
    jira_id = (request.args.get("jira_id") or "").strip() or None
    per_page = 50

    modules, priorities, chunk_cards = [], [], []
    total = 0

    if exists:
        modules = vectorstore.facet_values(client, config.COLLECTION_NAME, "module", limit=50)
        priorities = vectorstore.facet_values(client, config.COLLECTION_NAME, "priority", limit=10)

        all_points = _scroll_all(client, search, priority, module, jira_id)
        total = len(all_points)
        start = (page - 1) * per_page
        page_points = all_points[start : start + per_page]

        highlight_ids = set(_last_used_chunk_ids)
        for point in page_points:
            vector = point.vector or {}
            sparse_dict = vectorstore.sparse_vector_to_dict(vector.get("sparse"))
            sparse_preview = []
            if sparse_dict:
                try:
                    sparse_preview = embeddings.decode_sparse_tokens(sparse_dict)
                except Exception:
                    sparse_preview = sorted(sparse_dict.items(), key=lambda kv: kv[1], reverse=True)[:5]
            chunk_cards.append(
                {
                    "id": point.id,
                    "payload": point.payload or {},
                    "dense_preview": (vector.get("dense") or [])[:8],
                    "sparse_preview": sparse_preview,
                    "highlighted": point.id in highlight_ids,
                }
            )

    total_pages = max(1, math.ceil(total / per_page))

    return render_template(
        "chunks.html",
        exists=exists,
        chunk_cards=chunk_cards,
        total=total,
        page=page,
        total_pages=total_pages,
        per_page=per_page,
        search=search or "",
        priority=priority or "",
        module=module or "",
        jira_id=jira_id or "",
        modules=modules,
        priorities=priorities,
    )


@app.route("/chat")
def chat_view():
    client = vectorstore.get_client()
    has_data = vectorstore.collection_exists(client, config.COLLECTION_NAME)
    return render_template(
        "chat.html",
        has_data=has_data,
        tunables={
            "CHUNK_SIZE": config.CHUNK_SIZE,
            "CHUNK_OVERLAP": config.CHUNK_OVERLAP,
            "TOP_N_HYBRID": config.TOP_N_HYBRID,
            "TOP_K_RERANK": config.TOP_K_RERANK,
            "RRF_K": config.RRF_K,
            "REWRITE_ENABLED": config.REWRITE_ENABLED,
        },
    )


@app.route("/chat/stream")
def chat_stream():
    question = (request.args.get("q") or "").strip()

    def generate():
        if not question:
            yield sse_event({"stage": "error", "status": "done", "message": "Empty question."})
            return
        last_event = None
        try:
            for event in chat_pipeline.run_chat(question):
                last_event = event
                yield sse_event(event)
        except Exception as exc:
            yield sse_event({"stage": "error", "status": "done", "message": str(exc)})
            return
        if last_event and last_event.get("stage") == "generate" and last_event.get("status") == "done":
            global _last_used_chunk_ids
            _last_used_chunk_ids = last_event.get("used_chunk_ids", [])

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=True)
