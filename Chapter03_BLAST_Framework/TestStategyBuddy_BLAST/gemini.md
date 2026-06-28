# Project Constitution (gemini.md)

Status: v1 BUILT AND DEPLOYED (2026-06-28) — live at https://teststrategy-testcase-generator-bla.vercel.app

## Data Schemas

### Settings Payload (client-side, Settings UI — no `.env`, same deviation as the sibling project)
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

### Test Case Generation Output (Tab 2 — plain B.L.A.S.T.-style prompt, NO RICE-POT, 10 Login + 10 Dashboard = 20 total)
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
      "traceability": "string (requirement/source, or 'Insufficient information to determine.')"
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
- **NO RICE-POT framework.** Prompts are built as plain, direct instructions per B.L.A.S.T.md's own "Behavioral Rules" discovery question — Role/persona framing is optional and minimal; the structure is simply: task instruction + grounding context (JIRA issue + docx) + explicit output JSON shape + a no-invention rule. No Example/Parameters/Tone sections.
- **JIRA input:** a single user-entered issue key per generation (text field), not a hardcoded SCRUM-5/SCRUM-6 pair. SCRUM-5 and SCRUM-6 from `objective.md` are usage examples, not fixed inputs.
- **Test Strategy tab:** grounded strictly in the fetched JIRA issue fields and the attached `Test Strategy for Ecommerce Website.docx` reference structure (Objective/Scope/Focus Areas/Approach/Deliverables/Risks). No fabricated scope items.
- **Test Case tab:** exactly 20 test cases per run — 10 Login, 10 Dashboard — covering both positive and negative scenarios, traceable to the JIRA issue or docx. If a detail can't be determined from the inputs, the field must read exactly "Insufficient information to determine." Count/limit chosen specifically to stay under GROQ's free-tier 8000 TPM cap (see `findings.md`).
- **JIRA write-back:** each test case is created as a **Sub-task issue type, parented to the source JIRA issue** (same mechanic as the sibling project). The UI displays the resulting list of created JIRA issue keys/links; failures are surfaced per test case, not silently dropped.
- v1 scope: write-back only creates new issues, never modifies/deletes existing ones.
- Credentials via Settings UI per-request — no `.env`.

## Architectural Invariants
- Same 3-layer A.N.T. architecture as the sibling Test Plan Generator / TestStrategyBuddy projects: Markdown SOPs in `architecture/`, Flask Navigation layer, deterministic Python Tools layer.
- Tools needed: `jira_client` (fetch, reused pattern), `jira_writer` (write-back Sub-task creation, reused pattern), `groq_strategy_client` (Test Strategy generation, plain prompt), `groq_testcase_client` (20-case generation, plain prompt — explicitly NOT RICE-POT structured).
- UI: two-tab dashboard (Test Strategy / Test Case Generator), with a dark/light mode toggle (persisted client-side).
- Deploy target: Vercel project `teststrategy_testcase_generator_blast_fw` (note: Vercel requires lowercase names, so the actual slug will differ, e.g. `teststrategy-testcase-generator-blast-fw`).

## Maintenance Log
- 2026-06-28: File created, draft state, new B.L.A.S.T. cycle started for TestStategyBuddy_BLAST.
- 2026-06-28: Discovery Q&A complete — single user-entered JIRA key (not fixed SCRUM-5/6 pair), 20 test cases (10 Login/10 Dashboard) to respect GROQ's free-tier rate limit. Data Schema defined above, Blueprint approved.
- 2026-06-28: v1 built and deployed. Reused `jira_client.py`/`jira_writer.py`/`adf.py` verbatim from the sibling `TestStrategyBuddy` project; wrote `groq_strategy_client.py`/`groq_testcase_client.py` fresh with plain B.L.A.S.T.-style prompts (no RICE-POT), `max_tokens: 3500`, 20-case target from the start. Built Flask navigation layer, architecture SOPs, two-tab dark/light-mode React UI. Verified locally (build + Flask validation smoke test), then deployed to Vercel as `teststrategy-testcase-generator-blast-fw`, live at https://teststrategy-testcase-generator-bla.vercel.app, confirmed via live API smoke test.
