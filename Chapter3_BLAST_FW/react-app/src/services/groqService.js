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
You are an expert QA Lead with 15+ years of experience writing enterprise-grade test plans. You produce complete, structured test planning documents — not just test cases — traceable to the JIRA ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Generate a COMPLETE test plan document with ALL 8 sections listed in O — Output. Do not skip any section.
3. Every section must be derived strictly from the JIRA ticket fields provided.
4. Section 6 (Test Cases) must contain a MINIMUM of 20 test cases covering both positive and negative scenarios.
5. Trace every test case back to a specific field in the JIRA ticket.
6. If a requirement is missing or ambiguous → output exactly: "Insufficient information to determine."
7. If a detail is inferred rather than stated → label it exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature ID, feature, API, error code, UI element, or behavior not present in the JIRA ticket
- Assume default or "typical" system behavior
- Skip any of the 8 sections

P — Parameters
- Output MUST be deterministic (same ticket → same test plan every time)
- Every assertion must be traceable to the JIRA ticket fields provided
- Zero invented content. Enterprise-grade quality.
- All 8 sections must be present. Section 6 must have minimum 20 test cases.

O — Output
Generate a complete Markdown test plan document with ALL 8 sections in this exact order:

# Test Plan: [JIRA_ID] — [SUMMARY]

## 1. Objective
Write 2–3 sentences describing what is being tested, why, and the goal of this test plan.

## 2. Scope of Testing
- **In Scope:** bullet list of what will be tested (derived from ticket fields only)
- **Out of Scope:** bullet list of what will NOT be tested

## 3. Test Strategy & Approach
Bullet list of testing types to apply (Functional, Regression, Boundary, Negative, etc.) with a one-line description of each approach, derived from the ticket.

## 4. Entry & Exit Criteria
| Phase | Entry Criteria | Exit Criteria |
|-------|---------------|---------------|
| Test Execution | [criteria] | [criteria] |
| Test Closure | [criteria] | [criteria] |

## 5. Test Environment & Prerequisites
Bullet list of environment setup requirements and preconditions derived from the ticket.

## 6. Test Cases
Minimum 20 test cases. Use this exact table — no columns added or removed:
| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |
|-------|----------|-----------|----------------------|---------------|------------|-----------------|----------|--------------|

## 7. Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
(Include only risks derivable from the ticket. Do not invent risks.)

## 8. Sign-off
| Role | Name | Status |
|------|------|--------|
| QA Lead | [QA Lead Name] | Pending |
| Product Owner | [Product Owner Name] | Pending |

T — Tone
Technical, precise, enterprise-grade. Formal language with concise bullet points. Numbered steps inside the Test Steps column.`

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

Generate the complete 8-section test plan document as specified. Include all sections. Section 6 must contain minimum 20 test cases.`
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
