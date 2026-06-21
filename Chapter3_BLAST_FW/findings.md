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

### 3. JIRA Cloud CORS — Direct Browser Calls Work
Atlassian Cloud APIs (`*.atlassian.net`) support CORS for authenticated browser
requests using `Authorization: Basic <base64>` header. No proxy needed.

### 4. JIRA Comment Format
`POST /rest/api/3/issue/{id}/comment` requires ADF body — not plain Markdown.
Must convert Markdown → ADF before posting.

### 5. GROQ Model Confirmed
`openai/gpt-oss-120b` is live and responsive on `https://api.groq.com/openai/v1`.
`temperature: 0` enforced for deterministic output.
