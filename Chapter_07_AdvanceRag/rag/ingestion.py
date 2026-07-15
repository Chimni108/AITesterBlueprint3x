"""Stage 1 (Ingest) pipeline: CSV/XLSX -> rows -> assemble docs -> chunk ->
bge-m3 (dense + sparse) -> Qdrant.

`run_ingestion` is a generator so app.py can stream each stage as it happens
over SSE - the generator *is* the progress bar, there is no separate
threading/queue layer to keep this teaching demo simple.
"""

import time
import uuid

import pandas as pd

from . import chunking, config, embeddings, vectorstore


def read_table(path: str) -> pd.DataFrame:
    if path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
    return df.where(pd.notnull(df), None)


def _point_id(row_id, chunk_index: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"vwo-test-cases:{row_id}:{chunk_index}"))


def _length_histogram(lengths: list[int], buckets: int = 10) -> list[dict]:
    lo, hi = min(lengths), max(lengths)
    if lo == hi:
        return [{"label": f"{lo}", "count": len(lengths)}]

    width = (hi - lo) / buckets
    counts = [0] * buckets
    for length in lengths:
        idx = min(buckets - 1, int((length - lo) / width))
        counts[idx] += 1

    return [
        {"label": f"{round(lo + i * width)}-{round(lo + (i + 1) * width)}", "count": counts[i]}
        for i in range(buckets)
    ]


def run_ingestion(path: str, text_cols: list[str], meta_cols: list[str]):
    t0 = time.time()

    yield {"stage": "read", "status": "start"}
    df = read_table(path)
    rows = df.to_dict(orient="records")
    yield {
        "stage": "read",
        "status": "done",
        "row_count": len(rows),
        "columns": list(df.columns),
        "preview": rows[:5],
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "elapsed": round(time.time() - t0, 2),
    }

    yield {"stage": "build_docs", "status": "start"}
    id_col = meta_cols[0] if meta_cols else None
    row_ids = [row.get(id_col, i) if id_col else i for i, row in enumerate(rows)]
    yield {"stage": "build_docs", "status": "done", "doc_count": len(rows)}

    yield {"stage": "chunk", "status": "start"}
    all_chunks = []
    for row, row_id in zip(rows, row_ids):
        all_chunks.extend(
            chunking.build_chunks_for_row(row, row_id, text_cols, meta_cols, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
        )
    lengths = [len(c["text"]) for c in all_chunks] or [0]
    yield {
        "stage": "chunk",
        "status": "done",
        "chunk_count": len(all_chunks),
        "avg_chars": round(sum(lengths) / len(lengths), 1),
        "min_chars": min(lengths),
        "max_chars": max(lengths),
        "overlap": config.CHUNK_OVERLAP,
        "sample": all_chunks[:5],
        "histogram": _length_histogram(lengths),
    }

    yield {"stage": "embed", "status": "start", "total": len(all_chunks)}
    client = vectorstore.get_client()
    dense_dim = None
    points = []
    batch_size = config.INGEST_BATCH
    for start in range(0, len(all_chunks), batch_size):
        batch = all_chunks[start : start + batch_size]
        embedded = embeddings.embed_texts([c["text"] for c in batch])

        if dense_dim is None and embedded:
            dense_dim = len(embedded[0]["dense"])
            vectorstore.ensure_collection(client, config.COLLECTION_NAME, dense_dim)

        for chunk_payload, vec in zip(batch, embedded):
            point_id = _point_id(chunk_payload["row_id"], chunk_payload["chunk_index"])
            points.append({"id": point_id, "dense": vec["dense"], "sparse": vec["sparse"], "payload": chunk_payload})

        done = min(start + batch_size, len(all_chunks))
        first_vec = embedded[0] if embedded else None
        yield {
            "stage": "embed",
            "status": "progress",
            "done": done,
            "total": len(all_chunks),
            "dense_preview": first_vec["dense"][:8] if first_vec else [],
            "sparse_preview": embeddings.decode_sparse_tokens(first_vec["sparse"]) if first_vec else [],
        }
    yield {"stage": "embed", "status": "done", "total": len(all_chunks)}

    yield {"stage": "index", "status": "start", "total": len(points)}
    vectorstore.upsert_points(client, config.COLLECTION_NAME, points)
    yield {
        "stage": "index",
        "status": "done",
        "points_indexed": len(points),
        "collection_info": vectorstore.collection_info(client, config.COLLECTION_NAME),
        "elapsed_total": round(time.time() - t0, 2),
    }
