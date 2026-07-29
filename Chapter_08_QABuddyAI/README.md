# QABuddy.ai

Self-hosted **Hybrid RAG** chatbot for QA engineers. Ask one question, get one **cited answer** — grounded in your Selenium/Playwright frameworks, test case repository, JIRA history, PRDs, meeting notes, and Jenkins logs.

- **Embeddings:** `BAAI/bge-base-en-v1.5` (dense) + BM25 (sparse) — open source, local, CPU-only via FastEmbed
- **Vector DB:** Qdrant (open source) with server-side RRF hybrid fusion
- **Answers:** Claude API (streamed, with `[n]` citations)
- **Design details & justifications:** see [ARCHITECTURE.md](ARCHITECTURE.md)

## Quick Start (local)

```bash
# 1. Python env
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Config
cp .env.example .env       # fill in ANTHROPIC_API_KEY (and JIRA_* when ready)

# 3. Start Qdrant
docker run -d --name qdrant -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant

# 4. Get data in place
bash scripts/clone_repos.sh                  # clones the two framework repos
#    drop testdata.csv into  data/03_test_cases/
#    drop PDFs/MD into       data/05_company_docs/ and data/09_prd_srs_docs/
#    drop transcripts into   data/07_meeting_notes/  etc.

# 5. Ingest (parse → clean → chunk → embed → index; incremental on re-runs)
python -m scripts.ingest --source all
python -m scripts.ingest --jira              # once JIRA_* is set in .env

# 6. Chat
uvicorn app.api:app --reload
# open http://localhost:8000
```

## Data Folders (place Phase 1 data here)

| Folder | Content |
|---|---|
| `data/01_selenium_framework/` | Selenium framework repo (auto-cloned) |
| `data/02_playwright_framework/` | Playwright framework repo (auto-cloned) |
| `data/03_test_cases/` | CSV / XLSX test cases (~5,000 rows; 1 row = 1 chunk) |
| `data/04_jira_tickets/` | JIRA JSON (auto-fetched via `--jira`, or export via MCP) |
| `data/05_company_docs/` | Company docs (PDF, MD) |
| `data/06_figma_designs/` | *Phase 2 — reserved* |
| `data/07_meeting_notes/` | Meeting transcripts (text) |
| `data/08_lucid_charts/` | Lucid charts exported to text |
| `data/09_prd_srs_docs/` | PRD / SRS / BRD / FRD (PDF) |
| `data/10_jenkins_logs/` | Jenkins logs & results (.log/.txt) |

## Deploy on DigitalOcean (24×7)

```bash
# on the droplet (4GB RAM / 2 vCPU minimum; Docker installed)
git clone <your-repo> qabuddy && cd qabuddy
cp .env.example .env && nano .env            # set ANTHROPIC_API_KEY, JIRA_*
docker compose up -d --build                 # qdrant + app, restart: unless-stopped

# ingest from inside the app container
docker compose exec app bash scripts/clone_repos.sh
docker compose exec app python -m scripts.ingest --source all
```

Chat UI is at `http://<droplet-ip>:8000` (put nginx/Caddy with basic auth or your VPN in front for internal use). `data/` and Qdrant storage are volumes, so redeploys keep the index.

## Everyday Commands

```bash
python -m scripts.ingest --source all              # incremental re-index (only changed files)
python -m scripts.ingest --source 10_jenkins_logs  # one source (e.g. after a build run)
python -m scripts.ingest --jira                    # refresh JIRA tickets then re-index
curl localhost:8000/health                         # {"status":"ok","indexed_chunks":N}
```

## Phase 2 (planned, not built)

- **Hourly auto-ingestion** — cron runs `scripts/ingest.py --source all`; SHA-256 change detection already makes it incremental. See ARCHITECTURE.md §6.
- **Figma ingestion** — ER diagrams, user guides, wireframes into `data/06_figma_designs/`.
