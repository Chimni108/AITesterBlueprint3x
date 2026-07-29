# Prompt: Build a "RAG Explorer" UI for my Langflow Flow

## Context
I have a Langflow project called **AI3x_Naive_RAG** running locally at `http://localhost:7861`.

- Flow ID: `ad8a07cd-5f2b-495b-ac8d-2b44d7baca08`
- Folder ID: `109065e9-75af-4202-9ec1-148b4568c24e`
- The flow implements a Naive RAG pipeline: Read File → Split Text → Chroma DB (vector store) → MistralAI Embeddings → Parser → Prompt Template → Groq LLM → Chat Output.

I want a simple, clean web UI — a **"RAG Explorer"** — so I (and others) can type natural-language questions and see the answers this flow generates, without opening the Langflow visual canvas each time.

## Goal
Build a single-page web app that:
1. Lets a user type a question into a text input and submit it (Enter key or a button click).
2. Sends the question to my local Langflow flow via its REST API.
3. Displays the returned answer in a chat-style conversation view (question above, answer below, newest message at the bottom).
4. Keeps a scrollable history of all Q&A pairs for the session.
5. Shows a loading/"thinking" indicator while waiting for a response.
6. Shows a clear, friendly error message if the Langflow server is unreachable, the flow fails to build, or the request times out — including the raw error text from Langflow so I can debug it.

## API integration details
- **Endpoint:** `POST http://localhost:7861/api/v1/run/ad8a07cd-5f2b-495b-ac8d-2b44d7baca08`
- **Request body (JSON):**
  ```json
  {
    "input_value": "<the user's question>",
    "output_type": "chat",
    "input_type": "chat"
  }
  ```
- **Headers:** `Content-Type: application/json`. Add an `x-api-key` header only if I later tell you I have API key auth enabled on my Langflow instance — leave it out/configurable by default.
- The response is nested JSON, and the actual answer text can appear at slightly different paths depending on Langflow version (e.g. `outputs[0].outputs[0].results.message.text`, or `...results.message.data.text`). **Write defensive parsing** that tries several known paths in order and, if none match, falls back to pretty-printing the raw JSON response so I can see the actual shape and fix the path myself.

## Technical requirements
- Build as a **single self-contained `index.html`** file with embedded CSS and JS — no build step, no `npm install`. I should be able to just open it in a browser or serve it with `python -m http.server`.
- Use plain `fetch()` for the API call, with a sensible timeout (e.g. 60s, since LLM calls can be slow) and a visible "Retry" option on failure.
- If direct browser calls to `http://localhost:7861` are likely to hit **CORS** issues, also provide a minimal Python proxy server (Flask or FastAPI) that forwards requests to Langflow, plus clear instructions on when/how to use it instead of calling Langflow directly.
- Make the Flow ID and base URL easy to change (constants at the top of the file), since I may point this at different flows later.
- Clean, modern, minimal UI: chat bubbles, a fixed input bar at the bottom, subtle loading animation. No heavy frontend frameworks — keep dependencies minimal (a CDN font is fine).

## Deliverables
1. `index.html` — the full RAG Explorer UI.
2. `proxy_server.py` (only if needed for CORS) — with run instructions (`pip install flask flask-cors` then `python proxy_server.py`).
3. A short usage note: how to run it, and how to repoint it at a different Langflow flow ID/URL later.

---
*Tip: if you're pasting this to me (Claude) directly in chat, just say "build it" and I'll create the files right away instead of just describing them.*