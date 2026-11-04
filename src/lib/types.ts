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

/** data/exercises.csv + data/exercise_muscles.csv */
export interface Exercise {
  id: string;
  name: string;
  variant: string;
  category: string;
  kind: DrillKind | null;
  joints: string[];
  setup: string;
  steps: string[];
  cues: string[];
  mistakes: string[];
  note: string | null;
  /** YouTube search text; falls back to the name */
  videoSearch: string | null;
  /** demo id in src/data/demos.ts (defaults to the exercise id); null when none exists */
  demo: string | null;
  /** Advanced muscle id → effort rating 1–5 */
  scores: Record<string, number>;
}

export interface AtlasData {
  muscles: Muscle[];
  groups: MuscleGroup[];
  categories: Category[];
  exercises: Exercise[];
}
