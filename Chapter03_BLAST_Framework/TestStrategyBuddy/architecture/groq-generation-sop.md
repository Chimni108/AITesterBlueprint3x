# SOP: GROQ Generation (Test Strategy + RICE-POT Test Cases)

## Goal
Generate (1) a Test Strategy and (2) exactly 20 test cases (10 Login / 10 Dashboard) from a fetched JIRA issue, grounded in the issue and the `Test Strategy for Ecommerce Website.docx` reference content, with zero invented content.

## Implementation
- `react-app/tools/groq_strategy_client.py` (`generate_test_strategy`) — Tab 1.
- `react-app/tools/groq_testcase_client.py` (`generate_test_cases`) — Tab 2, prompt built per the **RICE-POT framework** (see `TestStrategyBuddy/RICE_POT.md`).
- Model: `openai/gpt-oss-120b` via `https://api.groq.com/openai/v1/chat/completions`, OpenAI-compatible, `response_format: {type: "json_object"}`, `temperature: 0.2` for determinism.

## RICE-POT Prompt Structure (test case generation)
- **R — Role:** expert QA Functional Tester, 15+ years.
- **I — Instructions:** generate exactly 10 Login + 10 Dashboard cases, cover positive+negative, trace each case to a requirement; mandatory "Don't" rules against inventing features/APIs/error codes/UI/behavior.
- **C — Context:** the fetched JIRA issue fields + the reference Test Strategy doc text (inlined, since GROQ has no file-attachment API in this flow).
- **E — Example:** one illustrative JSON test case row.
- **P — Parameters:** deterministic, traceable, "Insufficient information to determine." fallback, "Inference (low confidence)" labeling, zero invented content.
- **O — Output:** strict JSON matching the Test Case Generation Output schema in `gemini.md`.
- **T — Tone:** technical, precise, JSON only.

## Edge Cases
- 401/403 → "GROQ authentication failed."
- Non-JSON or malformed response → raise `GroqToolError`, surfaced to UI; do not attempt partial recovery (anti-hallucination invariant — a broken response is not patched client-side).
- Model returns fewer/more than 20 cases → not currently validated/truncated server-side; logged here as a known v1 gap (see Maintenance Log in `gemini.md` if this needs hardening later).
- 413 `rate_limit_exceeded` → GROQ free-tier `on_demand` service tier caps `openai/gpt-oss-120b` at 8000 tokens-per-minute (prompt + completion combined). Surfaced to the UI as-is via `GroqToolError`; no automatic retry/backoff in v1.

## Learnings
- 2026-06-28: The original spec (40 cases, `max_tokens: 8000`) exceeded the GROQ free-tier 8000 TPM limit (8965 tokens requested) and failed with a 413. Fixed by reducing to 20 cases (10 Login / 10 Dashboard) and `max_tokens` to 3500 — keeps prompt + completion comfortably under the limit. If a paid/Dev Tier GROQ key is configured later, this cap could be relaxed back toward 40.
