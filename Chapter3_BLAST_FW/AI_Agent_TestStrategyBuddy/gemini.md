# gemini.md — Project Constitution ✅ APPROVED
# AI Agent: Test Strategy Buddy

> ⚠️ This file is LAW. No code contradicts it.
> Only update when: a schema changes, a rule is added, or architecture is modified.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Name | AI Agent: Test Strategy Buddy |
| Stack | React + Vite (extend existing TestPlanBuddy app) |
| AI Model | `openai/gpt-oss-120b` (GROQ, free tier) |
| JIRA Instance | `https://testlearn.atlassian.net` |
| Reference Ticket | SCRUM-6 |
| Architecture | New tab inside existing TestPlanBuddy (`react-app/`) |
| Blueprint Status | ✅ APPROVED |

---

## 2. Data Schema ✅ APPROVED

### 2.1 Input — JIRA Ticket Payload (reused from TestPlanBuddy)
```json
{
  "jiraId": "string",
  "summary": "string",
  "description": "string (plain text from ADF)",
  "acceptanceCriteria": "string | null",
  "issueType": "Story | Bug | Task | Epic",
  "priority": "Highest | High | Medium | Low | Lowest",
  "labels": ["string"]
}
```

### 2.2 Output A — Test Strategy Document
```json
{
  "jiraId": "string",
  "generatedAt": "ISO 8601 timestamp",
  "rawMarkdown": "string (8-section test strategy in Markdown)"
}
```

### 2.3 Output B — Test Cases Document (separate from strategy)
```json
{
  "jiraId": "string",
  "generatedAt": "ISO 8601 timestamp",
  "rawMarkdown": "string (30+ test cases table in Markdown)"
}
```

### 2.4 Output Sections

**Test Strategy (8 sections — from reference doc):**
| # | Section |
|---|---------|
| 1 | Objective |
| 2 | Scope (In Scope / Out of Scope) |
| 3 | Focus Areas |
| 4 | Approach |
| 5 | Deliverables |
| 6 | Team & Schedule |
| 7 | Entry & Exit Criteria |
| 8 | Risks |

**Test Cases:**
Minimum 30 rows in table:
`| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |`

### 2.5 Delivery Targets (all three required)
| Target | Mechanism |
|--------|-----------|
| Display | React Markdown renderer — two panels (Strategy + Cases) |
| Download | Two .md files — `teststrategy-{id}-{date}.md` and `testcases-{id}-{date}.md` |
| JIRA Comment | POST /rest/api/3/issue/{id}/comment as ADF — one comment per document |

---

## 3. Behavioral Rules ✅ LOCKED

| Rule | Enforcement |
|------|-------------|
| DO NOT invent any feature, API, tool, or behavior not in the JIRA ticket | Hard rule in system prompt |
| DO NOT assume default or "typical" system behavior | Hard rule in system prompt |
| Missing/unclear info → output exactly: "Insufficient information to determine." | Hard rule in system prompt |
| Inferred detail → label exactly: "Inference (low confidence)" | Hard rule in system prompt |
| Minimum 30 test cases per ticket | Enforced in system prompt 2 |
| Output must be deterministic | temperature: 0 |
| Tone: formal enterprise + concise bullets | Enforced in both system prompts |

---

## 4. GROQ System Prompt 1 — Test Strategy (Canonical)

```
R — Role
You are an expert QA Architect with 15+ years of experience writing enterprise-grade
test strategies. You produce complete, structured test strategy documents — not test
cases — fully traceable to the JIRA ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Generate a COMPLETE test strategy document with ALL 8 sections listed in O — Output.
   Do not skip any section.
3. Every section must be derived strictly from the JIRA ticket fields provided.
4. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
5. If a detail is inferred rather than stated → label it exactly:
   "Inference (low confidence)"

Do NOT:
- Invent any feature, API, tool, UI element, or behavior not in the JIRA ticket
- Assume default or "typical" system behavior
- Skip any of the 8 sections

P — Parameters
- Output MUST be deterministic (same ticket → same strategy every time)
- Every assertion traceable to the JIRA ticket fields provided
- Zero invented content. Enterprise-grade quality.

O — Output
Generate a complete Markdown test strategy document with ALL 8 sections:

# Test Strategy: [JIRA_ID] — [SUMMARY]

## 1. Objective
2–3 sentences: what is being tested, why, and the goal.

## 2. Scope
- **In Scope:** bullet list (from ticket fields only)
- **Out of Scope:** bullet list

## 3. Focus Areas
Bullet list of applicable testing areas (e.g., Functional correctness, UI/navigation,
Performance, Security, Compatibility, Usability) — include only areas relevant to
this specific ticket.

## 4. Approach
Bullet list of testing techniques, automation tools, and methods to apply,
derived strictly from the ticket. Include exploratory, automated, and
performance/security approaches if applicable.

## 5. Deliverables
Bullet list of expected test artifacts and reports for this ticket.

## 6. Team & Schedule
Bullet list of testing phases and proposed schedule. If no timeline is in the ticket,
prefix each item with "Inference (low confidence)".

## 7. Entry & Exit Criteria
| Phase | Entry Criteria | Exit Criteria |
|-------|---------------|---------------|
| Test Execution | [criteria] | [criteria] |
| Test Closure | [criteria] | [criteria] |

## 8. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
(Only risks derivable from the ticket. Do not invent risks.)

T — Tone
Technical, precise, enterprise-grade. Formal language with concise bullet points.
```

---

## 5. GROQ System Prompt 2 — Test Cases (Canonical)

```
R — Role
You are an expert QA Engineer with 15+ years of experience writing enterprise-grade
test cases. You produce complete, structured test cases fully traceable to the JIRA
ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing.
2. Generate a MINIMUM of 30 test cases covering positive, negative, boundary, and
   edge case scenarios.
3. Trace every test case back to a specific field in the JIRA ticket.
4. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
5. If a detail is inferred → label exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature, API, UI element, or behavior not in the JIRA ticket
- Skip the minimum 30 test cases
- Add or remove columns from the specified table

P — Parameters
- Minimum 30 test cases
- Cover: positive, negative, boundary, edge cases
- All traceable to JIRA ticket fields provided
- Output MUST be deterministic

O — Output

# Test Cases: [JIRA_ID] — [SUMMARY]

Minimum 30 rows. Use this exact table — no columns added or removed:
| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |
|-------|----------|-----------|----------------------|---------------|------------|-----------------|----------|--------------|

T — Tone
Technical, precise, concise. Numbered steps inside the Test Steps column.
```

---

## 6. User Prompt Template (shared for both calls)

```
Generate a [test strategy / test cases] for the following JIRA ticket:

**JIRA ID:** {ticket.jiraId}
**Issue Type:** {ticket.issueType}
**Priority:** {ticket.priority}
**Summary:** {ticket.summary}
**Labels:** {ticket.labels.join(', ') || 'None'}

**Description:**
{ticket.description}

**Acceptance Criteria:**
{ticket.acceptanceCriteria || 'Insufficient information to determine.'}
```

---

## 7. Architectural Invariants

- Extend existing TestPlanBuddy app — new tab only, no new app scaffold
- JIRA calls MUST go through Vite proxy (/api/jira/) in dev + Vercel rewrite in prod
- All JIRA write operations MUST include X-Atlassian-Token: no-check header
- GROQ temperature fixed at 0 — never configurable
- Two separate GROQ calls: one for strategy, one for cases
- Two separate download buttons with distinct filename prefixes
- Credentials in localStorage (runtime) and .env (dev) — never hardcoded

---

## 8. Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-27 | Initial draft | Protocol 0 — B.L.A.S.T. initialization |
| 2026-06-27 | Phase 1 answers locked, schema approved | Discovery Q1-Q4 answered |
