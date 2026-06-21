import { useState } from 'react'
import Settings from './components/Settings'
import Generator from './components/Generator'
import TestPlanDisplay from './components/TestPlanDisplay'

export default function App() {
  const [activeTab, setActiveTab] = useState('generator')
  const [testPlan, setTestPlan] = useState(null)
  const [ticket, setTicket] = useState(null)

  function handleTestPlanGenerated(plan, t) {
    setTestPlan(plan)
    setTicket(t)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">🚀</span>
          <div>
            <h1>JIRA Test Plan Generator</h1>
            <span className="header-subtitle">B.L.A.S.T. Framework · RICE-POT Format · Powered by GROQ</span>
          </div>
        </div>
        <nav className="header-nav">
          <button
            className={activeTab === 'generator' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('generator')}
          >
            ⚡ Generate
          </button>
          <button
            className={activeTab === 'settings' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('settings')}
          >
            ⚙ Settings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'settings' && <Settings />}

        {activeTab === 'generator' && (
          <>
            <Generator onTestPlanGenerated={handleTestPlanGenerated} />
            {testPlan && ticket && (
              <TestPlanDisplay testPlan={testPlan} ticket={ticket} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
