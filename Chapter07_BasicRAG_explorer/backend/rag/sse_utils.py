"""Shared helper for the ingestion/query SSE generators."""

import threading


def call_with_heartbeat(fn, stage, heartbeat_every=4):
    """Runs fn() in a background thread, yielding a heartbeat event every
    `heartbeat_every` seconds while it's still running. The first Nomic
    Embed call downloads ~550MB from Hugging Face, which can take several
    minutes on a slow connection - without this, the SSE stream would sit
    completely silent that whole time, long enough for a browser to decide
    the connection is dead. Returns fn()'s result via
    `result = yield from call_with_heartbeat(...)`.
    """
    box = {}

    def target():
        try:
            box["result"] = fn()
        except Exception as exc:  # re-raised on the generator side below
            box["error"] = exc

    thread = threading.Thread(target=target, daemon=True)
    thread.start()

    waited = 0
    while thread.is_alive():
        thread.join(timeout=heartbeat_every)
        if thread.is_alive():
            waited += heartbeat_every
            yield {
                "stage": stage,
                "status": "progress",
                "note": f"waiting on Nomic Embed (first run downloads ~550MB) - {waited}s",
            }

    if "error" in box:
        raise box["error"]
    return box["result"]
