# Muscle Graph

A strength-training reference: a muscle map you can click, animated form demos for every exercise, and a side-by-side comparison of any two exercises, muscle by muscle.

It's a Next.js app that builds to a **fully static site** (`out/`). Every exercise gets its own prerendered page (`/exercises/back-squat/`, …), so links are shareable and the back button works. All exercise content lives in **CSV files in `data/`** that you can edit in any spreadsheet or text editor.

## Run it

You need Node.js 20.9+ and pnpm (`npm i -g pnpm` or `corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:3000 — after editing a CSV, run `pnpm data:build` (or restart) and refresh
pnpm build        # writes the static site to ./out
pnpm preview      # serves ./out locally to check the real build
pnpm check-data   # validates the CSVs without building
pnpm data:build   # regenerates public/data/ (the split data the app fetches); dev and build run it for you
pnpm ms:build     # rebuilds the imported 1,211-exercise database in data/ms/ from its mapping and evidence tables
pnpm verify       # check-data, typecheck, build and check the export
```

Next.js has its own dev server and bundler (Turbopack), so there's no Vite in this project; `pnpm dev` is the equivalent of `vite`.

## Deploy to Netlify

- **Drag and drop:** run `pnpm build`, then drop the `out` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
- **From Git:** push the repo and create a site from it. `netlify.toml` already sets the build command (`pnpm build`) and publish folder (`out`).

`out/` is plain HTML, CSS and JS, so it also works on any other static host (GitHub Pages, Cloudflare Pages, S3, …).

## The database (`data/*.csv`)

Five files, related by id. Ids are lowercase words joined by hyphens (`bulgarian-split-squat`); an exercise id also becomes its URL.

```
categories.csv ──< exercises.csv ──< exercise_muscles.csv >── muscles.csv >── muscle_groups.csv
 (body areas)       (one row per       (one row per exercise      (38 detailed      (19 simple
                     exercise)          × muscle, with a 1–5       muscles,          groups,
                                        rating)                    Advanced view)    Basic view)
```

Row order matters: exercises are listed in file order within their category, categories and groups appear in file order.

### `exercises.csv` — one row per exercise

| column | required | what it is |
|---|---|---|
| `id` | yes | unique id, also the page URL |
| `name` | yes | display name |
| `variant` | | the line under the name, e.g. "Barbell, high or low bar" |
| `category` | yes | an `id` from `categories.csv` |
| `kind` | | empty for a normal exercise; `Mobility`, `Stretch` or `Strength` marks a joint drill. `Stretch` relabels the muscles as "Main stretch / Also stretches" |
| `joints` | | joint ids separated by `;`: `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `upper-spine`, `scapula`, `lower-spine` (shown in Advanced view) |
| `setup` | | setup paragraph |
| `steps` | | numbered steps, separated by ` \| ` |
| `cues` | | cues, separated by ` \| ` |
| `mistakes` | | common mistakes, separated by ` \| ` |
| `note` | | optional callout under the mistakes |
| `video_search` | | YouTube search text for "Watch a video demo" (defaults to the name; " proper form" is added unless it's a stretch) |
| `demo` | | which animation to show. Empty = the demo with the same id as the exercise. Put another exercise's id here to reuse its animation |

### `exercise_muscles.csv` — how hard each exercise works each muscle

This is what powers the map colours, the Primary/Secondary lists, the muscle filter, "closest match" and the whole comparison view.

| column | what it is |
|---|---|
| `exercise_id` | an `id` from `exercises.csv` |
| `muscle_id` | an `id` from `muscles.csv` |
| `score` | 1–5: **5** main target · **4** major · **3** moderate · **2** assists · **1** minor |

- Ratings of **4–5 are primary**, 1–3 secondary.
- Leave a muscle out entirely if the exercise doesn't meaningfully work it.
- In Basic view a group shows the highest rating among its muscles (e.g. Quads = max of the three quad heads).
- When two muscles have the same rating, the one listed first in this file is listed first on the page.
- Comparing A and B uses these numbers directly: a difference of 2+ is "much harder", 1 is "harder", 0 is "even", and a muscle rated in only one of them is "only A / only B".

### `muscles.csv` — the detailed muscles (Advanced view)

`id, name, short_name, region, group` — `region` is one of `Top`, `Torso`, `Arms`, `Legs`. `group` is an id from `muscle_groups.csv`; leave it empty to show the muscle only in Advanced view (neck, serratus and hip flexors are set up that way).

Each muscle's shape on the body map is drawn from `src/lib/anatomy-data.ts`, keyed by the same id. If you rename a muscle id, rename it there too; a muscle with no shape still works everywhere except the map (`pnpm check-data` warns about it).

### `muscle_groups.csv` — the simple groups (Basic view)

`id, name, region`. Assign muscles to a group with the `group` column in `muscles.csv`.

### `categories.csv` — body areas used for browsing

`id, name`, in the order the chips and list sections appear.

### Adding an exercise

1. Add a row to `exercises.csv`. If there's no animation for it, leave `demo` empty and the demo area (and list thumbnail) is simply left out; to reuse an existing animation, set `demo` to its id (e.g. `back-squat` for a goblet squat).
2. Add one row per muscle to `exercise_muscles.csv`.
3. Run `pnpm check-data` (or just refresh `pnpm dev`).

```csv
goblet-squat,Goblet squat,Dumbbell held at the chest,legs,,,"Hold one dumbbell against your chest…",Brace and sit down | Drive up through the whole foot,Chest proud | Elbows inside knees,Heels lifting,,goblet squat,back-squat
```
```csv
goblet-squat,quads-vl,5
goblet-squat,quads-vm,5
goblet-squat,glutes,4
goblet-squat,adductors,3
```

### Editing in Excel, Numbers or Google Sheets

Open the CSV, edit, and save it back as CSV. In Excel choose **CSV UTF-8** so characters like `–` and `°` survive. Cells that contain commas just need the usual CSV quotes, which spreadsheets add for you. Lists inside one cell use `|`, so don't use `|` in your text.

### When something is wrong

`pnpm build`, `pnpm dev` and `pnpm check-data` all stop with a list of problems, each with its file and line, e.g.

```
✗ The CSV data in data/ has 2 problems:
  • exercises.csv line 3: category "legz" is not an id in categories.csv (legs, glutes-hamstrings, …)
  • exercise_muscles.csv line 339: score "7" must be a whole number from 1 to 5
```

Things that are allowed but probably unintended (an exercise with no ratings or no demo, a muscle with no shape) are printed as warnings.

## What isn't in the CSVs, and where it is

These are drawings rather than data, so they stay in code:

- **Form demos** — `src/data/demos.ts`. Each demo is 2–3 key poses that loop; the field reference is at the top of `src/lib/stick.ts`.
- **Body map shapes and joint markers** — `src/lib/anatomy-data.ts` (outline points per muscle, mirrored left/right).

## Project layout

```
data/                     the CSV database
src/app/                  Next.js routes: / , /exercises/[id]/ , 404, global CSS
src/components/           MuscleGraph (state, routing), Figures (muscle map), Catalog (list),
                          Detail, Compare, Readout, shared bits
src/lib/load-data.ts      reads + validates the CSVs at build time
src/lib/csv.ts            CSV parser (quotes, commas and line breaks inside cells, BOM)
src/lib/model.ts          ratings, Basic/Advanced groups, comparison maths
src/lib/anatomy*.ts       body map geometry
src/lib/stick.ts          stick-figure animation engine
src/data/demos.ts         the animations
scripts/check-data.ts     `pnpm check-data`
scripts/ms-build.ts       `pnpm ms:build` (imported database; see project_spec.md §6.4)
scripts/build-public-data.ts  `pnpm data:build`
```

The whole interactive page is one client component rendered from the root layout, so it stays mounted while the URL changes between `/` and `/exercises/<id>/`. Each route is still prerendered with that exercise open, with its own `<title>` and description. Body type and Basic/Advanced are remembered per browser (`localStorage`).

## Notes

- `next dev` writes an `AGENTS.md` file into the project for AI coding tools. That's normal Next.js behaviour; commit it or ignore it.
- In `pnpm dev`, the very first visit to a newly added exercise's page can log one 404 while Next refreshes its page list; it loads on the retry. Production builds aren't affected.
