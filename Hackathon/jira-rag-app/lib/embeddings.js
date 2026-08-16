const NOMIC_ENDPOINT = 'https://api-atlas.nomic.ai/v1/embedding/text';
const NOMIC_MODEL = process.env.NOMIC_EMBED_MODEL || 'nomic-embed-text-v1.5';

/**
 * Embeds a batch of texts with Nomic Embed in a single request.
 * @param {string[]} texts
 * @param {'search_document' | 'search_query'} taskType
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts, taskType = 'search_document') {
  const apiKey = process.env.NOMIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NOMIC_API_KEY environment variable');
  }
  if (!texts.length) return [];

  const res = await fetch(NOMIC_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NOMIC_MODEL,
      texts,
      task_type: taskType,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Nomic Embed API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.embeddings;
}

export async function embedQuery(query) {
  const [embedding] = await embedTexts([query], 'search_query');
  return embedding;
}
