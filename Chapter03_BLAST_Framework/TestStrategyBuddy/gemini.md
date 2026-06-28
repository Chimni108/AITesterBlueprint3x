# Project Constitution (gemini.md)

Status: v1 BUILT AND DEPLOYED (2026-06-28) — live at https://teststrategy-testcase-generator.vercel.app

## Data Schemas

### Settings Payload (client-side, Settings UI — same pattern as the existing Test Plan Generator)
```json
{
  "jira": { "baseUrl": "string", "email": "string", "apiToken": "string" },
  "groq": { "apiKey": "string", "model": "openai/gpt-oss-120b" }
}
```

### JIRA Fetch Output
```json
{
  "issueKey": "string",
  "issueType": "string",
  "summary": "string",
  "description": "string",
  "acceptanceCriteria": "string | null",
  "comments": ["string"]
}
```

### Test Strategy Output (Tab 1 — grounded in JIRA issue + attached Test Strategy docx structure)
```json
{
  "issueKey": "string",
  "objective": "string",
  "scope": { "inScope": ["string"], "outOfScope": ["string"] },
  "focusAreas": ["string"],
  "approach": ["string"],
  "deliverables": ["string"],
  "risks": ["string"]
}
```

### Test Case Generation Output (Tab 2 — RICE-POT framework, 10 Login + 10 Dashboard = 20 total)
```json
{
  "issueKey": "string",
  "testCases": [
    {
      "id": "string (e.g. TC-001)",
      "page": "Login | Dashboard",
      "scenario": "string",
      "testData": "string",
      "description": "string",
      "preCondition": "string",
      "steps": ["string"],
      "expectedResult": "string",
      "priority": "High | Medium | Low",
      "isAutomated": "boolean",
      "traceability": "string (requirement/source, or 'Insufficient information to determine.' / 'Inference (low confidence)')"
    }
  ]
}
```

### JIRA Write-Back Output (after posting test cases as Sub-tasks under the source issue)
```json
{
  "created": [{ "testCaseId": "string", "jiraIssueKey": "string", "url": "string" }],
  "failed": [{ "testCaseId": "string", "error": "string" }]
}
```

## Behavioral Rules
- **Test Strategy tab:** grounded strictly in the fetched JIRA issue fields and the attached `Test Strategy for Ecommerce Website.docx` reference structure (Objective/Scope/Focus Areas/Approach/Deliverables/Risks). No fabricated scope items.
- **Test Case tab:** generated using the **RICE-POT prompt framework** (see `RICE_POT.md`) — Role (expert QA Functional Tester), Instructions (cover positive+negative, trace every case to a requirement, stop-and-flag on ambiguity), Context (JIRA issue + docx), Example (one sample row), Parameters (deterministic, traceable, zero invented content, "Insufficient information to determine." fallback, "Inference (low confidence)" labeling), Output (strict JSON per schema above), Tone (technical, precise, no commentary).
- Exactly 20 test cases per run: 10 for Login, 10 for Dashboard. (Reduced from the originally-spec'd 40 on 2026-06-28 — GROQ free-tier `on_demand` service tier caps `openai/gpt-oss-120b` at 8000 tokens-per-minute, and a 40-case request plus its completion exceeded that limit with a 413 `rate_limit_exceeded`.)
- **JIRA write-back:** each test case is created as a **Sub-task issue type, parented to the source JIRA issue** (e.g. SCRUM-6). The UI displays the resulting list of created JIRA issue keys/links; failures are surfaced per test case, not silently dropped.
- v1 scope: write-back only creates new issues, never modifies/deletes existing ones.
- Credentials via Settings UI per-request — no `.env`, consistent with the existing Test Plan Generator project's confirmed deviation from the literal B.L.A.S.T. spec.

## Architectural Invariants
- Same 3-layer A.N.T. architecture as the existing Test Plan Generator: Markdown SOPs in `architecture/`, Flask Navigation layer, deterministic Python Tools layer.
- New tools needed beyond the existing project: `jira_create_subtask` (write-back), `groq_strategy_client` (Test Strategy generation), `groq_testcase_client` (RICE-POT test case generation).
- UI: two-tab dashboard (Test Strategy / Test Case Generator), with a dark/light mode toggle (persisted client-side).
- Deploy target: Vercel project `teststrategy_testcase_generator` (note: Vercel requires lowercase names, so the actual slug will differ, e.g. `teststrategy-testcase-generator`).

## Maintenance Log
- 2026-06-28: File created, draft state, new B.L.A.S.T. cycle started for TestStrategyBuddy.
- 2026-06-28: Discovery Q&A complete — RICE-POT clarified via `RICE_POT.md`, write-back = one Sub-task per test case under the source issue, 20/20 Login/Dashboard split confirmed. Data Schema defined above, pending Blueprint approval.
- 2026-06-28: Blueprint approved. Build started.
- 2026-06-28: v1 built (Python tools, Flask navigation layer, two-tab React UI with dark/light mode) and deployed to Vercel as `nam-qa/teststrategy-testcase-generator` (lowercase, per Vercel naming rule) — live at https://teststrategy-testcase-generator.vercel.app.
- 2026-06-28: Self-Annealing repair — live test case generation hit GROQ 413 `rate_limit_exceeded` (8965 tokens requested vs. 8000 TPM limit on the free `on_demand` tier). Reduced test case count from 40 (20/20) to 20 (10/10) and `max_tokens` from 8000 to 3500 in `groq_testcase_client.py` to fit within the rate limit. Redeployed.
