import base64

import requests

from tools.adf import plain_text_to_adf


class JiraWriteError(Exception):
    pass


def _auth_header(email, api_token):
    auth_raw = f"{email}:{api_token}".encode("utf-8")
    return base64.b64encode(auth_raw).decode("utf-8")


def _project_key_from_issue_key(issue_key):
    return issue_key.split("-")[0]


def create_test_case_subtask(base_url, email, api_token, parent_key, test_case):
    project_key = _project_key_from_issue_key(parent_key)
    base = base_url.rstrip("/")

    description_lines = [
        f"Page: {test_case['page']}",
        f"Test Data: {test_case['testData']}",
        f"Pre-Condition: {test_case['preCondition']}",
        "",
        "Steps:",
        *[f"{i + 1}. {step}" for i, step in enumerate(test_case["steps"])],
        "",
        f"Expected Result: {test_case['expectedResult']}",
        f"Priority: {test_case['priority']}",
        f"Is Automated: {'Yes' if test_case['isAutomated'] else 'No'}",
        f"Traceability: {test_case['traceability']}",
    ]
    description_text = "\n".join(description_lines)

    payload = {
        "fields": {
            "project": {"key": project_key},
            "parent": {"key": parent_key},
            "issuetype": {"name": "Sub-task"},
            "summary": f"{test_case['id']} — {test_case['scenario']}",
            "description": plain_text_to_adf(description_text),
        }
    }

    try:
        response = requests.post(
            f"{base}/rest/api/3/issue",
            headers={
                "Authorization": f"Basic {_auth_header(email, api_token)}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
    except requests.RequestException as exc:
        raise JiraWriteError(f"Failed to reach JIRA: {exc}") from exc

    if response.status_code in (401, 403):
        raise JiraWriteError("JIRA authentication failed. Check email/API token.")
    if not response.ok:
        raise JiraWriteError(f"JIRA issue creation failed with status {response.status_code}: {response.text}")

    data = response.json()
    key = data.get("key")
    return {"jiraIssueKey": key, "url": f"{base}/browse/{key}"}
