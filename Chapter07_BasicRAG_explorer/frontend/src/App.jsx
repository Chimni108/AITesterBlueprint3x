import { useEffect, useState } from "react";
import IngestPanel from "./components/IngestPanel";
import ChunksBrowser from "./components/ChunksBrowser";
import QueryPanel from "./components/QueryPanel";
import { fetchStatus } from "./api";
import "./App.css";

function App() {
  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, [refreshKey]);

  function handleIngested() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-dot" />
          <span>Basic RAG Explorer</span>
        </div>
        <p className="brand-sub">
          One PDF (the VWO Product Requirements Document) &middot; Nomic Embed &middot; ChromaDB &middot; Groq
        </p>
        {status && (
          <div className="status-strip">
            <span className={`pill ${status.ingested ? "pill-good" : "pill-idle"}`}>
              {status.ingested ? `${status.chunk_count} chunks indexed` : "not ingested yet"}
            </span>
            <span className="pill">{status.embed_model}</span>
            <span className="pill">{status.groq_model}</span>
            <span className="pill">top {status.top_k}</span>
          </div>
        )}
      </header>

      <main className="app-main">
        <IngestPanel onIngested={handleIngested} />
        <ChunksBrowser refreshKey={refreshKey} />
        <QueryPanel enabled={Boolean(status?.ingested)} />
      </main>

      <footer className="app-footer">
        Chapter07 &middot; The Testing Academy &mdash; a minimal, end-to-end RAG pipeline over a single PDF.
      </footer>
    </div>
  );
}

export default App;
