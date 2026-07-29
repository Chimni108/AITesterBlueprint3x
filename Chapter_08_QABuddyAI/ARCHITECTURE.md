# QABuddy.ai — Architecture & Design Decisions

Self-hosted, multi-source **Hybrid RAG** system for QA engineers. One question in → one **cited answer** out, grounded in the Selenium/Playwright frameworks, test case repository, PRDs, and JIRA history.

## 1. High-Level Architecture

```
                    ┌────────────────────────────────────────────────┐
                    │                DigitalOcean Droplet             │
                    │                                                │
 data/01..10  ──►   │  INGESTION PIPELINE (scripts/ingest.py)        │
 (10 source         │  parse → clean → chunk → embed → index         │
  folders)          │        │                                       │
                    │        ▼                                       │
 JIRA (JQL) ──►     │  ┌──────────────┐   dense (BGE)  + sparse(BM25)│
 REST/MCP           │  │   Qdrant     │◄──────────────────────────── │
                    │  │ (vector DB)  │                              │
                    │  └──────┬───────┘                              │
                    │         │ hybrid search (RRF fusion)           │
                    │         ▼                                      │
 QA Engineer ──►    │  FastAPI chatbot ──► Claude API ──► cited      │
 (browser chat)     │  (app/api.py)        (answers)      answer     │
                    └────────────────────────────────────────────────┘
```

**Flow per question:** query → embedded twice (dense + sparse) → Qdrant hybrid search with Reciprocal Rank Fusion → top-k chunks (with file/ticket metadata) → packed into a single Claude prompt → streamed answer with `[n]` citations mapped back to source files/tickets.

## 2. Decisions & Justification

### 2.1 Embedding model — `BAAI/bge-base-en-v1.5` (dense) + `Qdrant/bm25` (sparse)

| Criterion | Why this choice |
|---|---|
| Open source | MIT-licensed, runs fully local via **FastEmbed** (ONNX, CPU) |
| Droplet-friendly | ~450MB model, fast CPU inference — no GPU needed on a 4GB–8GB droplet |
| Quality | BGE family is consistently top-tier on MTEB for retrieval at this size |
| Hybrid pairing | BM25 sparse vectors give exact keyword matching (test case IDs, class names, `JIRA-1234`, stack-trace strings) that dense embeddings miss |
| Upgrade path | Swap one config line to `BAAI/bge-m3` (8K context, multilingual, built-in sparse) if you later move to a bigger droplet/GPU |

Code, test-case IDs, and log strings are exactly where pure semantic search fails — hybrid (keyword + semantic) is a hard requirement of this system, and this pair delivers it cheaply.

### 2.2 Vector database — **Qdrant**

| Criterion | Qdrant | Weaviate | Milvus | Chroma |
|---|---|---|---|---|
| Native hybrid (dense+sparse, RRF server-side) | ✅ first-class | ✅ | partial | ❌ |
| Single small Docker container, low RAM | ✅ (~150MB idle) | heavier | heavy (etcd/minio) | ✅ but no hybrid |
| Payload filtering (source, path, ticket) | ✅ rich | ✅ | ✅ | basic |
| License | Apache 2.0 | BSD | Apache 2.0 | Apache 2.0 |

Qdrant is the best fit for a self-hosted droplet: one container, server-side RRF fusion (no client-side score juggling), and metadata payloads that carry citation info natively.

### 2.3 Chunk size & overlap — per source type

Token counts are approximate (word-based estimate); tuned per content shape:

| # | Source | Strategy | Chunk size | Overlap | Rationale |
|---|---|---|---|---|---|
| 1–2 | Selenium / Playwright repos | Split on class/method/function boundaries | ~400 tokens | 0 | Code must stay syntactically whole; overlap creates duplicate near-identical code hits |
| 3 | Test cases (CSV/XLSX) | **1 row = 1 chunk** | row size | 0 | A test case is an atomic unit — never split, never merge |
| 4 | JIRA tickets | 1 ticket = 1 chunk; split if long | ~800 | 100 | Summary+description+resolution belong together for RCA questions |
| 5, 9 | Company docs / PRD, SRS | Heading-aware, page-aware sliding window | ~700 | ~120 (15%) | Prose benefits from overlap so answers spanning paragraph boundaries survive |
| 7 | Meeting transcripts | Sliding window | ~500 | ~80 | Conversational text is loosely structured; smaller chunks keep retrieval precise |
| 8 | Lucid chart text exports | Sliding window | ~500 | 50 | Diagram exports are terse lists — small chunks |
| 10 | Jenkins logs | **Error-block extraction** (windows around ERROR/FAILED/Exception) | ~500 | 0 | 95% of a log is noise; only failure blocks carry retrieval value |
| 6 | Figma | — Phase 2 | — | — | — |

### 2.4 Preprocessing / normalization

- **ANSI/control-code stripping** (Jenkins logs, console output)
- **Timestamp stripping + consecutive-duplicate-line collapse** for logs (massively reduces index noise and token spend)
- **Whitespace normalization** and blank-line collapse for all prose
- **Terminology tagging** — `glossary/terminology.yaml` maps QA abbreviations (RTM, RCA, VWO, POM, …); matched terms are stored in each chunk's payload for filtering and future query expansion
- **Metadata schema on every chunk:** `source` (folder id), `source_type`, `path`, `title`, `page`/`row`/`ticket_key` where applicable, `chunk_index` — this is what powers the citations
- **Incremental state** — SHA-256 per file in `data/.ingest_state.json`; unchanged files are skipped, changed files have their old vectors deleted and re-indexed (this is also the foundation for Phase 2 hourly auto-ingestion)

### 2.5 Answering LLM — Claude API (`claude-opus-4-8`)

The open-source constraint in the spec applies to the **embedding model and vector DB** (both fully local). For answer generation the default is the Claude API — highest answer quality for RCA/test-design reasoning, and token-efficient because only the top-k retrieved chunks are sent (typically 2–4K tokens per question, not whole documents). The model is configurable via `ANTHROPIC_MODEL`. If a fully offline stack is ever required, `app/llm.py` is the single swap point (e.g. Ollama).

### 2.6 Token efficiency

- Hybrid retrieval returns only `top_k` (default 8) chunks after RRF fusion over `prefetch_k` (24) candidates
- Chunk-level indexing means answers are grounded in ~3K context tokens, not full files
- Static system prompt is marked with `cache_control` so prompt caching engages as the prompt grows
- Streaming responses (SSE) — no timeout risk, immediate feedback in the chat UI

## 3. JIRA Ingestion (source #4)

Two supported paths — both land normalized JSON in `data/04_jira_tickets/`:

1. **Automated (pipeline):** `python -m scripts.ingest --jira` uses JIRA REST with your **JQL** (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_JQL` in `.env`). This is the server-side equivalent of the MCP connection — same credentials, same JQL.
2. **Interactive (MCP):** from Claude Code with your JIRA MCP server connected, export tickets returned by the JQL as JSON files into `data/04_jira_tickets/` — the parser handles raw JIRA JSON (single issue, array, or `{"issues": [...]}`).

## 4. Folder Structure (10 sources)

```
data/
├── 01_selenium_framework/    # clone of ATB13xSeleniumAdvanceFramework
├── 02_playwright_framework/  # clone of Advance-Playwright-Framework
├── 03_test_cases/            # testdata.csv / .xlsx (~5,000 rows)
├── 04_jira_tickets/          # JSON from REST/MCP + JQL
├── 05_company_docs/          # PDF, MD
├── 06_figma_designs/         # ── Phase 2 (folder reserved) ──
├── 07_meeting_notes/         # text transcripts
├── 08_lucid_charts/          # text exports
├── 09_prd_srs_docs/          # PRD / SRS / BRD / FRD (PDF)
└── 10_jenkins_logs/          # .log / .txt
```

## 5. Deployment (DigitalOcean droplet, 24×7)

- `docker compose up -d` → two containers: **qdrant** (persistent volume) + **app** (FastAPI + embedded FastEmbed models)
- Recommended droplet: **4GB RAM / 2 vCPU minimum** (8GB comfortable); embedding runs on CPU
- Restart policy `unless-stopped` gives 24×7 availability; Qdrant storage and `data/` are volume-mounted so re-deploys don't lose the index

## 6. Phase 2 — Plan Only (not built)

1. **Hourly auto-ingestion:** cron (or systemd timer) runs `scripts/ingest.py --source all` hourly. The SHA-256 state file already makes this incremental — new commits (`git pull` in repo folders first), new test-case rows, and new documents are detected and re-indexed; unchanged files cost nothing. JIRA delta via `updated >= -1h` appended to the JQL.
2. **Figma ingestion:** export frames via Figma REST API (`/v1/files/:key` for node trees + rendered PNGs); text layers indexed like docs, diagrams described via a vision model pass, both into `06_figma_designs/` and indexed with `source_type: figma`.
