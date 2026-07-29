"""Fetch JIRA tickets via REST + JQL into data/04_jira_tickets/.

Server-side equivalent of the JIRA MCP connection: same credentials, same JQL.
Set in .env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_JQL
"""
import json
import os

import requests

from app.config import DATA_DIR

JIRA_DIR = DATA_DIR / "04_jira_tickets"
FIELDS = "summary,description,status,priority,issuetype,labels,resolution,created,updated"
PAGE_SIZE = 100


def fetch_jira():
    base = os.getenv("JIRA_BASE_URL", "").rstrip("/")
    email = os.getenv("JIRA_EMAIL", "")
    token = os.getenv("JIRA_API_TOKEN", "")
    jql = os.getenv("JIRA_JQL", "")
    if not all((base, email, token, jql)):
        raise SystemExit(
            "Missing JIRA config — set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_JQL in .env"
        )

    auth = (email, token)
    start_at, total_saved = 0, 0
    while True:
        resp = requests.get(
            f"{base}/rest/api/3/search",
            params={"jql": jql, "fields": FIELDS, "startAt": start_at, "maxResults": PAGE_SIZE},
            auth=auth,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        issues = data.get("issues", [])
        if not issues:
            break
        for issue in issues:
            out = JIRA_DIR / f"{issue['key']}.json"
            out.write_text(json.dumps(issue, indent=2), encoding="utf-8")
            total_saved += 1
        start_at += len(issues)
        if start_at >= data.get("total", 0):
            break
    print(f"Saved {total_saved} JIRA tickets to {JIRA_DIR}")
