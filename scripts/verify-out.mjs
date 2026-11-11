/* `pnpm verify` — sanity-checks the static export in out/ after `pnpm build`:
 * one page and one detail file per exercise in the index, no oversized pages, and a readable index. */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const MAX_PAGE_BYTES = 80 * 1024;
const fail = [];

const index = JSON.parse(fs.readFileSync(path.join(OUT, "data", "index.json"), "utf8"));
const ids = index.exercises.map((e) => e[0]);
if (index.v !== 1 || !ids.length) fail.push("data/index.json is empty or has an unknown version");

let biggest = 0;
for (const id of ids) {
  const page = path.join(OUT, "exercises", id, "index.html");
  const detail = path.join(OUT, "data", "ex", id + ".json");
  if (!fs.existsSync(page)) { fail.push(`missing page for ${id}`); continue; }
  if (!fs.existsSync(detail)) fail.push(`missing data/ex/${id}.json`);
  const size = fs.statSync(page).size;
  biggest = Math.max(biggest, size);
  if (size > MAX_PAGE_BYTES) fail.push(`${id}: page is ${(size / 1024).toFixed(0)} KB (limit ${MAX_PAGE_BYTES / 1024} KB)`);
  if (fail.length > 20) break;
}
const home = path.join(OUT, "index.html");
if (!fs.existsSync(home)) fail.push("missing out/index.html");

if (fail.length) {
  console.error("✗ Export problems:\n" + fail.map((f) => "  • " + f).join("\n"));
  process.exit(1);
}
console.log(`✓ Export OK: ${ids.length} exercise pages + detail files, largest page ${(biggest / 1024).toFixed(1)} KB`);
