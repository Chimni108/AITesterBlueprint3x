import { useState } from "react";
import PipelineLane from "./PipelineLane";
import { streamIngest } from "../api";

const NODES = [
  { key: "read", label: "Read PDF", sub: "pypdf, per page" },
  { key: "chunk", label: "Chunk", sub: "paragraph-aware" },
  { key: "embed", label: "Embed", sub: "Nomic Embed, local" },
  { key: "store", label: "Store", sub: "ChromaDB, local" },
];

const IDLE_STAGES = { read: "idle", chunk: "idle", embed: "idle", store: "idle" };

export default function IngestPanel({ onIngested }) {
  const [stages, setStages] = useState(IDLE_STAGES);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [liveNote, setLiveNote] = useState(null);
  const [readInfo, setReadInfo] = useState(null);
  const [chunkInfo, setChunkInfo] = useState(null);
  const [embedInfo, setEmbedInfo] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);

  function runIngest() {
    setRunning(true);
    setError(null);
    setLiveNote(null);
    setReadInfo(null);
    setChunkInfo(null);
    setEmbedInfo(null);
    setStoreInfo(null);
    setStages({ ...IDLE_STAGES });

    const source = streamIngest(
      (event) => {
        if (event.stage === "error") {
          setError(event.message);
          setRunning(false);
          source.close(); // otherwise EventSource treats the server ending the stream as a drop and retries
          return;
        }

        setStages((prev) => ({ ...prev, [event.stage]: event.status === "done" ? "done" : "active" }));
        setLiveNote(event.note || null);

        if (event.status !== "done") return;
        if (event.stage === "read") setReadInfo(event);
        if (event.stage === "chunk") setChunkInfo(event);
        if (event.stage === "embed") setEmbedInfo(event);
        if (event.stage === "store") {
          setStoreInfo(event);
          setRunning(false);
          onIngested?.();
          source.close(); // pipeline finished - close before EventSource's own auto-reconnect kicks in
        }
      },
      () => {
        setError((prev) => prev || "Connection to the server was lost mid-ingest.");
        setRunning(false);
      }
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>1 &middot; Ingest</h2>
          <p className="panel-sub">Reads the bundled VWO PRD, chunks it, embeds every chunk, and stores it in ChromaDB.</p>
        </div>
        <button className="btn" onClick={runIngest} disabled={running}>
          {running ? "Ingesting…" : "Ingest PDF"}
        </button>
      </div>

      <PipelineLane nodes={NODES} stages={stages} />

      {running && liveNote && <div className="callout">{liveNote}</div>}
      {error && <div className="callout callout-error">{error}</div>}

      {(readInfo || chunkInfo || embedInfo || storeInfo) && (
        <div className="stat-row">
          {readInfo && (
            <div className="stat-tile">
              <div className="stat-value">{readInfo.page_count}</div>
              <div className="stat-label">pages read</div>
            </div>
          )}
          {chunkInfo && (
            <div className="stat-tile">
              <div className="stat-value">{chunkInfo.chunk_count}</div>
              <div className="stat-label">chunks created</div>
            </div>
          )}
          {embedInfo && (
            <div className="stat-tile">
              <div className="stat-value">{embedInfo.dim}</div>
              <div className="stat-label">embedding dims</div>
            </div>
          )}
          {storeInfo && (
            <div className="stat-tile">
              <div className="stat-value">{storeInfo.points_stored}</div>
              <div className="stat-label">stored in ChromaDB</div>
            </div>
          )}
        </div>
      )}

      {chunkInfo && chunkInfo.sample?.length > 0 && (
        <div className="sample-chunks">
          <h3>Sample chunks</h3>
          {chunkInfo.sample.map((c) => (
            <div className="chunk-card" key={`${c.page}-${c.chunk_index}`}>
              <div className="chunk-meta">
                <span className="badge">page {c.page}</span>
                <span className="badge">chunk {c.chunk_index + 1}</span>
                <span className="badge">{c.text.length} chars</span>
              </div>
              <div className="chunk-text">{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {embedInfo && embedInfo.preview?.length > 0 && (
        <div className="embed-preview">
          <h3>Embedding preview (first 8 of {embedInfo.dim} dims, last chunk embedded)</h3>
          <div className="dense-bars">
            {embedInfo.preview.map((v, i) => (
              <span key={i} style={{ height: `${Math.max(6, Math.abs(v) * 90 + 6)}%` }} title={v.toFixed(4)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
