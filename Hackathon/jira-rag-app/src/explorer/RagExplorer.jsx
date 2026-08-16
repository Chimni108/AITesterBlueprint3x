import { useState } from 'react';
import TicketInput from '../components/TicketInput.jsx';
import PipelinePanel from '../components/PipelinePanel.jsx';
import ChunkBrowser from './ChunkBrowser.jsx';
import ChunkEditor from './ChunkEditor.jsx';
import StorageInspector from './StorageInspector.jsx';
import SearchPanel from './SearchPanel.jsx';
import AskPanel from './AskPanel.jsx';
import ParamControls from './ParamControls.jsx';
import { applyEditsLocally } from './localEdits.js';
import { ingestTicket, listChunks, applyChunkEdits } from '../lib/api.js';

export default function RagExplorer() {
  const [ticketId, setTicketId] = useState(null);
  const [ingestSteps, setIngestSteps] = useState([]);
  const [ingesting, setIngesting] = useState(false);
  const [rawChunks, setRawChunks] = useState([]);
  const [edits, setEdits] = useState([]);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ chunkSize: 500, chunkOverlap: 50, topK: 4 });

  const viewChunks = applyEditsLocally(rawChunks, edits);

  async function loadTicket(id, force = false) {
    setError(null);
    setIngestSteps([]);
    setIngesting(true);
    setEdits([]);
    setTicketId(id);
    try {
      const result = await ingestTicket(
        id,
        { chunkSize: params.chunkSize, chunkOverlap: params.chunkOverlap, force },
        (stage) => setIngestSteps((prev) => [...prev, stage])
      );
      setRawChunks((result.chunks || []).map((c) => ({ id: c.id, text: c.text, metadata: c.metadata })));
    } catch (err) {
      setError(err.message);
    } finally {
      setIngesting(false);
    }
  }

  async function refreshFromServer() {
    if (!ticketId) return;
    const data = await listChunks(ticketId);
    setRawChunks(data.chunks.map((c) => ({ id: c.id, text: c.text, metadata: c.metadata, embeddingDimensions: c.embeddingDimensions, embeddingPreview: c.embeddingPreview })));
  }

  async function applyStagedEdits() {
    if (!ticketId || !edits.length) return;
    setApplying(true);
    setError(null);
    try {
      await applyChunkEdits(ticketId, edits);
      setEdits([]);
      const data = await listChunks(ticketId);
      setRawChunks(data.chunks.map((c) => ({ id: c.id, text: c.text, metadata: c.metadata, embeddingDimensions: c.embeddingDimensions, embeddingPreview: c.embeddingPreview })));
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Ingest a Ticket</h2>
        <TicketInput onLoad={(id) => loadTicket(id, false)} loading={ingesting} />
        <div style={{ marginTop: 12 }}>
          <PipelinePanel steps={ingestSteps} running={ingesting} />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Pipeline Parameters</h2>
        <ParamControls
          {...params}
          onChange={(patch) => setParams((p) => ({ ...p, ...patch }))}
          onRerun={() => ticketId && loadTicket(ticketId, true)}
          disabled={!ticketId || ingesting}
        />
      </div>

      <div className="explorer-grid">
        <div className="card">
          <h2>Chunk Browser ({viewChunks.length})</h2>
          <ChunkBrowser chunks={viewChunks} />
        </div>

        <div className="card">
          <h2>Storage Inspector (Chroma Cloud)</h2>
          <StorageInspector chunks={rawChunks} />
          <button className="btn" style={{ marginTop: 10 }} onClick={refreshFromServer} disabled={!ticketId}>
            Refresh from Chroma Cloud
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Chunk Editor</h2>
        <ChunkEditor
          chunks={viewChunks}
          pendingCount={edits.length}
          onStage={(edit) => setEdits((prev) => [...prev, edit])}
          onApply={applyStagedEdits}
          onDiscard={() => setEdits([])}
          applying={applying}
        />
      </div>

      <div className="explorer-grid">
        <div className="card">
          <h2>Search (retrieval only)</h2>
          <SearchPanel ticketId={ticketId} topK={params.topK} />
        </div>
        <div className="card">
          <h2>Ask (retrieval + optional generation)</h2>
          <AskPanel ticketId={ticketId} topK={params.topK} />
        </div>
      </div>
    </div>
  );
}
