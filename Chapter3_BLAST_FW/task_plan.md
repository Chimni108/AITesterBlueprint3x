# task_plan.md — JIRA Test Plan Generator

## Project: SCRUM-5 → Fetch Test Plan (React + GROQ + JIRA)

---

## Phases & Checklist

### ✅ Protocol 0 — Initialization (COMPLETE)
- [x] Create task_plan.md
- [x] Create findings.md
- [x] Create progress.md
- [x] Initialize gemini.md (Project Constitution)
- [x] Discovery questions answered by user
- [x] Data Schema approved in gemini.md
- [x] Blueprint approved → Phase 2 UNLOCKED

### ✅ Phase 1 — Blueprint (COMPLETE)
- [x] North Star confirmed → display + download (.md) + post to JIRA
- [x] Integrations confirmed → JIRA (testlearn.atlassian.net) + GROQ (gpt-oss-120b)
- [x] Source of Truth → summary, description, AC, issueType, priority, labels
- [x] Delivery Payload → all three: UI display, .md download, JIRA comment
- [x] Behavioral Rules locked → RICE-POT, anti-hallucination, min 20 TCs, temp=0
- [x] JSON Data Schema locked in gemini.md

### 🟡 Phase 2 — Link (IN PROGRESS)
- [ ] JIRA API handshake: GET /rest/api/3/issue/SCRUM-5 → 200 OK
- [ ] GROQ API handshake: POST /chat/completions → 200 OK
- [ ] CORS verification for browser-direct calls documented in findings.md

### ⚪ Phase 3 — Architect (3-Layer Build)
**Layer 1 — Architecture SOPs**
- [ ] architecture/jira-fetch-sop.md
- [ ] architecture/groq-generation-sop.md
- [ ] architecture/export-sop.md
- [ ] architecture/jira-comment-sop.md

**Layer 2 — React App**
- [ ] Vite + React scaffold in react-app/
- [ ] Settings page (JIRA + GROQ config → localStorage)
- [ ] Main page: JIRA ID input + Generate button
- [ ] jiraService.js → fetch + parse ADF to plaintext
- [ ] groqService.js → build RICE-POT prompt + call GROQ
- [ ] TestPlanDisplay.jsx → Markdown renderer
- [ ] exportUtils.js → .md download
- [ ] jiraCommentService.js → POST comment as ADF

**Layer 3 — Tools**
- [x] tools/verify_jira.py (Phase 2)
- [x] tools/verify_groq.py (Phase 2)

### ⚪ Phase 4 — Stylize
- [ ] Clean CSS layout (sidebar settings + main panel)
- [ ] Test plan rendered with proper table formatting
- [ ] Download and Post-to-JIRA buttons styled
- [ ] User feedback collected

### ⚪ Phase 5 — Trigger
- [ ] gemini.md Maintenance Log finalized
- [ ] .env.example committed, .env gitignored

---

## Approved Architecture

```
Chapter3_BLAST_FW/
├── gemini.md                    ← Project Constitution (LAW)
├── .env                         ← Secrets (GITIGNORED)
├── .env.example                 ← Safe template (committed)
├── architecture/                ← Layer 1: SOPs
│   ├── jira-fetch-sop.md
│   ├── groq-generation-sop.md
│   ├── export-sop.md
│   └── jira-comment-sop.md
├── tools/                       ← Phase 2 handshake scripts
│   ├── verify_jira.py
│   └── verify_groq.py
├── .tmp/                        ← Ephemeral intermediates
└── react-app/                   ← Layer 2+3: The App
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── App.css
        ├── components/
        │   ├── Settings.jsx
        │   ├── TestPlanGenerator.jsx
        │   └── TestPlanDisplay.jsx
        └── services/
            ├── jiraService.js
            ├── groqService.js
            ├── exportService.js
            └── jiraCommentService.js
```
