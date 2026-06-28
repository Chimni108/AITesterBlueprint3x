# Findings

## 2026-06-28
- Found a pre-existing `.env` in this folder with `VITE_`-prefixed keys (`VITE_JIRA_BASE_URL`, `VITE_JIRA_EMAIL`, `VITE_JIRA_TOKEN`, `VITE_GROQ_API_KEY`, `VITE_GROQ_MODEL`).
- **Risk:** `VITE_*` env vars are inlined into the client-side JS bundle by Vite at build time — readable by anyone who opens devtools/views the bundle. Must not be read directly by frontend code if these are real secrets. Raised as a discovery question on credential architecture.
- Reusing prior project's research: GROQ `openai/gpt-oss-120b` via OpenAI-compatible endpoint (`https://api.groq.com/openai/v1/chat/completions`), JIRA Cloud REST API v3 `description`/comments are ADF (not plain text), Basic Auth via base64(email:apiToken).
