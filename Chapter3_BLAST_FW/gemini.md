# gemini.md — Project Constitution ✅ APPROVED
# JIRA Test Plan Generator

> ⚠️ This file is LAW. No code contradicts it.
> Only update when: a schema changes, a rule is added, or architecture is modified.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Name | JIRA Test Plan Generator |
| Stack | React + Vite (frontend) + GROQ API + JIRA REST API v3 |
| AI Model | `openai/gpt-oss-120b` (GROQ, free tier) |
| JIRA Instance | `https://testlearn.atlassian.net` |
| Phase | Phase 2 — Link (UNLOCKED) |
| Blueprint Status | ✅ APPROVED |

---

## 2. Data Schema ✅ APPROVED

### 2.1 Settings (stored in localStorage — NOT in code)
```json
{
  "jira": {
    "baseUrl": "https://testlearn.atlassian.net",
    "email": "string",
    "token": "string (Atlassian API token)"
  },
  "groq": {
    "apiKey": "string",
    "model": "openai/gpt-oss-120b"
  }
}
```

### 2.2 JIRA Ticket Payload (fetched from GET /rest/api/3/issue/{id})
```json
{
  "jiraId": "string (e.g. SCRUM-5)",
  "summary": "string",
  "description": "string (plain text extracted from ADF)",
  "acceptanceCriteria": "string | null",
  "issueType": "Story | Bug | Task | Epic",
  "priority": "Highest | High | Medium | Low | Lowest",
  "labels": ["string"]
}
```

### 2.3 GROQ Request Shape
```json
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    { "role": "system", "content": "RICE-POT system prompt (see Section 4)" },
    { "role": "user", "content": "JIRA ticket details as structured text" }
  ],
  "temperature": 0
}
```
> `temperature: 0` is MANDATORY — enforces deterministic output per Q5.

### 2.4 Test Plan Output Shape
```json
{
  "jiraId": "string",
  "generatedAt": "ISO 8601 timestamp",
  "rawMarkdown": "string (full test plan in Markdown)"
}
```

### 2.5 Delivery Targets (all three required per Q4)
| Target | Mechanism |
|--------|-----------|
| Display | React Markdown renderer in UI |
| Download | `.md` file via Blob URL download |
| JIRA Comment | `POST /rest/api/3/issue/{id}/comment` with ADF body |

---

## 3. Behavioral Rules ✅ LOCKED

| Rule | Enforcement |
|------|-------------|
| DO NOT invent feature IDs or features not in the JIRA ticket | Hard rule in system prompt |
| DO NOT invent APIs, error codes, UI elements, or behavior | Hard rule in system prompt |
| DO NOT assume default or "typical" system behavior | Hard rule in system prompt |
| Missing/unclear info → output exactly: `"Insufficient information to determine."` | Hard rule in system prompt |
| Inferred detail → label exactly: `"Inference (low confidence)"` | Hard rule in system prompt |
| Minimum 20 test cases per plan | Enforced in system prompt |
| Tone: formal enterprise + concise bullets | Enforced in system prompt |
| Output must be deterministic | `temperature: 0` + system prompt |

---

## 4. GROQ System Prompt (Canonical — do not change without updating this file)

> ⚠️ Updated 2026-06-26: O section corrected — output is a full 8-section test plan, NOT a table-only response.

```
R — Role
You are an expert QA Lead with 15+ years of experience writing enterprise-grade
test plans. You produce complete, structured test planning documents — not just
test cases — traceable to the JIRA ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Generate a COMPLETE test plan document with ALL 8 sections listed in O — Output.
   Do not skip any section.
3. Every section must be derived strictly from the JIRA ticket fields provided.
4. Section 6 (Test Cases) must contain a MINIMUM of 20 test cases covering both
   positive and negative scenarios.
5. Trace every test case back to a specific field in the JIRA ticket.
6. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
7. If a detail is inferred → label it exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature ID, feature, API, error code, UI element, or behavior
  not present in the JIRA ticket
- Assume default or "typical" system behavior
- Skip any of the 8 sections

C — Context
[JIRA ticket fields injected at runtime: jiraId, summary, description,
 acceptanceCriteria, issueType, priority, labels]

P — Parameters
- Output MUST be deterministic (same ticket → same test plan every time)
- Every assertion traceable to the JIRA ticket fields provided
- Zero invented content. Enterprise-grade quality.
- All 8 sections must be present. Section 6 minimum 20 test cases.

O — Output
Generate a complete Markdown test plan document with ALL 8 sections:

# Test Plan: [JIRA_ID] — [SUMMARY]

## 1. Objective
2–3 sentences: what is being tested, why, and the goal.

## 2. Scope of Testing
- **In Scope:** bullet list (from ticket only)
- **Out of Scope:** bullet list

## 3. Test Strategy & Approach
Bullet list of testing types (Functional, Regression, Boundary, Negative, etc.)
with one-line description each.

## 4. Entry & Exit Criteria
| Phase | Entry Criteria | Exit Criteria |

## 5. Test Environment & Prerequisites
Bullet list of setup requirements from the ticket.

## 6. Test Cases
Minimum 20 rows. Exact columns:
| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |

## 7. Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
(only risks derivable from the ticket)

## 8. Sign-off
| Role | Name | Status |
| QA Lead | [QA Lead Name] | Pending |
| Product Owner | [Product Owner Name] | Pending |

T — Tone
Technical, precise, enterprise-grade. Formal with concise bullets.
Numbered steps inside the Test Steps column.
```

---

## 5. Architectural Invariants

- Credentials MUST live in `.env` (local) and `localStorage` (runtime UI). Never hardcoded.
- `.env` is gitignored. `.env.example` with placeholders is committed.
- JIRA ADF description must be converted to plain text before passing to GROQ.
- GROQ `temperature` is fixed at `0` — never configurable by user.
- JIRA comment is posted as ADF (Atlassian Document Format), not plain Markdown.
- CORS: JIRA Cloud BLOCKS browser-direct API calls from external origins (no ACAO header).
  All JIRA calls MUST go through the Vite proxy (`/api/jira/` prefix).
  Direct `fetch(config.baseUrl + ...)` from the browser will always fail.
- XSRF: JIRA Cloud requires `'X-Atlassian-Token': 'no-check'` header on ALL write operations
  (POST/PUT/DELETE). Without it, server returns `403 — XSRF check failed` regardless of auth.

---

## 6. Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-21 | Initial draft | Protocol 0 |
| 2026-06-21 | Schema APPROVED, behavioral rules LOCKED | Blueprint Q1-Q5 answered |
| 2026-06-26 | CORS fix: Vite proxy added, jiraService + jiraCommentService patched | JIRA Cloud blocks browser-direct calls |
| 2026-06-26 | System prompt O section corrected: output is full 8-section test plan, not table-only | App was generating test cases instead of a test plan |
| 2026-06-26 | `X-Atlassian-Token: no-check` added to jiraCommentService.js POST headers | JIRA Cloud XSRF protection returns 403 on all write operations without this header |
