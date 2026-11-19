// Boot, routing and wiring for the Leonida Platinum Atlas.
import {
  loadState, saveState, blankState, exportPayload, parseImport,
  toggleEarned, countOf, setCount, isEarned,
} from "./store.js";
import { applyFilters, nextUp } from "./filters.js";
import {
  renderStats, renderList, renderDetail, renderRoadmap,
  renderMissables, renderNext, renderSaveStats,
} from "./views.js";

const els = {
  earnedCount: document.getElementById("earnedCount"),
  earnedBar: document.getElementById("earnedBar"),
  earnedPct: document.getElementById("earnedPct"),
  gradeLine: document.getElementById("gradeLine"),
  missableBadge: document.getElementById("missableBadge"),
  searchInput: document.getElementById("searchInput"),
  kindChips: document.getElementById("kindChips"),
  gradePick: document.getElementById("gradePick"),
  statusPick: document.getElementById("statusPick"),
  spoilerToggle: document.getElementById("spoilerToggle"),
  spoilerToggle2: document.getElementById("spoilerToggle2"),
  listSummary: document.getElementById("listSummary"),
  trophyList: document.getElementById("trophyList"),
  detailPane: document.getElementById("detailPane"),
  roadmapStages: document.getElementById("roadmapStages"),
  missableList: document.getElementById("missableList"),
  nextList: document.getElementById("nextList"),
  saveStats: document.getElementById("saveStats"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  importMsg: document.getElementById("importMsg"),
  resetBtn: document.getElementById("resetBtn"),
};

const state = loadState();
let trophies = [];
let selectedId = null;
const revealed = new Set();
const filters = { kind: "all", grade: "all", status: "all", query: "" };

function byId(id) {
  return trophies.find((t) => t.id === id) || null;
}

function persist() {
  saveState(state);
}

function refreshAll() {
  renderStats(state, trophies, els);
  const shown = applyFilters(trophies, state, filters);
  renderList(els.trophyList, shown, state, selectedId);
  const earnedShown = shown.filter((t) => isEarned(state, t.id)).length;
  els.listSummary.textContent =
    "Showing " + shown.length + " of " + trophies.length + " trophies · " + earnedShown + " earned in this view" +
    (state.spoiler ? " · spoiler-free mode on" : "");
  const current = selectedId ? byId(selectedId) : null;
  if (current && revealed.has(current.id)) {
    renderDetail(els.detailPane, current, { ...state, spoiler: false }, handlers);
  } else {
    renderDetail(els.detailPane, current, state, handlers);
  }
  renderRoadmap(els.roadmapStages, trophies, state);
  renderMissables(els.missableList, trophies, state);
  renderNext(els.nextList, nextUp(trophies, state, 8), state);
  renderSaveStats(els.saveStats, state, trophies);
  els.spoilerToggle.checked = state.spoiler === true;
  els.spoilerToggle2.checked = state.spoiler === true;
}

const handlers = {
  toggle(id) {
    toggleEarned(state, id);
    persist();
    refreshAll();
  },
  bump(id, delta) {
    const t = byId(id);
    if (!t || !t.target) return;
    setCount(state, id, countOf(state, id) + delta, t.target);
    persist();
    refreshAll();
  },
  setCount(id, value) {
    const t = byId(id);
    if (!t || !t.target) return;
    setCount(state, id, value, t.target);
    persist();
    refreshAll();
  },
  note(id, text) {
    const key = String(id);
    if (text.trim() === "") {
      delete state.notes[key];
    } else {
      state.notes[key] = text.slice(0, 2000);
    }
    persist();
  },
  reveal(id) {
    revealed.add(id);
    refreshAll();
  },
  step(id, delta) {
    const shown = applyFilters(trophies, state, filters);
    const idx = shown.findIndex((t) => t.id === id);
    if (idx === -1 || shown.length === 0) return;
    const next = shown[Math.min(shown.length - 1, Math.max(0, idx + delta))];
    if (next) select(next.id, false);
  },
};

function select(id, focusRow) {
  selectedId = id;
  refreshAll();
  if (focusRow) {
    const row = els.trophyList.querySelector('[data-id="' + id + '"]');
    if (row) row.focus();
  }
}

function route() {
  const hash = location.hash.replace(/^#\//, "") || "checklist";
  const known = ["checklist", "roadmap", "missables", "next", "save"];
  const current = known.includes(hash) ? hash : "checklist";
  for (const name of known) {
    document.getElementById("view-" + name).hidden = name !== current;
  }
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.route === current);
  });
}

function wire() {
  els.searchInput.addEventListener("input", () => {
    filters.query = els.searchInput.value;
    refreshAll();
  });
  els.kindChips.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-kind]");
    if (!btn) return;
    filters.kind = btn.dataset.kind;
    els.kindChips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-on", c === btn));
    refreshAll();
  });
  els.gradePick.addEventListener("change", () => {
    filters.grade = els.gradePick.value;
    refreshAll();
  });
  els.statusPick.addEventListener("change", () => {
    filters.status = els.statusPick.value;
    refreshAll();
  });
  const onSpoiler = (event) => {
    state.spoiler = event.target.checked === true;
    persist();
    refreshAll();
  };
  els.spoilerToggle.addEventListener("change", onSpoiler);
  els.spoilerToggle2.addEventListener("change", onSpoiler);

  els.trophyList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-id]");
    if (!row) return;
    select(Number(row.dataset.id), false);
  });
  els.trophyList.addEventListener("dblclick", (event) => {
    const row = event.target.closest("[data-id]");
    if (!row) return;
    handlers.toggle(Number(row.dataset.id));
  });

  els.exportBtn.addEventListener("click", () => {
    const payload = exportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leonida-platinum-atlas-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    els.importMsg.textContent = "Exported. Keep the file somewhere safe.";
  });

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files && els.importInput.files[0];
    els.importInput.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImport(text);
      const count = Object.keys(imported.earned).length;
      if (!window.confirm("Import progress with " + count + " earned trophies? This replaces your current progress.")) {
        els.importMsg.textContent = "Import cancelled.";
        return;
      }
      state.earned = imported.earned;
      state.counts = imported.counts;
      state.notes = imported.notes;
      state.spoiler = imported.spoiler;
      persist();
      refreshAll();
      els.importMsg.textContent = "Imported " + count + " earned trophies.";
    } catch (err) {
      els.importMsg.textContent = "That file is not a valid progress export.";
    }
  });

  els.resetBtn.addEventListener("click", () => {
    if (!window.confirm("Reset all progress, counters and notes?")) return;
    const fresh = blankState();
    state.earned = fresh.earned;
    state.counts = fresh.counts;
    state.notes = fresh.notes;
    state.spoiler = fresh.spoiler;
    selectedId = null;
    persist();
    refreshAll();
    els.importMsg.textContent = "Progress reset.";
  });

  document.addEventListener("keydown", (event) => {
    const tag = (event.target && event.target.tagName) || "";
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (event.key === "/" && !typing) {
      event.preventDefault();
      els.searchInput.focus();
      return;
    }
    if (typing) return;
    const shown = applyFilters(trophies, state, filters);
    if (shown.length === 0) return;
    const idx = shown.findIndex((t) => t.id === selectedId);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      select(shown[Math.min(shown.length - 1, idx + 1)].id, true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      select(shown[Math.max(0, idx - 1)].id, true);
    } else if (event.key === " " && selectedId) {
      event.preventDefault();
      handlers.toggle(selectedId);
    } else if (event.key === "Enter" && selectedId) {
      event.preventDefault();
      refreshAll();
    }
  });

  window.addEventListener("hashchange", route);
}

async function boot() {
  try {
    const res = await fetch("data/trophies.json");
    if (!res.ok) throw new Error("data load failed");
    const data = await res.json();
    trophies = Array.isArray(data) ? data : data.trophies;
  } catch (err) {
    els.listSummary.textContent = "Could not load data/trophies.json. Serve the app/ folder over HTTP (for example: node serve.ts) — browsers block data files opened from disk.";
    els.detailPane.innerHTML = '<p class="empty">Trophy data failed to load.</p>';
    return;
  }
  wire();
  route();
  const first = trophies.find((t) => !isEarned(state, t.id)) || trophies[0];
  selectedId = first ? first.id : null;
  refreshAll();
}

boot();
