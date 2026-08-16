import { fetchJiraTicket, ticketToDocument } from '../lib/jiraClient.js';
import { chunkText } from '../lib/chunker.js';
import { embedTexts } from '../lib/embeddings.js';
import { getTicketCollection, ticketCollectionExists, upsertChunks, listStoredChunks } from '../lib/chroma.js';
import { withSseErrorHandling } from '../lib/sse.js';

/**
 * POST /api/ingest
 * body: { ticketId, chunkSize?, chunkOverlap?, force? }
 *
 * Streams pipeline-visibility stage events over SSE:
 *   checking -> (reused | fetching -> chunking -> embedding -> storing) -> done
 *
 * If the ticket is already ingested and `force` is not set, the existing
 * Chroma Cloud entry is reused as-is (no re-fetch/re-chunk/re-embed).
 * `force` is used by the RAG Explorer's "re-run pipeline" action when the
 * user changes chunk size/overlap and wants to regenerate the collection.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticketId, chunkSize, chunkOverlap, force } = req.body || {};
  if (!ticketId || typeof ticketId !== 'string') {
    res.status(400).json({ error: 'ticketId is required' });
    return;
  }

  await withSseErrorHandling(res, async (sse) => {
    sse.send('stage', { stage: 'checking', message: `Checking Chroma Cloud for ${ticketId}` });

    const alreadyIngested = await ticketCollectionExists(ticketId);

    if (alreadyIngested && !force) {
      const chunks = await listStoredChunks(ticketId);
      sse.send('stage', {
        stage: 'reused',
        message: `Found existing entry for ${ticketId} (${chunks.length} chunks) — reusing as-is`,
      });
      sse.send('done', { ticketId, reused: true, chunkCount: chunks.length, chunks });
      return;
    }

    sse.send('stage', { stage: 'fetching', message: `Fetching ${ticketId} from Jira Cloud` });
    const ticket = await fetchJiraTicket(ticketId);
    const document = ticketToDocument(ticket);

    sse.send('stage', { stage: 'chunking', message: 'Splitting ticket content into chunks' });
    const chunks = chunkText(document, { chunkSize, chunkOverlap });
    if (!chunks.length) {
      throw new Error('Ticket content was empty after extraction — nothing to ingest');
    }
    sse.send('stage', { stage: 'chunked', message: `Created ${chunks.length} chunks`, chunkCount: chunks.length });

    sse.send('stage', { stage: 'embedding', message: `Embedding ${chunks.length} chunks with Nomic Embed` });
    const embeddings = await embedTexts(chunks.map((c) => c.text), 'search_document');

    sse.send('stage', { stage: 'storing', message: 'Storing embeddings in Chroma Cloud' });
    await upsertChunks(ticketId, chunks, embeddings);
    // Touch the collection metadata so future getOrCreateCollection calls confirm it exists.
    await getTicketCollection(ticketId);

    sse.send('stage', { stage: 'stored', message: `Stored ${chunks.length} chunks in Chroma Cloud` });
    sse.send('done', {
      ticketId,
      reused: false,
      ticket: { summary: ticket.summary, issueType: ticket.issueType, status: ticket.status, url: ticket.url },
      chunkCount: chunks.length,
      chunks: chunks.map((c) => ({ id: `${ticketId}-chunk-${c.index}`, text: c.text, metadata: { ticketId, chunkIndex: c.index, charCount: c.charCount, tokenEstimate: c.tokenEstimate } })),
    });
  });
}
