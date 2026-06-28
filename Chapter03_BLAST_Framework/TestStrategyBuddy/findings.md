# Findings

## 2026-06-28
- Extracted text from `Test Strategy for Ecommerce Website.docx` (binary, parsed via document.xml) for use as grounding reference in test strategy/case generation:

```
Objective: test end-to-end functionality, usability, performance of the ecommerce website; meet business/technical requirements.

Scope
In scope: customer workflows (search, browse, cart, checkout, payments), account registration/management, order management/tracking, payment gateway integration, admin module, web and mobile site.
Out of scope: physical fulfillment of orders, unrelated 3rd-party integrations.

Focus Areas: functional correctness, UI/navigation, performance (load/stress/scalability), security (vulnerabilities, encryption), compatibility (browsers/devices/OS), usability (ease of use, accessibility).

Approach: black box + white box testing, automated tests (Selenium/Appium), exploratory testing, load testing with JMeter (1000+ concurrent users), OWASP Top 10 security testing, cross-browser testing (IE/Chrome/Firefox), usability evaluation (10+ end users).

Deliverables: functional test cases/reports, performance scripts/results, security report, UAT report, coverage/defect reports, automation regression suite.

Team & Schedule: 5-person team, 4 months (April: functional/security, May: load/performance, June: compatibility/UAT, July: regression).

Entry/Exit Criteria: stories must meet "Ready for Testing"; testing completes when all cases execute with no critical defects outstanding.

Risks: test environment delays, lack of access to 3rd-party payment systems, complex workflows needing more time/resources.
```

- Reusing prior project's research: GROQ `openai/gpt-oss-120b`, JIRA Cloud REST API v3 (ADF parsing, Basic Auth). New for this project: JIRA issue **creation** (write-back) — `POST /rest/api/3/issue` — needs project key, issue type, and ADF-formatted description for each test case.

## RICE-POT Framework (resolved — was initially unfound, surfaced via user pointer to `RICE_POT.md`)
A 7-part **prompt-engineering meta-structure** for building GROQ system prompts (not a test-case-content template):
- **R**ole, **I**nstructions (+ mandatory "Don't" rules), **C**ontext, **E**xample, **P**arameters (determinism/traceability/anti-hallucination), **O**utput (exact format), **T**one.
- Worked example found in `Chapter2/Project1_TC_Gen/RICEPOT_FRAMEWORK/RICE-POT-TestCase-Prompt.md.pdf` (a VWO login test-case prompt) — used as the concrete template for `tools/groq_testcase_client.py`'s prompt, including the anti-hallucination block ("Insufficient information to determine.", "Inference (low confidence)" labeling, no invented IDs/APIs/error codes/UI/behavior).
- Applied to this project's two GROQ calls: `groq_strategy_client.py` (Test Strategy, simpler structured prompt) and `groq_testcase_client.py` (40 test cases, full RICE-POT structure since it's the higher-stakes, more detailed generation).

## Build outcome (2026-06-28)
- v1 built and deployed to Vercel as `nam-qa/teststrategy-testcase-generator` — https://teststrategy-testcase-generator.vercel.app.
- JIRA write-back implemented as `tools/jira_writer.py::create_test_case_subtask` — creates one Sub-task per test case, parented to the source issue; failures per test case are collected separately rather than aborting the whole batch.
