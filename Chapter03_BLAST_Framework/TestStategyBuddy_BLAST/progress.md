# Progress Log

## 2026-06-28
- Started new B.L.A.S.T. cycle for `TestStategyBuddy_BLAST` — a sibling project to `TestStrategyBuddy`, explicitly required to use only plain B.L.A.S.T.md-style prompts (no RICE-POT structure). Same scope otherwise: Test Strategy + test cases for Login/Dashboard pages, grounded in the attached `Test Strategy for Ecommerce Website.docx`, write test cases back to JIRA, return list of created JIRA IDs. Two-tab UI (Test Strategy / Test Case Generator) with dark+light mode. Deploy target: Vercel project `teststrategy_testcase_generator_blast_fw`.
- Re-read `B.L.A.S.T.md` per user instruction — confirmed unchanged from the prior cycle.
- Per protocol, halting before writing any tools/ code until Discovery Q&A is answered and Data Schema is approved.
- Discovery Q&A answered: single user-entered JIRA issue key per run (not a fixed SCRUM-5/6 pair); 20 test cases total (10 Login/10 Dashboard), chosen up front to respect GROQ's free-tier 8000 TPM cap learned from the sibling project's incident. Data Schema written into `gemini.md` and Blueprint approved.
- Scaffolded `react-app/` (Vite + React 19), reused `jira_client.py`, `jira_writer.py`, `adf.py` verbatim from the sibling project (JIRA logic is identical regardless of prompt style).
- Wrote fresh `groq_strategy_client.py` and `groq_testcase_client.py` using plain B.L.A.S.T.-style prompts (task instruction + grounding context inlined + explicit JSON output shape + a "do not invent" rule) — explicitly no RICE-POT R/I/C/E/P/O/T structure. `max_tokens: 3500` and a 20-case (10/10) target set from the start to avoid repeating the sibling project's 413 rate-limit error.
- Built Flask navigation layer (`api/index.py`) with `/api/strategy/create`, `/api/testcases/create`, `/api/testcases/publish`; wrote `requirements.txt`, `vercel.json`, `vite.config.js` proxy (port 3003), `package.json` `server`/`dev:all` scripts, `.gitignore` Python/env additions.
- Wrote `architecture/jira-fetch-sop.md`, `architecture/jira-writeback-sop.md`, `architecture/groq-generation-sop.md` (the latter documents the plain-prompt structure and the GROQ rate-limit rationale).
- Built two-tab React UI (Settings, IssueFetchForm, TestStrategyTab, TestCaseTab, App.jsx) reusing the sibling project's proven dark/light-mode theming pattern, with branding updated to distinguish this app ("Test Strategy Buddy — B.L.A.S.T.").
- Local verification: `npm run build` succeeded; started Flask on port 3003 and curled `/api/strategy/create` and `/api/testcases/publish` with empty bodies — both correctly returned 400 validation errors.
- Linked and deployed to Vercel under project `teststrategy-testcase-generator-blast-fw` (lowercase/hyphenated per Vercel naming rules) using a freshly provided deploy token. Production deployment succeeded; live API smoke test against `/api/strategy/create` confirmed the validation-error response on the deployed instance.
- Live at https://teststrategy-testcase-generator-bla.vercel.app
