import { useState } from "react";

export default function Generator({ disabled, onGenerate, loading }) {
  const [issueKey, setIssueKey] = useState("SCRUM-5");

  function handleSubmit(e) {
    e.preventDefault();
    if (!issueKey.trim()) return;
    onGenerate(issueKey.trim());
  }

  return (
    <form className="generator-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={issueKey}
        onChange={(e) => setIssueKey(e.target.value)}
        placeholder="JIRA issue key, e.g. SCRUM-5"
        disabled={disabled || loading}
      />
      <button type="submit" className="btn-primary" disabled={disabled || loading}>
        {loading ? "Generating…" : "Fetch & Generate"}
      </button>
    </form>
  );
}
