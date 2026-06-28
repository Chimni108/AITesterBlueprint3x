import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request

from tools.groq_strategy_client import GroqToolError as StrategyGroqError, generate_test_strategy
from tools.groq_testcase_client import GroqToolError as TestCaseGroqError, generate_test_cases
from tools.jira_client import JiraToolError, fetch_jira_issue
from tools.jira_writer import JiraWriteError, create_test_case_subtask

app = Flask(__name__)


def _validate_payload(body):
    jira = body.get("jira") or {}
    groq = body.get("groq") or {}
    issue_key = body.get("issueKey")

    if not all([jira.get("baseUrl"), jira.get("email"), jira.get("apiToken"), groq.get("apiKey"), groq.get("model"), issue_key]):
        return None
    return jira, groq, issue_key


@app.post("/api/strategy/create")
def strategy_create():
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
        strategy = generate_test_strategy(groq["apiKey"], groq["model"], issue)
    except StrategyGroqError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"issue": issue, "strategy": strategy})


@app.post("/api/testcases/create")
def testcases_create():
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
        result = generate_test_cases(groq["apiKey"], groq["model"], issue)
    except TestCaseGroqError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"issue": issue, "testCases": result["testCases"]})


@app.post("/api/testcases/publish")
def testcases_publish():
    body = request.get_json(silent=True) or {}
    jira = body.get("jira") or {}
    issue_key = body.get("issueKey")
    test_cases = body.get("testCases") or []

    if not all([jira.get("baseUrl"), jira.get("email"), jira.get("apiToken"), issue_key]) or not test_cases:
        return jsonify({"error": "jira (baseUrl, email, apiToken), issueKey, and a non-empty testCases array are required."}), 400

    created = []
    failed = []

    for test_case in test_cases:
        try:
            result = create_test_case_subtask(
                jira["baseUrl"], jira["email"], jira["apiToken"], issue_key, test_case
            )
            created.append({"testCaseId": test_case.get("id"), **result})
        except JiraWriteError as exc:
            failed.append({"testCaseId": test_case.get("id"), "error": str(exc)})

    return jsonify({"created": created, "failed": failed})


if __name__ == "__main__":
    app.run(port=3003, debug=True)
