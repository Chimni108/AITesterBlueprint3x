import { embedTexts } from '../../lib/embeddings.js';
import { upsertChunks, deleteChunkRecord } from '../../lib/chroma.js';

/**
 * POST /api/chunks/apply
 * body: { ticketId, edits: Edit[] }
 *
 * Edits are staged client-side in the Explorer's chunk editor and only sent
 * here when the user clicks "Apply Changes". Only the chunks touched by an
 * edit are re-embedded/re-stored (or removed) — the rest of the collection
 * is left untouched.
 *
 * Edit shapes:
 *   { type: 'edit',   chunkId, text }
 *   { type: 'delete', chunkId }
 *   { type: 'split',  chunkId, textA, textB }
 *   { type: 'merge',  chunkIds: [idA, idB], text }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticketId, edits } = req.body || {};
  if (!ticketId || !Array.isArray(edits) || edits.length === 0) {
    res.status(400).json({ error: 'ticketId and a non-empty edits array are required' });
    return;
  }

  try {
    const results = [];

    for (const edit of edits) {
      if (edit.type === 'edit') {
        const [embedding] = await embedTexts([edit.text], 'search_document');
        await upsertChunks(
          ticketId,
          [{ index: parseChunkIndex(edit.chunkId), text: edit.text, charCount: edit.text.length, tokenEstimate: Math.ceil(edit.text.length / 4) }],
          [embedding]
        );
        results.push({ type: 'edit', chunkId: edit.chunkId, status: 'updated' });
      } else if (edit.type === 'delete') {
        await deleteChunkRecord(ticketId, edit.chunkId);
        results.push({ type: 'delete', chunkId: edit.chunkId, status: 'deleted' });
      } else if (edit.type === 'split') {
        const newIdA = `${edit.chunkId}-a`;
        const newIdB = `${edit.chunkId}-b`;
        const [embA, embB] = await embedTexts([edit.textA, edit.textB], 'search_document');
        await deleteChunkRecord(ticketId, edit.chunkId).catch(() => {});
        await upsertChunksRaw(ticketId, [
          { id: newIdA, text: edit.textA, embedding: embA },
          { id: newIdB, text: edit.textB, embedding: embB },
        ]);
        results.push({ type: 'split', chunkId: edit.chunkId, newIds: [newIdA, newIdB], status: 'split' });
      } else if (edit.type === 'merge') {
        const [idA, idB] = edit.chunkIds;
        const mergedId = `${idA}+${idB}`;
        const [embedding] = await embedTexts([edit.text], 'search_document');
        await Promise.all([
          deleteChunkRecord(ticketId, idA).catch(() => {}),
          deleteChunkRecord(ticketId, idB).catch(() => {}),
        ]);
        await upsertChunksRaw(ticketId, [{ id: mergedId, text: edit.text, embedding }]);
        results.push({ type: 'merge', chunkIds: edit.chunkIds, newId: mergedId, status: 'merged' });
      } else {
        results.push({ type: edit.type, status: 'skipped', reason: 'unknown edit type' });
      }
    }

    res.status(200).json({ ticketId, applied: results });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to apply chunk edits' });
  }
}

function parseChunkIndex(chunkId) {
  const match = /-chunk-(\d+)$/.exec(chunkId);
  return match ? Number(match[1]) : 0;
}

// Split/merge produce new record ids that don't follow the `ticket-chunk-N`
// convention (e.g. "TICKET-chunk-2-a"), so they're upserted directly rather
// than through upsertChunks' index-based id builder.
async function upsertChunksRaw(ticketId, records) {
  const { getTicketCollection } = await import('../../lib/chroma.js');
  const collection = await getTicketCollection(ticketId);
  await collection.upsert({
    ids: records.map((r) => r.id),
    embeddings: records.map((r) => r.embedding),
    documents: records.map((r) => r.text),
    metadatas: records.map((r) => ({
      ticketId,
      charCount: r.text.length,
      tokenEstimate: Math.ceil(r.text.length / 4),
      derivedFrom: r.id,
    })),
  });
}
