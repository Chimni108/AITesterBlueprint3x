import { useState } from 'react';
import RetrievedChunks from '../components/RetrievedChunks.jsx';
import AnswerDisplay from '../components/AnswerDisplay.jsx';
import { retrievalOnlyQuery, generateAnswerStream } from '../lib/api.js';

/** Same query box as SearchPanel, but toggleable to also call Groq -- lets the user compare retrieval-only vs. retrieval+generation for the same query. */
export default function AskPanel({ ticketId, topK }) {
  const [query, setQuery] = useState('');
  const [withGeneration, setWithGeneration] = useState(true);
  const [chunks, setChunks] = useState([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!ticketId || !query.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer('');
    try {
      if (withGeneration) {
        await generateAnswerStream(
          { ticketId, mode: 'custom', query, topK },
          {
            chunks: (data) => setChunks(data.chunks),
            answer: (data) => setAnswer(data.answer),
          }
        );
      } else {
        const data = await retrievalOnlyQuery(ticketId, query, topK);
        setChunks(data.results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="row" onSubmit={submit} style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Ask about this ticket…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!ticketId}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="btn btn-primary" type="submit" disabled={!ticketId || loading || !query.trim()}>
          {loading ? 'Working…' : 'Ask'}
        </button>
      </form>
      <label className="row" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        <input type="checkbox" checked={withGeneration} onChange={(e) => setWithGeneration(e.target.checked)} />
        Also send retrieved chunks to Groq and generate an answer
      </label>

      {error && <div className="error-banner" style={{ marginTop: 10 }}>{error}</div>}

      <h2 style={{ marginTop: 16 }}>Retrieved Chunks</h2>
      <RetrievedChunks chunks={chunks} />

      {withGeneration && (
        <>
          <h2 style={{ marginTop: 16 }}>Answer</h2>
          <AnswerDisplay answer={answer} loading={loading} />
        </>
      )}
    </div>
  );
}
