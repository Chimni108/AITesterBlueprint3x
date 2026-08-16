import { CloudClient } from 'chromadb';

let client;
function getClient() {
  if (!client) {
    const apiKey = process.env.CHROMA_API_KEY;
    const tenant = process.env.CHROMA_TENANT;
    const database = process.env.CHROMA_DATABASE;
    if (!apiKey || !tenant || !database) {
      throw new Error(
        'Missing CHROMA_API_KEY, CHROMA_TENANT, or CHROMA_DATABASE environment variables'
      );
    }
    client = new CloudClient({ apiKey, tenant, database });
  }
  return client;
}

// One Chroma Cloud collection per Jira ticket, so "reuse existing entry for
// this ticket ID" is just "does this collection already have documents."
function collectionName(ticketId) {
  const safe = ticketId.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `jira-ticket-${safe}`;
}

export async function getTicketCollection(ticketId) {
  const chroma = getClient();
  return chroma.getOrCreateCollection({
    name: collectionName(ticketId),
    metadata: { ticketId },
  });
}

export async function ticketCollectionExists(ticketId) {
  const chroma = getClient();
  try {
    const collection = await chroma.getCollection({ name: collectionName(ticketId) });
    const count = await collection.count();
    return count > 0;
  } catch {
    return false;
  }
}

export async function upsertChunks(ticketId, chunks, embeddings) {
  const collection = await getTicketCollection(ticketId);
  await collection.upsert({
    ids: chunks.map((c) => `${ticketId}-chunk-${c.index}`),
    embeddings,
    documents: chunks.map((c) => c.text),
    metadatas: chunks.map((c) => ({
      ticketId,
      chunkIndex: c.index,
      charCount: c.charCount,
      tokenEstimate: c.tokenEstimate,
    })),
  });
  return collection;
}

export async function listStoredChunks(ticketId) {
  const collection = await getTicketCollection(ticketId);
  const result = await collection.get({ include: ['documents', 'metadatas', 'embeddings'] });

  return result.ids.map((id, i) => ({
    id,
    text: result.documents[i],
    metadata: result.metadatas[i],
    embeddingDimensions: result.embeddings?.[i]?.length ?? null,
    embeddingPreview: result.embeddings?.[i]?.slice(0, 8) ?? null,
  })).sort((a, b) => (a.metadata.chunkIndex ?? 0) - (b.metadata.chunkIndex ?? 0));
}

export async function queryTopK(ticketId, queryEmbedding, topK = 4) {
  const collection = await getTicketCollection(ticketId);
  const result = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances'],
  });

  const ids = result.ids[0] || [];
  return ids.map((id, i) => ({
    id,
    text: result.documents[0][i],
    metadata: result.metadatas[0][i],
    distance: result.distances[0][i],
    similarity: 1 - result.distances[0][i],
  }));
}

export async function deleteChunkRecord(ticketId, chunkRecordId) {
  const collection = await getTicketCollection(ticketId);
  await collection.delete({ ids: [chunkRecordId] });
}

export async function deleteTicketCollection(ticketId) {
  const chroma = getClient();
  await chroma.deleteCollection({ name: collectionName(ticketId) });
}
