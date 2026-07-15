export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error(`GET /api/status -> ${res.status}`);
  return res.json();
}

export async function fetchChunks() {
  const res = await fetch(`${API_BASE}/api/chunks`);
  if (!res.ok) throw new Error(`GET /api/chunks -> ${res.status}`);
  return res.json();
}

/** Opens an SSE connection and calls onEvent(parsedJson) for every message.
 * Returns the EventSource so the caller can close() it. */
export function openStream(path, onEvent, onError) {
  const source = new EventSource(`${API_BASE}${path}`);
  source.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data));
    } catch {
      onError?.(new Error("Malformed event from server"));
    }
  };
  source.onerror = (event) => {
    onError?.(event);
    source.close();
  };
  return source;
}

export function streamIngest(onEvent, onError) {
  return openStream("/api/ingest/stream", onEvent, onError);
}

export function streamQuery(question, onEvent, onError) {
  return openStream(`/api/query/stream?q=${encodeURIComponent(question)}`, onEvent, onError);
}
