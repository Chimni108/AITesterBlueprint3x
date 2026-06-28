# Progress Log

## 2026-06-28
- Started fresh rebuild in `Chapter03_BLAST_Framework/` per user request ("delete everything, do it from scratch").
- Read `B.L.A.S.T.md` and `objective.md`. Initialized Phase 0 memory files (task_plan.md, findings.md, progress.md, gemini.md).
- Found a pre-existing `.env` with `VITE_`-prefixed secrets — flagged as a security concern (see findings.md) and raised as a discovery question before building anything.
- Per protocol, halting before writing any `tools/` code until Discovery Q&A is answered and Data Schema is approved.

## 2026-06-28 (cont.) — Discovery Q&A, Blueprint approval, full build
- Discovery answers: credentials via Settings UI (not `.env`), North Star = display-only in v1 (no JIRA write-back), Tools layer = Python from the start (no Node-then-rewrite this time), source of truth = JIRA fields only, behavioral rules = same structured QA template + hard grounding rule as the prior project.
- Deleted the leaked-secret `VITE_`-prefixed `.env` per user's choice.
- Defined full Data Schema (Settings Payload, JIRA Fetch Output, Test Plan Output) in `gemini.md`. User approved the Blueprint.
- Scaffolded `react-app/` (Vite 6 + React 19 — no rolldown/Node-version issue this time since `create-vite@6` already pins stable Vite).
- Built Python tools layer directly: `tools/adf.py`, `tools/jira_client.py`, `tools/groq_client.py` (ported from the prior project's Python rewrite, same logic).
- Built Flask navigation layer `api/index.py` exposing the single combined `/api/testplan/create` endpoint.
- Wrote `architecture/jira-fetch-sop.md` and `architecture/groq-generation-sop.md` before/alongside the tools they describe, per the Golden Rule.
- Built an attractive dark-themed dashboard UI: gradient brand mark header, modal-based Settings form, card-based results layout with color-coded test-case pills (positive/negative/edge), scope grid, AC mapping section.
- Verified locally: Flask dev server (3001) responds correctly to validation; Vite dev server (5173) proxies through to it correctly; `npm run build` succeeds (34 modules, ~870ms).
- Deployed to Vercel. Requested project name `TestPlanGenerator_NAM` was rejected (Vercel requires lowercase, no underscores in some contexts) — used `testplangenerator-nam` instead, org `nam-qa`. Cloud build succeeded (Python 3.12 runtime via `uv`, Vite build). Live and aliased to production: https://testplangenerator-nam.vercel.app. Verified via curl — `/api/testplan/create` returns the expected 400 validation error on an empty body.
- **Outstanding:** live end-to-end test with real JIRA + GROQ credentials not yet done — needs the user to fill in Settings UI on the deployed app. Automation (cron/webhook) decision not yet asked.
