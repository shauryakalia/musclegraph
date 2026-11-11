/* Compact wire format for the exercise index (public/data/index.json), shared by the build script and the
 * browser. Each exercise is one array so the file stays small (~30% of the equivalent object JSON):
 *   [id, name, variant, category, kind, demo, equipment, mechanics, level, scores, jointScores, joints, measured]
 * `scores` / `jointScores` are comma lists of `<id><digit>`, e.g. "quads-vl5,glutes4"; `joints` and `measured`
 * are `;` lists. */
import type { Exercise, ExerciseCore, DrillKind, ExerciseDetail } from "./types";

export type PackedExercise = [string, string, string, string, string, string, string, string, string, string, string, string, string];
export interface PackedIndex { v: 1; exercises: PackedExercise[] }

const packMap = (m: Record<string, number>) => Object.keys(m).map((k) => k + m[k]).join(",");
const unpackMap = (s: string) => {
  const o: Record<string, number> = {};
  if (s) s.split(",").forEach((t) => { o[t.slice(0, -1)] = Number(t.slice(-1)); });
  return o;
};

export function packExercise(e: ExerciseCore): PackedExercise {
  return [e.id, e.name, e.variant, e.category, e.kind || "", e.demo || "", e.equipment, e.mechanics, e.level,
    packMap(e.scores), packMap(e.jointScores), e.joints.join(";"), e.measured.join(";")];
}

export function unpackExercise(p: PackedExercise): ExerciseCore {
  return {
    id: p[0], name: p[1], variant: p[2], category: p[3], kind: (p[4] || null) as DrillKind | null, demo: p[5] || null,
    equipment: p[6], mechanics: p[7], level: p[8], scores: unpackMap(p[9]), jointScores: unpackMap(p[10]),
    joints: p[11] ? p[11].split(";") : [], measured: p[12] ? p[12].split(";") : [],
  };
}

export const packIndex = (list: Exercise[]): PackedIndex => ({ v: 1, exercises: list.map(packExercise) });

export function detailOf(e: Exercise): ExerciseDetail {
  return {
    setup: e.setup, steps: e.steps, cues: e.cues, mistakes: e.mistakes, note: e.note, videoSearch: e.videoSearch,
    jointActions: e.jointActions, basis: e.basis, source: e.source, force: e.force,
  };
}
