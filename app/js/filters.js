// Filtering, the spoiler rule, roadmap order and the Next up planner.
import { isEarned } from "./store.js";

export const KIND_LABELS = {
  story: "Story",
  collectibles: "Collectibles",
  activities: "Activities",
  completion: "Completion",
};

export const STAGES = [
  { n: 1, title: "Stage 1 — Story first", blurb: "Chapters and named missions in order. Grab the flagged missables while their windows are open, and save before choices." },
  { n: 2, title: "Stage 2 — Strangers & side missions", blurb: "Finish the stranger strands (Andy, Kenton, Billy, Randy, Tyrone and three more) and the partner and odd-event trophies." },
  { n: 3, title: "Stage 3 — Activities & crime", blurb: "Races, stunts, the shooting range, challenges, robberies and the loud stuff. Counters in the tracker mirror PlayStation's." },
  { n: 4, title: "Stage 4 — Collectibles & exploration", blurb: "Card sets, WAiNK spots, meditation points, vehicle discoveries and clearing the whole map in one sweep per region." },
  { n: 5, title: "Stage 5 — Money & property", blurb: "Launder marked bills, spend, buy every garage property and register vehicles in the Scooter Bros app." },
  { n: 6, title: "Stage 6 — 100% & platinum", blurb: "A Long Road for 100% completion, then the platinum, Vice Got a Price!, pops when the other 54 are done." },
];

export function isMasked(trophy, state) {
  // Spoiler-free mode hides story trophies until they are earned.
  return state.spoiler === true && trophy.kind === "story" && !isEarned(state, trophy.id);
}

export function matchesFilters(trophy, state, filters) {
  if (filters.kind === "missable") {
    if (!trophy.missable) return false;
  } else if (filters.kind !== "all" && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.status === "earned" && !isEarned(state, trophy.id)) return false;
  if (filters.status === "remaining" && isEarned(state, trophy.id)) return false;
  const q = filters.query.trim().toLowerCase();
  if (q !== "") {
    if (isMasked(trophy, state)) return false;
    const hay = (trophy.name + " " + trophy.description + " " + (KIND_LABELS[trophy.kind] || "")).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function applyFilters(trophies, state, filters) {
  return trophies.filter((t) => matchesFilters(t, state, filters));
}

export function roadmapOrder(trophies) {
  // Stage order; inside a stage, missables first, then by official list order.
  return [...trophies].sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    return a.id - b.id;
  });
}

export function nextUp(trophies, state, limit) {
  const remaining = roadmapOrder(trophies).filter((t) => !isEarned(state, t.id));
  return remaining.slice(0, limit);
}

export function stageProgress(trophies, state, stageN) {
  let total = 0;
  let done = 0;
  for (const t of trophies) {
    if (t.stage !== stageN) continue;
    total += 1;
    if (isEarned(state, t.id)) done += 1;
  }
  return { total, done };
}
