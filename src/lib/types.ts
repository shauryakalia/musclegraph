export type Region = "Top" | "Torso" | "Arms" | "Legs";
export const REGIONS: Region[] = ["Top", "Torso", "Arms", "Legs"];

export type Level = "basic" | "advanced";
export type Gender = "male" | "female";

/** A non-empty kind marks an exercise as a joint drill. */
export type DrillKind = "Mobility" | "Stretch" | "Strength";
export const DRILL_KINDS: DrillKind[] = ["Mobility", "Stretch", "Strength"];

/** data/muscles.csv — the detailed (Advanced) muscles */
export interface Muscle {
  id: string;
  name: string;
  short: string;
  region: Region;
  /** Basic group id from data/muscle_groups.csv; null = shown only in Advanced */
  group: string | null;
}

/** data/muscle_groups.csv — the simple (Basic) groups */
export interface MuscleGroup {
  id: string;
  name: string;
  region: Region;
}

/** data/categories.csv — body areas used for browsing */
export interface Category {
  id: string;
  name: string;
}

/** How a rating was obtained. "emg" = taken from a published EMG study (see EvidenceSource); "model" = derived
 * from the movement's anatomy because no study measured that exercise. */
export type Basis = "emg" | "model";

/** data/ms/evidence/sources.csv — a published study the ratings lean on */
export interface EvidenceSource {
  id: string;
  /** short label, e.g. "ACE triceps study" */
  label: string;
  citation: string;
  url: string;
}

/** The slim part of an exercise: everything the list, the muscle map and Compare need. Shipped to the
 * browser for every exercise in one small file (public/data/index.json). */
export interface ExerciseCore {
  id: string;
  name: string;
  variant: string;
  category: string;
  kind: DrillKind | null;
  /** joints that carry the exercise (score ≥ 4, ≥ 3 for stretches), highest first */
  joints: string[];
  /** joint id → load score 1–5, every joint the exercise meaningfully moves or holds */
  jointScores: Record<string, number>;
  /** gear, "" when none or unknown (e.g. "Dumbbell", "Cable") */
  equipment: string;
  mechanics: string;
  level: string;
  /** demo id in src/data/demos.ts (defaults to the exercise id); null when none exists */
  demo: string | null;
  /** Advanced muscle id → effort rating 1–5 */
  scores: Record<string, number>;
  /** muscle ids whose rating comes from a published EMG study */
  measured: string[];
}

/** The text and provenance of one exercise, loaded on demand (public/data/ex/<id>.json). */
export interface ExerciseDetail {
  setup: string;
  steps: string[];
  cues: string[];
  mistakes: string[];
  note: string | null;
  /** YouTube search text; falls back to the name */
  videoSearch: string | null;
  /** joint id → the motion at that joint, e.g. "horizontal adduction" */
  jointActions: Record<string, string>;
  /** muscle id → ids of the studies behind its rating (absent = model estimate) */
  basis: Record<string, string[]>;
  /** where the exercise's facts were catalogued, if imported */
  source: { name: string; url: string } | null;
  force: string;
}

/** The full exercise as the loader builds it (build/server only). */
export interface Exercise extends ExerciseCore, ExerciseDetail {}

/** Small reference tables, embedded in every page. */
export interface RefData {
  muscles: Muscle[];
  groups: MuscleGroup[];
  categories: Category[];
  sources: EvidenceSource[];
}

/** Reference tables plus the exercise index. */
export interface MuscleGraphData extends RefData {
  exercises: ExerciseCore[];
}

/** The loader's result: full exercises. */
export interface FullData extends RefData {
  exercises: Exercise[];
}
