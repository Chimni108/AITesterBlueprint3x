/**
 * Reads a POST-based SSE stream (EventSource only supports GET, and our
 * pipeline endpoints need a JSON body) and dispatches parsed events to a
 * handler map, e.g. { stage: (data) => {}, done: (data) => {} }.
 */
async function streamSse(url, body, handlers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request to ${url} failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const eventLine = raw.split('\n').find((l) => l.startsWith('event: '));
      const dataLine = raw.split('\n').find((l) => l.startsWith('data: '));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.slice('event: '.length);
      const data = JSON.parse(dataLine.slice('data: '.length));

      if (event === 'error') throw new Error(data.message || 'Server error');
      handlers[event]?.(data);
      if (event === 'done') return data;
    }
  }
}

export function ingestTicket(ticketId, { chunkSize, chunkOverlap, force } = {}, onStage) {
  return streamSse('/api/ingest', { ticketId, chunkSize, chunkOverlap, force }, {
    stage: onStage,
    done: () => {},
  });
}

export function generateAnswerStream({ ticketId, mode, query, topK }, handlers) {
  return streamSse('/api/generate', { ticketId, mode, query, topK }, handlers);
}

export async function listChunks(ticketId) {
  const res = await fetch(`/api/chunks/list?ticketId=${encodeURIComponent(ticketId)}`);
  if (!res.ok) throw new Error(`Failed to list chunks (${res.status})`);
  return res.json();
}

export async function applyChunkEdits(ticketId, edits) {
  const res = await fetch('/api/chunks/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, edits }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to apply edits (${res.status})`);
  }
  return res.json();
}

export async function retrievalOnlyQuery(ticketId, query, topK) {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, query, topK }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Retrieval failed (${res.status})`);
  }
  return res.json();
}
