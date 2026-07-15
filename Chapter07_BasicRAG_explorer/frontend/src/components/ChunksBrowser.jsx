import { useEffect, useState } from "react";
import { fetchChunks } from "../api";

export default function ChunksBrowser({ refreshKey }) {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchChunks()
      .then((data) => setChunks(data.chunks))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>2 &middot; Storage</h2>
          <p className="panel-sub">Everything currently stored in the local ChromaDB collection.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setExpanded((v) => !v)} disabled={chunks.length === 0}>
          {expanded ? "Collapse" : `Browse ${chunks.length} chunks`}
        </button>
      </div>

      {error && <div className="callout callout-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {!loading && !error && chunks.length === 0 && <p className="muted">Nothing stored yet — run ingestion first.</p>}

      {expanded && chunks.length > 0 && (
        <div className="chunk-list">
          {chunks.map((c) => (
            <div className="chunk-card" key={c.id}>
              <div className="chunk-meta">
                <span className="badge">{c.id}</span>
                <span className="badge">page {c.metadata.page}</span>
                <span className="badge">{c.text.length} chars</span>
              </div>
              <div className="chunk-text">{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
