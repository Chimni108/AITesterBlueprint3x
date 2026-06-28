import json

import requests

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

REFERENCE_STRATEGY_DOC = """Focus Areas: functional correctness, UI/navigation, performance, security (vulnerabilities, encryption), compatibility (browsers/devices/OS), usability (ease of use, accessibility).
Approach: black box + white box testing, valid and invalid scenarios, exploratory testing, cross-browser testing, usability evaluation.
Scope includes: account registration/management (Login) and order/account overview (Dashboard) for an ecommerce website."""


class GroqToolError(Exception):
    pass


def _build_prompt(issue):
    comments_text = "\n".join(f"- {c}" for c in issue["comments"]) or "(none)"

    return f"""Write test cases for the JIRA issue and reference document below.

Instructions:
1. Generate exactly 20 test cases total: exactly 10 for the "Login" page and exactly 10 for the "Dashboard" page.
2. Cover both valid (positive) and invalid (negative) scenarios for each page.
3. Every test case must be traceable to a specific requirement in the JIRA issue or the reference document.
4. Do NOT invent features, APIs, error codes, UI elements, or behavior not present in the provided inputs.
5. If a field cannot be determined from the inputs, set its value to exactly "Insufficient information to determine."

JIRA ISSUE ({issue['issueKey']}, type: {issue['issueType']}):
Summary: {issue['summary']}
Description: {issue['description']}
Acceptance Criteria: {issue.get('acceptanceCriteria') or '(none stated)'}
Comments:
{comments_text}

REFERENCE TEST STRATEGY DOCUMENT (ecommerce website, structural/domain grounding):
{REFERENCE_STRATEGY_DOC}

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
}}"""


def generate_test_cases(api_key, model, issue):
    prompt = _build_prompt(issue)

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
