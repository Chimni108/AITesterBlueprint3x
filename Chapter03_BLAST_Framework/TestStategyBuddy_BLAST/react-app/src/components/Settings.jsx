import { useState } from "react";

export default function Settings({ settings, onSave, onClose }) {
  const [form, setForm] = useState(settings);

  function update(section, field, value) {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Settings</h2>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>JIRA</legend>
            <label>
              Base URL
              <input
                type="text"
                placeholder="https://yourcompany.atlassian.net"
                value={form.jira.baseUrl}
                onChange={(e) => update("jira", "baseUrl", e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.jira.email}
                onChange={(e) => update("jira", "email", e.target.value)}
              />
            </label>
            <label>
              API Token
              <input
                type="password"
                value={form.jira.apiToken}
                onChange={(e) => update("jira", "apiToken", e.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>GROQ</legend>
            <label>
              API Key
              <input
                type="password"
                value={form.groq.apiKey}
                onChange={(e) => update("groq", "apiKey", e.target.value)}
              />
            </label>
            <label>
              Model
              <input
                type="text"
                value={form.groq.model}
                onChange={(e) => update("groq", "model", e.target.value)}
              />
            </label>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
