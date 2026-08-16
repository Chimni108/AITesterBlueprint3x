import { useState } from 'react';
import ThemeToggle from './components/ThemeToggle.jsx';
import MainView from './MainView.jsx';
import RagExplorer from './explorer/RagExplorer.jsx';

export default function App() {
  const [tab, setTab] = useState('main');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="app-title">Jira Ticket RAG Pipeline</div>
          <div className="app-subtitle">Nomic Embed · Chroma Cloud · Groq</div>
        </div>
        <div className="row">
          <div className="tabs">
            <button className={`tab-btn ${tab === 'main' ? 'active' : ''}`} onClick={() => setTab('main')}>
              Ticket Analysis
            </button>
            <button className={`tab-btn ${tab === 'explorer' ? 'active' : ''}`} onClick={() => setTab('explorer')}>
              RAG Explorer
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {tab === 'main' ? <MainView /> : <RagExplorer />}
    </div>
  );
}
