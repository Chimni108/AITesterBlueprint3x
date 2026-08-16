import { useState } from 'react';
import TicketInput from './components/TicketInput.jsx';
import PipelinePanel from './components/PipelinePanel.jsx';
import RetrievedChunks from './components/RetrievedChunks.jsx';
import AnswerDisplay from './components/AnswerDisplay.jsx';
import RagFlowDiagram from './components/RagFlowDiagram.jsx';
import { ingestTicket, generateAnswerStream } from './lib/api.js';

const STAGE_TO_DIAGRAM_KEY = {
  fetching: 'ingest',
  chunking: 'chunk',
  chunked: 'chunk',
  embedding: 'embed',
  storing: 'store',
  stored: 'store',
  'embedding-query': 'embed',
  retrieving: 'retrieve',
  generating: 'generate',
};

export default function MainView() {
  const [ticketId, setTicketId] = useState(null);
  const [ticketSummary, setTicketSummary] = useState(null);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [activeDiagramStage, setActiveDiagramStage] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [answer, setAnswer] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLoad(id) {
    setError(null);
    setAnswer('');
    setChunks([]);
    setPipelineSteps([]);
    setPipelineRunning(true);
    setTicketId(id);
    try {
      const result = await ingestTicket(id, {}, (stage) => {
        setPipelineSteps((prev) => [...prev, stage]);
        setActiveDiagramStage(STAGE_TO_DIAGRAM_KEY[stage.stage] || null);
      });
      setChunks(result.chunks || []);
      if (result.ticket) setTicketSummary(result.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setPipelineRunning(false);
      setActiveDiagramStage(null);
    }
  }

  async function runPreset(mode) {
    if (!ticketId) return;
    setError(null);
    setAnswer('');
    setAnswerLoading(true);
    setPipelineSteps((prev) => [...prev, { stage: mode, message: `Running "${mode === 'analyze' ? 'Analyze Ticket' : 'Generate Test Cases'}"` }]);
    try {
      await generateAnswerStream(
        { ticketId, mode },
        {
          stage: (data) => {
            setPipelineSteps((prev) => [...prev, data]);
            setActiveDiagramStage(STAGE_TO_DIAGRAM_KEY[data.stage] || null);
          },
          chunks: (data) => setChunks(data.chunks),
          answer: (data) => setAnswer(data.answer),
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAnswerLoading(false);
      setActiveDiagramStage(null);
    }
  }

  async function runCustomQuery(query) {
    if (!ticketId || !query.trim()) return;
    setError(null);
    setAnswer('');
    setAnswerLoading(true);
    try {
      await generateAnswerStream(
        { ticketId, mode: 'custom', query },
        {
          stage: (data) => {
            setPipelineSteps((prev) => [...prev, data]);
            setActiveDiagramStage(STAGE_TO_DIAGRAM_KEY[data.stage] || null);
          },
          chunks: (data) => setChunks(data.chunks),
          answer: (data) => setAnswer(data.answer),
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAnswerLoading(false);
      setActiveDiagramStage(null);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>1. Load Ticket</h2>
        <TicketInput onLoad={handleLoad} loading={pipelineRunning} />
        {ticketSummary && (
          <p className="chunk-meta" style={{ marginTop: 10 }}>
            {ticketSummary.issueType} · {ticketSummary.status} · {ticketSummary.summary}
          </p>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>RAG Pipeline</h2>
        <RagFlowDiagram activeStage={activeDiagramStage} />
      </div>

      <div className="card">
        <h2>Pipeline Progress</h2>
        <PipelinePanel steps={pipelineSteps} running={pipelineRunning || answerLoading} />
      </div>

      <div className="card">
        <h2>2. Ask</h2>
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn btn-primary" disabled={!ticketId || answerLoading} onClick={() => runPreset('analyze')}>
            Analyze Ticket
          </button>
          <button className="btn btn-primary" disabled={!ticketId || answerLoading} onClick={() => runPreset('testcases')}>
            Generate Test Cases
          </button>
        </div>
        <CustomQueryBox disabled={!ticketId || answerLoading} onSubmit={runCustomQuery} />
      </div>

      <div className="card">
        <h2>Retrieved Chunks</h2>
        <RetrievedChunks chunks={chunks} />
      </div>

      <div className="card">
        <h2>Answer</h2>
        <AnswerDisplay answer={answer} loading={answerLoading} />
      </div>
    </div>
  );
}

function CustomQueryBox({ disabled, onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <input
        type="text"
        placeholder="Ask a free-text question about this ticket…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ flex: 1, minWidth: 240 }}
        disabled={disabled}
      />
      <button type="submit" className="btn" disabled={disabled || !value.trim()}>
        Ask
      </button>
    </form>
  );
}
