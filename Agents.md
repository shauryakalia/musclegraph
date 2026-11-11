# Agent instructions

Muscle Graph: a static Next.js 16 site (muscle map, exercise demos, comparisons) whose content lives in CSV files under `data/`.

- **Read `project_spec.md` first.** It covers architecture, the CSV data model, state, conventions, how-to recipes and the verification checklist. Keep it in sync when you change any of those.
- Cursor: scoped rules are in `.cursor/rules/`, and repeatable workflows (add an exercise, author a demo, verify a build) are in `.cursor/skills/`.
- Done means `pnpm verify` passes and the affected screen has been checked in `pnpm dev`.

The block below is maintained by `next dev`. Leave it as is.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
