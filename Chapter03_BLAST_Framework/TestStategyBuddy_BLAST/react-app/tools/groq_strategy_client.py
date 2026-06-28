import json

import requests

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

REFERENCE_STRATEGY_DOC = """Objective: test end-to-end functionality, usability, performance of the ecommerce website; meet business/technical requirements.

Scope
In scope: customer workflows (search, browse, cart, checkout, payments), account registration/management, order management/tracking, payment gateway integration, admin module, web and mobile site.
Out of scope: physical fulfillment of orders, unrelated 3rd-party integrations.

Focus Areas: functional correctness, UI/navigation, performance (load/stress/scalability), security (vulnerabilities, encryption), compatibility (browsers/devices/OS), usability (ease of use, accessibility).

Approach: black box + white box testing, automated tests (Selenium/Appium), exploratory testing, load testing with JMeter (1000+ concurrent users), OWASP Top 10 security testing, cross-browser testing (IE/Chrome/Firefox), usability evaluation (10+ end users).

Deliverables: functional test cases/reports, performance scripts/results, security report, UAT report, coverage/defect reports, automation regression suite.

Risks: test environment delays, lack of access to 3rd-party payment systems, complex workflows needing more time/resources."""


class GroqToolError(Exception):
    pass


def _build_prompt(issue):
    comments_text = "\n".join(f"- {c}" for c in issue["comments"]) or "(none)"
    return f"""Derive a Test Strategy strictly from the JIRA issue and reference document below.

Do NOT invent scope items, focus areas, or risks that are not supported by these inputs. If something cannot be determined from the inputs, omit it rather than guessing.

JIRA ISSUE ({issue['issueKey']}, type: {issue['issueType']}):
Summary: {issue['summary']}
Description: {issue['description']}
Acceptance Criteria: {issue.get('acceptanceCriteria') or '(none stated)'}
Comments:
{comments_text}

REFERENCE TEST STRATEGY DOCUMENT (ecommerce website, use as structural and domain grounding):
{REFERENCE_STRATEGY_DOC}

Respond with JSON only, matching exactly this shape:
{{
  "objective": "string",
  "scope": {{ "inScope": ["string"], "outOfScope": ["string"] }},
  "focusAreas": ["string"],
  "approach": ["string"],
  "deliverables": ["string"],
  "risks": ["string"]
}}"""


def generate_test_strategy(api_key, model, issue):
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
            },
            timeout=60,
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

    parsed["issueKey"] = issue["issueKey"]
    return parsed
