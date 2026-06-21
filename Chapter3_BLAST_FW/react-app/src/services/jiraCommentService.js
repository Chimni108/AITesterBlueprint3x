import { getJiraConfig } from './jiraService'

function markdownToAdf(markdown) {
  const lines = markdown.split('\n')
  const content = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      content.push({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: trimmed.slice(2) }] })
    } else if (trimmed.startsWith('## ')) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: trimmed.slice(3) }] })
    } else if (trimmed.startsWith('### ')) {
      content.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: trimmed.slice(4) }] })
    } else {
      content.push({ type: 'paragraph', content: [{ type: 'text', text: trimmed }] })
    }
  }

  return { type: 'doc', version: 1, content }
}

export async function postTestPlanToJira(jiraId, testPlan) {
  const config = getJiraConfig()
  if (!config?.baseUrl || !config?.email || !config?.token) {
    throw new Error('JIRA not configured. Go to Settings.')
  }

  const creds = btoa(`${config.email}:${config.token}`)
  const adfBody = markdownToAdf(testPlan.rawMarkdown)

  const response = await fetch(`${config.baseUrl}/rest/api/3/issue/${jiraId}/comment`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ body: adfBody }),
  })

  if (response.status === 401) throw new Error('JIRA auth failed. Check Settings.')
  if (response.status === 404) throw new Error(`Issue "${jiraId}" not found.`)
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`JIRA comment failed: ${response.status} — ${err}`)
  }

  return await response.json()
}
