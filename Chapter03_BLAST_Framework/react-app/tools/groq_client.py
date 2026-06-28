import json

import requests

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

REQUIRED_KEYS = {
    "issueKey",
    "objective",
    "scope",
    "testCases",
    "risks",
    "acceptanceCriteriaMapping",
}

SYSTEM_PROMPT = """You are a senior QA engineer generating a structured test plan from a JIRA issue.

Respond with STRICT JSON only, matching exactly this shape:
{
  "issueKey": "string",
  "objective": "string",
  "scope": { "inScope": ["string"], "outOfScope": ["string"] },
  "testCases": [
    {
      "id": "string",
      "title": "string",
      "type": "positive | negative | edge",
      "steps": ["string"],
      "expectedResult": "string"
    }
  ],
  "risks": ["string"],
  "acceptanceCriteriaMapping": [
    { "criterion": "string", "coveredByTestCaseIds": ["string"] }
  ]
}

HARD RULE: Never invent acceptance criteria, features, or requirements that are not present in the
provided JIRA issue content (summary, description, acceptance criteria, comments). Every test case
must be grounded in the actual ticket content. If acceptance criteria are absent, derive scope and
test cases only from the summary/description and leave acceptanceCriteriaMapping as an empty array.
Do not include any text outside the JSON object."""


class GroqToolError(Exception):
    pass


def _call_groq(api_key, model, messages):
    try:
        response = requests.post(
            GROQ_ENDPOINT,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
            },
            timeout=60,
        )
    except requests.RequestException as exc:
        raise GroqToolError(f"Failed to reach GROQ: {exc}") from exc

    if response.status_code == 401:
        raise GroqToolError("GROQ authentication failed. Check API key.")
    if response.status_code == 429:
        raise GroqToolError("GROQ rate limit reached. Try again shortly.")
    if not response.ok:
        raise GroqToolError(f"GROQ request failed with status {response.status_code}.")

    return response.json()["choices"][0]["message"]["content"]


def generate_test_plan(api_key, model, issue):
    user_message = json.dumps(
        {
            "issueKey": issue.get("issueKey"),
            "issueType": issue.get("issueType"),
            "summary": issue.get("summary"),
            "description": issue.get("description"),
            "acceptanceCriteria": issue.get("acceptanceCriteria"),
            "comments": issue.get("comments"),
        }
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw = _call_groq(api_key, model, messages)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        messages.append({"role": "assistant", "content": raw})
        messages.append(
            {"role": "user", "content": "Your last response was not valid JSON. Return valid JSON only, matching the required shape exactly."}
        )
        raw_retry = _call_groq(api_key, model, messages)
        try:
            parsed = json.loads(raw_retry)
        except json.JSONDecodeError as exc:
            raise GroqToolError("Test plan generation failed: invalid model output") from exc

    missing = REQUIRED_KEYS - parsed.keys()
    if missing:
        raise GroqToolError(f"Test plan generation failed: missing keys {sorted(missing)}")

    return parsed
