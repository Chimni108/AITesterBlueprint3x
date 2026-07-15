# Advanced RAG Explorer

End-to-end teaching demo for The Testing Academy, built on a real corpus of
5,000 JIRA-style VWO test cases (`testcase/vwo_test_cases.csv`). It goes
beyond naive "embed and cosine-search" RAG with the techniques that actually
matter at scale:

- **Hybrid retrieval** — `bge-m3` produces dense + sparse vectors from one model
- **Vector DB** — Qdrant (embedded, on-disk) with native dense + sparse + RRF fusion + filters
- **Re-ranking** — `BAAI/bge-reranker-v2-m3` cross-encoder
- **Query rewriting** — alternate phrasings via Openrouter before retrieval
- **Generation** — Openrouter (`deepseek/deepseek-v4-pro` by default) for grounded answers and test-case drafting

The UI uses a Claude-inspired theme (warm cream + coral) with a two-pane
layout: left = pipeline stage tracker (live), right = active content/chat.

---

## Pipeline

```
Stage 1 (Ingest):
  CSV/XLSX -> rows -> assemble docs -> chunk (1 row = 1 chunk if small) ->
  bge-m3 (dense + sparse) -> Qdrant collection 'vwo_test_cases'

Stage 2 (Chat):
  Question -> rewrite (Openrouter) -> embed -> dense + sparse search ->
  RRF fuse (Qdrant native fusion query) -> bge-reranker-v2-m3 -> Openrouter -> grounded answer
```

---

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # then add your OPENROUTER_API_KEY
```

Qdrant runs **embedded** by default (file store at `./qdrant_data/`) — **no
Docker required**. To use a real Qdrant server instead, set
`QDRANT_URL=http://host:6333` in `.env`.

You need your own `OPENROUTER_API_KEY` in `.env` for query rewriting and
generation (get one at openrouter.ai). Everything else (bge-m3, the
reranker, Qdrant) runs locally.

---

## Run

```bash
python app.py
# open http://127.0.0.1:5050
```

The first ingestion hits cold model loaders (bge-m3 ~2.3 GB, bge-reranker
~570 MB, downloaded from Hugging Face on first use) — subsequent runs are
fast, since the models stay cached and are loaded once per process (lazily,
on first embed/rerank call).

### CLI ingestion (optional, instead of the /upload + /ingest UI)

```bash
python ingest.py testcase/vwo_test_cases.csv \
  --text-cols title,steps,expected,tags \
  --meta-cols id,jira_id,priority,module
```

### Regenerating the sample dataset

`testcase/vwo_test_cases.csv` (5,000 rows) is produced by
`generate_test_cases.py` — a seeded, deterministic generator that combines
20 VWO product modules x ~10 features each x 11 test types (positive,
negative, boundary, security, performance, usability, regression, smoke,
compatibility, accessibility, integration), plus cross-browser/device
variant passes for realism. Re-run it any time with `python
generate_test_cases.py`; it always produces the same 5,000 rows.

---

## What you can see in the UI

### `/upload`
- File picker accepts `.csv`, `.xlsx`, `.xls`, or use the bundled dataset with one click.
- After upload: row count, columns, first 5 rows, dtypes.
- Pick text columns (concatenated into the embedded document) and metadata
  columns (kept in Qdrant payload for filtering).

### `/ingest` (live SSE)
- Stage tracker shows: Read -> Build docs -> Chunk -> Embed -> Index.
- For each stage, a card on the right shows what happened:
  - **Chunk**: histogram, total chunks, avg/min/max chars, sample chunks with
    the overlapping region highlighted in coral.
  - **Embed**: progress bar, dense vector preview (first 8 dims), sparse top-5
    tokens by weight.
  - **Index**: Qdrant collection info, dashboard link (server mode only).

### `/chunks`
- Paginated viewer (50/page) over the entire collection.
- Search box (substring, via Qdrant's text match) + filters (`priority`,
  `module`, `jira_id`), with live facet counts in the dropdowns.
- Each chunk card: id, payload, dense preview, sparse preview, full text.
- Chunks used in the most recent chat answer are outlined in coral.

### `/chat`
- Chat box on the right; pipeline stage tracker on the left updates per query.
- After each turn, that turn's block shows:
  - The query rewrites
  - Dense top-N vs sparse top-N vs RRF-fused top-N
  - Re-rank before/after table
  - Final answer with `[Chunk N]` citations
- Two modes auto-detected:
  - **Answer**: grounded Q&A on test cases.
  - **Generate**: phrasings like "create a new test case for JIRA VWO-1234"
    produce a structured test case (Title / Preconditions / Steps / Expected
    Result / Priority / Tags) using retrieved similar test cases as templates.

---

## Project layout

```
app.py                  Flask routes (upload, ingest SSE, chunks, chat SSE)
ingest.py                CLI ingestion entry point
generate_test_cases.py   Generates testcase/vwo_test_cases.csv
rag/
  config.py              All tunables, read from .env
  chunking.py             Row -> document -> chunk(s)
  embeddings.py           bge-m3 hybrid (dense + sparse) embeddings, lazy-loaded
  vectorstore.py          Qdrant collection setup, upsert, hybrid search, RRF, facets
  reranker.py             bge-reranker-v2-m3 cross-encoder, lazy-loaded
  llm.py                  Openrouter calls: query rewriting + generation
  mode_detect.py          Answer vs Generate heuristic
  ingestion.py            Stage 1 pipeline (generator, streamed over SSE)
  chat_pipeline.py        Stage 2 pipeline (generator, streamed over SSE)
templates/, static/       Two-pane Claude-themed UI
testcase/                 The bundled 5,000-row VWO dataset
```

---

## Tunables (`.env`, see `rag/config.py`)

| Knob               | Default                    | Meaning                                          |
|---------------------|----------------------------|---------------------------------------------------|
| `CHUNK_SIZE`        | 1000                       | Max chars per chunk before splitting             |
| `CHUNK_OVERLAP`     | 150                        | Chars repeated between adjacent chunks           |
| `TOP_N_HYBRID`      | 20                         | Candidates per dense / sparse / fused search     |
| `TOP_K_RERANK`      | 4                          | Final chunks sent to the LLM after rerank        |
| `RRF_K`             | 60                         | Kept for the from-scratch RRF explanation in the UI (Qdrant's native fusion query doesn't take it as a parameter) |
| `REWRITE_ENABLED`   | True                       | Use Openrouter to generate alt phrasings before search |
| `REWRITE_COUNT`     | 3                          | Number of alternate phrasings to generate        |
| `GENERATION_MODEL`  | `deepseek/deepseek-v4-pro` | Openrouter model for answers/test-case generation |

---

## Troubleshooting

- **Connection refused on 6333** — only relevant if you set `QDRANT_URL` to a server. Default is embedded; nothing to start.
- **Openrouter 401** — `.env` is missing or `OPENROUTER_API_KEY` is wrong.
- **First query is slow** — bge-m3 + reranker downloading + warming. Subsequent calls are sub-second.
- **Out-of-memory on bge-m3** — set `BGE_USE_FP16=1` (default) and reduce `INGEST_BATCH=8`.
- **Port 5050 busy** — change `PORT` in `.env`.
- **`UserWarning: Payload indexes have no effect in the local Qdrant`** — expected and harmless. Embedded/local mode filters by brute-force scan instead of an index; correctness is unaffected at this corpus size. The indexes are still created so the same code gets faster indexed filtering if you later point `QDRANT_URL` at a real server.
- **`Exception ignored in QdrantClient.__del__` on exit (Windows)** — a benign cleanup-order quirk when the embedded Qdrant file lock is released during interpreter shutdown. Safe to ignore; it happens after your data has already been saved.
