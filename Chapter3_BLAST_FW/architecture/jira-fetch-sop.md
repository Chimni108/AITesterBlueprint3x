# SOP: JIRA Ticket Fetch & Parse

## Goal
Fetch a JIRA issue by ID and extract structured fields for the GROQ prompt.

## Endpoint
`GET https://{baseUrl}/rest/api/3/issue/{issueId}`

## Auth
`Authorization: Basic base64(email:token)`

## ADF Parsing Rule
JIRA descriptions are in Atlassian Document Format. Walk the tree recursively:
```
function adfToText(node):
  if node.type === 'text' → return node.text
  if node.content exists → return node.content.map(adfToText).join('')
  return ''
```

## Fields to Extract
| Field | JIRA Path | Fallback |
|-------|-----------|----------|
| summary | fields.summary | '' |
| description | adfToText(fields.description) | 'Insufficient information to determine.' |
| acceptanceCriteria | regex match in description | null |
| issueType | fields.issuetype.name | 'Task' |
| priority | fields.priority.name | 'Medium' |
| labels | fields.labels | [] |

## Error Handling
- 401 → Invalid credentials → throw 'JIRA auth failed. Check Settings.'
- 404 → Ticket not found → throw 'JIRA issue {id} not found.'
- Network error → throw raw error message
