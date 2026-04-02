# YouTube Queue

A personal web app that syncs YouTube playlists and turns them into a prioritized, categorized watch queue. Stop losing videos in the backlog.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Drizzle ORM + libSQL
- **Styling:** Tailwind CSS
- **API:** YouTube Data API v3
- **Deployment:** Vercel

## Prerequisites

- Node.js 20+
- A Google Cloud project with YouTube Data API v3 enabled

## Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Library**
4. Search for "YouTube Data API v3" and enable it
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. Copy the key — you'll paste it into `.env.local` below

**Optional:** Restrict the key to only "YouTube Data API v3" under API restrictions for security.

## Local Development Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd youtube-queue-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
YOUTUBE_API_KEY=your-actual-api-key-here
DATABASE_URL="file:./data/youtube-queue.db"
```

```bash
# 4. Create the data directory and push the database schema
mkdir -p data
npm run db:push

# 5. Start the dev server
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

## First Use

1. Open [http://localhost:3000/settings](http://localhost:3000/settings)
2. Paste a YouTube playlist ID and click **Add** (the ID is the string after `list=` in a playlist URL, e.g., `PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`)
3. Click the sync button next to the playlist (or hit **Sync Now** on the dashboard)
4. Videos populate your queue — prioritize, tag, and start watching

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:push` | Push schema changes to SQLite |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Dashboard (main page)
│   ├── settings/page.tsx   # Settings (playlists, tags)
│   └── api/                # API routes
│       ├── playlists/      # CRUD + sync per playlist
│       ├── sync/           # Sync all (cron target)
│       ├── videos/         # List, update, stats
│       ├── tags/           # Tag CRUD
│       └── settings/       # App settings
├── components/             # React components by feature
│   ├── dashboard/          # Stats, sync status, watch queue
│   ├── video/              # Video card, list
│   └── tags/               # Tag badge, filter
├── lib/                    # Business logic & services
│   ├── db/                 # Drizzle schema + client
│   ├── youtube/            # YouTube API service layer
│   ├── scoring.ts          # Priority scoring algorithm
│   ├── sync.ts             # Sync orchestration
│   └── validators.ts       # Zod schemas for API validation
└── types/                  # Shared TypeScript types
```

## Docs

- [Product Vision](docs/00-product-vision.md)
- [Feature Requirements](docs/01-feature-requirements.md)
- [Technical Architecture](docs/02-technical-architecture.md)
- [Codebase Plan](docs/03-codebase-plan.md)
