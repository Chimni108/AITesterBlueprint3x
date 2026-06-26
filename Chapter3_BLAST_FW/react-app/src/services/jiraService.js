const JIRA_CONFIG_KEY = 'blast_jira_config'

export function getJiraConfig() {
  const stored = localStorage.getItem(JIRA_CONFIG_KEY)
  return stored ? JSON.parse(stored) : null
}

export function saveJiraConfig(config) {
  localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config))
}

function adfToText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.type === 'hardBreak') return '\n'
  if (Array.isArray(node.content)) return node.content.map(adfToText).join('')
  return ''
}

function extractAcceptanceCriteria(text) {
  const match = text.match(/acceptance criteria[:\s]+([\s\S]+?)(?:\n{2,}|$)/i)
  return match ? match[1].trim() : null
}

export async function fetchJiraTicket(jiraId) {
  const config = getJiraConfig()
  if (!config?.baseUrl || !config?.email || !config?.token) {
    throw new Error('JIRA not configured. Go to Settings and fill in all fields.')
  }

  const creds = btoa(`${config.email}:${config.token}`)
  const url = `/api/jira/rest/api/3/issue/${jiraId}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${creds}`,
      Accept: 'application/json',
    },
  })

  if (response.status === 401) throw new Error('JIRA auth failed. Check your email and API token in Settings.')
  if (response.status === 404) throw new Error(`JIRA issue "${jiraId}" not found. Check the ID and your project key.`)
  if (!response.ok) throw new Error(`JIRA error: ${response.status} ${response.statusText}`)

  const data = await response.json()
  const fields = data.fields
  const descriptionText = adfToText(fields.description)

  return {
    jiraId,
    summary: fields.summary || '',
    description: descriptionText || 'Insufficient information to determine.',
    acceptanceCriteria: extractAcceptanceCriteria(descriptionText) || 'Insufficient information to determine.',
    issueType: fields.issuetype?.name || 'Task',
    priority: fields.priority?.name || 'Medium',
    labels: fields.labels || [],
  }
}
