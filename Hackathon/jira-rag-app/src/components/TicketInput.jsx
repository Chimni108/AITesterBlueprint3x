import { useState } from 'react';

export default function TicketInput({ onLoad, loading }) {
  const [ticketId, setTicketId] = useState('');

  function submit(e) {
    e.preventDefault();
    const trimmed = ticketId.trim();
    if (trimmed) onLoad(trimmed);
  }

  return (
    <form className="row" onSubmit={submit}>
      <input
        type="text"
        placeholder="Jira ticket ID (e.g. PROJ-123)"
        value={ticketId}
        onChange={(e) => setTicketId(e.target.value)}
        style={{ minWidth: 220 }}
      />
      <button type="submit" className="btn btn-primary" disabled={loading || !ticketId.trim()}>
        {loading ? 'Loading…' : 'Load Ticket'}
      </button>
    </form>
  );
}
