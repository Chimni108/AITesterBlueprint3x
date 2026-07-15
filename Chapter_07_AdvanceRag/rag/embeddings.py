"""bge-m3 hybrid embeddings: one model produces both a dense vector and a
sparse (lexical) vector per text. The model is loaded lazily on first use so
importing this module (or the Flask app) never requires torch/FlagEmbedding
to be installed until an embed actually happens."""

from . import config

_model = None


def get_embedder():
    global _model
    if _model is None:
        from FlagEmbedding import BGEM3FlagModel

        _model = BGEM3FlagModel(config.EMBED_MODEL_NAME, use_fp16=config.BGE_USE_FP16)
    return _model


def embed_texts(texts: list[str]) -> list[dict]:
    """Returns one {"dense": [float,...], "sparse": {token_id: weight}} dict per text."""
    if not texts:
        return []

    model = get_embedder()
    output = model.encode(
        texts,
        batch_size=config.INGEST_BATCH,
        max_length=config.EMBED_MAX_LENGTH,
        return_dense=True,
        return_sparse=True,
        return_colbert_vecs=False,
    )

    dense_vecs = output["dense_vecs"]
    lexical_weights = output["lexical_weights"]

    results = []
    for dense, sparse in zip(dense_vecs, lexical_weights):
        dense_list = dense.tolist() if hasattr(dense, "tolist") else list(dense)
        sparse_dict = {int(token_id): float(weight) for token_id, weight in sparse.items()}
        results.append({"dense": dense_list, "sparse": sparse_dict})
    return results


def embed_query(text: str) -> dict:
    return embed_texts([text])[0]


def decode_sparse_tokens(sparse: dict, top_n: int = 5) -> list[tuple[str, float]]:
    """Best-effort decode of the top sparse token ids back into human-readable
    subword tokens, for the ingest/chat UI's sparse-vector preview."""
    model = get_embedder()
    top_items = sorted(sparse.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
    decoded = []
    for token_id, weight in top_items:
        try:
            token = model.tokenizer.convert_ids_to_tokens([int(token_id)])[0]
        except Exception:
            token = str(token_id)
        decoded.append((token, weight))
    return decoded
