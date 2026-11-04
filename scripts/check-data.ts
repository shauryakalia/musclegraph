/* `pnpm check-data` — validates data/*.csv without building the site and prints a summary. */
import { DataError, loadAtlasData } from "../src/lib/load-data";

try {
  const { data, warnings } = loadAtlasData();
  const ratings = data.exercises.reduce((n, e) => n + Object.keys(e.scores).length, 0);
  console.log(
    `✓ Data OK: ${data.exercises.length} exercises, ${ratings} muscle ratings, ` +
      `${data.muscles.length} muscles in ${data.groups.length} groups, ${data.categories.length} categories` +
      (warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"} above)` : ""),
  );
} catch (e) {
  if (e instanceof DataError) {
    console.error("✗ " + e.message);
    process.exit(1);
  }
  throw e;
}
