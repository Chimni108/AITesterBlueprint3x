import { useState } from "react";
import IssueFetchForm from "./IssueFetchForm";
import { createTestStrategyFromJiraId } from "../services/strategyService";

export default function TestStrategyTab({ settings, configured }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleGenerate(issueKey) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createTestStrategyFromJiraId(settings, issueKey);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tab-panel">
      <IssueFetchForm
        disabled={!configured}
        loading={loading}
        onSubmit={handleGenerate}
        buttonLabel="Fetch &amp; Generate Strategy"
      />

      {error && <div className="banner-error">{error}</div>}

      {result && (
        <div className="strategy-display">
          <h2>
            Test Strategy — <span className="issue-key">{result.issue.issueKey}</span>
          </h2>
          <p className="issue-summary">{result.issue.summary}</p>

          <section>
            <h3>Objective</h3>
            <p>{result.strategy.objective}</p>
          </section>

          <section className="two-col">
            <div>
              <h3>In Scope</h3>
              <ul>
                {result.strategy.scope.inScope.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Out of Scope</h3>
              <ul>
                {result.strategy.scope.outOfScope.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h3>Focus Areas</h3>
            <ul>
              {result.strategy.focusAreas.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Approach</h3>
            <ul>
              {result.strategy.approach.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Deliverables</h3>
            <ul>
              {result.strategy.deliverables.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Risks</h3>
            <ul>
              {result.strategy.risks.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="empty-state">
          <p>Enter a JIRA issue key and click "Fetch &amp; Generate Strategy" to build a Test Strategy.</p>
        </div>
      )}
    </div>
  );
}
