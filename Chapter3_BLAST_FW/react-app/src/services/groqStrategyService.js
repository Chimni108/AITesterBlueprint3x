import { getGroqConfig } from './groqService'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const STRATEGY_SYSTEM_PROMPT = `R — Role
You are an expert QA Architect with 15+ years of experience writing enterprise-grade
test strategies. You produce complete, structured test strategy documents — not test
cases — fully traceable to the JIRA ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing anything.
2. Generate a COMPLETE test strategy document with ALL 8 sections listed in O — Output.
   Do not skip any section.
3. Every section must be derived strictly from the JIRA ticket fields provided.
4. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
5. If a detail is inferred rather than stated → label it exactly:
   "Inference (low confidence)"

Do NOT:
- Invent any feature, API, tool, UI element, or behavior not in the JIRA ticket
- Assume default or "typical" system behavior
- Skip any of the 8 sections

P — Parameters
- Output MUST be deterministic (same ticket → same strategy every time)
- Every assertion traceable to the JIRA ticket fields provided
- Zero invented content. Enterprise-grade quality.

O — Output
Generate a complete Markdown test strategy document with ALL 8 sections in this exact order:

# Test Strategy: [JIRA_ID] — [SUMMARY]

## 1. Objective
Write 2–3 sentences describing what is being tested, why, and the goal of this test strategy.

## 2. Scope
- **In Scope:** bullet list of what will be tested (derived from ticket fields only)
- **Out of Scope:** bullet list of what will NOT be tested

## 3. Focus Areas
Bullet list of applicable testing areas relevant to this specific ticket only.
Examples: Functional correctness, UI/navigation, Performance, Security, Compatibility, Usability.
Only include areas that are applicable based on the ticket.

## 4. Approach
Bullet list of testing techniques, automation tools, and methods to apply.
Derived strictly from the ticket. Include automated, exploratory, and any
performance or security approaches only if applicable to this ticket.

## 5. Deliverables
Bullet list of expected test artifacts and reports for this ticket.

## 6. Team & Schedule
Bullet list of testing phases and proposed schedule.
If no timeline information is present in the ticket, prefix each item with
"Inference (low confidence)".

## 7. Entry & Exit Criteria
| Phase | Entry Criteria | Exit Criteria |
|-------|---------------|---------------|
| Test Execution | [criteria] | [criteria] |
| Test Closure | [criteria] | [criteria] |

## 8. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
(Include only risks derivable from the ticket. Do not invent risks.)

T — Tone
Technical, precise, enterprise-grade. Formal language with concise bullet points.`

const CASES_SYSTEM_PROMPT = `R — Role
You are an expert QA Engineer with 15+ years of experience writing enterprise-grade
test cases. You produce complete, structured test cases fully traceable to the JIRA
ticket provided.

I — Instructions
1. Read the provided JIRA ticket fields carefully before writing.
2. Generate a MINIMUM of 30 test cases covering positive, negative, boundary, and
   edge case scenarios.
3. Trace every test case back to a specific field in the JIRA ticket.
4. If a requirement is missing or ambiguous → output exactly:
   "Insufficient information to determine."
5. If a detail is inferred → label exactly: "Inference (low confidence)"

Do NOT:
- Invent any feature, API, UI element, or behavior not in the JIRA ticket
- Generate fewer than 30 test cases
- Add or remove columns from the specified table

P — Parameters
- Minimum 30 test cases (more is acceptable, fewer is not)
- Cover: positive, negative, boundary, and edge case scenarios
- Every test case traceable to the JIRA ticket fields provided
- Output MUST be deterministic (same ticket → same test cases every time)

O — Output

# Test Cases: [JIRA_ID] — [SUMMARY]

Minimum 30 rows. Use this exact table — no columns added or removed:
| TC ID | Scenario | Test Data | Test Case Description | Pre-Condition | Test Steps | Expected Result | Priority | Is Automated |
|-------|----------|-----------|----------------------|---------------|------------|-----------------|----------|--------------|

T — Tone
Technical, precise, concise. Number each step inside the Test Steps column (1. 2. 3.).`

function buildUserPrompt(ticket, type) {
  return `Generate a ${type} for the following JIRA ticket:

**JIRA ID:** ${ticket.jiraId}
**Issue Type:** ${ticket.issueType}
**Priority:** ${ticket.priority}
**Summary:** ${ticket.summary}
**Labels:** ${ticket.labels.length > 0 ? ticket.labels.join(', ') : 'None'}

**Description:**
${ticket.description}

**Acceptance Criteria:**
${ticket.acceptanceCriteria || 'Insufficient information to determine.'}`
}

async function callGroq(systemPrompt, userPrompt, config) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
  return data.choices?.[0]?.message?.content || ''
}

export async function generateTestStrategy(ticket) {
  const config = getGroqConfig()
  if (!config?.apiKey) throw new Error('GROQ not configured. Go to Settings and add your API key.')

  const rawMarkdown = await callGroq(
    STRATEGY_SYSTEM_PROMPT,
    buildUserPrompt(ticket, 'complete test strategy document (8 sections)'),
    config
  )

  return { jiraId: ticket.jiraId, generatedAt: new Date().toISOString(), rawMarkdown }
}

export async function generateTestCases(ticket) {
  const config = getGroqConfig()
  if (!config?.apiKey) throw new Error('GROQ not configured. Go to Settings and add your API key.')

  const rawMarkdown = await callGroq(
    CASES_SYSTEM_PROMPT,
    buildUserPrompt(ticket, 'complete set of test cases — minimum 30 rows'),
    config
  )

  return { jiraId: ticket.jiraId, generatedAt: new Date().toISOString(), rawMarkdown }
}
