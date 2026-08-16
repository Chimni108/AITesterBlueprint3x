import { embedQuery } from '../lib/embeddings.js';
import { queryTopK } from '../lib/chroma.js';

/**
 * POST /api/query
 * body: { ticketId, query, topK? }
 *
 * Retrieval only — no LLM call. Used by the Explorer's search/query panel
 * to test retrieval quality in isolation.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticketId, query, topK } = req.body || {};
  if (!ticketId || !query) {
    res.status(400).json({ error: 'ticketId and query are required' });
    return;
  }

  try {
    const queryEmbedding = await embedQuery(query);
    const results = await queryTopK(ticketId, queryEmbedding, topK || 4);
    res.status(200).json({ ticketId, query, topK: topK || 4, results });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Retrieval failed' });
  }
}
