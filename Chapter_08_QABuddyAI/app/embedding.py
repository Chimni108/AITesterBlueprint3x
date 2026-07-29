"""Dense + sparse embedding via FastEmbed (fully local, CPU/ONNX)."""
from fastembed import SparseTextEmbedding, TextEmbedding

from app.config import DENSE_MODEL, SPARSE_MODEL


class Embedder:
    def __init__(self):
        self.dense = TextEmbedding(model_name=DENSE_MODEL)
        self.sparse = SparseTextEmbedding(model_name=SPARSE_MODEL)

    def embed_documents(self, texts: list[str]):
        dense = list(self.dense.embed(texts))
        sparse = list(self.sparse.embed(texts))
        return dense, sparse

    def embed_query(self, text: str):
        dense = list(self.dense.query_embed(text))[0]
        sparse = list(self.sparse.query_embed(text))[0]
        return dense, sparse


_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
