/**
 * Minimal SSE helper for Vercel Node.js serverless functions so the frontend
 * can render the pipeline visibility panel live instead of waiting for one
 * big JSON response.
 */
export function startSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  return {
    send(event, data) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    end() {
      res.end();
    },
  };
}

export async function withSseErrorHandling(res, fn) {
  const sse = startSse(res);
  try {
    await fn(sse);
  } catch (err) {
    sse.send('error', { message: err.message || 'Unexpected server error' });
  } finally {
    sse.end();
  }
}
