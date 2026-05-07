# YouTube Queue - Current State

## As Of

- Checked: 2026-05-07 09:38:25 EDT
- Branch: `main`
- HEAD: `46e097f`
- Remote status: `ahead 2` vs `origin/main`
- Worktree state:
  - modified: `README.md`
  - untracked: `.codex/`, `AGENTS.md`, `docs/04-ai-knowledge-system-roadmap.md`, `graphify-out/`

## Current Reality

This repo is no longer a planning-only scaffold. The app is implemented as a personal Next.js 14 + PostgreSQL + Drizzle + pgvector system for:

- syncing YouTube playlists into a shared video library
- browsing a prioritized queue with watch-state filters
- managing manual tags
- running AI enrichment on videos
- clustering semantically related videos

The product direction has now expanded from "video queue" to "topic-centered knowledge system". That direction is captured in [04-ai-knowledge-system-roadmap.md](./04-ai-knowledge-system-roadmap.md).

## What Is Implemented

### Core app

- playlist sync and video upsert logic in [src/lib/sync.ts](../src/lib/sync.ts)
- queue/dashboard UI in [src/components/dashboard/watch-next.tsx](../src/components/dashboard/watch-next.tsx)
- settings UI for playlists and tags in [src/app/settings/page.tsx](../src/app/settings/page.tsx)
- video listing, filtering, and score-based sorting via [src/app/api/videos/route.ts](../src/app/api/videos/route.ts)

### AI and discovery

- transcript fetch with description fallback in [src/lib/ai/transcript.ts](../src/lib/ai/transcript.ts)
- video summary and `keyTopics` extraction in [src/lib/ai/summarize.ts](../src/lib/ai/summarize.ts)
- embeddings and persistence in [src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts)
- semantic clustering in [src/lib/ai/clustering.ts](../src/lib/ai/clustering.ts)
- cluster browsing UI in [src/app/clusters/page.tsx](../src/app/clusters/page.tsx)

### Planning artifacts

- strategy and end-state plan in [04-ai-knowledge-system-roadmap.md](./04-ai-knowledge-system-roadmap.md)
- older architecture and feature docs remain useful, but some historical sections still refer to the pre-Postgres design

## What Is Not Done Yet

### Knowledge-system evolution

The roadmap exists, but the implementation has not started for:

- first-class `topics`
- `video_topics`
- `video_insights`
- `knowledge_bases`
- review workflows for AI-suggested topics
- topic pages and knowledge-base pages

### Repo hygiene

- `docs/progress.json` is stale and still claims SQLite + Prisma
- the README docs list has been updated, but repo-native current-state handoff only starts with this file

## Verified Health

### Passing

- `npm run lint`

### Failing

- `npm run build`

Current verified build blocker:

- `scripts/db-bootstrap.ts` imports `pg`, but `@types/pg` is not installed, so type checking fails during `next build`

## Known Issues

### 1. Build blocker

- file: [scripts/db-bootstrap.ts](../scripts/db-bootstrap.ts)
- issue: missing `@types/pg`
- impact: production build currently fails even though app code compiles

### 2. Stale machine-readable progress doc

- file: [progress.json](./progress.json)
- issue: still reports SQLite + Prisma instead of PostgreSQL + Drizzle + pgvector
- impact: future agents can be misled if they trust that file first

### 3. Handoff source only partially normalized

- `AGENTS.md` contains useful observations and local memory
- `current-state.md` should now become the canonical near-term handoff source
- impact: future work should update this file at the end of each milestone

## Active Workstream

The active product workstream is:

- evolving the app from queue + summaries into a multi-topic AI-assisted knowledge system

The current implementation entrypoint for that effort is:

- [04-ai-knowledge-system-roadmap.md](./04-ai-knowledge-system-roadmap.md)

## Next 3 Steps

1. Fix the current build blocker by adding `@types/pg` or an equivalent typed module declaration and re-run `npm run build`.
2. Start Phase A from the roadmap by extending [src/lib/db/schema.ts](../src/lib/db/schema.ts) with `topics`, `video_topics`, and `video_insights`.
3. Replace the current summary-only extraction contract in [src/lib/ai/summarize.ts](../src/lib/ai/summarize.ts) with a structured knowledge extraction payload, then persist it from [src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts).

## How To Resume

For a fresh agent handoff, read in this order:

1. [current-state.md](./current-state.md)
2. [04-ai-knowledge-system-roadmap.md](./04-ai-knowledge-system-roadmap.md)
3. [README.md](../README.md)
4. [graphify-out/GRAPH_REPORT.md](../graphify-out/GRAPH_REPORT.md)
5. the code files listed under "What Is Implemented"

## Verification Commands

Run these from the repo root:

```bash
git status --short --branch
git rev-parse --short HEAD
npm run lint
npm run build
```

Expected results right now:

- `lint` passes
- `build` fails on the missing `pg` type declaration

## Rule For Future Milestones

When repo reality changes, update this file in the same milestone. Do not treat current-state handoff as a later cleanup task.
