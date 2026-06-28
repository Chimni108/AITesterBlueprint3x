import { useEffect, useState } from "react";
import Settings from "./components/Settings";
import TestStrategyTab from "./components/TestStrategyTab";
import TestCaseTab from "./components/TestCaseTab";
import { loadSettings, saveSettings, isSettingsComplete, loadTheme, saveTheme } from "./services/settingsService";
import "./App.css";

export default function App() {
  const [settings, setSettings] = useState(loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(loadTheme());
  const [activeTab, setActiveTab] = useState("strategy");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function handleSaveSettings(next) {
    setSettings(next);
    saveSettings(next);
    setShowSettings(false);
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    saveTheme(next);
  }

  const configured = isSettingsComplete(settings);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">TB</span>
          <div>
            <h1>Test Strategy Buddy — B.L.A.S.T.</h1>
            <p>JIRA → GROQ (plain B.L.A.S.T. prompts) → Test Strategy &amp; 20 Test Cases</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "🌙 Dark" : "☀ Light"}
          </button>
          <button className="btn-secondary" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      <main className="app-main">
        {!configured && (
          <div className="banner-warning">
            Configure your JIRA and GROQ credentials in Settings before generating anything.
          </div>
        )}

        <nav className="tab-bar">
          <button
            className={activeTab === "strategy" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("strategy")}
          >
            Test Strategy
          </button>
          <button
            className={activeTab === "testcases" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("testcases")}
          >
            Test Case Generator
          </button>
        </nav>

        {activeTab === "strategy" ? (
          <TestStrategyTab settings={settings} configured={configured} />
        ) : (
          <TestCaseTab settings={settings} configured={configured} />
        )}
      </main>

      {showSettings && (
        <Settings settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
