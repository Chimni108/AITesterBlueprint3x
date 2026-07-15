# Basic RAG Explorer

A minimal, end-to-end RAG pipeline over a single PDF — the VWO Product
Requirements Document in `data/`. Built to demonstrate the full RAG flow
plainly: one file in, chunks out, embeddings in a local vector store,
top-4 retrieval, one grounded answer.

- **PDF ingestion** — `pypdf` (layout-aware text extraction, per page)
- **Chunking** — paragraph-aware, per page, with overlap
- **Embeddings** — **Nomic Embed** (`nomic-embed-text-v1.5`), run locally via `sentence-transformers`
- **Vector store** — **ChromaDB**, local and on-disk, no server to run
- **Retrieval** — cosine similarity, top 4 chunks
- **Generation** — **Groq**, `openai/gpt-oss-120b`, grounded on the retrieved chunks
- **UI** — React (Vite), showing every stage live as it runs

---

## Architecture

```
frontend/   React + Vite SPA. Talks to the backend over fetch + SSE.
backend/    FastAPI. Owns the whole pipeline.
  main.py            routes: /api/status, /api/ingest/stream, /api/query/stream, /api/chunks
  rag/
    pdf_loader.py     pypdf, layout mode, per page
    chunking.py       paragraph-aware chunking with overlap
    embeddings.py     Nomic Embed, lazy-loaded, query/document prefixes
    vectorstore.py    ChromaDB wrapper (cosine space)
    llm.py            Groq chat completion, grounded prompt
    ingestion.py       Stage 1 generator: read -> chunk -> embed -> store
    query_pipeline.py  Stage 2 generator: embed -> retrieve -> generate
data/       The bundled PDF (VWO PRD).
```

Both ingestion and querying are implemented as Python generators that yield
one event per pipeline stage; `main.py` streams those events to the browser
over Server-Sent Events, and the React UI updates its pipeline diagram and
result panels live as each stage completes. There's no separate "build a
progress bar" layer — the generator *is* the progress bar.

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy .env.example .env        # Windows; `cp` on macOS/Linux
```

Add your `GROQ_API_KEY` to `.env` (get one at console.groq.com). Nomic Embed
and ChromaDB both run locally — nothing else to sign up for or start.

> **Windows note:** `requirements.txt` pins a CPU-only `torch==2.5.1` from
> PyTorch's own package index. That's deliberate, not just for size: the
> latest `torch` releases bundle a third-party license file tree so deep
> that installing it fails with `WinError 206: filename too long` inside a
> nested project path. If you ever change the pin and hit that error, either
> enable Windows long paths (`pip.pypa.io/warnings/enable-long-paths`) or
> pin `torch` back down to something like `2.5.1`.

### Frontend

```bash
cd frontend
npm install
```

---

## Run

Two terminals:

```bash
# terminal 1
cd backend
.venv\Scripts\activate
python main.py
# API on http://127.0.0.1:8000

# terminal 2
cd frontend
npm run dev
# UI on http://localhost:5173
```

Open http://localhost:5173. First ingestion downloads Nomic Embed
(~550 MB, cached after that) — subsequent runs are fast.

---

## Using it

1. **Ingest** — click "Ingest PDF". Watch Read → Chunk → Embed → Store run
   live; see page/chunk counts and an embedding preview when it's done.
2. **Storage** — browse every chunk actually sitting in ChromaDB, with its
   id and source page.
3. **Query** — ask a question. Watch Embed → Retrieve → Generate run live;
   each turn shows the top-4 retrieved chunks with similarity scores, then
   the grounded answer with page citations.

Try: *"What statistical engine does VWO use?"*, *"What are the
non-functional requirements?"*, *"Who are the target users?"*

---

## Troubleshooting

- **Groq error about the API key** — `.env` is missing `GROQ_API_KEY`, or it's wrong. The UI will show the error inline rather than failing silently.
- **First ingestion is slow** — Nomic Embed downloading + loading. Subsequent runs reuse the cached model.
- **CORS error in the browser console** — the frontend's origin isn't in `CORS_ORIGINS` in `backend/.env`. Defaults cover the standard Vite dev ports (5173).
- **Empty/garbled chunk text** — some PDFs extract more cleanly than others; `pdf_loader.py` uses pypdf's `layout` extraction mode specifically because it's much cleaner than the default for this PDF (Google Docs–style exports in particular tend to fragment badly under the default mode).
- **Port 8000 or 5173 already in use** — change `PORT` in `backend/.env`, or run `npm run dev -- --port <n>` and update `VITE_API_BASE`/`CORS_ORIGINS` to match.
