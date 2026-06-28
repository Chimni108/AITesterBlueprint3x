export default function TestPlanDisplay({ issue, plan }) {
  return (
    <div className="results">
      <section className="card issue-card">
        <div className="card-header">
          <h3>{issue.issueKey}</h3>
          <span className="badge">{issue.issueType}</span>
        </div>
        <p className="summary">{issue.summary}</p>
      </section>

      <section className="card">
        <h3>Objective</h3>
        <p>{plan.objective}</p>
      </section>

      <section className="card scope-grid">
        <div>
          <h3>In Scope</h3>
          <ul>
            {plan.scope.inScope.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Out of Scope</h3>
          <ul>
            {plan.scope.outOfScope.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <h3>Test Cases</h3>
        <div className="test-case-list">
          {plan.testCases.map((tc) => (
            <div key={tc.id} className={`test-case test-case-${tc.type}`}>
              <div className="test-case-header">
                <strong>{tc.id}</strong>
                <span className={`pill pill-${tc.type}`}>{tc.type}</span>
              </div>
              <p className="test-case-title">{tc.title}</p>
              <ol>
                {tc.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <p className="expected-result">
                <strong>Expected:</strong> {tc.expectedResult}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Risks</h3>
        <ul>
          {plan.risks.map((risk, i) => (
            <li key={i}>{risk}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Acceptance Criteria Mapping</h3>
        {plan.acceptanceCriteriaMapping.length === 0 ? (
          <p className="muted">No acceptance criteria found on this issue.</p>
        ) : (
          <ul>
            {plan.acceptanceCriteriaMapping.map((mapping, i) => (
              <li key={i}>
                {mapping.criterion} — <em>{mapping.coveredByTestCaseIds.join(", ")}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
