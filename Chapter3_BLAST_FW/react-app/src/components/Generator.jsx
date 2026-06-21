import { useState } from 'react'
import { fetchJiraTicket } from '../services/jiraService'
import { generateTestPlan } from '../services/groqService'

export default function Generator({ onTestPlanGenerated }) {
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

      setStatus(`Ticket fetched: "${ticket.summary}". Generating test plan with GROQ...`)
      const testPlan = await generateTestPlan(ticket)

      setStatus(null)
      onTestPlanGenerated(testPlan, ticket)
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
        <p>Enter a JIRA ticket ID to automatically generate a RICE-POT test plan using AI.</p>
      </div>

      <form className="generator-form" onSubmit={handleGenerate}>
        <input
          className="jira-input"
          value={jiraId}
          onChange={e => setJiraId(e.target.value)}
          placeholder="Enter JIRA ID — e.g. SCRUM-5"
          disabled={loading}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading || !jiraId.trim()}>
          {loading ? (
            <span className="loading-text"><span className="spinner" />Generating...</span>
          ) : (
            '⚡ Generate Test Plan'
          )}
        </button>
      </form>

      {status && <p className="status-msg">{status}</p>}
      {error && <p className="error-msg">❌ {error}</p>}
    </div>
  )
}
