# RAG Explorer

A single-page chat UI for the **AI3x_Naive_RAG** Langflow flow, so you can ask
it questions without opening the visual canvas each time.

## Run it

```bash
python -m http.server
```

Then open `http://localhost:8000/index.html`. (Opening `index.html` directly
via `file://` also works in most browsers, but some restrict local-network
`fetch()` calls from `file://` pages — serving it is the reliable option.)

## Set your API key (required)

This Langflow instance was verified to require an API key on every
`/api/v1/run/...` call (a security default since Langflow v1.5) — without
one you'll get a 403 with `"requires a valid API key"` the first time you
ask a question.

1. In Langflow, click your profile icon → **Settings** → **Langflow API Keys** → **Add New**.
2. Copy the key.
3. In RAG Explorer, click the ⚙ icon in the header, paste the key, click **Save**.

The key is stored only in your browser's `localStorage` — it is never
written into `index.html`, so it's safe to keep this file in git.

## Point it at a different flow or Langflow instance

Open `index.html` and edit the constants near the top of the `<script>` block:

```js
const LANGFLOW_BASE_URL = "http://localhost:7861";
const FLOW_ID = "ad8a07cd-5f2b-495b-ac8d-2b44d7baca08";
```

Everything else (request shape, response parsing, error handling) is
independent of which flow you point at.

## About `proxy_server.py`

**Not needed for this setup** — this Langflow instance already sends
permissive CORS headers (`Access-Control-Allow-Origin: *`), verified on both
a plain request and the preflight for `POST` + the `x-api-key` header. Direct
browser calls from `index.html` work fine as-is.

Use the proxy only if:
- you point this at a different Langflow instance that *doesn't* send CORS
  headers, or
- you'd rather keep the API key server-side (in an environment variable)
  instead of pasting it into the browser.

```bash
pip install flask flask-cors requests
set LANGFLOW_API_KEY=your-key-here      # Windows
# export LANGFLOW_API_KEY=your-key-here # macOS/Linux
python proxy_server.py
```

Then change `LANGFLOW_BASE_URL` in `index.html` to `http://localhost:5001`.

## What's verified vs. not

Tested directly against the running Langflow instance (v1.10.1) at
`localhost:7861`: reachability, the exact 403/auth error shape, CORS on both
simple and preflight requests, and the proxy's request/response/error
forwarding. **Not tested**: a full successful answer end-to-end, since that
needs a real API key which only you have. The response parser
(`extractAnswer` in `index.html`) tries several known Langflow response
shapes in order; if your first real response doesn't match any of them,
the UI falls back to showing the raw JSON so you can see the actual shape —
send that over and the path list can be extended.
