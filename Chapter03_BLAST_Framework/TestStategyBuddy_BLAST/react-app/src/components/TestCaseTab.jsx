import { useState } from "react";
import IssueFetchForm from "./IssueFetchForm";
import { createTestCasesFromJiraId, publishTestCasesToJira } from "../services/testCaseService";

function TestCaseTable({ page, cases }) {
  return (
    <section>
      <h3>{page} ({cases.length})</h3>
      <div className="table-scroll">
        <table className="testcase-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Scenario</th>
              <th>Test Data</th>
              <th>Pre-Condition</th>
              <th>Steps</th>
              <th>Expected Result</th>
              <th>Priority</th>
              <th>Automated</th>
              <th>Traceability</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((tc) => (
              <tr key={tc.id}>
                <td>{tc.id}</td>
                <td>{tc.scenario}</td>
                <td>{tc.testData}</td>
                <td>{tc.preCondition}</td>
                <td>
                  <ol>
                    {tc.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </td>
                <td>{tc.expectedResult}</td>
                <td>{tc.priority}</td>
                <td>{tc.isAutomated ? "Yes" : "No"}</td>
                <td>{tc.traceability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function TestCaseTab({ settings, configured }) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [publishResult, setPublishResult] = useState(null);

  async function handleGenerate(issueKey) {
    setLoading(true);
    setError(null);
    setResult(null);
    setPublishResult(null);
    try {
      const data = await createTestCasesFromJiraId(settings, issueKey);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!result) return;
    setPublishing(true);
    setError(null);
    try {
      const data = await publishTestCasesToJira(settings, result.issue.issueKey, result.testCases);
      setPublishResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  const loginCases = result?.testCases.filter((tc) => tc.page === "Login") || [];
  const dashboardCases = result?.testCases.filter((tc) => tc.page === "Dashboard") || [];

  return (
    <div className="tab-panel">
      <IssueFetchForm
        disabled={!configured}
        loading={loading}
        onSubmit={handleGenerate}
        buttonLabel="Fetch &amp; Generate 20 Test Cases"
      />

      {error && <div className="banner-error">{error}</div>}

      {result && (
        <div className="testcase-display">
          <div className="testcase-toolbar">
            <h2>
              Test Cases — <span className="issue-key">{result.issue.issueKey}</span> ({result.testCases.length} total)
            </h2>
            <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish All to JIRA"}
            </button>
          </div>

          {publishResult && (
            <div className="publish-result">
              <h3>Created JIRA Sub-tasks ({publishResult.created.length})</h3>
              <ul className="jira-id-list">
                {publishResult.created.map((c) => (
                  <li key={c.jiraIssueKey}>
                    <a href={c.url} target="_blank" rel="noreferrer">
                      {c.jiraIssueKey}
                    </a>{" "}
                    — {c.testCaseId}
                  </li>
                ))}
              </ul>
              {publishResult.failed.length > 0 && (
                <>
                  <h3>Failed ({publishResult.failed.length})</h3>
                  <ul className="jira-id-list failed">
                    {publishResult.failed.map((f) => (
                      <li key={f.testCaseId}>
                        {f.testCaseId} — {f.error}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <TestCaseTable page="Login" cases={loginCases} />
          <TestCaseTable page="Dashboard" cases={dashboardCases} />
        </div>
      )}

      {!result && !error && !loading && (
        <div className="empty-state">
          <p>Enter a JIRA issue key and click "Fetch &amp; Generate 20 Test Cases" to build the Login + Dashboard test case set.</p>
        </div>
      )}
    </div>
  );
}
