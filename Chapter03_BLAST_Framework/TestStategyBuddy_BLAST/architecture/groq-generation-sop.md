# SOP: GROQ Generation (Test Strategy + Test Cases — plain B.L.A.S.T. prompts, NO RICE-POT)

## Goal
Generate (1) a Test Strategy and (2) exactly 20 test cases (10 Login / 10 Dashboard) from a fetched JIRA issue, grounded in the issue and the `Test Strategy for Ecommerce Website.docx` reference content, with zero invented content — **without** using the RICE-POT prompt structure (explicit user requirement for this project, unlike the sibling `TestStrategyBuddy` project).

## Implementation
- `react-app/tools/groq_strategy_client.py` (`generate_test_strategy`) — Tab 1.
- `react-app/tools/groq_testcase_client.py` (`generate_test_cases`) — Tab 2.
- Model: `openai/gpt-oss-120b` via `https://api.groq.com/openai/v1/chat/completions`, OpenAI-compatible, `response_format: {type: "json_object"}`, `temperature: 0.2` for determinism.

## Plain B.L.A.S.T. Prompt Structure (per B.L.A.S.T.md's "Behavioral Rules" discovery question, not RICE-POT)
- A direct task instruction (what to generate, exact count/split).
- Grounding context inlined: the fetched JIRA issue fields + the reference Test Strategy doc text.
- A short numbered "Do" list (cover positive+negative, trace every case) and a single explicit "Do NOT invent..." rule.
- An explicit fallback string for missing information: "Insufficient information to determine."
- An exact JSON output shape, with no Example/Parameters/Tone sections (those are RICE-POT-specific and intentionally omitted here).

## Edge Cases
- 401/403 → "GROQ authentication failed."
- Non-JSON or malformed response → raise `GroqToolError`, surfaced to UI; do not attempt partial recovery.
- Model returns fewer/more than 20 cases → not currently validated/truncated server-side; logged here as a known v1 gap.
- 413 `rate_limit_exceeded` → GROQ free-tier `on_demand` service tier caps `openai/gpt-oss-120b` at 8000 tokens-per-minute (prompt + completion combined). This project's count (20, not 40) and `max_tokens: 3500` were chosen from the start to avoid this, based on the same error encountered and fixed in the sibling `TestStrategyBuddy` project.

## Learnings
- 2026-06-28: Carried forward the sibling project's Self-Annealing fix proactively — built this project with the already-known-safe 20-case / `max_tokens: 3500` configuration instead of starting at 40 and hitting the same rate limit.
