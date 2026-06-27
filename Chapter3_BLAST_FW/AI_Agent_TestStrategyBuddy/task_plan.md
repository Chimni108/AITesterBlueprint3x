# task_plan.md — AI Agent: Test Strategy Buddy

---

## Project Goal
Lightweight React AI Agent that fetches a JIRA ticket and auto-generates
a complete Test Strategy + Test Cases using GROQ, formatted after the
ecommerce test strategy reference document.

---

## Phase Checklist

### Phase 0 — Protocol 0 (Initialization) 🟡 IN PROGRESS
- [x] task_plan.md initialized
- [x] findings.md initialized
- [x] progress.md initialized
- [x] gemini.md initialized
- [ ] Phase 1 discovery questions answered
- [ ] Data schema locked in gemini.md
- [ ] Blueprint approved

### Phase 1 — Blueprint (Vision & Logic)
- [ ] 5 discovery questions answered by user
- [ ] RICE-POT system prompt designed
- [ ] Output schema locked
- [ ] gemini.md approved

### Phase 2 — Link (Connectivity)
- [ ] JIRA handshake verified (reuse existing credentials)
- [ ] GROQ handshake verified (reuse existing credentials)

### Phase 3 — Architect (Build)
- [ ] Architecture SOPs written
- [ ] React app scaffolded (new or extended — TBD after Q1)
- [ ] JIRA fetch service
- [ ] GROQ generation service (new prompt)
- [ ] Test Strategy display component
- [ ] Export (.md download)
- [ ] Post to JIRA as comment

### Phase 4 — Stylize (UI Polish)
- [ ] UI reviewed and refined

### Phase 5 — Trigger (Deployment)
- [ ] Deployed to Vercel
- [ ] gemini.md maintenance log finalized

---

## Architecture Decision — PENDING (awaiting Q1 answer)
Option A: New standalone React app in AI_Agent_TestStrategyBuddy/react-app/
Option B: Add as a new route/tab in the existing TestPlanBuddy app
