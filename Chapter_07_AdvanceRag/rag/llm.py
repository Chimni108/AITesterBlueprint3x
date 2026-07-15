"""Openrouter calls: query rewriting before retrieval, and grounded generation
after rerank. Uses OpenRouter's OpenAI-compatible /chat/completions endpoint
directly over HTTP, so no extra SDK dependency is needed beyond `requests`."""

import json

import requests

from . import config


class LLMError(RuntimeError):
    pass


def _chat(messages: list[dict], model: str, temperature: float = 0.3, max_tokens: int = 800) -> str:
    if not config.OPENROUTER_API_KEY:
        raise LLMError("OPENROUTER_API_KEY is not set - add it to .env (see .env.example).")

    response = requests.post(
        f"{config.OPENROUTER_BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        timeout=60,
    )
    if response.status_code == 401:
        raise LLMError("Openrouter 401 - check OPENROUTER_API_KEY in .env.")
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def rewrite_query(question: str, n: int = None) -> list[str]:
    """Returns up to n alternate phrasings of `question`. Falls back to just
    [question] if rewriting is disabled or the LLM call/parse fails, so a
    flaky rewrite never blocks retrieval."""
    n = n or config.REWRITE_COUNT
    prompt = (
        f"Rewrite the following search query into {n} alternate phrasings that keep its "
        f"meaning but vary the wording and vocabulary, to widen recall in a hybrid search "
        f"system. Return ONLY a JSON array of {n} strings - no markdown, no commentary.\n\n"
        f"Query: {question}"
    )
    try:
        content = _chat([{"role": "user", "content": prompt}], model=config.REWRITE_MODEL, temperature=0.7, max_tokens=300)
        content = content.strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.lower().startswith("json"):
                content = content[4:]
        rewrites = json.loads(content.strip())
        if isinstance(rewrites, list) and rewrites:
            return [str(r) for r in rewrites][:n]
    except Exception:
        pass
    return [question]


_ANSWER_SYSTEM_PROMPT = (
    "You are a QA knowledge assistant answering questions about a corpus of VWO test "
    "cases. Answer ONLY using the provided context chunks - do not invent test cases or "
    "details that are not present in the context. Cite the chunks you rely on inline as "
    "[Chunk N]. If the context does not contain the answer, say so plainly instead of "
    "guessing."
)


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    context = "\n\n".join(f"[Chunk {i + 1}]\n{c['text']}" for i, c in enumerate(context_chunks))
    messages = [
        {"role": "system", "content": _ANSWER_SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
    ]
    return _chat(messages, model=config.GENERATION_MODEL, temperature=0.2, max_tokens=800)


_GENERATE_SYSTEM_PROMPT = (
    "You are a senior QA engineer drafting a new test case for VWO. Use the retrieved "
    "example test cases as structural templates (level of detail, tone, step style) but "
    "write original content specific to the new request - never copy an example verbatim. "
    "Return a single test case using exactly these section headers: Title, Preconditions, "
    "Steps, Expected Result, Priority, Tags."
)


def generate_test_case(question: str, context_chunks: list[dict]) -> str:
    context = "\n\n".join(f"[Example {i + 1}]\n{c['text']}" for i, c in enumerate(context_chunks))
    messages = [
        {"role": "system", "content": _GENERATE_SYSTEM_PROMPT},
        {"role": "user", "content": f"Similar existing test cases:\n{context}\n\nRequest: {question}"},
    ]
    return _chat(messages, model=config.GENERATION_MODEL, temperature=0.4, max_tokens=800)
