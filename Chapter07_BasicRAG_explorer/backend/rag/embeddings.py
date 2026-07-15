"""Nomic Embed (nomic-embed-text-v1.5), run locally via sentence-transformers.

The model is lazily loaded on first use so importing this module never
requires torch/sentence-transformers until an embed actually happens. Nomic
Embed is prefix-sensitive: queries and documents must be embedded with
different task-instruction prefixes, or retrieval quality degrades sharply.
"""

from . import config

_model = None


def get_embedder():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(config.EMBED_MODEL_NAME, trust_remote_code=True)
    return _model


def embed_documents(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = get_embedder()
    prefixed = [config.EMBED_DOCUMENT_PREFIX + t for t in texts]
    vectors = model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    model = get_embedder()
    vector = model.encode(config.EMBED_QUERY_PREFIX + text, normalize_embeddings=True, show_progress_bar=False)
    return vector.tolist()
