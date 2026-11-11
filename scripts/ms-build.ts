/* `pnpm ms:build` — turns the scraped Muscle & Strength facts (data/ms/source/ms_exercises_raw.csv) into
 * the imported part of the database: data/ms/exercises.csv, exercise_muscles.csv and exercise_joints.csv.
 *
 * Inputs (all editable):
 *   mapping/movement_rules.csv    ordered regex rules: exercise name (+ M&S target / type) → movement pattern
 *   mapping/movements.csv         movement pattern ids, names and the stick-figure demo each reuses
 *   mapping/muscle_map.csv        M&S muscle label × movement → muscle ids with a 0–1 weight (the anatomical model)
 *   mapping/movement_joints.csv   movement → joint load scores (1–5) and the joint action
 *   mapping/ms_targets.csv        M&S target → body-area category, fallback joints, stretch demo
 *   mapping/instructions.csv      written guidance per movement; equipment_notes.csv adds the gear line
 *   mapping/curated_movements.csv movement pattern of each hand-curated exercise in data/ (for joint scores)
 *   evidence/emg.csv + sources.csv  published EMG findings that override the model where an exercise was measured
 *
 * Ratings: the anatomical model gives every muscle a starting rating (targets base 5, secondary 3, or 2 for
 * isolation moves; stretches 4/2; each × a 0–1 weight). Where a study measured the exercise, the measured result
 * replaces that muscle's model rating and the rating is tagged basis=emg with its sources. */
import fs from "node:fs";
import path from "node:path";
import { readCsvTable } from "../src/lib/csv";
import { JOINTS } from "../src/lib/anatomy-data";

const ROOT = process.cwd();
const MS = path.join(ROOT, "data", "ms");
const MAP = path.join(MS, "mapping");
const EVID = path.join(MS, "evidence");
const read = (file: string, required: string[] = []) => readCsvTable(fs.readFileSync(file, "utf8"), path.relative(ROOT, file), required);

const raw = read(path.join(MS, "source", "ms_exercises_raw.csv"), ["slug", "name", "url", "target", "secondary"]);
const movements = read(path.join(MAP, "movements.csv"), ["id", "name", "demo"]);
const rules = read(path.join(MAP, "movement_rules.csv"), ["movement", "name_match", "targets", "types"]);
const muscleMap = read(path.join(MAP, "muscle_map.csv"), ["ms_muscle", "movement", "muscle_id", "weight"]);
const moveJoints = read(path.join(MAP, "movement_joints.csv"), ["movement", "joint_id", "score", "action"]);
const targets = read(path.join(MAP, "ms_targets.csv"), ["ms_muscle", "category", "joints", "stretch_demo"]);
const instructions = read(path.join(MAP, "instructions.csv"), ["movement", "setup", "steps", "cues", "mistakes", "note"]);
const equipmentNotes = read(path.join(MAP, "equipment_notes.csv"), ["equipment", "setup_line"]);
const curatedMoves = read(path.join(MAP, "curated_movements.csv"), ["exercise_id", "movement"]);
const emg = read(path.join(EVID, "emg.csv"), ["source", "study_exercise", "exercise_ids", "muscle_ids", "kind", "value"]);
const sources = read(path.join(EVID, "sources.csv"), ["id"]);
const categories = read(path.join(ROOT, "data", "categories.csv"), ["id", "name"]);
const muscles = read(path.join(ROOT, "data", "muscles.csv"), ["id"]);
const curated = read(path.join(ROOT, "data", "exercises.csv"), ["id"]);

/* ---------- check the tables against each other ---------- */
const problems: string[] = [];
const moveIds = new Set(movements.map((m) => m.id));
const muscleIds = new Set(muscles.map((m) => m.id));
const catIds = categories.map((c) => c.id);
const sourceIds = new Set(sources.map((s) => s.id));
const instrOf = new Map(instructions.map((i) => [i.movement, i]));
const KINDS = ["pct_mvc", "pct_ref", "top", "high", "lower"];
rules.forEach((r) => { if (!moveIds.has(r.movement)) problems.push(`movement_rules.csv line ${r.__line}: unknown movement "${r.movement}"`); });
muscleMap.forEach((r) => {
  if (r.movement !== "*" && !moveIds.has(r.movement)) problems.push(`muscle_map.csv line ${r.__line}: unknown movement "${r.movement}"`);
  if (!muscleIds.has(r.muscle_id)) problems.push(`muscle_map.csv line ${r.__line}: unknown muscle "${r.muscle_id}"`);
});
moveJoints.forEach((r) => {
  if (!moveIds.has(r.movement)) problems.push(`movement_joints.csv line ${r.__line}: unknown movement "${r.movement}"`);
  if (!JOINTS[r.joint_id]) problems.push(`movement_joints.csv line ${r.__line}: unknown joint "${r.joint_id}"`);
});
targets.forEach((t) => { if (!catIds.includes(t.category)) problems.push(`ms_targets.csv line ${t.__line}: unknown category "${t.category}"`); });
movements.forEach((m) => { if (!instrOf.has(m.id)) problems.push(`instructions.csv: no row for movement "${m.id}"`); });
curatedMoves.forEach((c) => {
  if (!moveIds.has(c.movement)) problems.push(`curated_movements.csv line ${c.__line}: unknown movement "${c.movement}"`);
  if (!curated.some((e) => e.id === c.exercise_id)) problems.push(`curated_movements.csv line ${c.__line}: "${c.exercise_id}" is not in data/exercises.csv`);
});
emg.forEach((r) => {
  const where = `emg.csv line ${r.__line}`;
  if (!sourceIds.has(r.source)) problems.push(`${where}: unknown source "${r.source}"`);
  if (!KINDS.includes(r.kind)) problems.push(`${where}: kind "${r.kind}" must be one of ${KINDS.join(", ")}`);
  if ((r.kind === "pct_mvc" || r.kind === "pct_ref") && !(Number(r.value) > 0)) problems.push(`${where}: ${r.kind} needs a numeric value`);
  r.muscle_ids.split(";").forEach((m) => { if (!muscleIds.has(m.trim())) problems.push(`${where}: unknown muscle "${m}"`); });
  if ((r.kind === "pct_mvc") && r.muscle_ids.includes(";")) problems.push(`${where}: pct_mvc rows take one muscle`);
});
const rawSlugs = new Set(raw.map((r) => r.slug));
emg.forEach((r) => r.exercise_ids.split(";").forEach((s) => { if (!rawSlugs.has(s.trim())) problems.push(`emg.csv line ${r.__line}: "${s}" is not a scraped exercise slug`); }));
if (problems.length) { console.error("✗ Mapping problems:\n" + problems.map((p) => "  • " + p).join("\n")); process.exit(1); }

const compiled = rules.map((r) => ({
  movement: r.movement,
  name: r.name_match ? new RegExp(r.name_match, "i") : null,
  targets: r.targets ? r.targets.split(";").map((s) => s.trim().toLowerCase()) : null,
  types: r.types ? new RegExp(r.types, "i") : null,
}));
const targetOf = new Map(targets.map((t) => [t.ms_muscle.toLowerCase(), t]));
const demoOf = new Map(movements.map((m) => [m.id, m.demo]));
const moveOrder = new Map(movements.map((m, i) => [m.id, i]));
const equipLine = new Map(equipmentNotes.map((e) => [e.equipment.toLowerCase(), e.setup_line]));
const parseJoints = (s: string) => s.split(";").filter(Boolean).map((p) => { const [id, n] = p.split(":"); return { id: id.trim(), score: Number(n) }; });
const list = (s: string) => s.split(",").map((x) => x.trim()).filter((x) => x && !/^(none|n\/a|--)$/i.test(x));
const clean = (s: string) => (/^(n\/a|none|--|other)$/i.test(s) ? "" : s);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const curatedIds = new Set(curated.map((e) => e.id));

/* ---------- build ---------- */
interface Out {
  row: Record<string, string>; slug: string;
  scores: Map<string, number>; basis: Map<string, Set<string>>;
  joints: Map<string, { score: number; action: string }>; cat: number; move: number;
}
const out: Out[] = [];
const unknown = new Map<string, number>();
const generic: string[] = [];
const ids = new Set<string>(curatedIds);
/** step added to the generic text by words in the exercise name */
function modifiers(name: string): { setup: string[]; steps: string[] } {
  const n = name.toLowerCase(), setup: string[] = [], steps: string[] = [];
  if (/smith/.test(n)) setup.push("The Smith machine fixes the bar path, so set your feet slightly in front of the bar and keep your balance over mid-foot.");
  if (/(^|\b)(one|single|1)[- ]?(arm|leg)\b|unilateral/.test(n)) steps.push("Finish all reps on one side before switching sides.");
  else if (/alternat/.test(n)) steps.push("Alternate sides on each rep.");
  if (/paused|pause/.test(n)) steps.push("Hold the hardest position for a full second before you continue.");
  if (/weighted/.test(n)) setup.push("Add the weight gradually and keep the same form you use unweighted.");
  if (/band(ed)?\b/.test(n) && !/band(ed)? (pull|assist)/.test(n)) setup.push("Anchor the band securely, because tension changes through the range.");
  return { setup, steps };
}

for (const r of raw) {
  const tgt = list(r.target), sec = list(r.secondary).filter((m) => !tgt.includes(m));
  const tl = tgt.map((t) => t.toLowerCase());
  const lname = r.name.toLowerCase();

  const rule = compiled.find((c) =>
    (!c.name || c.name.test(lname)) &&
    (!c.targets || c.targets.some((t) => tl.includes(t))) &&
    (!c.types || c.types.test(r.type || "")) &&
    (c.name || c.types));
  const movement = rule?.movement ?? "general";
  if (movement === "general") generic.push(`${r.name} [${r.target}]`);
  const stretch = movement === "stretch";

  /* model ratings */
  const scores = new Map<string, number>();
  const add = (msMuscle: string, base: number) => {
    let rows = muscleMap.filter((m) => m.ms_muscle.toLowerCase() === msMuscle.toLowerCase() && m.movement === movement);
    if (!rows.length) rows = muscleMap.filter((m) => m.ms_muscle.toLowerCase() === msMuscle.toLowerCase() && m.movement === "*");
    if (!rows.length) { unknown.set(msMuscle, (unknown.get(msMuscle) ?? 0) + 1); return; }
    rows.forEach((m) => {
      const s = Math.max(1, Math.min(5, Math.round(base * Number(m.weight))));
      scores.set(m.muscle_id, Math.max(scores.get(m.muscle_id) ?? 0, s));
    });
  };
  const isolation = /isolation/i.test(r.mechanics || "");
  tgt.forEach((m) => add(m, stretch ? 4 : 5));
  sec.forEach((m) => add(m, stretch ? 2 : isolation ? 2 : 3));

  /* joints */
  const joints = new Map<string, { score: number; action: string }>();
  const setJ = (id: string, score: number, action: string) => {
    const cur = joints.get(id);
    if (!cur || score > cur.score) joints.set(id, { score, action });
  };
  const mj = moveJoints.filter((j) => j.movement === movement);
  if (mj.length) mj.forEach((j) => setJ(j.joint_id, Number(j.score), j.action));
  else tgt.forEach((t) => parseJoints(targetOf.get(t.toLowerCase())?.joints ?? "").forEach((j) =>
    setJ(j.id, stretch ? Math.min(3, j.score) : j.score, stretch ? "stretched" : "loaded")));

  /* category, kind, demo */
  const t0 = targetOf.get(tl[0] ?? "");
  const category = stretch ? "joint-care" : movement === "olympic" ? "core-power" : t0?.category ?? "core-power";
  const kind = stretch ? (/foam|roll|smr|ball|massage|mobili|circle|slide|dislocate|dynamic|pass.?through|flexion|90\/90/i.test(lname) ? "Mobility" : "Stretch") : "";
  /* The movement's demo is only a suggestion (pattern_demo): the site shows an animation only for exercises
   * that have their own (a demo with the exercise's id). To reuse a pattern demo, copy pattern_demo into `demo`. */
  const patternDemo = stretch ? t0?.stretch_demo ?? "" : demoOf.get(movement) ?? "";

  /* id: the M&S slug, kept unique against the curated ids and each other */
  const base = slugify(r.slug) || slugify(r.name);
  let id = base;
  if (ids.has(id)) { id = base + "-ms"; for (let n = 2; ids.has(id); n++) id = `${base}-ms-${n}`; }
  ids.add(id);
  /* written guidance: the movement's text, tailored by equipment and the exercise's name */
  const ins = instrOf.get(movement)!;
  const equipment = clean(r.equipment);
  const mod = modifiers(r.name);
  const gear = equipLine.get(equipment.toLowerCase()) ?? "";
  const setup = [gear, ...mod.setup, ins.setup].filter(Boolean).join(" ");
  const steps = [...ins.steps.split("|").map((s) => s.trim()), ...mod.steps].join(" | ");

  out.push({
    slug: r.slug,
    row: {
      id, name: r.name,
      variant: [equipment, clean(r.mechanics)].filter(Boolean).join(" · "),
      category, kind, joints: "",
      setup, steps, cues: ins.cues, mistakes: ins.mistakes, note: ins.note, video_search: r.name, demo: "", pattern_demo: patternDemo,
      equipment, mechanics: clean(r.mechanics), force: clean(r.force), level: clean(r.level),
      movement, source_name: "Muscle & Strength", source_url: r.url,
    },
    scores, basis: new Map(), joints,
    cat: catIds.indexOf(category), move: moveOrder.get(movement) ?? 999,
  });
}

/* ---------- apply published EMG findings ---------- */
const bySlug = new Map(out.map((o) => [o.slug, o]));
const bandOf = (pct: number) => (pct >= 80 ? 5 : pct >= 60 ? 4 : pct >= 40 ? 3 : pct >= 20 ? 2 : 1);
const tag = (o: Out, m: string, src: string) => { if (!o.basis.has(m)) o.basis.set(m, new Set()); o.basis.get(m)!.add(src); };
let emgApplied = 0;
for (const r of emg) {
  const ms = r.muscle_ids.split(";").map((m) => m.trim());
  for (const slug of r.exercise_ids.split(";").map((s) => s.trim())) {
    const o = bySlug.get(slug)!;
    if (r.kind === "pct_mvc") {
      o.scores.set(ms[0], bandOf(Number(r.value))); tag(o, ms[0], r.source); emgApplied++;
    } else if (r.kind === "pct_ref") {
      /* the study measured the whole muscle as a % of a reference lift (same bands as %MVC): set the strongest part to
       * that band and shift the other parts by the same amount, which keeps the model's split between them */
      const top = Math.max(...ms.map((m) => o.scores.get(m) ?? 0));
      const delta = bandOf(Number(r.value)) - top;
      ms.forEach((m) => { if (o.scores.has(m)) o.scores.set(m, Math.max(1, Math.min(5, o.scores.get(m)! + delta))); tag(o, m, r.source); emgApplied++; });
    } else {
      ms.forEach((m) => {
        const cur = o.scores.get(m);
        if (r.kind === "top") o.scores.set(m, 5);
        else if (r.kind === "high") o.scores.set(m, Math.max(cur ?? 0, 4));
        else if (cur == null) return;
        else o.scores.set(m, Math.min(cur, 3));
        tag(o, m, r.source); emgApplied++;
      });
    }
  }
}

/* ---------- joint scores for the hand-curated exercises ---------- */
const curatedJointRows: { id: string; joint: string; score: number; action: string }[] = [];
for (const c of curatedMoves) moveJoints.filter((j) => j.movement === c.movement)
  .forEach((j) => curatedJointRows.push({ id: c.exercise_id, joint: j.joint_id, score: Number(j.score), action: j.action }));

out.sort((a, b) => a.cat - b.cat || a.move - b.move || a.row.name.localeCompare(b.row.name));

/* ---------- write ---------- */
const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const write = (file: string, cols: string[], rows: Record<string, string | number>[]) =>
  fs.writeFileSync(path.join(MS, file), [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(","))].join("\n") + "\n");

for (const f of ["categories.csv", "muscle_groups.csv", "muscles.csv", "joints.csv"]) fs.rmSync(path.join(MS, f), { force: true });
write("exercises.csv", Object.keys(out[0].row), out.map((o) => o.row));
write("exercise_muscles.csv", ["exercise_id", "muscle_id", "score", "basis", "sources"],
  out.flatMap((o) => [...o.scores].sort((a, b) => b[1] - a[1]).map(([m, s]) => ({
    exercise_id: o.row.id, muscle_id: m, score: s,
    basis: o.basis.has(m) ? "emg" : "model", sources: o.basis.has(m) ? [...o.basis.get(m)!].join(";") : "",
  }))));
write("exercise_joints.csv", ["exercise_id", "joint_id", "score", "action"], [
  ...curatedJointRows.map((j) => ({ exercise_id: j.id, joint_id: j.joint, score: j.score, action: j.action })),
  ...out.flatMap((o) => [...o.joints].sort((a, b) => b[1].score - a[1].score).map(([j, v]) => ({ exercise_id: o.row.id, joint_id: j, score: v.score, action: v.action }))),
]);

/* ---------- report ---------- */
const by = (k: string) => { const m: Record<string, number> = {}; out.forEach((o) => (m[o.row[k]] = (m[o.row[k]] ?? 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k2, v]) => `${k2 || "(none)"} ${v}`).join(", "); };
console.log(`Categories: ${by("category")}`);
console.log(`Movements:  ${by("movement")}`);
if (unknown.size) console.warn(`⚠ M&S muscle labels with no row in muscle_map.csv: ${[...unknown].map(([k, v]) => `${k} (${v})`).join(", ")}`);
if (generic.length) console.warn(`⚠ ${generic.length} exercises matched no movement rule (scored from targets only):\n  ` + generic.join("\n  "));
const exWithEmg = out.filter((o) => o.basis.size).length;
const total = out.reduce((n, o) => n + o.scores.size, 0);
console.log(`✓ ${out.length} exercises, ${total} muscle ratings (${emgApplied} measured-rating updates across ${exWithEmg} exercises), ` +
  `${out.reduce((n, o) => n + o.joints.size, 0) + curatedJointRows.length} joint scores → data/ms/`);
