import base64
import re

import requests

from tools.adf import adf_to_plain_text


class JiraToolError(Exception):
    pass


_AC_HEADING_RE = re.compile(r"acceptance criteria", re.IGNORECASE)


def _extract_acceptance_criteria(fields, description_text):
    ac_field = fields.get("customfield_10001")
    if isinstance(ac_field, str) and ac_field.strip():
        return ac_field.strip()

    if not description_text:
        return None

    lines = description_text.split("\n")
    for i, line in enumerate(lines):
        if _AC_HEADING_RE.search(line):
            block = []
            for subsequent in lines[i + 1:]:
                if subsequent.strip() == "":
                    if block:
                        break
                    continue
                block.append(subsequent)
            if block:
                return "\n".join(block).strip()
    return None


def fetch_jira_issue(base_url, email, api_token, issue_key):
    url = f"{base_url.rstrip('/')}/rest/api/3/issue/{issue_key}"
    auth_raw = f"{email}:{api_token}".encode("utf-8")
    auth_header = base64.b64encode(auth_raw).decode("utf-8")

    try:
        response = requests.get(
            url,
            headers={
                "Authorization": f"Basic {auth_header}",
                "Accept": "application/json",
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        raise JiraToolError(f"Failed to reach JIRA: {exc}") from exc

    if response.status_code in (401, 403):
        raise JiraToolError("JIRA authentication failed. Check email/API token.")
    if response.status_code == 404:
        raise JiraToolError(f"Issue {issue_key} not found.")
    if not response.ok:
        raise JiraToolError(f"JIRA request failed with status {response.status_code}.")

    data = response.json()
    fields = data.get("fields", {})

    description_text = adf_to_plain_text(fields.get("description"))
    acceptance_criteria = _extract_acceptance_criteria(fields, description_text)

    comments = []
    comment_block = fields.get("comment", {})
    for comment in comment_block.get("comments", []):
        text = adf_to_plain_text(comment.get("body"))
        if text:
            comments.append(text)

    return {
        "issueKey": data.get("key", issue_key),
        "issueType": fields.get("issuetype", {}).get("name", "Unknown"),
        "summary": fields.get("summary", ""),
        "description": description_text or "",
        "acceptanceCriteria": acceptance_criteria,
        "comments": comments,
    }
