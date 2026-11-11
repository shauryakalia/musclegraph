/* `pnpm ms:scrape` — crawls the Muscle & Strength exercise library and writes the facts of every
 * exercise to data/ms/source/ms_exercises_raw.csv.
 *
 * Only the "Exercise Profile" facts are kept (name, link, target and secondary muscles, type,
 * equipment, mechanics, force, level). Overview text, instructions and tips are never stored.
 *
 * Pages are cached in .cache/ms/ so a rerun (or `pnpm ms:build` tweaks) doesn't hit the site again.
 * Delete that folder to refetch. Polite by default: 3 requests in flight, ~300 ms apart per worker. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ORIGIN = "https://www.muscleandstrength.com";
const CACHE = path.join(process.cwd(), ".cache", "ms");
const OUT = path.join(process.cwd(), "data", "ms", "source", "ms_exercises_raw.csv");
const WORKERS = 3, GAP_MS = 300, MAX_PAGES = 5000;
const UA = "MuscleGraphBot/1.0 (personal training reference; facts only)";

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string | null> {
  const file = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".html");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      fs.writeFileSync(file, html);
      await sleep(GAP_MS);
      return html;
    } catch (e) {
      if (attempt === 3) { console.warn(`  ! ${url}: ${(e as Error).message}`); return null; }
      await sleep(1500 * attempt);
    }
  }
  return null;
}

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ").replace(/&ndash;|&mdash;/g, "-").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, " ").trim();

/** Normalises an /exercises/ link to an absolute URL without query or hash, or null if it isn't one. */
function exerciseLink(href: string): string | null {
  const m = href.match(/^(?:https?:\/\/www\.muscleandstrength\.com)?(\/exercises\/[a-z0-9-]+(?:\.html)?)(?:[?#].*)?$/i);
  return m ? ORIGIN + m[1].toLowerCase() : null;
}

interface Raw {
  slug: string; url: string; name: string; target: string; type: string; equipment: string;
  mechanics: string; force: string; level: string; secondary: string;
}

function parseExercise(url: string, html: string): Raw | null {
  const block = html.match(/<div class="node-stats-block">([\s\S]*?)<\/ul>/);
  if (!block) return null;
  const field = (label: string) => {
    const m = block[1].match(new RegExp(`<span class="row-label">${label}</span>([\\s\\S]*?)</li>`, "i"));
    if (!m) return "";
    const links = [...m[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)].map((a) => decode(a[1]));
    return links.length ? links.join(", ") : decode(m[1]);
  };
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const name = decode(h1 ? h1[1] : "").replace(/\s*(Video\s+)?Exercise Guide.*$/i, "").trim();
  return {
    slug: url.replace(/^.*\/exercises\//, "").replace(/\.html$/, ""),
    url, name,
    target: field("Target Muscle Group"),
    type: field("Exercise Type"),
    equipment: field("Equipment Required"),
    mechanics: field("Mechanics"),
    force: field("Force Type"),
    level: field("Experience Level"),
    secondary: field("Secondary Muscles"),
  };
}

async function sitemapUrls(): Promise<string[]> {
  const index = (await get(`${ORIGIN}/sitemap.xml`)) ?? "";
  const pages = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const urls: string[] = [];
  for (const p of pages) {
    const xml = (await get(p)) ?? "";
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) { const u = exerciseLink(m[1]); if (u) urls.push(u); }
  }
  return urls;
}

async function main() {
  const seen = new Set<string>();
  const queue: string[] = [];
  const push = (u: string | null) => { if (u && !seen.has(u) && seen.size < MAX_PAGES) { seen.add(u); queue.push(u); } };

  push(`${ORIGIN}/exercises`);
  (await sitemapUrls()).forEach(push);
  console.log(`Seeded ${queue.length} URLs from the index and sitemap`);

  const found = new Map<string, Raw>();
  let listings = 0, done = 0;

  async function worker() {
    while (queue.length) {
      const url = queue.shift()!;
      const html = await get(url);
      done++;
      if (done % 100 === 0) console.log(`  ${done} pages fetched, ${found.size} exercises, ${queue.length} queued`);
      if (!html) continue;
      const ex = parseExercise(url, html);
      if (ex) { if (ex.name) found.set(ex.slug, ex); continue; }
      /* listing page: follow exercise cards, sub-listings and pagination */
      listings++;
      for (const m of html.matchAll(/href="([^"]+)"/g)) {
        const href = m[1].replace(/&amp;/g, "&");
        push(exerciseLink(href));
        const page = href.match(/^(?:https?:\/\/www\.muscleandstrength\.com)?(\/exercises\/[a-z0-9-]+(?:\.html)?)\?page=(\d+)$/i);
        if (page) push(`${ORIGIN}${page[1].toLowerCase()}?page=${page[2]}`);
      }
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));

  const cols: (keyof Raw)[] = ["slug", "name", "url", "target", "secondary", "type", "equipment", "mechanics", "force", "level"];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [...found.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(OUT, [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n");
  console.log(`✓ ${rows.length} exercises from ${done} pages (${listings} listing pages) → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
