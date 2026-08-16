import { embedQuery } from '../lib/embeddings.js';
import { queryTopK } from '../lib/chroma.js';
import { generateAnswer, PRESET_PROMPTS } from '../lib/groq.js';
import { withSseErrorHandling } from '../lib/sse.js';

/**
 * POST /api/generate
 * body: { ticketId, mode: 'analyze' | 'testcases' | 'custom', query?, topK? }
 *
 * Streams stage events over SSE: embedding-query -> retrieving -> chunks
 * -> generating -> answer -> done. Used by both the two preset buttons
 * (mode=analyze|testcases) and the Explorer's Ask panel (mode=custom with
 * "also generate" toggled on).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticketId, mode, query, topK } = req.body || {};
  if (!ticketId || !mode) {
    res.status(400).json({ error: 'ticketId and mode are required' });
    return;
  }
  if (mode === 'custom' && !query) {
    res.status(400).json({ error: 'query is required for custom mode' });
    return;
  }

  const effectiveQuery =
    mode === 'analyze'
      ? PRESET_PROMPTS.analyze(ticketId)
      : mode === 'testcases'
      ? PRESET_PROMPTS.testcases(ticketId)
      : query;

  await withSseErrorHandling(res, async (sse) => {
    sse.send('stage', { stage: 'embedding-query', message: 'Embedding query with Nomic Embed' });
    const queryEmbedding = await embedQuery(effectiveQuery);

    sse.send('stage', { stage: 'retrieving', message: `Retrieving top ${topK || 4} chunks from Chroma Cloud` });
    const chunks = await queryTopK(ticketId, queryEmbedding, topK || 4);
    if (!chunks.length) {
      throw new Error('No chunks found for this ticket — ingest it before querying');
    }
    sse.send('chunks', { chunks });

    sse.send('stage', { stage: 'generating', message: 'Generating answer with Groq' });
    const answer = await generateAnswer({ query: effectiveQuery, chunks, ticketId });

    sse.send('answer', { answer });
    sse.send('done', { ticketId, mode, query: effectiveQuery, chunkCount: chunks.length });
  });
}
