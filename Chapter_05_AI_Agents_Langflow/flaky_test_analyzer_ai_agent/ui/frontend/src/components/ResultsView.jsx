import { useState } from 'react';

const SECTION_CONFIG = {
  FLAKY_TESTS: { title: 'Flaky Tests', tone: 'warning' },
  CONSISTENT_FAILURES: { title: 'Consistent Failures', tone: 'danger' },
  RERUN_RECOMMENDATION: { title: 'Rerun Recommendation', tone: 'info' },
  SUMMARY: { title: 'Summary', tone: 'neutral' },
};

function titleCase(key) {
  return key
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseSections(text) {
  if (!text) return [];
  const headerRegex = /\*\*([A-Z0-9_]+)\*\*/g;
  const matches = [...text.matchAll(headerRegex)];

  if (matches.length === 0) {
    return [{ key: 'RESPONSE', title: 'Response', tone: 'neutral', content: text.trim() }];
  }

  return matches.map((match, i) => {
    const key = match[1];
    const contentStart = match.index + match[0].length;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const config = SECTION_CONFIG[key] || { title: titleCase(key), tone: 'neutral' };
    return {
      key,
      title: config.title,
      tone: config.tone,
      content: text.slice(contentStart, contentEnd).trim(),
    };
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

export default function ResultsView({ result }) {
  const [showRaw, setShowRaw] = useState(false);
  const sections = parseSections(result.text);
  const source = result.properties?.source;
  const usage = result.properties?.usage;

  return (
    <div className="results">
      <div className="results__header">
        <h2>Comparison Result</h2>
        {(source || usage) && (
          <div className="results__meta">
            {source?.display_name && (
              <span className="meta-pill">
                {source.display_name} · {source.source}
              </span>
            )}
            {usage?.total_tokens != null && (
              <span className="meta-pill">{usage.total_tokens} tokens</span>
            )}
          </div>
        )}
      </div>

      <div className="results__grid">
        {sections.map((section) => (
          <div key={section.key} className={`section section--${section.tone}`}>
            <div className="section__title">{section.title}</div>
            <div
              className="section__content"
              dangerouslySetInnerHTML={{ __html: renderInline(section.content) }}
            />
          </div>
        ))}
      </div>

      <button type="button" className="link-button" onClick={() => setShowRaw((v) => !v)}>
        {showRaw ? 'Hide raw response' : 'Show raw response'}
      </button>
      {showRaw && <pre className="raw-json">{JSON.stringify(result.raw, null, 2)}</pre>}
    </div>
  );
}
