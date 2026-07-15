"""Qdrant wrapper: collection setup, upsert, dense/sparse/RRF-fused search, and
the scroll/facet helpers the /chunks explorer needs.

Runs embedded (on-disk, no server) by default via QdrantClient(path=...). Set
QDRANT_URL to point at a real Qdrant server instead - every call below works
unchanged either way, since it only uses the client's public API.
"""

from qdrant_client import QdrantClient, models

from . import config

_client = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        if config.QDRANT_URL:
            _client = QdrantClient(url=config.QDRANT_URL)
        else:
            _client = QdrantClient(path=config.QDRANT_PATH)
    return _client


def collection_exists(client: QdrantClient, name: str) -> bool:
    return client.collection_exists(name)


def ensure_collection(client: QdrantClient, name: str, dense_dim: int) -> None:
    if collection_exists(client, name):
        return

    client.create_collection(
        collection_name=name,
        vectors_config={
            "dense": models.VectorParams(size=dense_dim, distance=models.Distance.COSINE),
        },
        sparse_vectors_config={
            "sparse": models.SparseVectorParams(),
        },
    )

    # Payload indexes are a no-op in embedded/local mode (Qdrant logs a warning
    # to that effect) but do speed up + are required for filtering on a real
    # Qdrant server, so we create them unconditionally for that migration path.
    client.create_payload_index(
        name,
        field_name="text",
        field_schema=models.TextIndexParams(
            type=models.TextIndexType.TEXT,
            tokenizer=models.TokenizerType.WORD,
            min_token_len=2,
            lowercase=True,
        ),
    )
    for field in ("priority", "module", "jira_id"):
        client.create_payload_index(name, field_name=field, field_schema=models.PayloadSchemaType.KEYWORD)


def upsert_points(client: QdrantClient, name: str, points: list[dict]) -> None:
    """points: list of {"id": ..., "dense": [float,...], "sparse": {int: float}, "payload": {...}}"""
    if not points:
        return

    structs = []
    for point in points:
        sparse = point["sparse"]
        indices = list(sparse.keys())
        values = [sparse[i] for i in indices]
        structs.append(
            models.PointStruct(
                id=point["id"],
                vector={
                    "dense": point["dense"],
                    "sparse": models.SparseVector(indices=indices, values=values),
                },
                payload=point["payload"],
            )
        )
    client.upsert(collection_name=name, points=structs)


def dense_search(client: QdrantClient, name: str, dense_vector: list[float], limit: int):
    result = client.query_points(
        collection_name=name, query=dense_vector, using="dense", limit=limit, with_payload=True
    )
    return result.points


def sparse_search(client: QdrantClient, name: str, sparse: dict, limit: int):
    indices = list(sparse.keys())
    values = [sparse[i] for i in indices]
    result = client.query_points(
        collection_name=name,
        query=models.SparseVector(indices=indices, values=values),
        using="sparse",
        limit=limit,
        with_payload=True,
    )
    return result.points


def hybrid_rrf_search(
    client: QdrantClient,
    name: str,
    dense_vector: list[float],
    sparse: dict,
    limit: int,
    rrf_k: int,
):
    """Native Qdrant Query API fusion: fetch `limit` candidates from each of the
    dense and sparse searches, then combine with Reciprocal Rank Fusion,
    server-side (works identically in embedded/local mode)."""
    indices = list(sparse.keys())
    values = [sparse[i] for i in indices]
    result = client.query_points(
        collection_name=name,
        prefetch=[
            models.Prefetch(query=dense_vector, using="dense", limit=limit),
            models.Prefetch(query=models.SparseVector(indices=indices, values=values), using="sparse", limit=limit),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=limit,
        with_payload=True,
    )
    # Qdrant's RRF uses a fixed internal smoothing constant; RRF_K is kept as a
    # tunable for the from-scratch explanation in the UI/README even though the
    # native fusion query does not take it as a parameter.
    del rrf_k
    return result.points


def scroll_chunks(
    client: QdrantClient,
    name: str,
    limit: int = 50,
    offset=None,
    search: str | None = None,
    priority: str | None = None,
    module: str | None = None,
    jira_id: str | None = None,
):
    must = []
    if search:
        must.append(models.FieldCondition(key="text", match=models.MatchText(text=search)))
    if priority:
        must.append(models.FieldCondition(key="priority", match=models.MatchValue(value=priority)))
    if module:
        must.append(models.FieldCondition(key="module", match=models.MatchValue(value=module)))
    if jira_id:
        must.append(models.FieldCondition(key="jira_id", match=models.MatchValue(value=jira_id)))
    scroll_filter = models.Filter(must=must) if must else None

    return client.scroll(
        collection_name=name,
        scroll_filter=scroll_filter,
        limit=limit,
        offset=offset,
        with_payload=True,
        with_vectors=True,
    )


def facet_values(client: QdrantClient, name: str, field: str, limit: int = 50):
    if not collection_exists(client, name):
        return []
    result = client.facet(collection_name=name, key=field, limit=limit, exact=True)
    return [{"value": hit.value, "count": hit.count} for hit in result.hits]


def sparse_vector_to_dict(sparse_vector) -> dict:
    """Normalizes a returned SparseVector (or already-plain dict) into a
    {index: value} dict, for the /chunks sparse-preview and re-embedding."""
    if sparse_vector is None:
        return {}
    if isinstance(sparse_vector, dict):
        return {int(k): float(v) for k, v in sparse_vector.items()}
    return {int(i): float(v) for i, v in zip(sparse_vector.indices, sparse_vector.values)}


def get_by_ids(client: QdrantClient, name: str, ids: list):
    if not ids:
        return []
    return client.retrieve(collection_name=name, ids=ids, with_payload=True, with_vectors=True)


def count(client: QdrantClient, name: str) -> int:
    if not collection_exists(client, name):
        return 0
    return client.count(collection_name=name, exact=True).count


def collection_info(client: QdrantClient, name: str) -> dict:
    if not collection_exists(client, name):
        return {"exists": False}
    info = client.get_collection(name)
    return {
        "exists": True,
        "points_count": info.points_count,
        "status": str(info.status),
        "name": name,
        "mode": "server" if config.QDRANT_URL else "embedded",
        "dashboard_url": f"{config.QDRANT_URL.rstrip('/')}/dashboard#/collections/{name}" if config.QDRANT_URL else None,
    }
