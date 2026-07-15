"""ChromaDB wrapper: local, on-disk, persistent collection of PDF chunks.
We supply our own Nomic Embed vectors (embedding_function=None) rather than
using Chroma's built-in embedding functions, so ingestion and query always
go through the exact same embedding code path."""

import chromadb

from . import config

_client = None


def get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=config.CHROMA_PATH)
    return _client


def collection_exists(client) -> bool:
    return config.COLLECTION_NAME in [c.name for c in client.list_collections()]


def get_collection(client):
    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        embedding_function=None,
        metadata={"hnsw:space": "cosine"},
    )


def reset_collection(client):
    if collection_exists(client):
        client.delete_collection(config.COLLECTION_NAME)
    return get_collection(client)


def upsert_chunks(collection, chunks: list[dict], embeddings: list[list[float]]) -> None:
    ids = [f"p{c['page']}-c{c['chunk_index']}" for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [{"page": c["page"], "chunk_index": c["chunk_index"]} for c in chunks]
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def query(collection, query_embedding: list[float], top_k: int) -> list[dict]:
    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    hits = []
    for i in range(len(result["ids"][0])):
        distance = result["distances"][0][i]
        hits.append(
            {
                "id": result["ids"][0][i],
                "text": result["documents"][0][i],
                "metadata": result["metadatas"][0][i],
                "distance": distance,
                "similarity": 1 - distance,
            }
        )
    return hits


def get_all_chunks(collection) -> list[dict]:
    result = collection.get(include=["documents", "metadatas"])
    items = [
        {"id": result["ids"][i], "text": result["documents"][i], "metadata": result["metadatas"][i]}
        for i in range(len(result["ids"]))
    ]
    items.sort(key=lambda x: (x["metadata"]["page"], x["metadata"]["chunk_index"]))
    return items


def count(collection) -> int:
    return collection.count()
