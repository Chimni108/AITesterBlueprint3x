import { useState } from 'react'
import { fetchJiraTicket } from '../services/jiraService'
import { generateTestStrategy, generateTestCases } from '../services/groqStrategyService'

export default function StrategyGenerator({ onGenerated }) {
  const [jiraId, setJiraId] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setError(null)
    setStatus(null)
    setLoading(true)

    try {
      const id = jiraId.trim().toUpperCase()

      setStatus('Fetching JIRA ticket...')
      const ticket = await fetchJiraTicket(id)

      setStatus(`Ticket fetched: "${ticket.summary}". Generating test strategy (8 sections)...`)
      const strategy = await generateTestStrategy(ticket)

      setStatus('Test strategy done. Generating test cases (minimum 30)...')
      const cases = await generateTestCases(ticket)

      setStatus(null)
      onGenerated(strategy, cases, ticket)
    } catch (err) {
      setError(err.message)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generator">
      <div className="generator-intro">
        <p>Enter a JIRA ticket ID to generate a complete Test Strategy (8 sections) and Test Cases (30+ rows) using AI.</p>
      </div>

      <form className="generator-form" onSubmit={handleGenerate}>
        <input
          className="jira-input"
          value={jiraId}
          onChange={e => setJiraId(e.target.value)}
          placeholder="Enter JIRA ID — e.g. SCRUM-6"
          disabled={loading}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading || !jiraId.trim()}>
          {loading ? (
            <span className="loading-text"><span className="spinner" />Generating...</span>
          ) : (
            '🧪 Generate Strategy + Cases'
          )}
        </button>
      </form>

      {status && <p className="status-msg">{status}</p>}
      {error && <p className="error-msg">❌ {error}</p>}
    </div>
  )
}
