"""Reads the source PDF into per-page text."""

from pypdf import PdfReader


def load_pdf_pages(path: str) -> list[dict]:
    """Returns [{"page": 1, "text": "..."}, ...], 1-indexed, skipping blank pages."""
    reader = PdfReader(path)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        # "layout" mode keeps words/sentences on one line instead of breaking
        # after almost every word, which is what this PDF's default extraction does.
        text = (page.extract_text(extraction_mode="layout") or "").strip()
        if text:
            pages.append({"page": i, "text": text})
    return pages
