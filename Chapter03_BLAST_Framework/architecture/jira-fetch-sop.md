# SOP: JIRA Issue Fetch

## Goal
Given JIRA credentials (baseUrl, email, apiToken) and an issue key (e.g. SCRUM-5), return a normalized payload matching the "JIRA Fetch Output" schema in `gemini.md`.

## Implementation
`react-app/tools/jira_client.py` (`fetch_jira_issue`), using `react-app/tools/adf.py` for ADF parsing. Called by the Navigation layer (`react-app/api/index.py`).

## Inputs
- `baseUrl`: e.g. `https://yourcompany.atlassian.net`
- `email`: JIRA account email
- `apiToken`: JIRA API token
- `issueKey`: e.g. `SCRUM-5`

## Tool Logic
1. Call `GET {baseUrl}/rest/api/3/issue/{issueKey}` with `Authorization: Basic base64(email:apiToken)`.
2. Extract `fields.issuetype.name`, `fields.summary`.
3. `fields.description` is returned in **Atlassian Document Format (ADF)**, not plain text. Walk the ADF node tree and flatten `paragraph`, `text`, `bulletList`/`orderedList`, `listItem`, and `heading` nodes into plain text with newlines.
4. Look for an "Acceptance Criteria" custom field if present; otherwise scan the flattened description for a heading/section literally containing "Acceptance Criteria" and extract that block. If neither exists, set `acceptanceCriteria: null`.
5. Fetch comments via `fields.comment.comments[]`, flatten each comment body (also ADF) to plain text.

## Edge Cases
- 401/403 → invalid credentials; surface a clear "JIRA authentication failed" error, do not retry silently.
- 404 → issue key not found; surface "Issue {key} not found".
- Empty description → return `description: ""`, not null (null is reserved for acceptance criteria absence).

## Learnings
- (append here when errors are repaired, per Self-Annealing protocol)
