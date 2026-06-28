export async function createTestStrategyFromJiraId(settings, issueKey) {
  const response = await fetch("/api/strategy/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jira: settings.jira, groq: settings.groq, issueKey }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Test strategy generation failed.");
  }
  return data;
}
