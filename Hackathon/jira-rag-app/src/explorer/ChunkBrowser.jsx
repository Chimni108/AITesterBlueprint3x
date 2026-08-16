export default function ChunkBrowser({ chunks }) {
  if (!chunks.length) return <p className="chunk-meta">No chunks loaded yet.</p>;

  return (
    <div>
      {chunks.map((chunk, i) => (
        <div key={chunk.id} className="chunk-item">
          <div className="chunk-meta">
            <span>#{i}</span>
            <span>{chunk.id}</span>
            <span>{chunk.text.length} chars</span>
            <span>~{Math.ceil(chunk.text.length / 4)} tokens</span>
          </div>
          <div className="chunk-text">{chunk.text}</div>
        </div>
      ))}
    </div>
  );
}
