import json

import requests

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

REFERENCE_STRATEGY_DOC = """Focus Areas: functional correctness, UI/navigation, performance, security (vulnerabilities, encryption), compatibility (browsers/devices/OS), usability (ease of use, accessibility).
Approach: black box + white box testing, valid and invalid scenarios, exploratory testing, cross-browser testing, usability evaluation.
Scope includes: account registration/management (Login) and order/account overview (Dashboard) for an ecommerce website."""


class GroqToolError(Exception):
    pass


def _build_rice_pot_prompt(issue):
    comments_text = "\n".join(f"- {c}" for c in issue["comments"]) or "(none)"

    return f"""R - ROLE
You are an expert QA Functional Tester with 15+ years of experience, specializing in writing enterprise-grade, traceable test cases for web applications.

I - INSTRUCTIONS
1. Read the JIRA issue and reference document below carefully before writing anything.
2. Generate exactly 20 test cases total: exactly 10 for the "Login" page and exactly 10 for the "Dashboard" page.
3. Cover both valid (positive) and invalid (negative) scenarios for each page.
4. Trace every test case back to a specific requirement in the JIRA issue or the reference document.
Mandatory "Don't" rules:
- Do not invent feature IDs, APIs, error codes, UI elements, or behavior not present in the provided inputs.
- Do not assume default or "typical" system behavior beyond what is stated or reasonably inferable.

C - CONTEXT
JIRA ISSUE ({issue['issueKey']}, type: {issue['issueType']}):
Summary: {issue['summary']}
Description: {issue['description']}
Acceptance Criteria: {issue.get('acceptanceCriteria') or '(none stated)'}
Comments:
{comments_text}

REFERENCE TEST STRATEGY DOCUMENT (ecommerce website, structural/domain grounding):
{REFERENCE_STRATEGY_DOC}

E - EXAMPLE
A single test case should look like this (values illustrative only):
{{"id": "TC-001", "page": "Login", "scenario": "Successful login", "testData": "valid email + valid password", "description": "Verify successful login with valid credentials", "preCondition": "User account exists and is active", "steps": ["Open login page", "Enter valid email", "Enter valid password", "Click Login"], "expectedResult": "User is redirected to the dashboard", "priority": "High", "isAutomated": false, "traceability": "JIRA {issue['issueKey']} description"}}

P - PARAMETERS
- Output must be deterministic (same input -> same output).
- Every test case's traceability field must reference a provided input (JIRA issue or reference document).
- If information needed for a field is missing or unclear, set that field's value to exactly "Insufficient information to determine."
- If a detail is inferred rather than explicitly stated, append " (Inference (low confidence))" to that field's value.
- Enterprise-grade quality. Zero invented content.

O - OUTPUT
Respond with JSON only, no commentary, matching exactly this shape:
{{
  "testCases": [
    {{
      "id": "string (e.g. TC-001)",
      "page": "Login or Dashboard",
      "scenario": "string",
      "testData": "string",
      "description": "string",
      "preCondition": "string",
      "steps": ["string"],
      "expectedResult": "string",
      "priority": "High, Medium, or Low",
      "isAutomated": false,
      "traceability": "string"
    }}
  ]
}}

T - TONE
Technical, precise, enterprise-grade. Output only the requested JSON, no commentary."""


def generate_test_cases(api_key, model, issue):
    prompt = _build_rice_pot_prompt(issue)

    try:
        response = requests.post(
            GROQ_ENDPOINT,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": 3500,
            },
            timeout=90,
        )
    except requests.RequestException as exc:
        raise GroqToolError(f"Failed to reach GROQ: {exc}") from exc

    if response.status_code in (401, 403):
        raise GroqToolError("GROQ authentication failed. Check API key.")
    if not response.ok:
        raise GroqToolError(f"GROQ request failed with status {response.status_code}: {response.text}")

    data = response.json()
    content = data["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise GroqToolError(f"GROQ returned invalid JSON: {exc}") from exc

    test_cases = parsed.get("testCases", [])
    return {"issueKey": issue["issueKey"], "testCases": test_cases}
