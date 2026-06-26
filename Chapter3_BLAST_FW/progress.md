# progress.md — Execution Log

---

## Session 1 — 2026-06-21

### Phase 0 — Complete ✅
- task_plan.md, findings.md, progress.md, gemini.md initialized

### Phase 1 — Complete ✅
- All 5 discovery questions answered
- Schema locked in gemini.md (temperature=0, min 20 TCs, RICE-POT format)
- Behavioral rules locked (anti-hallucination block, deterministic output)
- .env created with credentials (gitignored)
- .env.example committed

### Phase 2 — Complete ✅
- JIRA handshake: SCRUM-5 → 200 OK (Bug, Highest priority, ADF description)
- GROQ handshake: openai/gpt-oss-120b → 200 OK
- Discovery: ADF parsing required for JIRA description
- Discovery: Python not on machine — Node.js 20 used instead
- Discovery: JIRA Cloud supports CORS for direct browser calls

### Phase 3 — IN PROGRESS 🟡
- Architecture SOPs being written
- React app being scaffolded

### Errors Encountered
| Error | Root Cause | Resolution |
|-------|-----------|------------|
| `pip: command not found` | Python not installed | Used Node.js for handshake scripts |
| `python3: command not found` | Python absent on machine | Node.js fallback documented in findings.md |
| `TypeError: Failed to fetch` (JIRA) | JIRA Cloud blocks CORS from browser origins — no `Access-Control-Allow-Origin` header returned for localhost | Added Vite proxy in `vite.config.js`: browser → `/api/jira/` → Vite → JIRA Cloud. Patched `jiraService.js` and `jiraCommentService.js` to use proxy path. |
| App generates test cases instead of a test plan | `O — Output` section of GROQ system prompt said "output one Markdown table only" — model followed instructions literally | Rewrote `O` section to specify a complete 8-section test plan document. Updated `groqService.js` SYSTEM_PROMPT and user prompt. Synced `gemini.md` canonical prompt. |
| `JIRA comment failed: 403 — XSRF check failed` | JIRA Cloud XSRF protection blocks all write operations from REST clients without the bypass header | Added `'X-Atlassian-Token': 'no-check'` to POST headers in `jiraCommentService.js`. Documented in `findings.md` and `gemini.md` invariants. |
