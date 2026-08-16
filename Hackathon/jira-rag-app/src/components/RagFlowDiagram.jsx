const STAGES = [
  { key: 'ingest', label: 'Jira Ingestion', detail: 'Fetch ticket via REST API' },
  { key: 'chunk', label: 'Chunking', detail: 'Split into overlapping chunks' },
  { key: 'embed', label: 'Embedding', detail: 'Nomic Embed' },
  { key: 'store', label: 'Storage', detail: 'Chroma Cloud collection' },
  { key: 'retrieve', label: 'Retrieval', detail: 'Top-K similarity search' },
  { key: 'generate', label: 'Generation', detail: 'Groq LLM' },
];

/**
 * Static/illustrative overview of the RAG architecture. Complements (does
 * not replace) the live PipelinePanel, which shows progress for the
 * currently-running request.
 */
export default function RagFlowDiagram({ activeStage }) {
  const width = 900;
  const boxWidth = 128;
  const boxHeight = 64;
  const gap = (width - STAGES.length * boxWidth) / (STAGES.length - 1);

  return (
    <svg viewBox={`0 0 ${width} 140`} width="100%" role="img" aria-label="RAG pipeline architecture diagram">
      {STAGES.map((stage, i) => {
        const x = i * (boxWidth + gap);
        const isActive = activeStage === stage.key;
        return (
          <g key={stage.key}>
            <rect
              x={x}
              y={20}
              width={boxWidth}
              height={boxHeight}
              rx={10}
              fill={isActive ? 'var(--accent)' : 'var(--bg-inset)'}
              stroke="var(--border)"
            />
            <text
              x={x + boxWidth / 2}
              y={44}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill={isActive ? 'var(--accent-contrast)' : 'var(--text)'}
            >
              {stage.label}
            </text>
            <text
              x={x + boxWidth / 2}
              y={62}
              textAnchor="middle"
              fontSize="10"
              fill={isActive ? 'var(--accent-contrast)' : 'var(--text-muted)'}
            >
              {stage.detail}
            </text>
            {i < STAGES.length - 1 && (
              <line
                x1={x + boxWidth}
                y1={52}
                x2={x + boxWidth + gap}
                y2={52}
                stroke="var(--border)"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--border)" />
        </marker>
      </defs>
    </svg>
  );
}
