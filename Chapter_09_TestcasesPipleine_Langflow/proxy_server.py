"""Optional CORS/auth proxy for the RAG Explorer UI.

Not required for this Langflow instance - it was verified to send permissive
CORS headers already (Access-Control-Allow-Origin: *, including on the
preflight for POST + x-api-key). Use this instead of calling Langflow
directly only if:
  - a different Langflow setup doesn't send those headers, or
  - you'd rather keep the API key server-side (in an env var here) instead
    of pasting it into the browser via the UI's settings panel.

Usage:
    pip install flask flask-cors requests
    set LANGFLOW_API_KEY=your-key-here   (Windows)  /  export LANGFLOW_API_KEY=... (macOS/Linux)
    python proxy_server.py
    # then set LANGFLOW_BASE_URL in index.html to http://localhost:5001
"""

import os

import requests
from flask import Flask, Response, request
from flask_cors import CORS

LANGFLOW_BASE_URL = os.environ.get("LANGFLOW_BASE_URL", "http://localhost:7861")
LANGFLOW_API_KEY = os.environ.get("LANGFLOW_API_KEY", "")
PROXY_PORT = int(os.environ.get("PROXY_PORT", "5001"))

app = Flask(__name__)
CORS(app)


@app.route("/api/v1/run/<flow_id>", methods=["POST"])
def run_flow(flow_id):
    headers = {"Content-Type": "application/json"}
    # Prefer a server-side key (env var); fall back to whatever the browser sent.
    forwarded_key = LANGFLOW_API_KEY or request.headers.get("x-api-key", "")
    if forwarded_key:
        headers["x-api-key"] = forwarded_key

    try:
        upstream = requests.post(
            f"{LANGFLOW_BASE_URL}/api/v1/run/{flow_id}",
            json=request.get_json(force=True, silent=True) or {},
            headers=headers,
            timeout=65,
        )
    except requests.RequestException as exc:
        return Response(
            f'{{"detail": "Could not reach Langflow at {LANGFLOW_BASE_URL}: {exc}"}}',
            status=502,
            content_type="application/json",
        )

    return Response(
        upstream.content,
        status=upstream.status_code,
        content_type=upstream.headers.get("Content-Type", "application/json"),
    )


if __name__ == "__main__":
    print(f"Proxying requests to {LANGFLOW_BASE_URL}")
    print(f"Listening on http://localhost:{PROXY_PORT}")
    app.run(port=PROXY_PORT, debug=False)
