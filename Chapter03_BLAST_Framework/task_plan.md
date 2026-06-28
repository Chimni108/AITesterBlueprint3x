# Task Plan — JIRA Test Plan Generator (v2 rebuild)

## Phase 0: Initialization
- [x] Create task_plan.md
- [x] Create findings.md
- [x] Create progress.md
- [x] Create gemini.md (Project Constitution)
- [x] Discovery questions answered
- [x] Data Schema defined in gemini.md
- [x] Blueprint approved

## Phase 1: Blueprint
- [x] Discovery Q&A (North Star, Integrations, Source of Truth, Delivery Payload, Behavioral Rules, credential storage, tools language)
- [x] Define JSON Data Schema (Input/Output) — approved by user
- [x] Research helpful repos/resources (reused prior project's GROQ/JIRA findings — see findings.md)

## Phase 2: Link
- [x] Local Flask server (`api/index.py`) verified — `/api/testplan/create` returns expected 400 on empty body
- [x] Live production endpoint verified the same way after deploy
- [ ] End-to-end test with real JIRA + GROQ credentials — pending user testing via the Settings UI

## Phase 3: Architect
- [x] Write SOPs in architecture/ (jira-fetch-sop.md, groq-generation-sop.md)
- [x] Build deterministic Python tools/ scripts (tools/jira_client.py, tools/groq_client.py, tools/adf.py)
- [x] Build navigation layer (Flask app api/index.py, single combined /api/testplan/create endpoint)

## Phase 4: Stylize
- [x] React dashboard UI: Settings.jsx (modal), Generator.jsx, TestPlanDisplay.jsx
- [x] Dark, card-based dashboard styling (App.css) — gradient brand mark, pill-tagged test cases, scope grid, modal settings

## Phase 5: Trigger
- [x] Deployed to Vercel as `testplangenerator-nam` (requested name `TestPlanGenerator_NAM` — Vercel requires lowercase project names)
- [x] Production verified live: https://testplangenerator-nam.vercel.app
- [ ] Automation decision (cron/webhook) — not yet asked, defaulting to manual UI per prior project's v1 precedent unless user wants otherwise
- [ ] Maintenance Log finalization — pending real-credential end-to-end test

## Status: v2 BUILT AND DEPLOYED — LIVE AT https://testplangenerator-nam.vercel.app
Core build complete: Python-first 3-layer architecture from the start, Settings-UI credentials, attractive dashboard, deployed and verified. Remaining: live test with real JIRA/GROQ credentials.
