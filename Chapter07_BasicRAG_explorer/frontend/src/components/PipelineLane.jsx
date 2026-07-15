function Node({ label, sub, state }) {
  return (
    <div className={`pd-node pd-${state}`}>
      <span className="pd-node-label">{label}</span>
      <span className="pd-node-sub">{sub}</span>
    </div>
  );
}

/** A horizontal row of pipeline stage nodes. `stages` maps node key -> "idle" | "active" | "done" | "error". */
export default function PipelineLane({ nodes, stages }) {
  return (
    <div className="pd-lane-row">
      {nodes.map((n, i) => {
        const state = stages[n.key] || "idle";
        return (
          <div className="pd-lane-item" key={n.key}>
            {i > 0 && <div className={`pd-wire pd-${state === "idle" ? "idle" : "active"}`} />}
            <Node label={n.label} sub={n.sub} state={state} />
          </div>
        );
      })}
    </div>
  );
}
