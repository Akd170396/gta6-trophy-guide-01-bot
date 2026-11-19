// Rendering: checklist rows, the guide pane, roadmap, missables, Next up and stats.
import { isEarned, countOf, earnedTotal, gradeTotals } from "./store.js";
import { KIND_LABELS, STAGES, isMasked, roadmapOrder, stageProgress } from "./filters.js";

export function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function fmtNum(n) {
  return Number(n).toLocaleString("en-US");
}

export function renderStats(state, trophies, els) {
  const total = trophies.length;
  const got = earnedTotal(state, trophies);
  const pct = total === 0 ? 0 : Math.round((got / total) * 100);
  els.earnedCount.textContent = String(got);
  els.earnedBar.style.width = pct + "%";
  els.earnedPct.textContent = pct + "% earned — " + got + " of " + total;
  const { totals, got: byGrade } = gradeTotals(state, trophies);
  els.gradeLine.textContent =
    "Platinum " + byGrade.platinum + "/" + totals.platinum +
    " · Gold " + byGrade.gold + "/" + totals.gold +
    " · Silver " + byGrade.silver + "/" + totals.silver +
    " · Bronze " + byGrade.bronze + "/" + totals.bronze;
  const missLeft = trophies.filter((t) => t.missable && !isEarned(state, t.id)).length;
  els.missableBadge.textContent = String(missLeft);
}

export function trophyRow(trophy, state, selectedId) {
  const earned = isEarned(state, trophy.id);
  const masked = isMasked(trophy, state);
  const count = trophy.target ? countOf(state, trophy.id) : 0;
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "trophy" + (earned ? " is-earned" : "") + (trophy.id === selectedId ? " is-selected" : "") + (masked ? " masked" : "");
  btn.dataset.id = String(trophy.id);
  btn.setAttribute("aria-pressed", earned ? "true" : "false");
  const name = masked ? "Hidden story trophy" : trophy.name;
  const desc = masked ? "Earn it to reveal — spoiler-free mode is on" : trophy.description;
  btn.innerHTML =
    '<span class="tick" aria-hidden="true">✓</span>' +
    '<span class="medal ' + esc(trophy.grade) + '" aria-hidden="true"></span>' +
    '<span class="tmain"><span class="tname">' + esc(name) + '</span><br><span class="tdesc">' + esc(desc) + "</span></span>" +
    '<span class="tmeta">' +
    (trophy.missable ? '<span class="flag">MISSABLE</span>' : "") +
    '<span>' + esc(trophy.grade) + " · " + esc(KIND_LABELS[trophy.kind] || trophy.kind) + "</span>" +
    (trophy.target ? '<span class="count">' + fmtNum(count) + " / " + fmtNum(trophy.target) + "</span>" : "") +
    "</span>";
  li.appendChild(btn);
  return li;
}

export function renderList(listEl, shown, state, selectedId) {
  listEl.replaceChildren();
  if (shown.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No trophies match these filters. Clear the search or pick another kind.";
    listEl.appendChild(li);
    return;
  }
  for (const t of shown) listEl.appendChild(trophyRow(t, state, selectedId));
}

export function sourceItems(trophy) {
  return trophy.sources.map((s) => {
    const m = s.match(/https?:\/\/\S+/);
    if (m) {
      const label = s.replace(m[0], "").replace(/:\s*$/, "").trim();
      let host = m[0];
      try { host = new URL(m[0]).hostname.replace(/^www\./, ""); } catch (err) { /* keep full URL */ }
      return '<li>' + esc(label) + ' — <a href="' + esc(m[0]) + '" rel="noopener">' + esc(host) + "</a></li>";
    }
    return "<li>" + esc(s) + "</li>";
  }).join("");
}

export function renderDetail(pane, trophy, state, handlers) {
  if (!trophy) {
    pane.innerHTML = '<p class="empty">Pick a trophy on the left to read its guide.</p>';
    return;
  }
  const earned = isEarned(state, trophy.id);
  const masked = isMasked(trophy, state);
  if (masked) {
    pane.innerHTML =
      "<h2>Hidden story trophy</h2>" +
      '<p class="odesc">Spoiler-free mode is on: story trophy names and descriptions stay hidden until earned.</p>' +
      '<div class="badges"><span class="pill grade-' + esc(trophy.grade) + '">' + esc(trophy.grade) + '</span>' +
      '<span class="pill">Story</span><span class="pill">Stage ' + trophy.stage + "</span></div>" +
      "<p>Earn it in the story, or turn spoiler-free mode off in Save &amp; settings to reveal it now.</p>" +
      '<button type="button" class="btn ghost" data-act="reveal">Reveal this one anyway</button>';
    pane.querySelector('[data-act="reveal"]').addEventListener("click", () => handlers.reveal(trophy.id));
    return;
  }
  const count = trophy.target ? countOf(state, trophy.id) : 0;
  const note = state.notes[String(trophy.id)] || "";
  pane.innerHTML =
    '<div class="detailnav">' +
    '<button type="button" class="btn ghost navbtn" data-act="prev">← Prev trophy</button>' +
    '<button type="button" class="btn ghost navbtn" data-act="next">Next trophy →</button>' +
    "</div>" +
    "<h2>" + esc(trophy.name) + "</h2>" +
    '<p class="odesc">“' + esc(trophy.description) + '” — official description</p>' +
    '<div class="badges">' +
    '<span class="pill grade-' + esc(trophy.grade) + '">' + esc(trophy.grade) + "</span>" +
    '<span class="pill">' + esc(KIND_LABELS[trophy.kind] || trophy.kind) + "</span>" +
    '<span class="pill">Roadmap stage ' + trophy.stage + "</span>" +
    (trophy.missable ? '<span class="pill miss">Missable — see guide</span>' : "") +
    (earned ? '<span class="pill">Earned ✓</span>' : "") +
    "</div>" +
    "<h3>Guide</h3><p class=\"guide\">" + esc(trophy.guide) + "</p>" +
    "<h3>Sources</h3><ul class=\"sources\">" + sourceItems(trophy) + "</ul>" +
    (trophy.target
      ? "<h3>Progress counter</h3>" +
        '<div class="counter">' +
        '<button type="button" data-act="dec" aria-label="Decrease counter">−</button>' +
        '<span class="cval">' + fmtNum(count) + " / " + fmtNum(trophy.target) + "</span>" +
        '<button type="button" data-act="inc" aria-label="Increase counter">+</button>' +
        '<input type="number" min="0" max="' + trophy.target + '" value="' + count + '" aria-label="Set counter value">' +
        "</div>"
      : "") +
    "<h3>Your notes</h3>" +
    '<textarea class="notes" placeholder="Where you left it, what to try next…">' + esc(note) + "</textarea>" +
    '<button type="button" class="btn earnedbtn" data-act="toggle">' + (earned ? "Mark as not earned" : "Mark as earned") + "</button>";
  pane.querySelector('[data-act="toggle"]').addEventListener("click", () => handlers.toggle(trophy.id));
  pane.querySelector('[data-act="prev"]').addEventListener("click", () => handlers.step(trophy.id, -1));
  pane.querySelector('[data-act="next"]').addEventListener("click", () => handlers.step(trophy.id, 1));
  const notesEl = pane.querySelector(".notes");
  notesEl.addEventListener("change", () => handlers.note(trophy.id, notesEl.value));
  if (trophy.target) {
    pane.querySelector('[data-act="inc"]').addEventListener("click", () => handlers.bump(trophy.id, 1));
    pane.querySelector('[data-act="dec"]').addEventListener("click", () => handlers.bump(trophy.id, -1));
    const numEl = pane.querySelector('input[type="number"]');
    numEl.addEventListener("change", () => handlers.setCount(trophy.id, numEl.value));
  }
}

export function renderRoadmap(container, trophies, state) {
  const ordered = roadmapOrder(trophies);
  container.replaceChildren();
  for (const stage of STAGES) {
    const inStage = ordered.filter((t) => t.stage === stage.n);
    const prog = stageProgress(trophies, state, stage.n);
    const pct = prog.total === 0 ? 100 : Math.round((prog.done / prog.total) * 100);
    const div = document.createElement("div");
    div.className = "stage";
    let html =
      '<div class="stage-head"><h3>' + esc(stage.title) + '</h3>' +
      '<span class="sprog">' + prog.done + " / " + prog.total + " earned (" + pct + "%)</span></div>" +
      '<div class="bar" aria-hidden="true"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<p class="viewnote" style="margin-bottom:10px">' + esc(stage.blurb) + "</p><ul>";
    for (const t of inStage) {
      const done = isEarned(state, t.id);
      const masked = isMasked(t, state);
      html +=
        '<li class="' + (done ? "done" : "") + '">' +
        '<span class="medal ' + esc(t.grade) + '" aria-hidden="true"></span>' +
        '<span class="sname">' + esc(masked ? "Hidden story trophy" : t.name) + "</span>" +
        (t.missable ? '<span class="flag">MISSABLE</span>' : "") +
        '<span class="sdesc">' + esc(masked ? "hidden until earned" : t.description) + "</span></li>";
    }
    html += "</ul>";
    div.innerHTML = html;
    container.appendChild(div);
  }
}

export function renderMissables(container, trophies, state) {
  const flagged = trophies.filter((t) => t.missable);
  container.replaceChildren();
  for (const t of flagged) {
    const done = isEarned(state, t.id);
    const div = document.createElement("div");
    div.className = "misscard";
    div.innerHTML =
      "<h3>" + esc(t.name) + (done ? " ✓ earned" : "") + "</h3>" +
      '<p class="odesc">“' + esc(t.description) + '” — official description · ' + esc(t.grade) + " · roadmap stage " + t.stage + "</p>" +
      "<p>" + esc(t.guide) + "</p>";
    container.appendChild(div);
  }
}

export function renderNext(container, items, state) {
  container.replaceChildren();
  if (items.length === 0) {
    container.innerHTML = '<p class="empty">Everything is earned. Leonida Legend status: achieved.</p>';
    return;
  }
  items.forEach((t, i) => {
    const masked = isMasked(t, state);
    const div = document.createElement("div");
    div.className = "nextcard";
    div.innerHTML =
      '<span class="rank">' + (i + 1) + "</span>" +
      '<span><strong>' + esc(masked ? "Hidden story trophy" : t.name) + "</strong><br>" +
      '<span class="tdesc">' + esc(masked ? "hidden until earned" : t.description) + "</span></span>" +
      '<span class="tmeta">' + (t.missable ? '<span class="flag">MISSABLE</span>' : "") +
      "<span>Stage " + t.stage + " · " + esc(t.grade) + "</span></span>";
    container.appendChild(div);
  });
}

export function renderSaveStats(el, state, trophies) {
  const got = earnedTotal(state, trophies);
  const notes = Object.keys(state.notes).length;
  const counters = Object.keys(state.counts).length;
  el.innerHTML =
    "<p>Earned: <strong>" + got + " / " + trophies.length + "</strong> · Counters in progress: <strong>" +
    counters + "</strong> · Trophies with notes: <strong>" + notes + "</strong></p>";
}
