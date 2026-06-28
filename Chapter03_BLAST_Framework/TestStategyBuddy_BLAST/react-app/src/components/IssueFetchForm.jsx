import { useState } from "react";

export default function IssueFetchForm({ disabled, loading, onSubmit, buttonLabel, defaultIssueKey }) {
  const [issueKey, setIssueKey] = useState(defaultIssueKey || "SCRUM-6");

  function handleSubmit(e) {
    e.preventDefault();
    if (issueKey.trim()) onSubmit(issueKey.trim());
  }

  return (
    <form className="generator-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="JIRA issue key, e.g. SCRUM-6"
        value={issueKey}
        onChange={(e) => setIssueKey(e.target.value)}
        disabled={disabled || loading}
      />
      <button type="submit" className="btn-primary" disabled={disabled || loading}>
        {loading ? "Working…" : buttonLabel}
      </button>
    </form>
  );
}
