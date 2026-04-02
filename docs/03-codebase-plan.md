# YouTube Queue — Codebase Plan

## Project Structure

```
youtube-queue-app/
├── docs/                           # Planning & architecture docs
│   ├── 00-product-vision.md
│   ├── 01-feature-requirements.md
│   ├── 02-technical-architecture.md
│   ├── 03-codebase-plan.md
│   └── progress.json
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                  # Auto-generated migrations
│   └── seed.ts                     # Seed data (sample tags, test videos)
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (html, body, providers)
│   │   ├── page.tsx                # Dashboard (main page)
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings page (playlists, sync config, scoring)
│   │   └── api/                    # API routes
│   │       ├── playlists/
│   │       │   ├── route.ts        # GET (list), POST (add)
│   │       │   └── [id]/
│   │       │       ├── route.ts    # DELETE
│   │       │       └── sync/
│   │       │           └── route.ts # POST (sync one playlist)
│   │       ├── sync/
│   │       │   └── route.ts        # POST (sync all — also cron target)
│   │       ├── videos/
│   │       │   ├── route.ts        # GET (list with filters)
│   │       │   ├── stats/
│   │       │   │   └── route.ts    # GET (dashboard stats)
│   │       │   ├── bulk/
│   │       │   │   └── route.ts    # PATCH (bulk update — post-MVP)
│   │       │   └── [id]/
│   │       │       ├── route.ts    # PATCH (update video)
│   │       │       └── tags/
│   │       │           └── route.ts # POST (assign), DELETE (remove)
│   │       ├── tags/
│   │       │   ├── route.ts        # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       └── route.ts    # PATCH (rename), DELETE
│   │       └── settings/
│   │           └── route.ts        # GET, PATCH
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui primitives (button, dialog, etc.)
│   │   ├── dashboard/
│   │   │   ├── watch-next.tsx      # Top prioritized videos grid
│   │   │   ├── recently-added.tsx  # Latest synced videos
│   │   │   ├── stats-bar.tsx       # Counts & metrics
│   │   │   └── sync-status.tsx     # Last sync time + trigger button
│   │   ├── video/
│   │   │   ├── video-card.tsx      # Video thumbnail + metadata + actions
│   │   │   ├── video-list.tsx      # Paginated/filterable video list
│   │   │   ├── priority-toggle.tsx # Quick priority change control
│   │   │   └── tag-picker.tsx      # Assign tags to a video
│   │   ├── tags/
│   │   │   ├── tag-badge.tsx       # Colored tag pill
│   │   │   ├── tag-filter.tsx      # Tag filter bar for dashboard
│   │   │   └── tag-manager.tsx     # CRUD for tags (settings page)
│   │   └── settings/
│   │       ├── playlist-manager.tsx # Add/remove playlists
│   │       ├── sync-config.tsx     # Sync interval, last sync info
│   │       └── scoring-config.tsx  # Priority weights, age factor tuning
│   ├── lib/                        # Shared utilities & services
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── youtube/
│   │   │   ├── youtube-service.ts  # All YouTube API calls
│   │   │   ├── youtube-types.ts    # API response types
│   │   │   └── youtube-mapper.ts   # API → domain model mapping
│   │   ├── scoring.ts              # Priority scoring algorithm
│   │   ├── sync.ts                 # Sync orchestration logic
│   │   └── validators.ts          # Zod schemas for API input validation
│   └── types/                      # Shared TypeScript types
│       └── index.ts                # Domain types (Video, Tag, Playlist, etc.)
├── public/                         # Static assets
│   └── favicon.ico
├── .env.example                    # Template for env vars
├── .env.local                      # Local env (gitignored)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                     # Cron job config
└── README.md
```

### Why This Structure

**`src/app/api/` mirrors the REST resource hierarchy.** Each folder is a resource, each `route.ts` handles the HTTP methods for that resource. Next.js convention — no routing library needed.

**`src/lib/` is the business logic layer.** API routes are thin — they validate input, call a service function, and return the response. The actual logic lives in `lib/`. This keeps routes testable and logic reusable.

**`src/components/` is organized by feature, not by type.** `dashboard/`, `video/`, `tags/`, `settings/` — not `buttons/`, `cards/`, `modals/`. Feature folders scale better and make it obvious where to look.

**`src/components/ui/` is for shadcn primitives only.** These are generic, design-system-level components. Feature components compose them.

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| **Files** | kebab-case | `video-card.tsx`, `youtube-service.ts` |
| **React components** | PascalCase | `VideoCard`, `WatchNext` |
| **Functions** | camelCase | `getUnwatchedVideos()`, `syncPlaylist()` |
| **Types/Interfaces** | PascalCase | `Video`, `SyncResult`, `PriorityLevel` |
| **Database tables** | snake_case (Prisma maps) | `video`, `video_tag`, `sync_log` |
| **Database columns** | camelCase (Prisma default) | `youtubeVideoId`, `watchedAt` |
| **API routes** | kebab-case URLs | `/api/videos`, `/api/playlists/:id/sync` |
| **Env vars** | SCREAMING_SNAKE_CASE | `YOUTUBE_API_KEY`, `CRON_SECRET` |
| **CSS classes** | Tailwind utilities | `flex items-center gap-2` |

---

## Key Dependencies

| Package | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `next` | ^14.2 | Framework | The whole app runs on this. App Router for RSC + API routes. |
| `react` / `react-dom` | ^18.3 | UI library | Required by Next.js. |
| `typescript` | ^5.4 | Language | Type safety for a solo dev is non-negotiable. |
| `prisma` / `@prisma/client` | ^5.x | ORM + DB client | Type-safe SQLite access with migration support. |
| `tailwindcss` | ^3.4 | Styling | Utility-first CSS. Fast to build, responsive by default. |
| `@radix-ui/*` | latest | Accessible primitives | Via shadcn/ui. Headless, composable. |
| `zod` | ^3.23 | Input validation | Runtime type checking for API inputs. Pairs with TypeScript. |
| `@dnd-kit/core` | ^6.x | Drag and drop | For manual reordering within priority tiers. Lightweight, accessible. |
| `lucide-react` | ^0.400 | Icons | Clean icon set, tree-shakeable. |
| `date-fns` | ^3.x | Date utilities | Lightweight date formatting/manipulation. No Moment.js. |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `eslint` + `eslint-config-next` | Linting |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting with Tailwind class sorting |
| `husky` | Git hooks |
| `lint-staged` | Run linters on staged files only |

---

## Development Environment Setup

### Prerequisites
- Node.js 20+
- npm or pnpm (pnpm recommended for speed)

### Clone → Running in 5 Minutes

```bash
# 1. Clone the repo
git clone <repo-url> youtube-queue-app
cd youtube-queue-app

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your YouTube API key

# 4. Initialize database
pnpm prisma generate
pnpm prisma db push

# 5. (Optional) Seed sample data
pnpm prisma db seed

# 6. Start dev server
pnpm dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `YOUTUBE_API_KEY` | Yes | — | Google API key with YouTube Data API v3 enabled |
| `DATABASE_URL` | No | `file:./dev.db` | SQLite database file path (Prisma) |
| `API_SECRET` | Recommended | — | Simple secret to protect API routes from external access |
| `CRON_SECRET` | Production | — | Auto-injected by Vercel for cron job auth |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Base URL for the app |

### `.env.example`

```bash
# YouTube
YOUTUBE_API_KEY=your-api-key-here

# Database (SQLite — relative to prisma/ directory)
DATABASE_URL="file:./dev.db"

# API Protection (generate with: openssl rand -hex 32)
API_SECRET=

# Vercel Cron (auto-injected in production)
CRON_SECRET=
```

---

## Code Quality

### ESLint

Next.js default config + strict TypeScript rules:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error"
  }
}
```

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Pre-commit Hooks (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Type Checking

TypeScript strict mode enabled. `pnpm tsc --noEmit` runs in CI and pre-commit.

---

## Git Strategy

### Branching

Keep it simple — you're a solo dev:

- `main` — always deployable. Vercel auto-deploys from here.
- `feature/<name>` — short-lived feature branches. Merge back to main when done.
- `fix/<name>` — bug fixes.

No `develop` branch. No release branches. Trunk-based development with feature flags if needed.

### Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add tag filtering to dashboard
fix: handle unavailable videos during sync
chore: update prisma to 5.x
refactor: extract scoring logic into separate module
docs: add API endpoint documentation
```

### Workflow

```
1. Create feature branch from main
2. Build the thing
3. Commit with conventional commit message
4. Push and open PR (even solo — it's a checkpoint)
5. Vercel creates preview deployment automatically
6. Merge to main → auto-deploy to production
```

Even as a solo dev, PRs create a paper trail. When you come back to this project after 3 months, the PR descriptions will remind you what you were thinking.
