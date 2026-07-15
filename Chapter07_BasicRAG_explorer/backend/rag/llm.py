"""Groq call for the final grounded answer (openai/gpt-oss-120b by default)."""

from . import config

_client = None


class LLMError(RuntimeError):
    pass


def get_client():
    global _client
    if _client is None:
        if not config.GROQ_API_KEY:
            raise LLMError("GROQ_API_KEY is not set - add it to backend/.env (see .env.example).")
        from groq import Groq

        _client = Groq(api_key=config.GROQ_API_KEY)
    return _client


_SYSTEM_PROMPT = (
    "You are a helpful assistant answering questions about a Product Requirements "
    "Document (PRD) for VWO, a digital experience optimization platform. Answer ONLY "
    "using the provided context chunks - do not invent details that aren't present. "
    "If the context doesn't contain the answer, say so plainly instead of guessing. "
    "Cite the chunk(s) you used inline, e.g. (Chunk 1, page 2)."
)


def generate_answer(question: str, chunks: list[dict]) -> str:
    client = get_client()
    context = "\n\n".join(
        f"[Chunk {i + 1}, page {c['metadata']['page']}]\n{c['text']}" for i, c in enumerate(chunks)
    )
    completion = client.chat.completions.create(
        model=config.GROQ_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.2,
        max_completion_tokens=700,
    )
    return completion.choices[0].message.content
