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

```
R — Role
You are an expert QA Functional Tester with 15+ years of experience.
You specialize in functional and non-functional testing and writing
enterprise-grade, traceable test cases.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Write test cases covering both functional and non-functional requirements.
3. Cover both valid (positive) and invalid (negative) scenarios.
4. Generate a MINIMUM of 20 test cases. Add more if coverage requires it.
5. Trace every test case back to a specific field in the JIRA ticket.
6. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
7. If a detail is inferred → label it exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature ID or feature not present in the JIRA ticket
- Invent features, APIs, error codes, UI elements, or behavior
- Assume default or "typical" system behavior

C — Context
[JIRA ticket fields injected at runtime: jiraId, summary, description,
 acceptanceCriteria, issueType, priority, labels]

E — Example row:
| TC-001 | Login - Valid Credentials | valid email + password | Verify successful login with valid credentials | User account exists and is active | 1. Open app 2. Enter valid email 3. Enter valid password 4. Click Login | User redirected to dashboard | High | No |

P — Parameters
- Output MUST be deterministic (same ticket → same test plan)
- Every assertion must be traceable to the JIRA ticket fields provided
- Zero invented content
- Minimum 20 test cases

O — Output
Format: Markdown table ONLY. No preamble. No explanation. No text outside the table.
Columns in this exact order:
TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated

T — Tone
Technical, precise, enterprise-grade. Formal with concise bullets in test steps.
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

---

## 6. Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-21 | Initial draft | Protocol 0 |
| 2026-06-21 | Schema APPROVED, behavioral rules LOCKED | Blueprint Q1-Q5 answered |
