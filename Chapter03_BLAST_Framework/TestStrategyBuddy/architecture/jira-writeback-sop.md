# SOP: JIRA Test Case Write-Back

## Goal
Given a list of generated test cases and a source JIRA issue key (e.g. SCRUM-6), create one **Sub-task** issue per test case, parented to the source issue, and return the resulting list of created JIRA issue keys/URLs per the "JIRA Write-Back Output" schema in `gemini.md`.

## Implementation
`react-app/tools/jira_writer.py` (`create_test_case_subtask`), using `react-app/tools/adf.py` (`plain_text_to_adf`) to build the issue description. Called per-test-case in a loop by the Navigation layer's `/api/testcases/publish` endpoint.

## Inputs
- `baseUrl`, `email`, `apiToken`: JIRA credentials.
- `parentKey`: the source issue (e.g. `SCRUM-6`) — the project key for the new Sub-tasks is derived from this (`SCRUM`).
- `test_case`: one object matching the Test Case Generation Output schema.

## Tool Logic
1. Derive `project.key` from `parentKey` (text before the `-`).
2. `POST {baseUrl}/rest/api/3/issue` with `fields.project.key`, `fields.parent.key = parentKey`, `fields.issuetype.name = "Sub-task"`, `fields.summary = "{id} — {scenario}"`, `fields.description` = ADF built from a plain-text rendering of page/testData/preCondition/steps/expectedResult/priority/isAutomated/traceability.
3. Return `{ jiraIssueKey, url }` on success.

## Edge Cases
- 401/403 → "JIRA authentication failed."
- Non-2xx → raise `JiraWriteError` with the JIRA response body; the Navigation layer records this test case under `failed`, not `created`, and continues processing the rest of the batch (failures never abort the whole run).
- If the JIRA project does not have "Sub-task" enabled, the create call fails per-item and is surfaced to the user via the `failed` list — no silent fallback to a different issue type (would violate the user's explicit Blueprint choice).

## Learnings
- (append here when errors are repaired, per Self-Annealing protocol)
