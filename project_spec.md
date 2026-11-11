# Muscle Graph — Project Spec

> The source of truth for how this codebase works. Read it before making structural changes, and update it in the same change when you alter anything it describes (architecture, data schema, conventions, commands).
>
> Last verified against the code: 2026-11-05 (Next.js 16.4.5, 62 exercises).

---

## 1. What this is

A **strength-training reference website**. Users can:

- **Browse** exercises grouped by body area, search them, and filter by muscle (or by joint in Advanced view).
- **Open an exercise**: an animated stick-figure form demo, the muscles it trains (primary/secondary with 1–5 ratings), setup, steps, cues, common mistakes, an optional note and a YouTube search link.
- **Use the muscle map**: front and back SVG bodies. Hover or tap a muscle to see its name and how many exercises train it; click it to filter the list.
- **Compare two exercises** muscle by muscle: both demos loop side by side, the map is coloured on a 7-step red↔blue scale, and a table shows A/B ratings and verdicts.
- **Toggle Body** (male/female figure) and **Detail** (Basic = 19 simple muscle groups, Advanced = 38 detailed muscles plus joint markers).

**Non-goals:** no backend, accounts, database server, analytics or CMS. It is a **fully static site** (`next build` → `out/`) deployed to Netlify. All content comes from **CSV files in `data/`**, read at build time.

Origin: it was first built as a single-file HTML page (a claude.ai artifact) and ported to Next.js with identical behaviour and data. The artifact and this repo are now separate copies, and changes to one don't reach the other.

---

## 2. Stack

| Thing | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.4.5**, App Router, Turbopack | `output: "export"` (static), `trailingSlash: true`, `images.unoptimized: true` |
| UI | **React 19.3**, client components | One stateful root component (`MuscleGraph`) |
| Language | **TypeScript 5.9**, `strict: true` | Path alias `@/*` → `src/*` |
| Package manager | **pnpm 10** (`packageManager` field) | `esbuild` allowed to run its postinstall (`pnpm.onlyBuiltDependencies`) |
| Styling | **One global stylesheet** `src/app/globals.css` | CSS custom properties; **no Tailwind, no CSS modules, no CSS-in-JS** |
| Fonts | Google Fonts `<link>` (Barlow, Barlow Condensed) in `layout.tsx` | Not `next/font` |
| Runtime deps | `next`, `react`, `react-dom` only | Dev: `typescript`, `@types/*`, `tsx` (data checker), `serve` (preview) |
| Hosting | Netlify (`netlify.toml`: `pnpm build` → publish `out`) | Any static host works |

**Next.js 16 is newer than most model training data.** The root `AGENTS.md` (managed by `next dev`) says the same: check `node_modules/next/dist/docs/` before using a Next.js API you're unsure of. Known differences that matter here: route `params` is a **Promise** (`const { id } = await params`), and Turbopack is the default bundler.

---

## 3. Commands

```bash
pnpm install        # Node >= 20.9
pnpm dev            # builds public/data/ first, then http://localhost:3000 (re-run after editing a CSV)
pnpm data:build     # CSVs → public/data/index.json + public/data/ex/<id>.json (the split data, §5.3)
pnpm check-data     # validate data/*.csv and data/ms/*.csv (fast, no build); --warnings lists every warning
pnpm typecheck      # tsc --noEmit
pnpm build          # data:build, then static export to ./out (fails on any CSV error)
pnpm preview        # serve ./out locally (port 3000)
pnpm verify         # check-data → typecheck → build → scripts/verify-out.mjs (stops at first failure)
pnpm ms:scrape      # crawl Muscle & Strength → data/ms/source/ms_exercises_raw.csv (pages cached in .cache/ms/)
pnpm ms:build       # raw facts + mapping + evidence → the data/ms/ database (§6.4)
```

`ms:scrape` needs `NODE_USE_SYSTEM_CA=1` on machines whose TLS goes through a custom root certificate (Node otherwise fails with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`).

There is **no test suite and no linter config**. Verification = `pnpm verify` plus a manual smoke check (see §11).

---

## 4. Repository layout

```
data/                         ← THE DATABASE (CSV, edited by hand or in a spreadsheet)
  categories.csv                body areas for browsing (chips + list sections), in display order
  muscle_groups.csv             19 Basic-view groups
  muscles.csv                   38 Advanced-view muscles, each mapped to a group (or none)
  exercises.csv                 one row per exercise (text content + metadata)
  exercise_muscles.csv          exercise × muscle × 1–5 rating (long format)
  ms/                           imported exercises (§6.4), merged with the files above by the loader

src/app/                      ← Next.js routes (server components)
  layout.tsx                    loads + validates CSVs, renders <MuscleGraph data={RefData}> around every page
  page.tsx                      "/" → returns null (the MuscleGraph is in the layout)
  exercises/[id]/page.tsx       "/exercises/<id>/" → generateStaticParams + generateMetadata, returns null
  not-found.tsx                 404 notice rendered above the MuscleGraph
  globals.css                   all styles (design tokens, light/dark, responsive)

src/components/               ← client UI ("use client")
  MuscleGraph.tsx                     state owner: UI state, URL sync, actions, derived paint/list; page shell
  context.ts                    Env / Paint / Actions contexts + types
  Figures.tsx                   <Figs>: front+back muscle map SVGs, hover/click delegation
  Readout.tsx                   the explanation box under the map
  Catalog.tsx                   search, category chips, muscle/joint select, grouped exercise list
  Detail.tsx                    one exercise + its animated demo
  Compare.tsx                   A/B comparison panel + side-by-side demos
  bits.tsx                      Meter, AddButton, PlayIcon, Thumb, useReducedMotion, useLoop (rAF)

src/lib/                      ← framework-free logic (also runs in Node scripts)
  types.ts                      domain types (Muscle, MuscleGroup, Category, Exercise, MuscleGraphData…)
  csv.ts                        RFC 4180 CSV parser + table reader
  load-data.ts                  reads data/*.csv, validates, returns MuscleGraphData (server/build only: uses fs)
  model.ts                      derived model: Basic/Advanced units, ratings split, compare maths, URLs
  anatomy-data.ts               body-map geometry: silhouette, FRONT/BACK muscle shapes, heads, joints
  anatomy.ts                    buildFigure(): turns geometry into SVG path data per body/view/level
  stick.ts                      stick-figure engine: pose solving (IK), props, SVG strings, viewBox fit, timing

src/data/demos.ts             ← animated form demos, keyed by demo id (= exercise id by default)
scripts/check-data.ts         ← `pnpm check-data`
scripts/ms-scrape.ts          ← `pnpm ms:scrape` (facts-only crawler)
scripts/ms-build.ts           ← `pnpm ms:build` (maps the facts onto muscles and joints)
scripts/build-public-data.ts  ← `pnpm data:build`: writes public/data/ (gitignored) from the loader
scripts/verify-out.mjs        ← checks out/ has a page and a detail file per exercise; flags oversized pages
AGENTS.md                     ← pointer to this spec + Next.js-managed block (don't edit the block)
.cursor/rules/*.mdc           ← Cursor project rules (scoped guidance)
.cursor/skills/*/SKILL.md     ← Cursor skills (repeatable workflows)
```

Generated or ignored: `.next/`, `out/`, `node_modules/`, `next-env.d.ts`, `*.tsbuildinfo`.

---

## 5. Architecture and data flow

```
            BUILD TIME (Node)                                  BROWSER
┌──────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│ data/*.csv                                │   │ <MuscleGraph data> (client, mounted once)          │
│   └─ lib/csv.ts  parseCsv/readCsvTable    │   │   buildModel(data)      → Model (memo)       │
│   └─ lib/load-data.ts  loadMuscleGraphData()    │   │   makeView(model,level) → ViewHelpers        │
│        validate → DataError (stops build) │   │   UiState (useState) + URL (usePathname)     │
│        warnings → console                 │   │   ├─ EnvCtx    model, v, gender, level, RM   │
│ app/layout.tsx (server component)         │──▶│   ├─ PaintCtx  unit→class map, hl, joints    │
│   <MuscleGraph data={RefData}>{children}      │   │   └─ ActionsCtx stable action object         │
│ app/exercises/[id]/page.tsx               │   │   Figs ×1–2 · Readout · Catalog · Detail ·   │
│   generateStaticParams (one per CSV row)  │   │   Compare · tray                              │
│   generateMetadata (title/description)    │   └──────────────────────────────────────────────┘
└──────────────────────────────────────────┘
```

### 5.0 Data splitting

With 1,273 exercises the dataset must not ride along in every page, so it is split (`lib/types.ts`, `lib/pack.ts`, `scripts/build-public-data.ts`):

| piece | where | contents |
|---|---|---|
| `RefData` | embedded by `layout.tsx` | muscles, groups, categories, evidence sources (a few KB) |
| `public/data/index.json` | fetched once by `MuscleGraph` (`lib/use-data.ts`) | every exercise's `ExerciseCore` in a packed array form (~350 KB, ~30 KB gzipped): ratings, joint scores, equipment, level, demo id, which ratings are EMG-measured |
| `public/data/ex/<id>.json` | fetched when an exercise opens (`useDetail`) | `ExerciseDetail`: setup, steps, cues, mistakes, note, joint actions, rating provenance (`basis`), source link |

`public/data/` is generated (gitignored) by `pnpm data:build`, which `dev` and `build` run first. `MuscleGraph` renders with an empty exercise list until the index arrives (the Catalog shows "Loading exercises…"). `Figs` draws the maps only after mount, and each exercise page adds a `<noscript>` article with its text, so every prerendered page is ~20–30 KB.

### 5.1 Routing (important and unusual)

- The **whole interactive MuscleGraph lives in the root layout** (`app/layout.tsx` → `<MuscleGraph>`), so it **stays mounted** while the URL changes between `/` and `/exercises/<id>/`. Page components return `null`; they only exist so each URL is prerendered with its own `<title>`/description.
- **The URL decides which exercise is open.** `MuscleGraph` reads `usePathname()` → `idFromPath()` → `routeSel`. A local `sel` state mirrors it, so a click opens the detail instantly before navigation finishes.
  - `openDetail(id)` → `setSel(id)` + `router.push("/exercises/<id>/", { scroll: false })`
  - `closeDetail()` → `setSel(null)` + `router.push("/")`
  - Back/forward → pathname changes → effect syncs `sel`.
- Every prerendered exercise page is the full MuscleGraph with that exercise open, so deep links work without JavaScript and before hydration.
- **Only the open exercise is in the URL.** Search, filters, mode (compare), picks and toggles are in-memory state (toggles persist in `localStorage`). Adding query-param state under static export means `useSearchParams` inside a `<Suspense>` boundary.
- `trailingSlash: true` → **internal paths must end in `/`** (use `exercisePath(id)` from `lib/model.ts`).
- `dynamicParams = false` on `[id]`: unknown ids return a 404. `not-found.tsx` renders a notice and the MuscleGraph renders below it.

### 5.2 Static export constraints (do not break)

There is no server at runtime. **Not available:** route handlers with runtime behaviour, middleware, server actions, `cookies()`/`headers()`, ISR/`revalidate`, image optimization, dynamic routes without `generateStaticParams`. Anything dynamic happens in the browser.

`load-data.ts` uses `node:fs` and must **only** be imported from server components (`app/**` files without `"use client"`) and `scripts/`. Client components receive data as props.

---

## 6. Data model (`data/*.csv`)

Five hand-edited files (`data/`) plus the generated import (`data/ms/`, §6.4), related by ids. **Ids are lowercase slugs** (`^[a-z0-9]+(-[a-z0-9]+)*$`). Exercise ids become URLs. Row order is meaningful (see §6.3).

```
categories.csv ──< exercises.csv ──< exercise_muscles.csv >── muscles.csv >── muscle_groups.csv
```

### 6.1 Schemas

**`categories.csv`**: `id, name`. Display order of chips and list sections.

**`muscle_groups.csv`** (Basic view units): `id, name, region`. `region` ∈ `Top | Torso | Arms | Legs`.

**`muscles.csv`** (Advanced view units): `id, name, short_name, region, group`
- `group` = a `muscle_groups.id`, or **empty** to show the muscle only in Advanced view (currently `neck`, `serratus`, `hip-flexors`).
- **Each `id` must match a shape id in `src/lib/anatomy-data.ts` (`FRONT`/`BACK`)** to be drawn. Without one it works in lists and comparisons but isn't on the map (validation warns).

**`exercises.csv`**: `id, name, variant, category, kind, joints, setup, steps, cues, mistakes, note, video_search, demo`

| column | rule |
|---|---|
| `id`, `name`, `category` | required. `category` = a `categories.id` |
| `kind` | empty = normal exercise; `Mobility` / `Stretch` / `Strength` = **joint drill**. `Stretch` relabels muscle lists as "Main stretch / Also stretches" and drops "proper form" from the video query |
| `joints` | `;`-separated joint ids: `shoulder elbow wrist hip knee ankle upper-spine scapula lower-spine` (defined in `anatomy-data.ts` `JOINTS`). Shown in Advanced view |
| `steps`, `cues`, `mistakes` | lists separated by ` \| ` (so text must never contain `\|`) |
| `note`, `video_search` | optional. `video_search` defaults to the name |
| `demo` | optional demo id in `src/data/demos.ts`. Empty → use the demo whose id equals the exercise id; none → no demo area, list thumbnail or Compare video is shown for it (nothing is rendered in its place) |
| `equipment`, `mechanics`, `force`, `level`, `source_name`, `source_url` | optional (used by the imported rows): filters, facts and the "catalogued from" link. Extra columns such as `movement` are ignored |

**`exercise_muscles.csv`**: `exercise_id, muscle_id, score`. One row per pair, `score` is an integer 1–5.

| score | meaning | role |
|---|---|---|
| 5 | main target | primary |
| 4 | major | primary |
| 3 | moderate | secondary |
| 2 | assists | secondary |
| 1 | minor | secondary |

Omit a muscle the exercise doesn't meaningfully work. Optional columns `basis` (`emg` or `model`, default `model`) and `sources` (`;`-list of ids from `data/ms/evidence/sources.csv`, required when `basis=emg`) record where a rating comes from; the UI marks `emg` ratings with an "EMG" badge and cites the studies.

**`exercise_joints.csv`** (`data/ms/`, covers curated and imported exercises): `exercise_id, joint_id, score, action`. Score 1–5 = how much the joint moves or is held under load. When an exercise has rows, its `joints` list = joints scoring ≥ 4 (≥ 3 for stretches/mobility); otherwise the `joints` column is used, each at 4.

### 6.2 Validation (`lib/load-data.ts`)

`loadMuscleGraphData()` returns `{ data, warnings }`. It is cached until a CSV's mtime changes, and throws a `DataError` listing **every** problem as `file line N: message`.

- **Errors (build stops):** missing file or required column; bad or duplicate id; empty name; unknown region / group / category / kind / joint / explicit demo; unknown exercise or muscle in ratings; score not an integer 1–5; duplicate exercise×muscle pair; no exercises. Rating rows for an exercise that already failed validation are skipped rather than reported again.
- **Warnings (logged):** muscle without a map shape; group with no muscles; exercise with no demo, no setup, no steps, or no ratings.

CSV parsing (`lib/csv.ts`): RFC 4180 (quoted commas, newlines and `""`), UTF-8 BOM and CRLF tolerated, cells trimmed, blank lines skipped, header matched case-insensitively, extra columns ignored.

### 6.3 Derived rules (`lib/model.ts`)

- **Exercise order**: by category (file order), then by row order in `exercises.csv`.
- **Unit order**: Advanced = `muscles.csv` order, Basic = `muscle_groups.csv` order. The filter `<select>` groups them by `REGIONS`.
- **Basic rating** for a group = **max** of its member muscles' ratings.
- **Primary** = rating ≥ 4, **secondary** = 1–3, each sorted by rating descending. Ties keep the **row order of `exercise_muscles.csv`** (stable sort over insertion order).
- **Basic hint**: muscles with no group and a rating ≥ 3 are listed as "Also works …, shown in the Advanced view".
- **Comparison category** `cat(a, b)` → colour class `c0…c6`: only A (0), A ≥ 2 higher (1), A 1 higher (2), equal (3), B 1 higher (4), B ≥ 2 higher (5), only B (6).
- **Closest match** `bestMatch(id)` = the exercise maximising Σ min(ratingA, ratingB) over shared Advanced muscles; the first in exercise order wins ties.
- **Search** matches name, variant, kind, muscle short names, group names and joint names (case-insensitive substring).

### 6.4 The imported database (`data/ms/`)

1,211 exercises scraped from muscleandstrength.com (every exercise in its sitemap and listing pages, 2026-11-05), merged by the loader with the 62 curated ones (1,273 total). **Generated: edit the inputs, then rerun `pnpm ms:build`, never the outputs** (`exercises.csv`, `exercise_muscles.csv`, `exercise_joints.csv`). Reference tables (muscles, groups, categories) always come from `data/`. An imported slug that collides with a curated id gets an `-ms` suffix.

**Inputs**
- `source/ms_exercises_raw.csv`: verbatim facts (name, URL, target/secondary muscle labels, equipment, mechanics, force, level).
- `mapping/`: `movement_rules.csv` (ordered regexes: name, optionally limited by M&S target/type → movement pattern; first match wins), `movements.csv` (pattern id, name, demo), `muscle_map.csv` (M&S label × movement → muscle id + 0–1 weight; `*` = default), `movement_joints.csv` (movement → joint scores + action), `ms_targets.csv` (label → category, fallback joints, stretch demo), `instructions.csv` (original written guidance per movement), `equipment_notes.csv` (one setup sentence per equipment), `curated_movements.csv` (movement of each hand-curated exercise, to give them joint scores).
- `evidence/sources.csv` + `evidence/emg.csv`: published studies and the findings taken from them.

**Provenance tiers (be honest about this in any UI or copy)**
- `basis=emg`: the rating was set from a published study. Today that is 151 ratings across 62 exercises, from the ACE-commissioned EMG studies (triceps, shoulders, chest, back, biceps, glutes, hamstrings, abs). `emg.csv` kinds: `pct_mvc` (one muscle, % of maximal voluntary contraction → bands ≥80→5, 60–79→4, 40–59→3, 20–39→2, 5–19→1), `pct_ref` (muscle group as % of a reference lift, same bands, applied as a shift so the model's split between parts is kept), and qualitative `top` (→5), `high` (→ at least 4), `lower` (→ at most 3) where a study ranks exercises without numbers. Overlays apply to imported exercises only; the curated ratings are never changed.
- `basis=model` (everything else): target base 5, secondary base 3 (2 for isolation; 4/2 for stretches) × the 0–1 weight in `muscle_map.csv`, rounded, min 1. These are anatomical estimates, not measurements. No public EMG data exists per exercise × muscle for most of the catalogue, and none for joints.
- **Joint scores** are modelled per movement pattern from joint mechanics (`movement_joints.csv`), never measured per exercise.
- **Instructions** are original text written per movement pattern and tailored by equipment and by words in the exercise's name (unilateral, alternating, paused, weighted, Smith); they are not copied from any site (§8.8).
- **Animations:** the site shows an animation only for exercises that have their own (the 62 curated ones). Imported exercises have an empty `demo`; the movement's closest demo is kept in the `pattern_demo` column (from `movements.csv`) and can be copied into `demo` to turn shared animations back on. Demos for jump, sled, get-up, battle ropes and throw/slam exist in `demos.ts` for that purpose.

`ms:build` validates every id in the mapping and evidence tables (unknown exercise slugs, muscles or sources stop it), and prints labels missing from `muscle_map.csv` and exercises that matched no movement rule; keep both lists empty.

---

## 7. UI state and rendering

### 7.1 State (`components/MuscleGraph.tsx`)

`UiState`: `mode` (`browse|compare`), `level` (`basic|advanced`), `gender` (`male|female`), `session` (category id or `"all"`), `qRaw` (search), `muscle` (unit id filter), `joint`, `picks` (≤1 exercise waiting for compare), `hover`/`hoverJ` (map hover), `tap`/`tapJ` (compare-mode taps), `ca`/`cb` (compare A/B ids, default `back-squat`/`leg-press`), `hl` (outlined unit), `flash` (compare row to highlight/scroll). Plus `sel` (open exercise, synced with URL).

- **Persistence:** `musclegraph-gender` and `musclegraph-level` in `localStorage`, read in an effect **after hydration** so server and client HTML match. Every storage access is wrapped in try/catch.
- **Contexts** are split so memoised children re-render only when their input changes:
  - `EnvCtx`: model, view helpers `v`, gender, level, reduced-motion flag.
  - `PaintCtx`: `cls` (unit id → `pri|sec|c0…c6|dim`), `hl`, `activeJoints`.
  - `ActionsCtx`: **one stable object** built once with `useMemo`. Actions read current state through `stRef.current` / `selRef.current`, not closures. **New actions must follow this pattern**, or they will read stale state.
- **Scrolling** after state changes goes through `pending.current` and a layout effect (`useIsoLayoutEffect`).
- Level-dependent lookups always go through `v` (`makeView`): `v.X(e)` ratings, `v.P(e)`/`v.S(e)` primary/secondary, `v.unitOf(muscleId)`, `v.uName`, `v.uShort`, `v.trains`.

### 7.2 Muscle map (`Figures.tsx` + `lib/anatomy*.ts`)

- `buildFigure(view, pfx, gender, level, groupOf)` returns plain geometry (paths, patterns, joints) and is memoised per view/pfx/gender/level. `Figure` renders it as JSX.
- **Basic** merges a group's member shapes under one outline (`.bg > .bo + .m.bm + .fib`). **Advanced** draws each muscle separately, shrunk 3.5% for visible separation.
- Every muscle path has `data-m="<muscle id>"`. Paths whose muscle has no unit at the current level get class `off`. Colours come from `PaintCtx` classes.
- `pfx` keeps `<pattern>` ids unique per copy: `m` = main map, `d` = mini map in Detail, `c` = mini map in Compare. Mini maps show only under 900px wide (CSS).
- Hover and click use **event delegation** on `.figs` (`.m[data-m]`, `.jt[data-j]`). Hover is ignored on touch devices (`(hover: hover)`).

### 7.3 Stick-figure demos (`lib/stick.ts` + `data/demos.ts` + `bits.tsx`)

- A `Demo` is 2–3 key poses (`frames`) plus `props` (equipment). The field reference is in the header comment of `lib/stick.ts`. Side view: hip/torso angle/ankles/wrists, solved with 2-link IK. Front view: pelvis/tilt/ankles/wrists, with the left side mirrored when omitted.
- `sceneSvg()` returns an **SVG string**. The animation loop (`useLoop`, requestAnimationFrame) writes it into the `<svg>` via `innerHTML` each frame, so React doesn't reconcile ~30 elements 60 times a second. The first pose is server-rendered with `dangerouslySetInnerHTML`, so static HTML shows a figure before JavaScript runs.
- Timing: hold 600 ms, move 1150 ms (eased); 2 frames ping-pong, 3+ go forward then back. `prefers-reduced-motion` → a still final pose with a faded ghost of the first, and Play still works.
- `fitBox(demo)` computes a viewBox (11:9) that fits all frames and props. Floor line at y = 160.
- Thumbnails use a module-level cache keyed `demoId|gender`.

### 7.4 Styling (`app/globals.css`)

- Design tokens on `:root` (`--bg --surface --ink --pri --sec --c0…--c6 …`). Dark mode redefines them under `@media (prefers-color-scheme: dark)` (unless `data-theme="light"`) and under `[data-theme="dark"]`.
- **Class names are a contract between `globals.css` and the components** (`.m .pri .sec .c0–.c6 .dim .hl .off .bm .bo .bg .fib .jt .on .ex .exrow .chip .seg .crow .demo .cdemo .tray …`). Rename both together.
- Breakpoints: `max-width: 899px` (single column, mini maps, "Show the list" button) and `max-width: 520px` (compact cards and compare table).
- Fonts: Barlow (body), Barlow Condensed (headings, names, numbers).

### 7.5 Accessibility conventions

Toggle buttons use `aria-pressed`; icon-only buttons get `aria-label` and `title`; the readout is `aria-live="polite"`; compare rows are focusable (`tabIndex=0`) and highlight on focus; Escape closes the open exercise and returns focus to its list card; the motion preference is respected.

---

## 8. Conventions (follow these)

1. **Content lives in CSV**, not in components. New per-exercise data means a new CSV column, parsed in `load-data.ts` and typed in `types.ts`.
2. **Drawings live in code** (`anatomy-data.ts`, `demos.ts`). Keep ids in sync with the CSVs.
3. **Client/server boundary:** `lib/load-data.ts` (fs) is server/build only. Everything in `components/` is `"use client"`. `lib/model.ts`, `lib/stick.ts`, `lib/anatomy*.ts` and `lib/csv.ts` are pure and usable from both sides.
4. **Determinism for hydration:** no `window`, `localStorage`, `Date.now()` or `Math.random()` during render. Read browser state in effects.
5. **No new runtime dependencies** without a clear need. There's no Tailwind, UI kit, state library or animation library.
6. **TypeScript strict.** Prefer the existing types; `any` is confined to the demo frame/prop shapes in `stick.ts`.
7. **Static export only:** see §5.2.
8. **Text you write for exercises must be original.** Don't paste instructions or tips from other sites; link to sources with `video_search` or a note instead.
9. **Keep docs in sync:** schema or structure changes update this file, `README.md` (user-facing CSV guide) and the relevant `.cursor/rules` file in the same change.

---

## 9. How to make common changes

### Add an exercise
1. Row in `data/exercises.csv` (pick a `category`; leave `kind` empty unless it's a joint drill; set `demo` to reuse a similar animation if needed).
2. Rows in `data/exercise_muscles.csv` (score 1–5; use ids from `data/muscles.csv`).
3. `pnpm check-data` → open `/exercises/<id>/` in `pnpm dev`.
(Full procedure: `.cursor/skills/add-exercise/SKILL.md`.)

### Add or change a demo animation
Edit `src/data/demos.ts` (key = demo id). Start from the closest existing demo. `labels.length` should equal `frames.length`. (Procedure: `.cursor/skills/author-demo/SKILL.md`.)

### Add a muscle (Advanced)
1. Row in `data/muscles.csv` (`group` = existing group id, or empty for Advanced-only).
2. Shape `[id, rightHalfPoints, fibreAngle]` in `FRONT` and/or `BACK` in `src/lib/anatomy-data.ts`. Points are the **right half** of the body (x ≥ 100) in the 200×420 viewBox and are mirrored automatically. Arm muscles also go in `ARM_IDS` in `anatomy.ts`.
3. Ratings rows that use the new id.

### Add a Basic muscle group
Row in `data/muscle_groups.csv`, then set the `group` column of its muscles in `data/muscles.csv`. Basic-view shapes come from the members' shapes, so no drawing is needed.

### Add a body-area category
Row in `data/categories.csv` (position = display order), then use its id in `exercises.csv`.

### Add a joint
Add to `JOINTS` in `src/lib/anatomy-data.ts` (`view`, and `pts` with `kind`, or `spine: [y0, y1]`). Then it can be used in the `joints` column.

### Add a field to exercises
`types.ts` (`Exercise`) → `load-data.ts` (parse + validate, optional columns default to empty) → UI (`Detail.tsx`, etc.) → document it in §6.1 here and in `README.md`.

### Add UI state or an action
State goes in `UiState` (`MuscleGraph.tsx`); action signature in `Actions` (`context.ts`); implementation in the `actions` `useMemo`, reading state via `stRef.current`. Map-affecting state belongs in the `paint` memo. Toggles that should persist use the `store` helper (try/catch) and are read after hydration.

### Change the rating semantics
`RATING`, `cat()`, the primary threshold (≥4 in `split()`), and copy in `Compare.tsx`/`README.md`/this spec.

---

## 10. Known limitations and gotchas

- **Page weight:** solved by data splitting (§5.0): ~20–30 KB per HTML page, `out/` ≈ 110 MB on disk for 1,273 pages plus 1,273 detail files (mostly filesystem block overhead). The exercise list is one ~350 KB (~30 KB gzipped) fetch on first load. Keep new per-exercise fields out of `ExerciseCore` unless the list or Compare needs them.
- **Requires JavaScript** for the interactive app: the list and maps are client-rendered after the index loads. Without JS each exercise page shows a plain text version (`<noscript>`).
- **First visit in dev:** a newly added exercise's page can 404 once in `pnpm dev` while Next refreshes its static params; it loads on retry. Production builds are unaffected.
- **Brief flash** when a saved toggle (female/Advanced) is applied after hydration.
- **`AGENTS.md`**: `next dev` keeps a managed `nextjs-agent-rules` block in it. Leave that block as is and keep project guidance outside it (or here).
- **Fonts** load from Google at runtime; offline previews fall back to system fonts.
- **No automated tests.** If adding them, Playwright smoke tests against `out/` (served) fit best.

---

## 11. Verification checklist (run before calling a change done)

1. `pnpm verify`, which runs:
   - `pnpm check-data`: no errors; new warnings are understood.
   - `pnpm typecheck`: clean.
   - `pnpm build`: succeeds; the "Generating static pages" count = number of exercises + 3 (1,276 for 1,273 exercises).
   - `node scripts/verify-out.mjs`: every exercise id has a page and a `data/ex/<id>.json`; flags pages over 80 KB.
2. Look at the build-time data warnings and the page-size line from the last step.
3. Leave the `nextjs-agent-rules` block in `AGENTS.md` untouched.
4. `pnpm preview` (or `pnpm dev`), then check what you touched:
   - `/` loads; the stats show the right counts; clicking a muscle filters the list.
   - An exercise page (`/exercises/<id>/`): demo animates, muscles listed, back button returns to the list.
   - Compare: "+ Compare" on two cards → colours, table and both demos.
   - Toggle Female and Advanced, reload: they persist; joints show in Advanced.
   - Narrow window (~390px): no horizontal scroll; mini map shows under the demo.
   - Dark mode and reduced motion, if you touched styles or animation.
5. Browser console: no errors or hydration warnings (dev mode reports them).
6. Docs updated if structure or schema changed (§8.9).

The `verify-MuscleGraph` skill (`.cursor/skills/verify-MuscleGraph/`) walks through this list.

---

## 12. Open items

- **Growing the EMG-backed share.** Only 62 of 1,273 exercises have any study-measured rating. More sources can be added as rows in `evidence/emg.csv` (+ `sources.csv`); the build validates ids and re-derives ratings. Good next sources: Contreras (glute/hip-thrust/squat studies), Schoenfeld (chest/back/quads), and the other ACE studies.
- **Animations:** one animation per movement pattern, not per exercise. A bespoke demo for an exercise is a `demos.ts` entry plus its `demo` column.
- **Instructions** are per pattern; exercise-specific cues (grip widths, angles) would need per-exercise overrides.
- Offer still open: plainer public-facing names (e.g. "Hack squat single-leg step-up" → "Single-leg step-up").
