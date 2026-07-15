"""Heuristic Answer-vs-Generate mode detection for the chat endpoint. Simple
regex is plenty for a teaching demo - no need for an LLM classifier call
before every turn."""

import re

_GENERATE_PATTERN = re.compile(
    r"\b(create|generate|write|draft|add|make)\b.{0,40}\b(test ?cases?|scenarios?)\b",
    re.IGNORECASE,
)


def detect_mode(question: str) -> str:
    return "generate" if _GENERATE_PATTERN.search(question) else "answer"
