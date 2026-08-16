const STAGE_ORDER = ['checking', 'fetching', 'chunking', 'chunked', 'embedding', 'storing', 'stored', 'reused'];

export default function PipelinePanel({ steps, running }) {
  if (!steps.length) {
    return <p className="chunk-meta">No pipeline activity yet — load a ticket to begin.</p>;
  }

  const lastIndex = steps.length - 1;

  return (
    <div className="pipeline-steps">
      {steps.map((step, i) => {
        const isLast = i === lastIndex;
        const status = isLast && running ? 'active' : 'done';
        return (
          <div key={`${step.stage}-${i}`} className={`pipeline-step ${status}`}>
            <span className="step-dot" />
            <span>{step.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export { STAGE_ORDER };
