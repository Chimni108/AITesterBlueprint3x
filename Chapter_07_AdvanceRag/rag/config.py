"""Central tunables, all overridable via .env. See README for what each knob does."""

import os

from dotenv import load_dotenv

load_dotenv()


def _bool(name, default):
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _int(name, default):
    val = os.getenv(name)
    return int(val) if val else default


# --- Retrieval pipeline tunables (see README "Tunables" table) --------------
CHUNK_SIZE = _int("CHUNK_SIZE", 1000)
CHUNK_OVERLAP = _int("CHUNK_OVERLAP", 150)
TOP_N_HYBRID = _int("TOP_N_HYBRID", 20)
TOP_K_RERANK = _int("TOP_K_RERANK", 4)
RRF_K = _int("RRF_K", 60)
REWRITE_ENABLED = _bool("REWRITE_ENABLED", True)
REWRITE_COUNT = _int("REWRITE_COUNT", 3)

# --- Qdrant ------------------------------------------------------------------
QDRANT_URL = os.getenv("QDRANT_URL")  # if unset, run embedded (on-disk, no server)
QDRANT_PATH = os.getenv("QDRANT_PATH", "./qdrant_data")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "vwo_test_cases")

# --- Models --------------------------------------------------------------
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "BAAI/bge-m3")
EMBED_MAX_LENGTH = _int("EMBED_MAX_LENGTH", 512)
RERANK_MODEL_NAME = os.getenv("RERANK_MODEL_NAME", "BAAI/bge-reranker-v2-m3")
BGE_USE_FP16 = _bool("BGE_USE_FP16", True)
INGEST_BATCH = _int("INGEST_BATCH", 16)

# --- OpenRouter (query rewriting + generation) -------------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
REWRITE_MODEL = os.getenv("REWRITE_MODEL", "deepseek/deepseek-v4-pro")
GENERATION_MODEL = os.getenv("GENERATION_MODEL", "deepseek/deepseek-v4-pro")

# --- Flask ---------------------------------------------------------------
HOST = os.getenv("HOST", "127.0.0.1")
PORT = _int("PORT", 5050)
SECRET_KEY = os.getenv("SECRET_KEY", "advance-rag-explorer-dev-key")
DEFAULT_DATASET_PATH = os.getenv("DEFAULT_DATASET_PATH", "testcase/vwo_test_cases.csv")
DEFAULT_TEXT_COLS = ["title", "steps", "expected", "tags"]
DEFAULT_META_COLS = ["id", "jira_id", "priority", "module"]
