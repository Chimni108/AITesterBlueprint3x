export default function StorageInspector({ chunks }) {
  if (!chunks.length) return <p className="chunk-meta">Nothing stored yet.</p>;

  return (
    <div>
      {chunks.map((chunk) => (
        <div key={chunk.id} className="chunk-item">
          <div className="chunk-meta">
            <span>id: {chunk.id}</span>
            <span>dims: {chunk.embeddingDimensions ?? 'n/a'}</span>
          </div>
          <div className="chunk-meta">metadata: {JSON.stringify(chunk.metadata)}</div>
          {chunk.embeddingPreview && (
            <div className="chunk-meta">
              vector[0:8]: [{chunk.embeddingPreview.map((v) => v.toFixed(4)).join(', ')}, …]
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
