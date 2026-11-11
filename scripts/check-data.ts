/* `pnpm check-data` — validates the CSV database (data/ and data/ms/) without building the site and prints a summary. */
import { DataError, loadMuscleGraphData } from "../src/lib/load-data";

try {
  const { data, warnings } = loadMuscleGraphData();
  const ratings = data.exercises.reduce((n, e) => n + Object.keys(e.scores).length, 0);
  const measured = data.exercises.reduce((n, e) => n + e.measured.length, 0);
  const jointRatings = data.exercises.reduce((n, e) => n + Object.keys(e.jointScores).length, 0);
  const full = data.exercises.filter((e) => e.steps.length).length;
  if (process.argv.includes("--warnings")) warnings.forEach((w) => console.warn("  • " + w));
  console.log(
    `✓ Data OK: ${data.exercises.length} exercises (${full} with written steps, ${data.exercises.filter((e) => e.demo).length} with an animation), ${ratings} muscle ratings (${measured} from EMG studies), ` +
      `${jointRatings} joint scores, ${data.muscles.length} muscles in ${data.groups.length} groups, ${data.categories.length} categories, ` +
      `${data.sources.length} evidence sources` +
      (warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"}; add --warnings to list)` : ""),
  );
} catch (e) {
  if (e instanceof DataError) {
    console.error("✗ " + e.message);
    process.exit(1);
  }
  throw e;
}
