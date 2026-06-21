# SOP: GROQ Test Plan Generation

## Goal
Generate a deterministic, RICE-POT-formatted test plan from a JIRA ticket payload.

## Endpoint
`POST https://api.groq.com/openai/v1/chat/completions`

## Auth
`Authorization: Bearer {groqApiKey}`

## Invariants (from gemini.md)
- model: `openai/gpt-oss-120b` (fixed)
- temperature: `0` (NEVER change — required for determinism)
- min test cases: 20

## Prompt Assembly
```
messages[0].role = 'system'  → RICE-POT system prompt (canonical in gemini.md §4)
messages[1].role = 'user'    → structured JIRA ticket fields
```

## User Message Template
```
JIRA ID: {jiraId}
Issue Type: {issueType}
Priority: {priority}
Summary: {summary}
Labels: {labels.join(', ') || 'None'}
Description: {description}
Acceptance Criteria: {acceptanceCriteria || 'Insufficient information to determine.'}
```

## Output Parsing
- Extract `choices[0].message.content`
- Store as `rawMarkdown` string
- No post-processing — the model outputs the table directly

## Error Handling
- 400/422 → Model error → throw GROQ error body
- 401 → Invalid key → throw 'GROQ auth failed. Check Settings.'
- Timeout → throw 'GROQ request timed out.'
