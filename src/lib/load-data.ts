/* Reads the CSV database in data/ at build time (and on every request in `pnpm dev`),
 * checks it, and returns typed data. Any problem stops the build with a list of what to fix. */
import fs from "node:fs";
import path from "node:path";
import { DEMOS } from "@/data/demos";
import { JOINTS, SHAPE_IDS } from "./anatomy";
import { readCsvTable, splitList, type CsvRow } from "./csv";
import { DRILL_KINDS, REGIONS, type AtlasData, type Category, type DrillKind, type Exercise, type Muscle, type MuscleGroup, type Region } from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");
export const FILES = {
  categories: "categories.csv",
  groups: "muscle_groups.csv",
  muscles: "muscles.csv",
  exercises: "exercises.csv",
  scores: "exercise_muscles.csv",
} as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class DataError extends Error {
  constructor(public problems: string[]) {
    super(
      `The CSV data in data/ has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n` +
        problems.map((p) => "  • " + p).join("\n"),
    );
    this.name = "DataError";
  }
}

export interface LoadResult { data: AtlasData; warnings: string[] }

let cache: { key: string; result: LoadResult } | null = null;

/** Loads and validates data/*.csv. Cached until one of the files changes. */
export function loadAtlasData(): LoadResult {
  const key = Object.values(FILES).map((f) => { try { return fs.statSync(path.join(DATA_DIR, f)).mtimeMs; } catch { return 0; } }).join("|");
  if (cache && cache.key === key) return cache.result;
  const result = parseAll();
  cache = { key, result };
  if (result.warnings.length) console.warn("[exercise-atlas] data warnings:\n" + result.warnings.map((w) => "  • " + w).join("\n"));
  return result;
}

function read(file: string, required: string[], problems: string[]): CsvRow[] {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) { problems.push(`${file}: file not found in data/`); return []; }
  try {
    return readCsvTable(fs.readFileSync(full, "utf8"), file, required);
  } catch (e) {
    problems.push((e as Error).message.startsWith(file) ? (e as Error).message : `${file}: ${(e as Error).message}`);
    return [];
  }
}

function parseAll(): LoadResult {
  const problems: string[] = [], warnings: string[] = [];
  const at = (file: string, r: CsvRow) => `${file} line ${r.__line}`;
  const isRegion = (v: string): v is Region => (REGIONS as string[]).indexOf(v) >= 0;

  /* categories */
  const categories: Category[] = [];
  read(FILES.categories, ["id", "name"], problems).forEach((r) => {
    const where = at(FILES.categories, r);
    if (!SLUG.test(r.id)) return problems.push(`${where}: id "${r.id}" must be lowercase words joined by hyphens, e.g. "glutes-hamstrings"`);
    if (categories.some((c) => c.id === r.id)) return problems.push(`${where}: duplicate category id "${r.id}"`);
    if (!r.name) return problems.push(`${where}: name is empty`);
    categories.push({ id: r.id, name: r.name });
  });

  /* muscle groups (Basic view) */
  const groups: MuscleGroup[] = [];
  read(FILES.groups, ["id", "name", "region"], problems).forEach((r) => {
    const where = at(FILES.groups, r);
    if (!SLUG.test(r.id)) return problems.push(`${where}: id "${r.id}" must be lowercase words joined by hyphens`);
    if (groups.some((g) => g.id === r.id)) return problems.push(`${where}: duplicate group id "${r.id}"`);
    if (!r.name) return problems.push(`${where}: name is empty`);
    if (!isRegion(r.region)) return problems.push(`${where}: region "${r.region}" must be one of ${REGIONS.join(", ")}`);
    groups.push({ id: r.id, name: r.name, region: r.region });
  });
  const groupIds = new Set(groups.map((g) => g.id));

  /* muscles (Advanced view) */
  const muscles: Muscle[] = [];
  read(FILES.muscles, ["id", "name", "short_name", "region", "group"], problems).forEach((r) => {
    const where = at(FILES.muscles, r);
    if (!SLUG.test(r.id)) return problems.push(`${where}: id "${r.id}" must be lowercase words joined by hyphens`);
    if (muscles.some((m) => m.id === r.id)) return problems.push(`${where}: duplicate muscle id "${r.id}"`);
    if (!r.name) return problems.push(`${where}: name is empty`);
    if (!isRegion(r.region)) return problems.push(`${where}: region "${r.region}" must be one of ${REGIONS.join(", ")}`);
    if (r.group && !groupIds.has(r.group)) return problems.push(`${where}: group "${r.group}" is not an id in ${FILES.groups}`);
    if (!SHAPE_IDS.has(r.id)) warnings.push(`${where}: muscle "${r.id}" has no shape on the body map (src/lib/anatomy-data.ts), so it won't be drawn`);
    muscles.push({ id: r.id, name: r.name, short: r.short_name || r.name, region: r.region, group: r.group || null });
  });
  const muscleIds = new Set(muscles.map((m) => m.id));
  groups.forEach((g) => { if (!muscles.some((m) => m.group === g.id)) warnings.push(`${FILES.groups}: group "${g.id}" has no muscles assigned to it in ${FILES.muscles}`); });

  /* exercises */
  const exercises: Exercise[] = [];
  const catIds = new Set(categories.map((c) => c.id));
  /** exercises that failed validation; their rating rows are skipped instead of reported again */
  const rejected = new Set<string>();
  read(FILES.exercises, ["id", "name", "category"], problems).forEach((r) => {
    const where = at(FILES.exercises, r);
    const bad = (msg: string) => { problems.push(msg); rejected.add(r.id); };
    if (!SLUG.test(r.id)) return problems.push(`${where}: id "${r.id}" must be lowercase words joined by hyphens (it becomes the page URL)`);
    if (exercises.some((e) => e.id === r.id)) return problems.push(`${where}: duplicate exercise id "${r.id}"`);
    if (!r.name) return bad(`${where}: name is empty`);
    if (!catIds.has(r.category)) return bad(`${where}: category "${r.category}" is not an id in ${FILES.categories} (${[...catIds].join(", ")})`);
    let kind: DrillKind | null = null;
    if (r.kind) {
      const k = DRILL_KINDS.find((d) => d.toLowerCase() === r.kind.toLowerCase());
      if (!k) return bad(`${where}: kind "${r.kind}" must be empty or one of ${DRILL_KINDS.join(", ")}`);
      kind = k;
    }
    const joints = splitList(r.joints, /[;,|]/);
    const badJ = joints.filter((j) => !JOINTS[j]);
    if (badJ.length) return bad(`${where}: unknown joint(s) ${badJ.join(", ")} — use ${Object.keys(JOINTS).join(", ")}`);
    const demoId = r.demo || r.id;
    let demo: string | null = demoId;
    if (!DEMOS[demoId]) {
      if (r.demo) return bad(`${where}: demo "${r.demo}" doesn't exist in src/data/demos.ts`);
      warnings.push(`${where}: "${r.id}" has no animated demo yet; set the demo column to an existing demo id (e.g. back-squat) to reuse one`);
      demo = null;
    }
    const steps = splitList(r.steps), cues = splitList(r.cues), mistakes = splitList(r.mistakes);
    if (!r.setup) warnings.push(`${where}: "${r.id}" has no setup text`);
    if (!steps.length) warnings.push(`${where}: "${r.id}" has no steps`);
    exercises.push({
      id: r.id, name: r.name, variant: r.variant || "", category: r.category, kind, joints,
      setup: r.setup || "", steps, cues, mistakes, note: r.note || null, videoSearch: r.video_search || null,
      demo, scores: {},
    });
  });
  const exById = new Map(exercises.map((e) => [e.id, e]));

  /* exercise × muscle effort ratings */
  read(FILES.scores, ["exercise_id", "muscle_id", "score"], problems).forEach((r) => {
    const where = at(FILES.scores, r);
    const e = exById.get(r.exercise_id);
    if (!e) { if (!rejected.has(r.exercise_id)) problems.push(`${where}: exercise "${r.exercise_id}" is not an id in ${FILES.exercises}`); return; }
    if (!muscleIds.has(r.muscle_id)) return problems.push(`${where}: muscle "${r.muscle_id}" is not an id in ${FILES.muscles}`);
    const n = Number(r.score);
    if (!Number.isInteger(n) || n < 1 || n > 5) return problems.push(`${where}: score "${r.score}" must be a whole number from 1 to 5`);
    if (e.scores[r.muscle_id] != null) return problems.push(`${where}: ${r.exercise_id} × ${r.muscle_id} is listed twice`);
    e.scores[r.muscle_id] = n;
  });
  exercises.forEach((e) => { if (!Object.keys(e.scores).length) warnings.push(`${FILES.scores}: "${e.id}" has no muscle ratings, so it won't light up the map or show in comparisons`); });

  if (!exercises.length && !problems.length) problems.push(`${FILES.exercises}: no exercises found`);
  if (problems.length) throw new DataError(problems);
  return { data: { muscles, groups, categories, exercises }, warnings };
}
