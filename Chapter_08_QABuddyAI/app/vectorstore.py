"""Qdrant collection management, upsert, and hybrid (dense + BM25) search with RRF."""
from qdrant_client import QdrantClient, models

from app.config import COLLECTION, DENSE_DIM, PREFETCH_K, QDRANT_URL, TOP_K


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(url=QDRANT_URL)

    def ensure_collection(self):
        if not self.client.collection_exists(COLLECTION):
            self.client.create_collection(
                collection_name=COLLECTION,
                vectors_config={
                    "dense": models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE)
                },
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(modifier=models.Modifier.IDF)
                },
            )
            for field in ("path", "source", "source_type"):
                self.client.create_payload_index(
                    collection_name=COLLECTION,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )

    def delete_by_path(self, path: str):
        self.client.delete(
            collection_name=COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(key="path", match=models.MatchValue(value=path))]
                )
            ),
        )

    def upsert(self, ids, dense_vecs, sparse_vecs, payloads):
        points = [
            models.PointStruct(
                id=pid,
                vector={
                    "dense": d.tolist(),
                    "sparse": models.SparseVector(
                        indices=s.indices.tolist(), values=s.values.tolist()
                    ),
                },
                payload=p,
            )
            for pid, d, s, p in zip(ids, dense_vecs, sparse_vecs, payloads)
        ]
        self.client.upsert(collection_name=COLLECTION, points=points)

    def hybrid_search(self, dense_q, sparse_q, top_k: int = TOP_K):
        result = self.client.query_points(
            collection_name=COLLECTION,
            prefetch=[
                models.Prefetch(query=dense_q.tolist(), using="dense", limit=PREFETCH_K),
                models.Prefetch(
                    query=models.SparseVector(
                        indices=sparse_q.indices.tolist(), values=sparse_q.values.tolist()
                    ),
                    using="sparse",
                    limit=PREFETCH_K,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )
        return result.points

    def count(self) -> int:
        return self.client.count(collection_name=COLLECTION).count


_store: VectorStore | None = None


def get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
        _store.ensure_collection()
    return _store
