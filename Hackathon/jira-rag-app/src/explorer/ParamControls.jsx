export default function ParamControls({ chunkSize, chunkOverlap, topK, onChange, onRerun, disabled }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="field">
          <label className="field-label" htmlFor="chunkSize">Chunk size (tokens)</label>
          <input
            id="chunkSize"
            type="number"
            min={50}
            step={50}
            value={chunkSize}
            onChange={(e) => onChange({ chunkSize: Number(e.target.value) })}
            style={{ width: 120 }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="chunkOverlap">Chunk overlap (tokens)</label>
          <input
            id="chunkOverlap"
            type="number"
            min={0}
            step={10}
            value={chunkOverlap}
            onChange={(e) => onChange({ chunkOverlap: Number(e.target.value) })}
            style={{ width: 120 }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="topK">Top-K</label>
          <input
            id="topK"
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => onChange({ topK: Number(e.target.value) })}
            style={{ width: 90 }}
          />
        </div>
      </div>
      <button className="btn" disabled={disabled} onClick={onRerun}>
        Re-run pipeline with these settings
      </button>
      <p className="chunk-meta" style={{ marginTop: 8 }}>
        Re-running re-chunks and re-embeds the current ticket from scratch using the values above.
      </p>
    </div>
  );
}
