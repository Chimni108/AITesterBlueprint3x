import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { downloadMarkdown } from '../services/exportService'
import { postTestPlanToJira } from '../services/jiraCommentService'

const PRIORITY_CLASS = {
  Highest: 'priority-highest',
  High: 'priority-high',
  Medium: 'priority-medium',
  Low: 'priority-low',
  Lowest: 'priority-lowest',
}

function OutputPanel({ title, icon, doc, ticket, prefix }) {
  const [posting, setPosting] = useState(false)
  const [postResult, setPostResult] = useState(null)

  async function handlePost() {
    setPosting(true)
    setPostResult(null)
    try {
      await postTestPlanToJira(doc.jiraId, doc)
      setPostResult({ type: 'success', msg: `✓ ${title} posted as comment on ${doc.jiraId}` })
    } catch (err) {
      setPostResult({ type: 'error', msg: `❌ ${err.message}` })
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="strategy-panel">
      <div className="display-header">
        <div className="display-meta">
          <span className="panel-label">{icon} {title}</span>
          <span className="badge badge-type">{ticket.issueType}</span>
          <span className={`badge ${PRIORITY_CLASS[ticket.priority] || 'priority-medium'}`}>
            {ticket.priority}
          </span>
          <span className="jira-id-label">{doc.jiraId}</span>
        </div>
        <div className="display-actions">
          <button
            className="btn-secondary"
            onClick={() => downloadMarkdown(doc, prefix)}
          >
            ⬇ Download .md
          </button>
          <button
            className="btn-primary"
            onClick={handlePost}
            disabled={posting}
          >
            {posting ? 'Posting...' : '📎 Post to JIRA'}
          </button>
        </div>
      </div>

      {postResult && (
        <p className={`post-result ${postResult.type}`}>{postResult.msg}</p>
      )}

      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.rawMarkdown}</ReactMarkdown>
      </div>
    </div>
  )
}

export default function StrategyDisplay({ strategy, testCases, ticket }) {
  const [activePanel, setActivePanel] = useState('strategy')
  const generated = new Date(strategy.generatedAt).toLocaleString()

  return (
    <div className="strategy-display">
      <div className="ticket-summary">
        <strong>{strategy.jiraId}:</strong> {ticket.summary}
        <span className="generated-at" style={{ marginLeft: 16 }}>Generated: {generated}</span>
      </div>

      <div className="strategy-tabs">
        <button
          className={activePanel === 'strategy' ? 'strategy-tab active' : 'strategy-tab'}
          onClick={() => setActivePanel('strategy')}
        >
          📋 Test Strategy
        </button>
        <button
          className={activePanel === 'cases' ? 'strategy-tab active' : 'strategy-tab'}
          onClick={() => setActivePanel('cases')}
        >
          🧪 Test Cases
        </button>
      </div>

      {activePanel === 'strategy' && (
        <OutputPanel
          title="Test Strategy"
          icon="📋"
          doc={strategy}
          ticket={ticket}
          prefix="teststrategy"
        />
      )}

      {activePanel === 'cases' && (
        <OutputPanel
          title="Test Cases"
          icon="🧪"
          doc={testCases}
          ticket={ticket}
          prefix="testcases"
        />
      )}
    </div>
  )
}
