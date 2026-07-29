"""Central configuration: config.yaml + environment overrides."""
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
STATE_FILE = DATA_DIR / ".ingest_state.json"
GLOSSARY_FILE = PROJECT_ROOT / "glossary" / "terminology.yaml"

load_dotenv(PROJECT_ROOT / ".env")

with open(PROJECT_ROOT / "config.yaml", encoding="utf-8") as f:
    CFG = yaml.safe_load(f)

QDRANT_URL = os.getenv("QDRANT_URL", CFG["qdrant"]["url"])
COLLECTION = CFG["qdrant"]["collection"]

DENSE_MODEL = CFG["embedding"]["dense_model"]
SPARSE_MODEL = CFG["embedding"]["sparse_model"]
DENSE_DIM = CFG["embedding"]["dense_dim"]

TOP_K = CFG["retrieval"]["top_k"]
PREFETCH_K = CFG["retrieval"]["prefetch_k"]

LLM_MODEL = os.getenv("ANTHROPIC_MODEL", CFG["llm"]["model"])
LLM_MAX_TOKENS = CFG["llm"]["max_tokens"]

SOURCES = CFG["sources"]


def load_glossary() -> dict:
    with open(GLOSSARY_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}
