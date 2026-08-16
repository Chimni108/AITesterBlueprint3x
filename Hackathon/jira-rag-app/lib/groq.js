// The project spec originally pinned this to "gpt-oss-12b", which Groq
// rejected with a 404 model_not_found -- confirmed not a real model id.
// Using Groq's actual documented id. Kept overridable via env.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Calls Groq's API directly with fetch rather than the groq-sdk package --
// requests made with that SDK's default headers (User-Agent/x-stainless-*)
// were rejected with a 401 invalid_api_key by Groq's Cloudflare layer even
// though the same key worked for an identical raw fetch request. Confirmed
// by testing both from the same deployed function with the same key.

function buildContext(chunks) {
  return chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
    .join('\n\n---\n\n');
}

export const PRESET_PROMPTS = {
  analyze: (ticketId) =>
    `You are explaining Jira ticket ${ticketId} to a non-technical reader. ` +
    `Using only the context chunks provided, explain in plain, easy-to-understand ` +
    `language: (1) what the ticket's purpose is, (2) its scope, and (3) its ` +
    `acceptance criteria if present. Do not invent details not present in the context.`,
  testcases: (ticketId) =>
    `You are a QA engineer writing test cases for Jira ticket ${ticketId}. ` +
    `Using only the context chunks provided, output all reasonable test cases ` +
    `strictly in Gherkin syntax (Feature / Scenario / Given / When / Then). ` +
    `Cover happy paths, edge cases, and negative cases implied by the ticket. ` +
    `Do not invent requirements not supported by the context.`,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates an answer from retrieved chunks + a query using Groq.
 *
 * Retries on a 401 "invalid_api_key" specifically: Groq's Cloudflare edge
 * intermittently rejects the very first request from a given serverless
 * origin with this exact error even though the key is valid -- confirmed by
 * immediately retrying the identical request with the identical key and
 * getting a 200. Subsequent requests from the same origin then pass, so a
 * short retry clears it without surfacing a false auth failure to the user.
 */
export async function generateAnswer({ query, chunks, ticketId }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable');
  }
  const context = buildContext(chunks);

  const body = JSON.stringify({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a retrieval-augmented assistant. Answer strictly using the ' +
          'provided context chunks from a Jira ticket. If the context does not ' +
          'contain enough information, say so explicitly instead of guessing.',
      },
      {
        role: 'user',
        content: `Ticket: ${ticketId}\n\nContext:\n${context}\n\nQuestion:\n${query}`,
      },
    ],
    temperature: 0.2,
  });

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices[0]?.message?.content ?? '';
    }

    const responseBody = await res.text().catch(() => '');
    lastError = new Error(`Groq API error ${res.status}: ${responseBody.slice(0, 300)}`);

    const isTransientAuthGlitch = res.status === 401 && responseBody.includes('invalid_api_key');
    if (!isTransientAuthGlitch || attempt === maxAttempts) break;
    await sleep(300 * attempt);
  }

  throw lastError;
}

export { GROQ_MODEL };
