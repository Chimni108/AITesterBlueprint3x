"""Central config, all overridable via .env."""

import os

from dotenv import load_dotenv

load_dotenv()

_HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
_PROJECT_ROOT = os.path.dirname(_HERE)  # Chapter07_BasicRAG_explorer/


def _int(name, default):
    val = os.getenv(name)
    return int(val) if val else default


def _str(name, default):
    # os.getenv(name, default) only falls back when the var is entirely
    # absent - a present-but-blank "NAME=" line in .env (which is exactly
    # what "leave blank to use the default" produces) would otherwise
    # resolve to "" instead of `default`.
    val = os.getenv(name)
    return val if val else default


# --- Source document ---------------------------------------------------------
PDF_PATH = _str("PDF_PATH", os.path.join(_PROJECT_ROOT, "data", "PRDVWO.com.pdf"))

# --- Chunking ------------------------------------------------------------
CHUNK_SIZE = _int("CHUNK_SIZE", 800)
CHUNK_OVERLAP = _int("CHUNK_OVERLAP", 120)

# --- Retrieval -----------------------------------------------------------
TOP_K = _int("TOP_K", 4)

# --- Embeddings (Nomic Embed, run locally via sentence-transformers) --------
EMBED_MODEL_NAME = _str("EMBED_MODEL_NAME", "nomic-ai/nomic-embed-text-v1.5")
EMBED_QUERY_PREFIX = "search_query: "
EMBED_DOCUMENT_PREFIX = "search_document: "

# --- ChromaDB (local, on-disk) -----------------------------------------------
CHROMA_PATH = _str("CHROMA_PATH", os.path.join(_HERE, "chroma_data"))
COLLECTION_NAME = _str("COLLECTION_NAME", "vwo_prd_chunks")

# --- Groq -----------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = _str("GROQ_MODEL", "openai/gpt-oss-120b")

# --- Server ----------------------------------------------------------------
HOST = _str("HOST", "127.0.0.1")
PORT = _int("PORT", 8000)
CORS_ORIGINS = _str("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
