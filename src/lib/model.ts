/* Derived data and helpers shared by the UI: Basic/Advanced "units", ratings and comparison maths. */
import type { MuscleGraphData, ExerciseCore, Level, Region } from "./types";

export const RATING: Record<number, string> = { 5: "Main target", 4: "Major", 3: "Moderate", 2: "Assists", 1: "Minor" };
/** comparison categories, index 0–6 (also the colour classes c0–c6) */
export const CAT = ["Only A", "A much harder", "A harder", "Even", "B harder", "B much harder", "Only B"];
export const SCALE_LAB = ["Only A", "Much more", "More", "Even", "More", "Much more", "Only B"];

/** colour class for a muscle rated a (exercise A) and b (exercise B); 0 = untouched */
export const cat = (a: number, b: number) => {
  if (a && !b) return 0;
  if (b && !a) return 6;
  const d = a - b;
  return d >= 2 ? 1 : d === 1 ? 2 : d === 0 ? 3 : d === -1 ? 4 : 5;
};

export const uniq = <T,>(a: T[]) => a.filter((x, i) => a.indexOf(x) === i);

export interface ExView {
  /** unit id → rating, for this level (Basic groups take the highest rating of their muscles) */
  x: Record<string, number>;
  /** primary units (rating 4–5), highest first */
  p: string[];
  /** secondary units (rating 1–3), highest first */
  s: string[];
}
export interface Unit { id: string; name: string; short: string; region: Region }

export interface Model {
  data: MuscleGraphData;
  exercises: ExerciseCore[];
  byId: Record<string, ExerciseCore>;
  units: Record<Level, Record<string, Unit>>;
  /** Advanced muscle id → Basic group id */
  groupOf: Record<string, string | null>;
  ex: Record<Level, Record<string, ExView>>;
  categoryName: Record<string, string>;
}

function split(x: Record<string, number>): ExView {
  const ids = Object.keys(x).sort((a, c) => x[c] - x[a]);
  return { x, p: ids.filter((k) => x[k] >= 4), s: ids.filter((k) => x[k] < 4) };
}

export function buildModel(data: MuscleGraphData): Model {
  const groupOf: Record<string, string | null> = {};
  data.muscles.forEach((m) => (groupOf[m.id] = m.group));
  const units: Model["units"] = { advanced: {}, basic: {} };
  data.muscles.forEach((m) => (units.advanced[m.id] = { id: m.id, name: m.name, short: m.short, region: m.region }));
  data.groups.forEach((g) => (units.basic[g.id] = { id: g.id, name: g.name, short: g.name, region: g.region }));
  const ex: Model["ex"] = { advanced: {}, basic: {} };
  const byId: Record<string, ExerciseCore> = {};
  data.exercises.forEach((e) => {
    byId[e.id] = e;
    const b: Record<string, number> = {};
    Object.keys(e.scores).forEach((m) => { const g = groupOf[m]; if (g) b[g] = Math.max(b[g] || 0, e.scores[m]); });
    ex.advanced[e.id] = split(e.scores);
    ex.basic[e.id] = split(b);
  });
  const categoryName: Record<string, string> = {};
  data.categories.forEach((c) => (categoryName[c.id] = c.name));
  // exercises in category order, then file order
  const pos = new Map(data.categories.map((c, i) => [c.id, i]));
  const exercises = data.exercises.map((e, i) => ({ e, i })).sort((a, b) => pos.get(a.e.category)! - pos.get(b.e.category)! || a.i - b.i).map((o) => o.e);
  return { data, exercises, byId, units, groupOf, ex, categoryName };
}

/** Level-bound helpers (what the original page called X, P, S, unitOf, uName …) */
export function makeView(model: Model, level: Level) {
  const units = model.units[level];
  const adv = level === "advanced";
  const V = (e: ExerciseCore) => model.ex[level][e.id];
  return {
    level,
    adv,
    units,
    unitOf: (m: string): string | null => (adv ? (units[m] ? m : null) : model.groupOf[m] || null),
    uName: (u: string) => units[u]?.name ?? u,
    uShort: (u: string) => units[u]?.short ?? u,
    X: (e: ExerciseCore) => V(e).x,
    P: (e: ExerciseCore) => V(e).p,
    S: (e: ExerciseCore) => V(e).s,
    trains: (e: ExerciseCore, u: string) => (V(e).x[u] || 0) > 0,
    /** muscles rated 3+ that Basic view doesn't show */
    hiddenInBasic: (e: ExerciseCore) => (adv ? [] : Object.keys(e.scores).filter((m) => !model.groupOf[m] && e.scores[m] >= 3)),
  };
}
export type ViewHelpers = ReturnType<typeof makeView>;

/** the exercise sharing the most muscle work with `id` */
export function bestMatch(model: Model, id: string): string {
  const a = model.byId[id].scores;
  let best: string | null = null, bs = -1;
  model.exercises.forEach((e) => {
    if (e.id === id) return;
    let s = 0;
    for (const k in a) if (e.scores[k]) s += Math.min(a[k], e.scores[k]);
    if (s > bs) { bs = s; best = e.id; }
  });
  return best ?? id;
}

export const exercisePath = (id: string) => `/exercises/${id}/`;
export function idFromPath(pathname: string | null): string | null {
  const m = /^\/exercises\/([^/]+)\/?$/.exec(pathname || "");
  return m ? decodeURIComponent(m[1]) : null;
}

/** YouTube search link for an exercise */
export function videoUrl(e: ExerciseCore, search?: string | null) {
  const stretch = e.kind === "Stretch";
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent((search || e.name.replace(/ \/.*$/, "")) + (stretch ? "" : " proper form"));
}
