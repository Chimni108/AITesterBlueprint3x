import { useState } from 'react';
import RetrievedChunks from '../components/RetrievedChunks.jsx';
import { retrievalOnlyQuery } from '../lib/api.js';

/** Retrieval only, no LLM call -- lets the user test retrieval quality in isolation. */
export default function SearchPanel({ ticketId, topK }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!ticketId || !query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await retrievalOnlyQuery(ticketId, query, topK);
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="row" onSubmit={submit}>
        <input
          type="text"
          placeholder="Test a retrieval query…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!ticketId}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="btn btn-primary" type="submit" disabled={!ticketId || loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <div className="error-banner" style={{ marginTop: 10 }}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        <RetrievedChunks chunks={results} />
      </div>
    </div>
  );
}
