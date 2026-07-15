"""Paragraph-aware chunking, applied per PDF page so every chunk maps to
exactly one page. Paragraphs are packed together up to CHUNK_SIZE; a single
paragraph longer than that is hard-split with CHUNK_OVERLAP characters
repeated between adjacent pieces."""

import re


def split_into_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def chunk_page_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    paragraphs = split_into_paragraphs(text)
    if not paragraphs:
        return []

    chunks = []
    current = ""
    for para in paragraphs:
        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate) <= chunk_size or not current:
            current = candidate
        else:
            chunks.append(current)
            current = para

        while len(current) > chunk_size:
            chunks.append(current[:chunk_size])
            current = current[max(chunk_size - overlap, 1):]

    if current:
        chunks.append(current)
    return chunks


def chunk_pages(pages: list[dict], chunk_size: int, overlap: int) -> list[dict]:
    """pages: [{"page": 1, "text": "..."}, ...] -> flat list of
    {"text": ..., "page": ..., "chunk_index": ...} (chunk_index is per-page)."""
    chunks = []
    for page in pages:
        for idx, piece in enumerate(chunk_page_text(page["text"], chunk_size, overlap)):
            chunks.append({"text": piece, "page": page["page"], "chunk_index": idx})
    return chunks
