import { listStoredChunks } from '../../lib/chroma.js';

/**
 * GET /api/chunks/list?ticketId=ABC-123
 * Returns every stored chunk for a ticket — used by both the Explorer's
 * chunk browser (text/char/token) and storage inspector (id/metadata/embedding).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticketId } = req.query;
  if (!ticketId) {
    res.status(400).json({ error: 'ticketId is required' });
    return;
  }

  try {
    const chunks = await listStoredChunks(ticketId);
    res.status(200).json({ ticketId, chunks });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list chunks' });
  }
}
