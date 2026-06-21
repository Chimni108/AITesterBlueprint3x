const GROQ_CONFIG_KEY = 'blast_groq_config'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export function getGroqConfig() {
  const stored = localStorage.getItem(GROQ_CONFIG_KEY)
  return stored ? JSON.parse(stored) : null
}

export function saveGroqConfig(config) {
  localStorage.setItem(GROQ_CONFIG_KEY, JSON.stringify(config))
}

const SYSTEM_PROMPT = `R — Role
You are an expert QA Functional Tester with 15+ years of experience. You specialize in functional and non-functional testing and writing enterprise-grade, traceable test cases.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Write test cases covering both functional and non-functional requirements.
3. Cover both valid (positive) and invalid (negative) scenarios.
4. Generate a MINIMUM of 20 test cases. Add more if coverage requires it.
5. Trace every test case back to a specific field in the JIRA ticket provided.
6. If a requirement is missing or ambiguous, output exactly: "Insufficient information to determine."
7. If a detail is inferred rather than stated, label it exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature ID or feature not present in the JIRA ticket
- Invent features, APIs, error codes, UI elements, or behavior
- Assume default or "typical" system behavior

P — Parameters
- Output MUST be deterministic (same ticket input → same test plan every time)
- Every assertion must be traceable to the JIRA ticket fields provided
- Zero invented content. Enterprise-grade quality.
- Minimum 20 test cases

O — Output
Start with a heading line: # Test Plan: {JIRA_ID} — {SUMMARY}
Then output one Markdown table. No preamble. No explanation. No text outside the heading and table.
Columns in this exact order:
| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |

T — Tone
Technical, precise, enterprise-grade. Formal with concise numbered steps inside the Test Steps column.`

function buildUserPrompt(ticket) {
  return `Generate a complete test plan for the following JIRA ticket:

**JIRA ID:** ${ticket.jiraId}
**Issue Type:** ${ticket.issueType}
**Priority:** ${ticket.priority}
**Summary:** ${ticket.summary}
**Labels:** ${ticket.labels.length > 0 ? ticket.labels.join(', ') : 'None'}

**Description:**
${ticket.description}

**Acceptance Criteria:**
${ticket.acceptanceCriteria}

Generate minimum 20 test cases in the RICE-POT Markdown table format specified.`
}

export async function generateTestPlan(ticket) {
  const config = getGroqConfig()
  if (!config?.apiKey) {
    throw new Error('GROQ not configured. Go to Settings and add your API key.')
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(ticket) },
      ],
      temperature: 0,
    }),
  })

  if (response.status === 401) throw new Error('GROQ auth failed. Check your API key in Settings.')
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GROQ error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const rawMarkdown = data.choices?.[0]?.message?.content || ''

  return {
    jiraId: ticket.jiraId,
    generatedAt: new Date().toISOString(),
    rawMarkdown,
  }
}
