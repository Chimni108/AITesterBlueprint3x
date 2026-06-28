import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request

from tools.groq_client import GroqToolError, generate_test_plan
from tools.jira_client import JiraToolError, fetch_jira_issue

app = Flask(__name__)


def _validate_payload(body):
    jira = body.get("jira") or {}
    groq = body.get("groq") or {}
    issue_key = body.get("issueKey")

    if not all([jira.get("baseUrl"), jira.get("email"), jira.get("apiToken"), groq.get("apiKey"), groq.get("model"), issue_key]):
        return None
    return jira, groq, issue_key


@app.post("/api/testplan/create")
def testplan_create():
    body = request.get_json(silent=True) or {}
    validated = _validate_payload(body)
    if validated is None:
        return jsonify({"error": "jira (baseUrl, email, apiToken), groq (apiKey, model), and issueKey are all required."}), 400

    jira, groq, issue_key = validated

    try:
        issue = fetch_jira_issue(jira["baseUrl"], jira["email"], jira["apiToken"], issue_key)
    except JiraToolError as exc:
        return jsonify({"error": str(exc)}), 502

    try:
        plan = generate_test_plan(groq["apiKey"], groq["model"], issue)
    except GroqToolError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"issue": issue, "plan": plan})


if __name__ == "__main__":
    app.run(port=3001, debug=True)
