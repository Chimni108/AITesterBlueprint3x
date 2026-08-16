export default function AnswerDisplay({ answer, loading }) {
  if (loading) return <p className="chunk-meta">Generating answer…</p>;
  if (!answer) return <p className="chunk-meta">No answer yet.</p>;

  return <div className="answer-box">{answer}</div>;
}
