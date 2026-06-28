# SOP: GROQ Test Plan Generation

## Goal
Given a normalized JIRA Fetch Output payload and a GROQ API key, produce a Test Plan matching the "Test Plan Generation Output" schema in `gemini.md`.

## Implementation
`react-app/tools/groq_client.py` (`generate_test_plan`). Called by the Navigation layer (`react-app/api/index.py`) after `fetch_jira_issue`.

## Inputs
- `apiKey`: GROQ API key
- `model`: `openai/gpt-oss-120b`
- JIRA Fetch Output (issueKey, issueType, summary, description, acceptanceCriteria, comments)

## Tool Logic
1. Build a system prompt enforcing the Behavioral Rules from `gemini.md`:
   - Structured QA template: Objective, Scope (in/out), Test Cases (positive/negative/edge), Risks, Acceptance Criteria mapping.
   - Hard rule: never invent acceptance criteria/features not present in the ticket content.
   - Instruct the model to respond with **strict JSON only**, matching the Test Plan Generation Output schema.
2. Build a user message containing the normalized JIRA fields (summary, description, acceptanceCriteria, comments).
3. POST to `https://api.groq.com/openai/v1/chat/completions` with `{ model, messages, temperature: 0.3, response_format: { type: "json_object" } }` via `requests`. Low temperature keeps output grounded/deterministic.
4. Parse the JSON response. If parsing fails, retry once with an explicit "return valid JSON only" correction message before failing.
5. Validate the parsed object has all required top-level keys (`issueKey`, `objective`, `scope`, `testCases`, `risks`, `acceptanceCriteriaMapping`); if any are missing, treat as a generation failure.

## Edge Cases
- 401 → invalid GROQ API key.
- 429 → rate limited; surface a clear message, do not silently retry in a loop.
- Malformed JSON after one retry → surface "Test plan generation failed: invalid model output".

## Learnings
- (append here when errors are repaired, per Self-Annealing protocol)
