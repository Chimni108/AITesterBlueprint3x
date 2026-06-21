# SOP: Export (.md Download) + JIRA Comment

## Goal A — Markdown Download
Create a Blob URL from rawMarkdown and trigger browser download.

```
filename: testplan-{jiraId}-{YYYY-MM-DD}.md
mime:     text/markdown
method:   Blob → URL.createObjectURL → <a>.click()
```

## Goal B — Post to JIRA as Comment
`POST https://{baseUrl}/rest/api/3/issue/{issueId}/comment`

### JIRA Comment Body Format
Must be ADF (Atlassian Document Format), NOT plain Markdown.

### Markdown → ADF Conversion Rules
| Markdown | ADF node |
|----------|----------|
| `# text` | heading, level 1 |
| `## text` | heading, level 2 |
| `\| col \|...` | paragraph (table ADF is complex — render as paragraph) |
| plain line | paragraph |
| empty line | skip |

### ADF Envelope
```json
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [ ...nodes ]
  }
}
```

## Error Handling
- 401 → 'JIRA auth failed'
- 404 → 'Issue not found'
- 400 → Log ADF body for debugging, throw parse error
