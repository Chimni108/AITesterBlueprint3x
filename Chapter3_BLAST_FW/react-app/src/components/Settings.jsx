import { useState, useEffect } from 'react'
import { getJiraConfig, saveJiraConfig } from '../services/jiraService'
import { getGroqConfig, saveGroqConfig } from '../services/groqService'

export default function Settings() {
  const [jira, setJira] = useState({ baseUrl: '', email: '', token: '' })
  const [groq, setGroq] = useState({ apiKey: '', model: 'openai/gpt-oss-120b' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const j = getJiraConfig()
    const g = getGroqConfig()
    if (j) setJira(j)
    if (g) setGroq(g)
  }, [])

  function handleSave(e) {
    e.preventDefault()
    saveJiraConfig(jira)
    saveGroqConfig(groq)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form className="settings-form" onSubmit={handleSave}>
      <div className="settings-section">
        <h2>JIRA Configuration</h2>
        <label>
          Base URL
          <input
            value={jira.baseUrl}
            onChange={e => setJira({ ...jira, baseUrl: e.target.value })}
            placeholder="https://yourorg.atlassian.net"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={jira.email}
            onChange={e => setJira({ ...jira, email: e.target.value })}
            placeholder="your-email@domain.com"
            required
          />
        </label>
        <label>
          API Token
          <input
            type="password"
            value={jira.token}
            onChange={e => setJira({ ...jira, token: e.target.value })}
            placeholder="Atlassian API token"
            required
          />
          <span className="field-hint">
            Generate at: id.atlassian.com → Security → API tokens
          </span>
        </label>
      </div>

      <div className="settings-section">
        <h2>GROQ Configuration</h2>
        <label>
          API Key
          <input
            type="password"
            value={groq.apiKey}
            onChange={e => setGroq({ ...groq, apiKey: e.target.value })}
            placeholder="gsk_..."
            required
          />
          <span className="field-hint">
            Get free key at: console.groq.com
          </span>
        </label>
        <label>
          Model
          <input
            value={groq.model}
            onChange={e => setGroq({ ...groq, model: e.target.value })}
          />
        </label>
      </div>

      <button type="submit" className="btn-primary">
        {saved ? '✓ Settings Saved' : 'Save Settings'}
      </button>
    </form>
  )
}
