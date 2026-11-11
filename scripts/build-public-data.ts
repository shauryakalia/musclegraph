/* `pnpm data:build` — writes the browser-facing data files into public/data/ (gitignored):
 *   index.json        every exercise in the compact format of src/lib/pack.ts
 *   ex/<id>.json      one exercise's text, joint actions and evidence (loaded when it is opened)
 * `pnpm dev` and `pnpm build` run this first. Rerun it after editing the CSVs while `pnpm dev` is running. */
import fs from "node:fs";
import path from "node:path";
import { DataError, loadMuscleGraphData } from "../src/lib/load-data";
import { detailOf, packIndex } from "../src/lib/pack";

const OUT = path.join(process.cwd(), "public", "data");

try {
  const { data, warnings } = loadMuscleGraphData();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "ex"), { recursive: true });
  const index = JSON.stringify(packIndex(data.exercises));
  fs.writeFileSync(path.join(OUT, "index.json"), index);
  for (const e of data.exercises) fs.writeFileSync(path.join(OUT, "ex", e.id + ".json"), JSON.stringify(detailOf(e)));
  console.log(`✓ public/data: index.json ${(index.length / 1024).toFixed(0)} KB + ${data.exercises.length} exercise files` +
    (warnings.length ? ` (${warnings.length} data warnings; run pnpm check-data to list them)` : ""));
} catch (e) {
  if (e instanceof DataError) { console.error("✗ " + e.message); process.exit(1); }
  throw e;
}
