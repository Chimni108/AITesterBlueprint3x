"""Text cleaning and terminology tagging applied before chunking."""
import re

from app.config import load_glossary

ANSI_RE = re.compile(r"\x1b\[[0-9;]*[a-zA-Z]")
# leading timestamps in log lines, e.g. "2026-07-18 10:22:33,123" or "[2026-07-18T10:22:33Z]"
LOG_TS_RE = re.compile(r"^\[?\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.,:0-9]*Z?\]?\s*", re.M)

_glossary = load_glossary()
_term_patterns = {
    term: re.compile(rf"\b{re.escape(term)}\b") for term in _glossary
}


def clean(text: str, kind: str) -> str:
    text = ANSI_RE.sub("", text)
    if kind == "logs":
        text = LOG_TS_RE.sub("", text)
        # collapse runs of identical consecutive lines (retry spam, polling loops)
        deduped, prev = [], None
        for line in text.splitlines():
            if line != prev:
                deduped.append(line)
            prev = line
        text = "\n".join(deduped)
    text = re.sub(r"[ \t]+$", "", text, flags=re.M)   # trailing whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)            # collapse blank-line runs
    return text.strip()


def extract_terms(text: str) -> list[str]:
    """Return glossary terms present in the text (stored on the chunk payload)."""
    return [t for t, pat in _term_patterns.items() if pat.search(text)]
