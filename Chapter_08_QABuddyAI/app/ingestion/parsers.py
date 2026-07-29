"""Per-source parsers. Each parser yields document dicts:
{"text": str, "meta": {...}} — one per logical unit (file, page, row, ticket)."""
import json
from pathlib import Path

import pandas as pd
import pdfplumber

CODE_EXTS = {
    ".java", ".py", ".ts", ".js", ".kt", ".cs", ".feature", ".xml", ".yml",
    ".yaml", ".properties", ".gradle", ".json", ".md", ".txt", ".html", ".css",
}
TEXT_EXTS = {".txt", ".md", ".log", ".text"}
SKIP_DIRS = {
    ".git", "node_modules", "target", "build", "dist", "__pycache__",
    ".idea", ".vscode", "venv", ".venv", "allure-results", "test-results",
}


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        if path.is_file() and not any(part in SKIP_DIRS for part in path.parts):
            if path.name.startswith("."):
                continue
            yield path


def parse_code(path: Path):
    if path.suffix.lower() not in CODE_EXTS:
        return
    text = _read_text(path)
    if text.strip():
        yield {"text": text, "meta": {"title": path.name}}


def parse_tabular(path: Path):
    """CSV/XLSX test cases — one row = one document."""
    if path.suffix.lower() == ".csv":
        df = pd.read_csv(path, dtype=str).fillna("")
    elif path.suffix.lower() in (".xlsx", ".xls"):
        df = pd.read_excel(path, dtype=str).fillna("")
    else:
        return
    for idx, row in df.iterrows():
        fields = [f"{col}: {val}" for col, val in row.items() if str(val).strip()]
        if not fields:
            continue
        title = str(row.iloc[0]) if len(row) else f"row {idx + 2}"
        yield {
            "text": "Test Case\n" + "\n".join(fields),
            "meta": {"title": title, "row": int(idx) + 2},  # +2 = header + 1-index
        }


def _adf_to_text(node) -> str:
    """Flatten Atlassian Document Format (JIRA rich text) to plain text."""
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "\n".join(filter(None, (_adf_to_text(n) for n in node)))
    if isinstance(node, dict):
        if node.get("type") == "text":
            return node.get("text", "")
        return _adf_to_text(node.get("content", []))
    return ""


def _issue_to_doc(issue: dict):
    key = issue.get("key", "UNKNOWN")
    f = issue.get("fields", {})
    desc = f.get("description")
    desc_text = desc if isinstance(desc, str) else _adf_to_text(desc or {})
    parts = [
        f"JIRA {key}: {f.get('summary', '')}",
        f"Status: {(f.get('status') or {}).get('name', '')} | "
        f"Priority: {(f.get('priority') or {}).get('name', '')} | "
        f"Type: {(f.get('issuetype') or {}).get('name', '')}",
    ]
    if f.get("labels"):
        parts.append("Labels: " + ", ".join(f["labels"]))
    if desc_text.strip():
        parts.append(f"Description:\n{desc_text.strip()}")
    resolution = (f.get("resolution") or {}).get("name")
    if resolution:
        parts.append(f"Resolution: {resolution}")
    return {"text": "\n".join(parts), "meta": {"title": key, "ticket_key": key}}


def parse_jira(path: Path):
    """JSON dumps: a single issue, a list, or a {"issues": [...]} search result."""
    if path.suffix.lower() != ".json":
        return
    data = json.loads(_read_text(path))
    issues = data.get("issues", [data]) if isinstance(data, dict) else data
    for issue in issues:
        if isinstance(issue, dict) and ("key" in issue or "fields" in issue):
            yield _issue_to_doc(issue)


def parse_docs(path: Path):
    """PDF (per page, for page-level citations) or MD/TXT."""
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    yield {"text": text, "meta": {"title": path.name, "page": i}}
    elif suffix in TEXT_EXTS:
        text = _read_text(path)
        if text.strip():
            yield {"text": text, "meta": {"title": path.name}}


def parse_text(path: Path):
    """Transcripts, Lucid exports, Jenkins logs — any plain-text file."""
    if path.suffix.lower() in TEXT_EXTS | {".out"}:
        text = _read_text(path)
        if text.strip():
            yield {"text": text, "meta": {"title": path.name}}


PARSERS = {
    "code": parse_code,
    "tabular": parse_tabular,
    "jira": parse_jira,
    "docs": parse_docs,
    "transcript": parse_text,
    "text": parse_text,
    "logs": parse_text,
}
