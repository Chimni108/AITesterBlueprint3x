# findings.md — Research & Discoveries

---

## Phase 2 — Link Results ✅ BOTH PASSED

### JIRA Handshake — SCRUM-5
| Field | Value |
|-------|-------|
| Status | ✅ 200 OK |
| Summary | VISIBLE Fields - Time Now fields retain saved time when saving and then reopening a form |
| Issue Type | Bug |
| Priority | Highest |
| Labels | (none) |
| Description Format | **ADF (Atlassian Document Format)** — must parse `content[].text` recursively |

### GROQ Handshake
| Field | Value |
|-------|-------|
| Status | ✅ 200 OK |
| Model | `openai/gpt-oss-120b` — confirmed available on GROQ |
| temperature: 0 | Confirmed supported |

---

## Critical Discoveries

### 1. ADF Parsing Required
JIRA descriptions arrive as Atlassian Document Format (ADF) JSON, not plain text.
Must recursively walk the `content` tree extracting `node.type === 'text'` nodes.
```json
{ "type": "doc", "version": 1, "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }] }
```

### 2. Python Not Available on This Machine
Node.js 20.18.0 is available. All handshake scripts written in Node.js instead.
Existing `tools/verify_jira.py` and `tools/verify_groq.py` are kept as reference but
the React app uses browser `fetch()` directly.

### 3. JIRA Cloud CORS — ❌ DIRECT BROWSER CALLS BLOCKED (CORRECTED)
Atlassian Cloud APIs (`*.atlassian.net`) do NOT return `Access-Control-Allow-Origin`
for requests from localhost or external browser origins. The browser throws
`TypeError: Failed to fetch` before the request even reaches JIRA.

**Fix applied:** Vite dev-server proxy. Browser calls `/api/jira/...` on localhost:5173.
Vite strips the prefix and forwards the request server-side to the JIRA base URL.
No CORS issue because server-to-server calls are not subject to browser CORS policy.

**Proxy config:** `vite.config.js` reads `VITE_JIRA_BASE_URL` from `.env` as the target.
**Affected files patched:** `vite.config.js`, `jiraService.js`, `jiraCommentService.js`

**Production note:** Vite proxy only works in `npm run dev`. Production deployment
requires a serverless function (Netlify/Vercel) or a backend proxy.

### 4. JIRA Comment Format
`POST /rest/api/3/issue/{id}/comment` requires ADF body — not plain Markdown.
Must convert Markdown → ADF before posting.

### 5. GROQ Model Confirmed
`openai/gpt-oss-120b` is live and responsive on `https://api.groq.com/openai/v1`.
`temperature: 0` enforced for deterministic output.

### 6. JIRA Cloud XSRF Protection on Write Operations
JIRA Cloud applies XSRF (Cross-Site Request Forgery) protection to all write operations
(POST, PUT, DELETE). Even with valid Basic Auth, the server returns:
`403 — XSRF check failed`

**Fix applied:** Add header `'X-Atlassian-Token': 'no-check'` to every JIRA write request.
This is the official Atlassian-documented bypass for REST API clients that cannot handle
cookies-based XSRF tokens.

**Affected file patched:** `jiraCommentService.js` — added to POST /comment headers.
**Rule:** All future JIRA POST/PUT/DELETE calls must include `'X-Atlassian-Token': 'no-check'`.
