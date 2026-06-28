export async function createTestCasesFromJiraId(settings, issueKey) {
  const response = await fetch("/api/testcases/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jira: settings.jira, groq: settings.groq, issueKey }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Test case generation failed.");
  }
  return data;
}

export async function publishTestCasesToJira(settings, issueKey, testCases) {
  const response = await fetch("/api/testcases/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jira: settings.jira, issueKey, testCases }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Publishing test cases to JIRA failed.");
  }
  return data;
}
