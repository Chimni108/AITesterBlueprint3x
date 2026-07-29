"""Answer generation via the Claude API — streamed, grounded, cited."""
import anthropic

from app.config import LLM_MAX_TOKENS, LLM_MODEL

SYSTEM_PROMPT = """You are QABuddy, the internal QA knowledge assistant for our engineering team.
You answer questions for QA engineers using ONLY the numbered context passages provided
(from our Selenium framework, Playwright framework, test case repository, JIRA tickets,
PRDs/SRS documents, meeting notes, Lucid charts, and Jenkins logs).

Rules:
- Ground every claim in the context. Cite passages inline as [1], [2], etc.
- If the context does not contain the answer, say so plainly and suggest which source
  (repo, test cases, JIRA, docs) would likely contain it. Never invent file paths,
  ticket numbers, or test case IDs.
- For test-design questions (test cases, test plans, gap analysis, RTM), structure the
  answer with clear headings and derive items from the cited requirements.
- For failure/RCA questions, quote the relevant log or ticket evidence before concluding.
- For framework coding help, follow the conventions visible in the cited framework code.
- Be concise and practical — engineers read this in a chat window."""

_client = anthropic.Anthropic()


def _build_user_message(question: str, contexts: list[dict]) -> str:
    blocks = [
        f"[{i + 1}] source: {c['citation']}\n{c['text']}" for i, c in enumerate(contexts)
    ]
    return (
        "Context passages:\n\n" + "\n\n---\n\n".join(blocks)
        + f"\n\nQuestion: {question}"
    )


def stream_answer(question: str, contexts: list[dict]):
    """Yield answer text deltas from Claude (streaming keeps the UI responsive
    and avoids HTTP timeouts on long answers)."""
    with _client.messages.stream(
        model=LLM_MODEL,
        max_tokens=LLM_MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                # engages prompt caching once the stable prefix is large enough
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": _build_user_message(question, contexts)}],
    ) as stream:
        yield from stream.text_stream
