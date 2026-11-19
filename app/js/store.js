// Progress store: localStorage persistence, export and import for the trophy tracker.
const STORAGE_KEY = "leonida-platinum-atlas-v1";

export function blankState() {
  return { earned: {}, counts: {}, notes: {}, spoiler: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch (err) {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Storage full or unavailable: the tracker keeps working in memory.
  }
}

export function sanitizeState(value) {
  const clean = blankState();
  if (!value || typeof value !== "object") return clean;
  if (value.earned && typeof value.earned === "object") {
    for (const [id, on] of Object.entries(value.earned)) {
      if (on === true) clean.earned[id] = true;
    }
  }
  if (value.counts && typeof value.counts === "object") {
    for (const [id, n] of Object.entries(value.counts)) {
      const num = Number(n);
      if (Number.isFinite(num) && num > 0) clean.counts[id] = Math.floor(num);
    }
  }
  if (value.notes && typeof value.notes === "object") {
    for (const [id, text] of Object.entries(value.notes)) {
      if (typeof text === "string" && text.trim() !== "") clean.notes[id] = text.slice(0, 2000);
    }
  }
  clean.spoiler = value.spoiler === true;
  return clean;
}

export function exportPayload(state) {
  return {
    app: "leonida-platinum-atlas",
    version: 1,
    exportedAt: new Date().toISOString(),
    state: sanitizeState(state),
  };
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  const inner = parsed && typeof parsed === "object" && parsed.state ? parsed.state : parsed;
  return sanitizeState(inner);
}

export function isEarned(state, id) {
  return state.earned[String(id)] === true;
}

export function toggleEarned(state, id) {
  const key = String(id);
  if (state.earned[key] === true) {
    delete state.earned[key];
  } else {
    state.earned[key] = true;
  }
}

export function countOf(state, id) {
  const n = state.counts[String(id)];
  return Number.isFinite(n) ? n : 0;
}

export function setCount(state, id, n, target) {
  const key = String(id);
  let value = Math.max(0, Math.floor(Number(n) || 0));
  if (typeof target === "number" && target > 0) value = Math.min(value, target);
  if (value === 0) {
    delete state.counts[key];
  } else {
    state.counts[key] = value;
  }
  return value;
}

export function earnedTotal(state, trophies) {
  let total = 0;
  for (const t of trophies) if (isEarned(state, t.id)) total += 1;
  return total;
}

export function gradeTotals(state, trophies) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const got = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    totals[t.grade] += 1;
    if (isEarned(state, t.id)) got[t.grade] += 1;
  }
  return { totals, got };
}
