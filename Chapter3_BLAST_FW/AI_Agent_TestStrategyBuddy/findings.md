# findings.md — Research & Discoveries

---

## Reference Document Analysis — TestStrategyforEcommerceWebsite.docx

### Test Strategy Structure (extracted from reference doc)
| Section | Content |
|---------|---------|
| Objective | What is being tested, why, and the goal |
| Scope | In Scope bullet list + Out of Scope bullet list |
| Focus Areas | Functional correctness, UI/navigation, Performance, Security, Compatibility, Usability |
| Approach | Testing techniques, tools, automation, load/perf targets, security coverage |
| Deliverables | Reports, test scripts, automation suite |
| Team & Schedule | Team size + month-by-month schedule |
| Entry & Exit Criteria | Ready criteria and completion criteria |
| Risks | Environment, access, and resource risks |

### Key Observations
- The reference uses 8 sections (matches the 8-section test plan pattern from TestPlanBuddy)
- Focus Areas is unique to Test Strategy (not in Test Plan) — it groups testing types
- Approach includes specific tools and quantitative targets (e.g., 1000 concurrent users, OWASP Top 10)
- Team & Schedule is unique to Test Strategy — ties testing phases to calendar months
- Test Cases are NOT part of the reference document — they are a separate deliverable

### Reusable Architecture from TestPlanBuddy (Chapter 3)
- JIRA fetch: same service pattern (proxy via /api/jira/, ADF parsing, same credentials)
- GROQ call: same endpoint, same temperature:0, new system prompt needed
- Export: same Blob URL download pattern
- JIRA comment: same ADF conversion + X-Atlassian-Token: no-check header
- CORS fix: Vite proxy in dev + vercel.json rewrites in prod

---

## Pending Discoveries (blocked on Phase 1 answers)
- Architecture decision: standalone app vs extension of TestPlanBuddy
- Test case format and minimum count
- Whether Team & Schedule section should be generated or use placeholder
- Delivery targets (display / download / JIRA comment — assumed same as TestPlanBuddy)
