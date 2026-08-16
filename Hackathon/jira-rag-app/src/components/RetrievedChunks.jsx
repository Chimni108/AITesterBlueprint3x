export default function RetrievedChunks({ chunks }) {
  if (!chunks?.length) return null;

  return (
    <div>
      {chunks.map((chunk, i) => (
        <div key={chunk.id || i} className="chunk-item">
          <div className="chunk-meta">
            <span>#{i + 1}</span>
            <span>{chunk.id}</span>
            {typeof chunk.similarity === 'number' && (
              <span>similarity {chunk.similarity.toFixed(3)}</span>
            )}
          </div>
          <div className="chunk-text">{chunk.text}</div>
        </div>
      ))}
    </div>
  );
}
