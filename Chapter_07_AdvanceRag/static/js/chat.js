function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

const thread = document.getElementById("thread");
const form = document.getElementById("chat-form");
const input = document.getElementById("question");
const askBtn = document.getElementById("ask-btn");

function resetTracker() {
  document.querySelectorAll("#tracker li").forEach((li) => {
    li.classList.remove("active", "done", "error");
    const detail = li.querySelector('[data-role="detail"]');
    if (detail) detail.textContent = "Idle";
  });
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

function addBubble(role, html) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  div.innerHTML = html;
  thread.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  return div;
}

function miniList(items) {
  if (!items.length) return `<li class="muted">none</li>`;
  return items
    .map((it) => `<li><span class="txt">#${escapeHtml(String(it.id).slice(0, 8))} ${escapeHtml(it.text)}</span><span class="score">${it.score.toFixed(3)}</span></li>`)
    .join("");
}

function rerankTable(before, after) {
  const afterIds = new Set(after.map((c) => c.id));
  const rows = before
    .map((c) => {
      const survived = afterIds.has(c.id);
      return `<tr style="${survived ? "font-weight:600;" : "opacity:0.55;"}"><td>#${escapeHtml(String(c.id).slice(0, 8))}</td><td>${escapeHtml(c.text)}</td><td>${c.score.toFixed(3)}</td><td>${survived ? "kept" : "dropped"}</td></tr>`;
    })
    .join("");
  return `<div class="table-scroll"><table><thead><tr><th>id</th><th>text</th><th>pre-rerank score</th><th>result</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function citationList(citations) {
  return citations
    .map((c) => {
      const p = c.payload || {};
      return `<li><span class="citation-n">[Chunk ${c.n}]</span>${escapeHtml(p.jira_id || p.row_id || c.id)} - ${escapeHtml((p.text || "").slice(0, 140))}</li>`;
    })
    .join("");
}

function runTurn(question) {
  addBubble("user", escapeHtml(question));
  const turnBox = document.createElement("div");
  turnBox.className = "msg msg-assistant";
  turnBox.innerHTML = `<span class="muted">Thinking&hellip;</span>`;
  thread.appendChild(turnBox);
  turnBox.scrollIntoView({ behavior: "smooth", block: "end" });

  resetTracker();
  askBtn.disabled = true;

  const source = new EventSource(`/chat/stream?q=${encodeURIComponent(question)}`);
  let bodyHtml = "";

  source.onmessage = (msg) => {
    const e = JSON.parse(msg.data);

    if (e.stage === "error") {
      turnBox.className = "msg msg-error";
      turnBox.textContent = e.message;
      askBtn.disabled = false;
      source.close();
      return;
    }

    if (e.stage === "mode" && e.status === "done") {
      bodyHtml += `<span class="badge msg-mode">${e.mode === "generate" ? "Generate mode" : "Answer mode"}</span><br>`;
      turnBox.innerHTML = bodyHtml + `<span class="muted">Thinking&hellip;</span>`;
      return;
    }

    if (e.status === "start") {
      setStage(e.stage, "active", "Working…");
      return;
    }

    if (e.stage === "rewrite" && e.status === "done") {
      setStage("rewrite", "done", `${e.rewrites.length} alternate phrasings`);
      bodyHtml += `<h4 style="margin:0.5rem 0 0.25rem;">Query rewrites</h4><ul class="mini-list">${e.rewrites.map((r) => `<li><span class="txt">${escapeHtml(r)}</span></li>`).join("")}</ul>`;
      turnBox.innerHTML = bodyHtml + `<span class="muted">Thinking&hellip;</span>`;
      return;
    }

    if (e.stage === "embed" && e.status === "done") {
      setStage("embed", "done", `${e.query_count} quer${e.query_count === 1 ? "y" : "ies"} embedded`);
      return;
    }

    if (e.stage === "search" && e.status === "done") {
      setStage("search", "done", `${e.fused_top.length} fused candidates`);
      bodyHtml += `
        <h4 style="margin:0.75rem 0 0.25rem;">Dense vs sparse vs RRF-fused</h4>
        <div class="compare-grid">
          <div><h4>Dense top-${e.dense_top.length}</h4><ul class="mini-list">${miniList(e.dense_top)}</ul></div>
          <div><h4>Sparse top-${e.sparse_top.length}</h4><ul class="mini-list">${miniList(e.sparse_top)}</ul></div>
        </div>
        <h4 style="margin:0.5rem 0 0.25rem;">RRF-fused top-${e.fused_top.length}</h4>
        <ul class="mini-list">${miniList(e.fused_top)}</ul>
      `;
      turnBox.innerHTML = bodyHtml + `<span class="muted">Thinking&hellip;</span>`;
      return;
    }

    if (e.stage === "rerank" && e.status === "done") {
      setStage("rerank", "done", `top ${e.after.length} kept`);
      bodyHtml += `<h4 style="margin:0.75rem 0 0.25rem;">Re-rank before &rarr; after</h4>${rerankTable(e.before, e.after)}`;
      turnBox.innerHTML = bodyHtml + `<span class="muted">Thinking&hellip;</span>`;
      return;
    }

    if (e.stage === "generate") {
      if (e.status === "start") {
        setStage("generate", "active", e.mode === "generate" ? "Drafting test case…" : "Writing answer…");
        return;
      }
      if (e.status === "done") {
        setStage("generate", "done", `${e.elapsed_total}s total`);
        bodyHtml += `<h4 style="margin:0.75rem 0 0.25rem;">Answer</h4><div>${escapeHtml(e.answer).replace(/\n/g, "<br>")}</div>`;
        if (e.citations && e.citations.length) {
          bodyHtml += `<h4 style="margin:0.75rem 0 0.25rem;">Citations</h4><ul class="citation-list">${citationList(e.citations)}</ul>`;
        }
        turnBox.innerHTML = bodyHtml;
        askBtn.disabled = false;
        source.close();
      }
    }
  };

  source.onerror = () => {
    if (askBtn.disabled) {
      turnBox.className = "msg msg-error";
      turnBox.textContent = "Connection to the server was lost mid-turn.";
      askBtn.disabled = false;
    }
    source.close();
  };
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  input.value = "";
  runTurn(question);
});
