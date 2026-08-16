import { useState } from 'react';

/**
 * Lets the user stage edit/split/merge/delete operations against the
 * currently-loaded (and possibly already-staged) chunk list. Nothing here
 * touches Chroma Cloud directly -- staged ops are handed to the parent via
 * onStage, and only committed when the user clicks "Apply Changes".
 */
export default function ChunkEditor({ chunks, pendingCount, onStage, onApply, onDiscard, applying }) {
  const [openEditId, setOpenEditId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [openSplitId, setOpenSplitId] = useState(null);
  const [splitA, setSplitA] = useState('');
  const [splitB, setSplitB] = useState('');

  function startEdit(chunk) {
    setOpenEditId(chunk.id);
    setOpenSplitId(null);
    setDraftText(chunk.text);
  }

  function confirmEdit(chunkId) {
    onStage({ type: 'edit', chunkId, text: draftText });
    setOpenEditId(null);
  }

  function startSplit(chunk) {
    const mid = Math.floor(chunk.text.length / 2);
    setOpenSplitId(chunk.id);
    setOpenEditId(null);
    setSplitA(chunk.text.slice(0, mid).trim());
    setSplitB(chunk.text.slice(mid).trim());
  }

  function confirmSplit(chunkId) {
    onStage({ type: 'split', chunkId, textA: splitA, textB: splitB });
    setOpenSplitId(null);
  }

  function mergeWithNext(chunk, next) {
    onStage({
      type: 'merge',
      chunkIds: [chunk.id, next.id],
      text: `${chunk.text}\n\n${next.text}`,
    });
  }

  if (!chunks.length) return <p className="chunk-meta">No chunks to edit yet — load a ticket first.</p>;

  return (
    <div>
      {chunks.map((chunk, i) => {
        const next = chunks[i + 1];
        return (
          <div key={chunk.id} className="chunk-item">
            <div className="chunk-meta">
              <span>#{i}</span>
              <span>{chunk.id}</span>
            </div>

            {openEditId === chunk.id ? (
              <div>
                <textarea rows={4} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => confirmEdit(chunk.id)}>Stage edit</button>
                  <button className="btn" onClick={() => setOpenEditId(null)}>Cancel</button>
                </div>
              </div>
            ) : openSplitId === chunk.id ? (
              <div>
                <label className="field-label">First half</label>
                <textarea rows={3} value={splitA} onChange={(e) => setSplitA(e.target.value)} />
                <label className="field-label" style={{ marginTop: 8 }}>Second half</label>
                <textarea rows={3} value={splitB} onChange={(e) => setSplitB(e.target.value)} />
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => confirmSplit(chunk.id)}>Stage split</button>
                  <button className="btn" onClick={() => setOpenSplitId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="chunk-text">{chunk.text}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => startEdit(chunk)}>Edit</button>
                  <button className="btn" onClick={() => startSplit(chunk)}>Split</button>
                  {next && <button className="btn" onClick={() => mergeWithNext(chunk, next)}>Merge with next</button>}
                  <button className="btn btn-danger" onClick={() => onStage({ type: 'delete', chunkId: chunk.id })}>Delete</button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={!pendingCount || applying} onClick={onApply}>
          {applying ? 'Applying…' : `Apply Changes${pendingCount ? ` (${pendingCount})` : ''}`}
        </button>
        <button className="btn" disabled={!pendingCount || applying} onClick={onDiscard}>
          Discard staged edits
        </button>
      </div>
      {pendingCount > 0 && (
        <p className="chunk-meta" style={{ marginTop: 8 }}>
          {pendingCount} staged change{pendingCount === 1 ? '' : 's'} — not yet written to Chroma Cloud.
        </p>
      )}
    </div>
  );
}
