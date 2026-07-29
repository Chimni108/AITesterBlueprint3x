"""Ingestion orchestrator: walk source folders → parse → clean → chunk → embed → index.

Incremental: SHA-256 per file in data/.ingest_state.json. Unchanged files are
skipped; changed files have their old vectors deleted before re-indexing.
"""
import hashlib
import json
import uuid

from app.config import DATA_DIR, SOURCES, STATE_FILE
from app.embedding import get_embedder
from app.ingestion import chunkers, preprocess
from app.ingestion.parsers import PARSERS, iter_files
from app.vectorstore import get_store

EMBED_BATCH = 64


def _load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def _save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=1), encoding="utf-8")


def _sha256(path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def _chunk(text: str, kind: str, cfg: dict) -> list[str]:
    size, overlap = cfg["chunk_tokens"], cfg["overlap"]
    if kind == "code":
        return chunkers.chunk_code(text, size)
    if kind == "tabular":
        return [text]  # one row = one chunk, never split
    if kind == "logs":
        return chunkers.chunk_log(text, size)
    if kind == "docs" and text.lstrip().startswith("#"):
        return chunkers.chunk_markdown(text, size, overlap)
    return chunkers.chunk_sliding(text, size, overlap)


def ingest_source(source_id: str, force: bool = False) -> dict:
    cfg = SOURCES[source_id]
    kind = cfg["kind"]
    stats = {"files": 0, "skipped": 0, "chunks": 0}
    if kind == "skip":
        return stats

    root = DATA_DIR / source_id
    parser = PARSERS[kind]
    state = _load_state()
    embedder = get_embedder()
    store = get_store()

    for path in iter_files(root):
        rel = path.relative_to(DATA_DIR).as_posix()
        digest = _sha256(path)
        if not force and state.get(rel) == digest:
            stats["skipped"] += 1
            continue

        texts, payloads = [], []
        for doc in parser(path) or []:
            text = preprocess.clean(doc["text"], kind)
            if not text:
                continue
            for piece in _chunk(text, kind, cfg):
                payload = {
                    "source": source_id,
                    "source_type": kind,
                    "path": rel,
                    "chunk_index": len(texts),
                    "terms": preprocess.extract_terms(piece),
                    "text": piece,
                    **doc["meta"],
                }
                texts.append(piece)
                payloads.append(payload)

        store.delete_by_path(rel)  # drop stale vectors for changed files
        for i in range(0, len(texts), EMBED_BATCH):
            batch_texts = texts[i : i + EMBED_BATCH]
            batch_payloads = payloads[i : i + EMBED_BATCH]
            dense, sparse = embedder.embed_documents(batch_texts)
            ids = [
                str(uuid.uuid5(uuid.NAMESPACE_URL, f"{rel}#{p['chunk_index']}"))
                for p in batch_payloads
            ]
            store.upsert(ids, dense, sparse, batch_payloads)

        state[rel] = digest
        stats["files"] += 1
        stats["chunks"] += len(texts)
        print(f"  indexed {rel} ({len(texts)} chunks)")

    _save_state(state)
    return stats


def ingest_all(force: bool = False):
    totals = {"files": 0, "skipped": 0, "chunks": 0}
    for source_id in SOURCES:
        print(f"[{source_id}]")
        stats = ingest_source(source_id, force=force)
        for k in totals:
            totals[k] += stats[k]
    print(
        f"\nDone: {totals['files']} files indexed, {totals['skipped']} unchanged, "
        f"{totals['chunks']} chunks."
    )
