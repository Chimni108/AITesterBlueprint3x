const STORAGE_KEY = "teststrategy-buddy-settings";
const THEME_KEY = "teststrategy-buddy-theme";

const DEFAULT_SETTINGS = {
  jira: { baseUrl: "", email: "", apiToken: "" },
  groq: { apiKey: "", model: "openai/gpt-oss-120b" },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      jira: { ...DEFAULT_SETTINGS.jira, ...parsed.jira },
      groq: { ...DEFAULT_SETTINGS.groq, ...parsed.groq },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isSettingsComplete(settings) {
  return Boolean(
    settings.jira.baseUrl &&
      settings.jira.email &&
      settings.jira.apiToken &&
      settings.groq.apiKey &&
      settings.groq.model
  );
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
