import { useState } from "react";
import PipelineLane from "./PipelineLane";
import { streamQuery } from "../api";

const NODES = [
  { key: "question", label: "Question", sub: "you ask" },
  { key: "embed", label: "Embed", sub: "Nomic Embed" },
  { key: "retrieve", label: "Retrieve", sub: "top 4 · ChromaDB" },
  { key: "generate", label: "Generate", sub: "Groq · gpt-oss-120b" },
];

const IDLE_STAGES = { question: "idle", embed: "idle", retrieve: "idle", generate: "idle" };

export default function QueryPanel({ enabled }) {
  const [question, setQuestion] = useState("");
  const [stages, setStages] = useState(IDLE_STAGES);
  const [running, setRunning] = useState(false);
  const [turns, setTurns] = useState([]);

  function updateTurn(index, patch) {
    setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function ask(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || running || !enabled) return;

    const index = turns.length;
    setTurns((prev) => [...prev, { question: q, hits: null, answer: null, citations: null, error: null, note: null }]);
    setQuestion("");
    setRunning(true);
    setStages({ question: "done", embed: "idle", retrieve: "idle", generate: "idle" });

    const source = streamQuery(
      q,
      (event) => {
        if (event.stage === "error") {
          updateTurn(index, { error: event.message });
          setRunning(false);
          source.close(); // otherwise EventSource treats the server ending the stream as a drop and retries
          return;
        }

        setStages((prev) => ({ ...prev, [event.stage]: event.status === "done" ? "done" : "active" }));
        updateTurn(index, { note: event.note || null });

        if (event.status !== "done") return;
        if (event.stage === "retrieve") updateTurn(index, { hits: event.hits });
        if (event.stage === "generate") {
          updateTurn(index, { answer: event.answer, citations: event.citations });
          setRunning(false);
          source.close(); // turn finished - close before EventSource's own auto-reconnect kicks in
        }
      },
      () => {
        updateTurn(index, { error: "Connection to the server was lost mid-turn." });
        setRunning(false);
      }
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>3 &middot; Query</h2>
          <p className="panel-sub">Ask a question about the PRD; watch retrieval and generation happen live.</p>
        </div>
      </div>

      <PipelineLane nodes={NODES} stages={stages} />

      {!enabled && <div className="callout">Ingest the PDF first before asking questions.</div>}

      {turns.length > 0 && (
        <div className="chat-thread">
          {turns.map((t, i) => (
            <div className="turn" key={i}>
              <div className="msg msg-user">{t.question}</div>

              {t.error && <div className="msg msg-error">{t.error}</div>}

              {t.hits && (
                <div className="retrieved">
                  <h4>Retrieved top {t.hits.length}</h4>
                  <ul className="mini-list">
                    {t.hits.map((h) => (
                      <li key={h.id}>
                        <span className="txt">
                          page {h.page} &middot; {h.text.slice(0, 90)}…
                        </span>
                        <span className="score">{h.similarity.toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {t.answer && (
                <div className="msg msg-assistant">
                  <div>{t.answer}</div>
                  {t.citations?.length > 0 && (
                    <div className="citations">
                      {t.citations.map((c) => (
                        <span className="badge" key={c.n}>
                          [{c.n}] page {c.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!t.answer && !t.error && <div className="msg msg-assistant muted">{t.note || "Thinking…"}</div>}
            </div>
          ))}
        </div>
      )}

      <form className="query-form" onSubmit={ask}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What statistical engine does VWO use?"
          disabled={!enabled || running}
        />
        <button className="btn" type="submit" disabled={!enabled || running || !question.trim()}>
          Ask
        </button>
      </form>
    </section>
  );
}
