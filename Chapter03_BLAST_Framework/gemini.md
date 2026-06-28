# Project Constitution (gemini.md)

Status: v2 BUILT AND DEPLOYED (2026-06-28) — Live at https://testplangenerator-nam.vercel.app. Python-first 3-layer architecture, Settings-UI credentials, attractive dashboard UI. Pending: live end-to-end test with real credentials.

## Data Schemas

### Settings Payload (stored client-side, used to configure JIRA/GROQ clients)
```json
{
  "jira": {
    "baseUrl": "string (e.g. https://yourcompany.atlassian.net)",
    "email": "string",
    "apiToken": "string"
  },
  "groq": {
    "apiKey": "string",
    "model": "openai/gpt-oss-120b"
  }
}
```

### JIRA Fetch Output (raw, normalized from JIRA REST API)
```json
{
  "issueKey": "string (e.g. SCRUM-5)",
  "issueType": "string",
  "summary": "string",
  "description": "string",
  "acceptanceCriteria": "string | null",
  "comments": ["string"]
}
```

### Test Plan Generation Output (GROQ response, rendered in UI)
```json
{
  "issueKey": "string",
  "objective": "string",
  "scope": { "inScope": ["string"], "outOfScope": ["string"] },
  "testCases": [
    {
      "id": "string",
      "title": "string",
      "type": "positive | negative | edge",
      "steps": ["string"],
      "expectedResult": "string"
    }
  ],
  "risks": ["string"],
  "acceptanceCriteriaMapping": [
    { "criterion": "string", "coveredByTestCaseIds": ["string"] }
  ]
}
```

## Behavioral Rules
- Output must follow the structured QA template: Objective, Scope (in/out), Test Cases (positive/negative/edge), Risks, Acceptance Criteria mapping.
- Source of truth is JIRA issue fields only (summary, description, acceptance criteria, comments) — no linked issues, no external context.
- v1 delivers results to the React UI only — no JIRA write-back, no file export.
- **Hard rule:** Never fabricate acceptance criteria, features, or requirements not present in the fetched JIRA issue. Every test case must be grounded in actual ticket content.

## Architectural Invariants
- 3-layer A.N.T. architecture, Python-first from the start (per literal B.L.A.S.T. spec):
  - **Layer 1 (Architecture):** SOPs in `architecture/jira-fetch-sop.md` and `architecture/groq-generation-sop.md`.
  - **Layer 2 (Navigation):** A Flask app routing requests to tools in the right order, no business logic itself.
  - **Layer 3 (Tools):** Deterministic Python scripts (`jira_client.py`, `groq_client.py`, `adf.py`), atomic and testable independently.
- **One intentional deviation from literal spec (user-confirmed):** credentials come from the React Settings UI per-request, not from `.env`. No `.env` is used at all in this rebuild — the previous leaked-secret `.env` was deleted.
- Project is "Complete" only when the payload reaches its final destination (rendered in the React dashboard for v1).
- Deploy target: Vercel project named `TestPlanGenerator_NAM` (note: Vercel lowercases/normalizes project names, so the live URL slug may differ slightly).

## Maintenance Log
- 2026-06-28: File created, draft state, fresh rebuild started.
- 2026-06-28: Discovery Q&A complete (credentials via Settings UI, Python tools from the start, display-only v1, JIRA-fields-only grounding). Blueprint approved.
- 2026-06-28: Full build complete — React dashboard, Python tools layer, Flask navigation layer, architecture SOPs. Verified locally (Flask + Vite proxy + production build).
- 2026-06-28: Deployed to Vercel as `testplangenerator-nam` (org `nam-qa`) — requested name `TestPlanGenerator_NAM` was rejected by Vercel's lowercase naming rule. Live at https://testplangenerator-nam.vercel.app, verified via curl.
- **Known constraints for future maintainers:**
  - JIRA `description`/comment fields are ADF, not plain text — see `architecture/jira-fetch-sop.md` and `tools/adf.py`.
  - GROQ responses are JSON-mode with one retry on malformed JSON — see `architecture/groq-generation-sop.md` and `tools/groq_client.py`.
  - Credentials are never stored server-side; they live in the browser's localStorage and are sent per-request to the Flask Navigation layer.
  - v1 scope explicitly excludes JIRA write-back and file export.
  - No `.env` is used anywhere in this build (the previous leaked-secret `.env` was deleted before any code was written).
