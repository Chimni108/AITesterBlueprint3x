# Project Prompt: Jira Ticket RAG Pipeline with React UI

## Objective
Build a full-stack RAG (Retrieval-Augmented Generation) application that ingests a
single Jira ticket, indexes its content into a hosted vector database, and lets the
user either get an AI-generated summary of the ticket or generate Gherkin-format
test cases from it. The app should visibly demonstrate every stage of the RAG
pipeline (ingestion → chunking → embedding → storage → retrieval → generation),
let the user **inspect and manually edit** the pipeline's intermediate artifacts
(chunks, stored embeddings, retrieval settings), and include a standalone
**RAG Explorer** view where a user can freely interact with the pipeline —
input, output, search, and query — independent of the two preset buttons.

## Tech Stack
- **Frontend**: React
- **Embedding model**: Nomic Embed
- **Vector store**: **Chroma Cloud** (hosted) — chosen so Vercel's serverless
  functions can reach the vector DB directly without needing a separately
  hosted backend server
- **LLM provider**: Groq API, using model ID **`gpt-oss-12b`** *(as specified —
  note: Groq's publicly documented hosted models are `openai/gpt-oss-120b` and
  `openai/gpt-oss-20b`; there's no listed `gpt-oss-12b`. Double-check this
  exact string against your Groq dashboard/API before wiring it up — it may be
  a typo for `120b`, or a newer/account-specific model ID not reflected here.)*
- **Source system**: Jira Cloud, base URL `https://testlearn.atlassian.net`
- **Frontend hosting**: Deployed to Vercel, under the `nam-qa` team
  (`https://vercel.com/nam-qa`), so other users can access the RAG Explorer
  without running anything locally.

## Core User Flow
1. User enters a **Jira ticket ID** (Epic, Bug, Defect, or User Story) into an input field.
2. App fetches the ticket's full content (summary, description, comments, status,
   linked issues) from the Jira REST API using the base URL above.
   **If a Chroma Cloud entry already exists for this ticket ID, reuse it as-is —
   do not re-fetch/re-chunk/re-embed automatically.** (Re-ingestion can be
   revisited later; for now, loading an already-ingested ticket just retrieves
   its existing stored chunks.)
3. If no existing entry is found, ticket content is split into text chunks.
4. Each chunk is embedded using the **Nomic Embed** model.
5. Embeddings are automatically stored in a **Chroma Cloud** collection
   (one collection per session or per ticket — specify which).
6. User can then either:
   - **Ask a free-text question** about the ticket, or
   - Click one of two action buttons (below).
7. For any query (typed question, or the query implied by a button click), the app
   retrieves the **top 4 most relevant chunks** from Chroma Cloud and displays them.
8. The retrieved chunks are passed as context to **Groq (gpt-oss-12b)**, which
   generates the final answer.

## Required UI Elements
- **Jira ID input field** + "Load Ticket" action.
- **Button 1 — "Analyze Ticket"**: sends a preset prompt asking the LLM to explain
  the ticket in plain, easy-to-understand language.
- **Button 2 — "Generate Test Cases"**: sends a preset prompt asking the LLM to
  generate all possible test cases in **Gherkin format** (Given/When/Then) based
  on the ticket content.
- **Free-text query box**: lets the user ask their own questions about the loaded
  ticket.
- **Pipeline visibility panel**: as each stage runs, show it happening —
  e.g. a step indicator or log showing "Fetching Jira ticket → Chunking (N chunks)
  → Embedding → Stored in Chroma Cloud → Retrieving top matches → Generating answer."
- **Retrieved chunks display**: show the top 4 chunks returned for the current
  query, before/alongside the final generated answer.
- **Answer display**: the final LLM-generated response (summary or Gherkin test cases).
- **Theme toggle**: a **light/dark mode switch**, available globally (both on
  the main ticket-analysis view and the RAG Explorer), with the user's choice
  persisted (e.g. in local storage) so it's remembered on return visits.
- **RAG flow diagram (in-app)**: a visual diagram, shown in the frontend, that
  illustrates the entire pipeline end-to-end — Jira ingestion → chunking →
  embedding (Nomic) → storage (Chroma Cloud) → retrieval (top-K) → generation
  (Groq). This should complement (not replace) the existing "Pipeline
  visibility panel" — the diagram is a static/illustrative overview of the
  architecture, while the visibility panel shows live progress through it for
  the current ticket.

### RAG Explorer (new standalone view/tab)
A dedicated screen, separate from the main ticket-analysis flow, where the user
can freely explore and drive the pipeline end-to-end. **The Explorer operates on
the same Chroma Cloud collection per ticket as the main Analyze/Test-Case flow**
(no separate "working copy") — so edits made here do eventually affect the main
flow, but only once explicitly applied (see below).
- **Input panel**: enter or select a Jira ID to ingest, with visible status of
  ingestion (fetched / chunked / embedded / stored). If the ticket is already
  ingested, the panel shows it's loading from the existing Chroma Cloud entry
  rather than re-running ingestion (consistent with the main flow's behavior —
  no automatic re-embedding on reload).
- **Chunk browser**: list every chunk generated for the loaded ticket, showing
  chunk index, character/token count, and full text.
- **Chunk editor**: allow the user to manually **edit chunk text, split a chunk
  into two, merge chunks, or delete a chunk**. Edits are staged locally in the
  UI and are **not** written to Chroma Cloud until the user clicks an explicit
  **"Apply Changes"** action — at which point only the affected chunk(s) are
  re-embedded/re-stored (or removed), not the whole collection. Until applied,
  the main flow continues to see the original, unedited chunks.
- **Embedding/storage inspector**: show what's actually stored in Chroma Cloud per
  chunk — id, metadata, embedding vector (e.g. truncated/dimensionality shown
  rather than the full raw vector), so the user can verify storage worked.
- **Search/query panel**: free-text query box (independent of the two preset
  buttons) that runs retrieval only (no LLM call) and displays the top-K chunks
  with similarity scores — lets the user test retrieval quality in isolation.
- **Ask panel**: same query box, but with a toggle to also send retrieved chunks
  to Groq and show the generated answer — so the user can compare "retrieval
  only" vs. "retrieval + generation" for the same query.
- **Pipeline parameter controls**: chunk size, chunk overlap, and top-K
  (currently 4) are **user-configurable in the UI** (not fixed in code) —
  expose them as editable fields in this view, with a "re-run pipeline" action
  that re-chunks/re-embeds the current ticket using the new settings.

## Functional Requirements (backend)
1. **Jira integration**: authenticate to Jira Cloud (API token + email), fetch
   ticket by ID via REST API (`GET /rest/api/3/issue/{issueIdOrKey}`), and extract
   summary, description, comments, and issue type.
2. **Chunking**: split extracted ticket text into chunks (define a sensible chunk
   size/overlap, e.g. ~500 tokens with 50-token overlap).
3. **Embedding**: generate embeddings for each chunk via Nomic Embed.
4. **Storage**: auto-store embeddings + chunk text + metadata (ticket ID, chunk
   index, issue type) in a Chroma Cloud collection.
5. **Retrieval**: given a query (typed or button-triggered), embed the query and
   retrieve the top 4 most similar chunks from Chroma Cloud.
6. **Generation**: send the retrieved chunks + query to Groq's gpt-oss-12b model
   and return the generated answer to the frontend.
7. **Preset prompts**:
   - Analyze button → prompt instructs the LLM to explain the ticket's purpose,
     scope, and acceptance criteria in plain language for a non-technical reader.
   - Test case button → prompt instructs the LLM to output all reasonable test
     cases strictly in Gherkin syntax (Feature/Scenario/Given/When/Then).
8. **Pipeline inspection endpoints**: expose API routes to list all chunks for a
   given ticket/collection, and to fetch stored Chroma Cloud records (id, metadata,
   embedding dimensionality) for that ticket — used by the RAG Explorer's
   chunk browser and storage inspector.
9. **Manual chunk editing endpoints**: support editing a chunk's text, splitting
   one chunk into two, merging two chunks, or deleting a chunk. Changes are only
   committed to Chroma Cloud when the frontend calls an explicit "apply changes"
   request — each apply operation re-embeds and updates (or removes) only the
   affected Chroma Cloud record(s), not the entire collection.
10. **Retrieval-only endpoint**: given a query, return the top-K matching chunks
    with similarity scores, without calling the LLM — used by the Explorer's
    search/query panel to test retrieval in isolation.
11. **Configurable pipeline parameters**: chunk size, chunk overlap, and top-K
    are exposed as user-editable inputs (not hardcoded), read from request
    parameters, so the Explorer's "re-run pipeline" action can pass new values
    and trigger re-chunking/re-embedding of the current ticket.

## Non-Functional / Demo Requirements
- This is a **demonstration app** — prioritize clarity of the RAG flow over
  production hardening (but still handle basic errors: invalid Jira ID, missing
  API keys, empty retrieval results).
- Vector storage uses **Chroma Cloud** (hosted), so both local development and
  the Vercel-deployed app talk to the same reachable vector DB — no local-only
  ChromaDB instance is used in this build.
- Keep API keys (Jira token, Groq key) in environment variables, never hardcoded
  or exposed to the frontend.

## Deployment (Vercel)
- The **React frontend** (including the RAG Explorer) is deployed to Vercel
  under the `nam-qa` account/team (`https://vercel.com/nam-qa`), so other users
  can access and use the app via a public URL without running anything locally.
- **Vector store decision: Chroma Cloud (hosted)**. Account and API key are
  already available. This means Vercel's serverless functions (or a thin API
  layer within the same Vercel project) can call Chroma Cloud directly over the
  network for storage and retrieval — no separate backend server is required
  just to host the vector DB.
- The remaining backend logic (Jira fetch, chunking, calling Nomic Embed,
  calling Groq) runs as **Vercel serverless/API routes** alongside the frontend,
  each request calling out to Chroma Cloud, the embedding model, and Groq as
  needed. Keeping this simple for now: ingestion for a ticket runs as a single
  request per stage rather than being split into per-chunk calls. Revisit this
  only if a ticket's ingestion is large enough to approach Vercel's serverless
  function timeout.
- Backend API keys (Jira token, Groq key, Chroma Cloud API key) must be set as
  **server-side environment variables in the Vercel project settings** —
  never exposed in client-side code, since the frontend will be publicly
  reachable once deployed.
- If Chroma Cloud enforces CORS or IP allowlisting, confirm the Vercel
  deployment's outbound requests are permitted.

## Deliverables (produced after the app is built)
1. **README.md**: created once the full project is built, covering setup
   instructions (env vars, running locally, deploying to Vercel), an overview
   of the tech stack, how to use the app (main flow + RAG Explorer), and any
   known limitations.
2. **Architecture diagram**: a diagram (e.g. as an image or Mermaid diagram
   embedded in the README) illustrating the entire RAG flow and how the
   frontend app surfaces each stage — ingestion, chunking, embedding, storage,
   retrieval, and generation — matching what's shown in the in-app RAG flow
   diagram described above, so the documented architecture and the in-app
   visual stay consistent.

## Resolved Decisions (for reference)
- **Re-loading an already-ingested Jira ID**: reuses the existing Chroma Cloud
  entry as-is; no automatic re-embedding for now.
- **Chunk size/overlap**: user-configurable in the UI, not fixed in code.
- **Groq model ID**: `gpt-oss-12b` (see caveat in Tech Stack — verify this
  string against your Groq account, as it doesn't match Groq's currently
  documented public model list).
- **RAG Explorer vs. main flow**: share the same Chroma Cloud collection per
  ticket; no separate working copy.
- **Explorer chunk edits**: staged locally and only committed to Chroma Cloud
  (and visible to the main flow) after an explicit "Apply Changes" action.
