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

export default function TestPlanDisplay({ testPlan, ticket }) {
  const [posting, setPosting] = useState(false)
  const [postResult, setPostResult] = useState(null)

  async function handlePostToJira() {
    setPosting(true)
    setPostResult(null)
    try {
      await postTestPlanToJira(testPlan.jiraId, testPlan)
      setPostResult({ type: 'success', msg: `✓ Test plan posted as a comment on ${testPlan.jiraId}` })
    } catch (err) {
      setPostResult({ type: 'error', msg: `❌ ${err.message}` })
    } finally {
      setPosting(false)
    }
  }

  const generated = new Date(testPlan.generatedAt).toLocaleString()

  return (
    <div className="test-plan-display">
      <div className="display-header">
        <div className="display-meta">
          <span className="badge badge-type">{ticket.issueType}</span>
          <span className={`badge ${PRIORITY_CLASS[ticket.priority] || 'priority-medium'}`}>
            {ticket.priority}
          </span>
          <span className="jira-id-label">{testPlan.jiraId}</span>
          <span className="generated-at">Generated: {generated}</span>
        </div>
        <div className="display-actions">
          <button
            className="btn-secondary"
            onClick={() => downloadMarkdown(testPlan)}
          >
            ⬇ Download .md
          </button>
          <button
            className="btn-primary"
            onClick={handlePostToJira}
            disabled={posting}
          >
            {posting ? 'Posting...' : '📎 Post to JIRA'}
          </button>
        </div>
      </div>

      {postResult && (
        <p className={`post-result ${postResult.type}`}>{postResult.msg}</p>
      )}

      <div className="ticket-summary">
        <strong>{testPlan.jiraId}:</strong> {ticket.summary}
      </div>

      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {testPlan.rawMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  )
}
