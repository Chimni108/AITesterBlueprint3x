"""Row -> document -> chunk(s). One row becomes one chunk unless its assembled
text exceeds CHUNK_SIZE, in which case it is split with CHUNK_OVERLAP characters
repeated between adjacent pieces."""

import math


def _is_missing(value) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    return False


def build_document_text(row: dict, text_cols: list[str]) -> str:
    parts = []
    for col in text_cols:
        value = row.get(col)
        if _is_missing(value):
            continue
        value = str(value).strip()
        if value:
            parts.append(f"{col.capitalize()}: {value}")
    return "\n".join(parts)


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    if len(text) <= chunk_size:
        return [text] if text else []

    pieces = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        pieces.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return pieces


def build_chunks_for_row(
    row: dict,
    row_id,
    text_cols: list[str],
    meta_cols: list[str],
    chunk_size: int,
    overlap: int,
) -> list[dict]:
    doc_text = build_document_text(row, text_cols)
    pieces = chunk_text(doc_text, chunk_size, overlap)

    chunks = []
    for idx, piece in enumerate(pieces):
        payload = {mc: row.get(mc) for mc in meta_cols if not _is_missing(row.get(mc))}
        payload.update(
            {
                "text": piece,
                "row_id": row_id,
                "chunk_index": idx,
                "chunk_total": len(pieces),
            }
        )
        chunks.append(payload)
    return chunks
