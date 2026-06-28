import { useState } from "react";
import Settings from "./components/Settings";
import Generator from "./components/Generator";
import TestPlanDisplay from "./components/TestPlanDisplay";
import { loadSettings, saveSettings, isSettingsComplete } from "./services/settingsService";
import { createTestPlanFromJiraId } from "./services/testPlanService";
import "./App.css";

export default function App() {
  const [settings, setSettings] = useState(loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleSaveSettings(next) {
    setSettings(next);
    saveSettings(next);
    setShowSettings(false);
  }

  async function handleGenerate(issueKey) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createTestPlanFromJiraId(settings, issueKey);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const configured = isSettingsComplete(settings);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">TP</span>
          <div>
            <h1>Test Plan Generator</h1>
            <p>JIRA → GROQ → QA test plan, in one click</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setShowSettings(true)}>
          ⚙ Settings
        </button>
      </header>

      <main className="app-main">
        {!configured && (
          <div className="banner-warning">
            Configure your JIRA and GROQ credentials in Settings before generating a test plan.
          </div>
        )}

        <Generator disabled={!configured} loading={loading} onGenerate={handleGenerate} />

        {error && <div className="banner-error">{error}</div>}

        {result && <TestPlanDisplay issue={result.issue} plan={result.plan} />}

        {!result && !error && !loading && (
          <div className="empty-state">
            <p>Enter a JIRA issue key above and click "Fetch &amp; Generate" to build a test plan.</p>
          </div>
        )}
      </main>

      {showSettings && (
        <Settings settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
