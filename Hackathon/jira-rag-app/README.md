# Jira Ticket RAG Pipeline

A full-stack Retrieval-Augmented Generation (RAG) app that turns a single Jira
ticket into a plain-language summary or a set of Gherkin test cases — with
every pipeline stage visible, and a **RAG Explorer** view for freely
inspecting and editing the pipeline's intermediate artifacts.

**Live demo:** [jira-rag-app.vercel.app](https://jira-rag-app.vercel.app)

## Problem Statement

Understanding a Jira ticket well enough to act on it — write test cases,
explain it to a non-technical stakeholder, or just answer "what does this
actually require?" — means reading through a summary, a long description,
and a scattered comment thread every time. Doing that by hand for every
ticket, every time it's revisited, doesn't scale, and copy-pasting ticket
content into a generic chat tool throws away structure and provides no way
to see what the model was actually shown before it answered.

## Solution

This app fetches one Jira ticket, chunks and embeds its content, and stores
it in a per-ticket vector collection — so a ticket is only ever processed
once and reused after that. From there, two preset actions (**Analyze
Ticket**, **Generate Test Cases**) and a free-text question box all run the
same retrieve-then-generate path, answering strictly from that ticket's own
content and showing the retrieved chunks alongside the answer.

Every stage of the pipeline is visible as it runs — not just the final
answer — and a separate **RAG Explorer** view lets you go further: browse
and hand-edit the stored chunks, inspect exactly what's in the vector
database, test retrieval quality on its own (no LLM call), and tune chunk
size / overlap / top-K live.

![RAG workflow overview](rag-workflow-diagram.png)

## Tech Stack

| Layer            | Choice                                                    |
|-------------------|------------------------------------------------------------|
| Frontend          | React (Vite)                                                |
| Backend           | Vercel serverless functions (`/api`)                        |
| Source system     | Jira Cloud REST API (`https://testlearn.atlassian.net`)     |
| Embedding model   | Nomic Embed                                                  |
| Vector store       | Chroma Cloud (hosted)                                        |
| LLM provider      | Groq — `openai/gpt-oss-120b`                                 |
| Hosting           | Vercel, `nam-qa` team                                        |

> **Groq model id note**: the original project spec pinned this to
> `gpt-oss-12b`, which Groq rejected outright (`model_not_found`) — that
> string doesn't correspond to a real model. It's now `openai/gpt-oss-120b`,
> overridable via the `GROQ_MODEL` env var.

### Architecture

```mermaid
flowchart LR
    subgraph Frontend[React Frontend - Vercel]
        UI[Ticket Analysis view]
        EX[RAG Explorer view]
    end

    subgraph API[Vercel Serverless Functions]
        ING[/api/ingest/]
        GEN[/api/generate/]
        QRY[/api/query/]
        CHK[/api/chunks/list, /api/chunks/apply]
    end

    JIRA[(Jira Cloud REST API)]
    NOMIC[(Nomic Embed API)]
    CHROMA[(Chroma Cloud)]
    GROQ[(Groq LLM API)]

    UI -- "Load Ticket / Analyze / Test Cases / Ask" --> ING
    UI --> GEN
    EX -- "Ingest / re-run pipeline" --> ING
    EX -- "Browse & inspect" --> CHK
    EX -- "Edit / split / merge / delete + Apply" --> CHK
    EX -- "Search (retrieval only)" --> QRY
    EX -- "Ask (retrieval + optional generation)" --> GEN

    ING -- "1. fetch ticket" --> JIRA
    ING -- "2. chunk (in-process)" --> ING
    ING -- "3. embed chunks" --> NOMIC
    ING -- "4. store embeddings" --> CHROMA

    QRY -- "embed query" --> NOMIC
    QRY -- "top-K similarity search" --> CHROMA

    GEN -- "embed query" --> NOMIC
    GEN -- "top-K similarity search" --> CHROMA
    GEN -- "generate answer" --> GROQ

    CHK -- "list / upsert / delete chunk records" --> CHROMA
```

Each pipeline stage streams progress to the frontend over Server-Sent Events
(`/api/ingest` and `/api/generate`), which is what powers the live **Pipeline
visibility panel** and in-app **RAG flow diagram** shown in the screenshots
below.

### Project Layout

```
jira-rag-app/
  api/                  Vercel serverless functions (backend)
    ingest.js           Fetch/chunk/embed/store a ticket (SSE progress)
    generate.js         Retrieve + generate an answer (SSE progress)
    query.js            Retrieval-only endpoint (Explorer's Search panel)
    chunks/
      list.js           List stored chunks + embedding metadata for a ticket
      apply.js          Commit staged edit/split/merge/delete operations
  lib/                  Shared backend logic
    jiraClient.js        Jira REST API client + ADF-to-text extraction
    chunker.js           Token-approximate overlapping text chunker
    embeddings.js        Nomic Embed API client
    chroma.js            Chroma Cloud client (one collection per ticket)
    groq.js              Groq client + preset prompts
    sse.js                Server-Sent Events helper
  src/                  React frontend
    App.jsx              Tab shell (Ticket Analysis / RAG Explorer) + theme
    MainView.jsx          Main ticket-analysis flow
    components/           Shared UI: ticket input, pipeline panel, chunks,
                           answer display, flow diagram, theme toggle
    explorer/              RAG Explorer: chunk browser/editor, storage
                           inspector, search/ask panels, param controls
    lib/api.js             Frontend fetch/SSE client for the API routes
```

## How to Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   | Variable            | Description                                              |
   |----------------------|------------------------------------------------------------|
   | `JIRA_BASE_URL`       | Jira Cloud base URL (defaults to `testlearn.atlassian.net`) |
   | `JIRA_EMAIL`          | Jira account email used for API auth                       |
   | `JIRA_API_TOKEN`      | Jira API token ([id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)) |
   | `NOMIC_API_KEY`       | Nomic Atlas API key                                          |
   | `NOMIC_EMBED_MODEL`   | Defaults to `nomic-embed-text-v1.5`                          |
   | `CHROMA_API_KEY`      | Chroma Cloud API key                                          |
   | `CHROMA_TENANT`       | Chroma Cloud tenant id                                        |
   | `CHROMA_DATABASE`     | Chroma Cloud database name                                    |
   | `GROQ_API_KEY`        | Groq API key                                                  |
   | `GROQ_MODEL`          | Defaults to `openai/gpt-oss-120b`                             |

   These must stay server-side only — they're read exclusively inside `/api`
   and `/lib`, never bundled into the frontend.

3. **Run locally**

   The frontend (Vite) and backend (`vercel dev`, which serves `/api`) run as
   two processes; Vite proxies `/api/*` to `vercel dev` (see `vite.config.js`).

   ```bash
   npm i -g vercel   # if not already installed
   vercel dev        # serves /api on :3000
   npm run dev        # serves the frontend on :5173, proxying /api to :3000
   ```

4. **Deploy to Vercel**

   ```bash
   vercel link        # link to the nam-qa team's project
   vercel env pull     # or set the variables above in the Vercel dashboard
   vercel --prod
   ```

   Set all the environment variables above as **server-side** env vars in the
   Vercel project settings (Project → Settings → Environment Variables) — do
   not prefix them with `VITE_`, which would expose them to the client bundle.

## Demo

**Live app:** [https://jira-rag-app.vercel.app](https://jira-rag-app.vercel.app)
— deployed under the `nam-qa` Vercel team, publicly reachable, no local
setup required.

### Ticket Analysis (main flow)

1. Enter a Jira ticket ID and click **Load Ticket**. If the ticket has already
   been ingested (a Chroma Cloud collection already exists for it), the app
   reuses the existing chunks instead of re-fetching/re-embedding.
2. Watch the **Pipeline visibility panel** and **RAG flow diagram** highlight
   each stage as it runs.
3. Click **Analyze Ticket** for a plain-language explanation, or **Generate
   Test Cases** for Gherkin-format test cases — or type a free-text question.
4. The top 4 retrieved chunks are shown alongside the generated answer.

### RAG Explorer

A separate tab that operates on the **same Chroma Cloud collection per
ticket** as the main flow (no separate working copy):

- **Ingest a ticket** and watch live ingestion status.
- **Chunk Browser**: see every chunk's index, char/token count, and full text.
- **Chunk Editor**: edit, split, merge, or delete chunks. Edits are staged
  locally and only committed to Chroma Cloud (re-embedding just the affected
  chunks) when you click **Apply Changes**.
- **Storage Inspector**: see exactly what's stored per chunk in Chroma Cloud
  — id, metadata, embedding dimensionality/preview.
- **Search**: retrieval-only queries with similarity scores, no LLM call.
- **Ask**: the same query box, with a toggle to also send retrieved chunks to
  Groq — compare retrieval-only vs. retrieval+generation.
- **Pipeline Parameters**: chunk size, chunk overlap, and top-K are editable;
  **Re-run pipeline** re-chunks/re-embeds the current ticket with the new
  values.

## Screenshots

**Ticket Analysis** — load a ticket, watch the pipeline run, get an answer
grounded in the retrieved chunks:

![Ticket Analysis view](screenshot-ticket-analysis.png)

**RAG Explorer** — inspect and hand-edit what's actually stored in Chroma
Cloud:

![RAG Explorer view](screenshot-rag-explorer.png)

## Known Limitations

- Chunking uses a character-based approximation (~4 chars/token) rather than
  a real tokenizer, since this is a demonstration app.
- Ingestion runs as a single request per stage (not per-chunk) to stay well
  under Vercel's serverless function timeout; very large tickets could still
  approach it and would need to be split into per-chunk calls.
- Error handling covers the basics (invalid Jira ID, missing API keys, empty
  retrieval results) but is not hardened for production use.
- The Explorer's staged edits live only in browser memory until "Apply
  Changes" is clicked — refreshing the page discards unapplied edits.
