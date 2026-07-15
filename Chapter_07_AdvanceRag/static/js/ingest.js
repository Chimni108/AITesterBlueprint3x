function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function setStage(stage, state, detail) {
  const li = document.querySelector(`#tracker li[data-stage="${stage}"]`);
  if (!li) return;
  li.classList.remove("active", "done", "error");
  if (state) li.classList.add(state);
  if (detail !== undefined) {
    const el = li.querySelector('[data-role="detail"]');
    if (el) el.textContent = detail;
  }
}

function cardBody(stage, html) {
  const card = document.getElementById(`card-${stage}`);
  if (!card) return;
  card.querySelector(".card-body")?.remove();
  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = html;
  card.appendChild(body);
}

function renderReadDone(e) {
  setStage("read", "done", `${e.row_count} rows &middot; ${e.columns.length} columns &middot; ${e.elapsed}s`.replace("&middot;", "·"));
  const cols = e.columns.slice(0, 8);
  const rowsHtml = e.preview.map((row) => `<tr>${cols.map((c) => `<td>${escapeHtml(String(row[c] ?? "").slice(0, 60))}</td>`).join("")}</tr>`).join("");
  cardBody("read", `
    <div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${e.row_count}</div><div class="stat-label">rows</div></div>
      <div class="stat-tile"><div class="stat-value">${e.columns.length}</div><div class="stat-label">columns</div></div>
      <div class="stat-tile"><div class="stat-value">${e.elapsed}s</div><div class="stat-label">read time</div></div>
    </div>
    <div class="table-scroll"><table><thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
    <tbody>${rowsHtml}</tbody></table></div>
  `);
}

function renderBuildDocsDone(e) {
  setStage("build_docs", "done", `${e.doc_count} documents assembled`);
  cardBody("build_docs", `<p class="muted">Concatenated the selected text columns into ${e.doc_count} documents (one per row).</p>`);
}

function renderChunkDone(e) {
  setStage("chunk", "done", `${e.chunk_count} chunks &middot; avg ${e.avg_chars} chars`.replace("&middot;", "·"));
  const maxCount = Math.max(...e.histogram.map((b) => b.count), 1);
  const bars = e.histogram.map((b) => `<span style="height:${Math.max(4, (b.count / maxCount) * 100)}%" title="${b.label} chars: ${b.count}"></span>`).join("");
  const samples = e.sample.map((c) => {
    const overlap = e.overlap;
    let text = escapeHtml(c.text);
    if (c.chunk_index > 0 && overlap > 0) {
      const raw = c.text;
      const head = escapeHtml(raw.slice(0, overlap));
      const rest = escapeHtml(raw.slice(overlap));
      text = `<mark class="token-pill" style="background:var(--coral-soft);">${head}</mark>${rest}`;
    }
    return `<div class="chunk-text" style="margin-bottom:0.5rem;"><span class="badge">row ${escapeHtml(String(c.row_id))} &middot; chunk ${c.chunk_index + 1}/${c.chunk_total}</span><br>${text}</div>`;
  }).join("");
  cardBody("chunk", `
    <div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${e.chunk_count}</div><div class="stat-label">total chunks</div></div>
      <div class="stat-tile"><div class="stat-value">${e.min_chars}</div><div class="stat-label">min chars</div></div>
      <div class="stat-tile"><div class="stat-value">${e.max_chars}</div><div class="stat-label">max chars</div></div>
      <div class="stat-tile"><div class="stat-value">${e.avg_chars}</div><div class="stat-label">avg chars</div></div>
    </div>
    <p class="muted">Chunk-length distribution</p>
    <div class="dense-bars" style="height:60px; margin-bottom:1rem;">${bars}</div>
    <p class="muted">Sample chunks (overlap with the previous chunk highlighted)</p>
    ${samples}
  `);
}

function renderEmbedProgress(e) {
  const pct = e.total ? Math.round((e.done / e.total) * 100) : 0;
  setStage("embed", "active", `${e.done}/${e.total} chunks embedded`);
  const dims = e.dense_preview || [];
  const maxAbs = Math.max(...dims.map((v) => Math.abs(v)), 0.001);
  const bars = dims.map((v) => `<span style="height:${Math.max(4, (Math.abs(v) / maxAbs) * 100)}%" title="${v.toFixed(4)}"></span>`).join("");
  const tokens = (e.sparse_preview || []).map((t) => `<span class="token-pill">${escapeHtml(t[0])} &middot; ${t[1].toFixed(2)}</span>`.replace("&middot;", "·")).join("");
  cardBody("embed", `
    <div class="progress-bar"><div style="width:${pct}%"></div></div>
    <p class="muted">${e.done} / ${e.total} chunks (${pct}%)</p>
    <p class="muted">Dense vector preview (first 8 dims, latest chunk)</p>
    <div class="dense-bars">${bars}</div>
    <p class="muted" style="margin-top:0.75rem;">Sparse top-5 tokens by weight</p>
    <div class="token-pills">${tokens}</div>
  `);
}

function renderIndexDone(e) {
  setStage("index", "done", `${e.points_indexed} points indexed &middot; ${e.elapsed_total}s total`.replace("&middot;", "·"));
  const info = e.collection_info || {};
  const dashboard = info.dashboard_url
    ? `<a href="${escapeHtml(info.dashboard_url)}" target="_blank" rel="noopener">Open Qdrant dashboard &rarr;</a>`
    : `<span class="muted">Running embedded (no web dashboard) - set QDRANT_URL to point at a real server for one.</span>`;
  cardBody("index", `
    <div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${e.points_indexed}</div><div class="stat-label">points indexed</div></div>
      <div class="stat-tile"><div class="stat-value">${info.points_count ?? "?"}</div><div class="stat-label">collection size</div></div>
      <div class="stat-tile"><div class="stat-value">${e.elapsed_total}s</div><div class="stat-label">total time</div></div>
    </div>
    <p>${dashboard}</p>
    <a class="btn" href="/chunks">Browse chunks &rarr;</a>
    <a class="btn btn-ghost" href="/chat">Go to Chat &rarr;</a>
  `);
}

function showError(message) {
  const el = document.getElementById("card-error");
  el.style.display = "block";
  el.textContent = message;
  document.querySelectorAll("#tracker li").forEach((li) => {
    if (li.classList.contains("active")) li.classList.replace("active", "error");
  });
}

const source = new EventSource("/ingest/stream");
source.onmessage = (msg) => {
  const e = JSON.parse(msg.data);

  if (e.stage === "error") {
    showError(e.message);
    source.close();
    return;
  }

  if (e.status === "start") {
    setStage(e.stage, "active", "Working…");
    return;
  }

  if (e.status === "progress" && e.stage === "embed") {
    renderEmbedProgress(e);
    return;
  }

  if (e.status === "done") {
    if (e.stage === "read") renderReadDone(e);
    else if (e.stage === "build_docs") renderBuildDocsDone(e);
    else if (e.stage === "chunk") renderChunkDone(e);
    else if (e.stage === "embed") setStage("embed", "done", `${e.total}/${e.total} chunks embedded`);
    else if (e.stage === "index") { renderIndexDone(e); source.close(); }
  }
};
source.onerror = () => {
  showError("Connection to the server was lost. Refresh to retry.");
  source.close();
};
