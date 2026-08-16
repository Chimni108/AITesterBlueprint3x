const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://testlearn.atlassian.net';

function extractTextFromAdf(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromAdf).join(node.type === 'paragraph' ? '\n' : ' ');
  }
  return '';
}

/**
 * Fetches a single Jira issue and flattens it into plain text sections
 * suitable for chunking: summary, description, comments, status, linked issues.
 */
export async function fetchJiraTicket(ticketId) {
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!email || !apiToken) {
    throw new Error('Missing JIRA_EMAIL or JIRA_API_TOKEN environment variables');
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${encodeURIComponent(ticketId)}?expand=renderedFields`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 404) {
    throw new Error(`Jira ticket "${ticketId}" was not found`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Jira API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const issue = await res.json();
  const fields = issue.fields || {};

  const summary = fields.summary || '';
  const description = extractTextFromAdf(fields.description).trim();
  const issueType = fields.issuetype?.name || 'Unknown';
  const status = fields.status?.name || 'Unknown';

  const comments = (fields.comment?.comments || []).map((c) => ({
    author: c.author?.displayName || 'Unknown',
    body: extractTextFromAdf(c.body).trim(),
    created: c.created,
  }));

  const linkedIssues = (fields.issuelinks || []).map((link) => {
    const other = link.outwardIssue || link.inwardIssue;
    if (!other) return null;
    const relation = link.outwardIssue ? link.type?.outward : link.type?.inward;
    return {
      key: other.key,
      relation,
      summary: other.fields?.summary || '',
    };
  }).filter(Boolean);

  return {
    ticketId: issue.key,
    issueType,
    status,
    summary,
    description,
    comments,
    linkedIssues,
    url: `${JIRA_BASE_URL}/browse/${issue.key}`,
  };
}

/**
 * Flattens a fetched ticket into a single plain-text document for chunking.
 */
export function ticketToDocument(ticket) {
  const parts = [
    `Ticket: ${ticket.ticketId}`,
    `Type: ${ticket.issueType}`,
    `Status: ${ticket.status}`,
    `Summary: ${ticket.summary}`,
    ticket.description ? `Description:\n${ticket.description}` : '',
  ];

  if (ticket.linkedIssues?.length) {
    parts.push(
      `Linked Issues:\n${ticket.linkedIssues
        .map((li) => `- ${li.relation} ${li.key}: ${li.summary}`)
        .join('\n')}`
    );
  }

  if (ticket.comments?.length) {
    parts.push(
      `Comments:\n${ticket.comments
        .map((c) => `[${c.author} @ ${c.created}]: ${c.body}`)
        .join('\n\n')}`
    );
  }

  return parts.filter(Boolean).join('\n\n');
}
