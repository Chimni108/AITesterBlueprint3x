import { useState } from 'react';
import FileDropzone from './components/FileDropzone';
import ResultsView from './components/ResultsView';
import { compareBuilds } from './api';
import './App.css';

function App() {
  const [build1, setBuild1] = useState(null);
  const [build2, setBuild2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const canCompare = build1 && build2 && !loading;

  async function handleCompare() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await compareBuilds(build1, build2);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Flaky Test Analyzer</h1>
        <p>Upload two build result JSON files to compare test runs and detect flaky tests.</p>
      </header>

      <div className="dropzone-row">
        <FileDropzone label="Build 1 result" file={build1} onFileSelected={setBuild1} />
        <FileDropzone label="Build 2 result" file={build2} onFileSelected={setBuild2} />
      </div>

      <button type="button" className="compare-button" disabled={!canCompare} onClick={handleCompare}>
        {loading ? 'Comparing…' : 'Compare Builds'}
      </button>

      {error && <div className="error-banner">{error}</div>}

      {result && <ResultsView result={result} />}
    </div>
  );
}

export default App;
