<claude-mem-context>
# Memory Context

# [youtube-queue-app] recent context, 2026-05-07 3:04pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,964t read) | 848,701t work | 98% savings

### May 5, 2026
S43 graphify . — build complete knowledge graph of youtube-queue-app (Next.js 14 YouTube watch queue manager) (May 5 at 8:25 PM)
S42 Run /graphify on the youtube-queue-app codebase to generate a knowledge graph (May 5 at 8:25 PM)
386 8:27p 🔵 Database migrated from SQLite to PostgreSQL with pgvector for AI embeddings
390 8:52p 🔵 YouTube Queue App Resume State
S44 Resume session on youtube-queue-app — user asked to resume with no specific task specified (May 5 at 8:53 PM)
391 8:53p 🔵 AI Pipeline Architecture for YouTube Queue App
392 " 🟣 AI Video Clustering Pipeline with pgvector
393 8:54p ✅ AI Pipeline Committed to Main Branch
394 " 🔵 Stale Docs Reference SQLite and Prisma
395 " ✅ README Stack Section Updated to Reflect Current Tech
396 " ✅ README Local Dev Setup Updated for PostgreSQL and pgvector
397 " 🔵 Technical Architecture Doc Has Extensive Prisma/SQLite Narrative
398 " ✅ Architecture Doc Stack Table Updated with PostgreSQL, Drizzle, and AI Rationale
399 8:55p ✅ Architecture Doc Migration History Section Added
400 " ✅ Architecture Mermaid Diagram Updated with PostgreSQL and AI Pipeline
401 " ✅ Codebase Plan Doc Marked as Historical for SQLite/Prisma References
402 " ✅ Feature Requirements Doc Search Note Updated; AI Recommendations Now In Scope
403 8:57p 🔵 youtube-queue-app Repo State Snapshot
404 " 🔵 docs/progress.json Stack Mismatch — SQLite/Prisma vs Actual PostgreSQL/Drizzle
405 " 🔵 Full Drizzle Schema with pgvector Custom Type
406 " 🔵 syncPlaylist() — Fire-and-Forget AI Post-Processing Pattern
407 8:58p 🔴 Build Fails — Missing @types/pg DevDependency
408 " 🔵 Two Unpushed Commits — AI Pipeline and Docs Update
409 " 🔵 Score Sort Fetches Up to 9999 Rows Into Memory
410 " 🔵 Dashboard Auto-Sync May Fail in Production if CRON_SECRET Is Set
411 " 🔵 Clusters Page Has NotebookLM Export Integration
412 9:21p ⚖️ Product North Star — AI-Powered Knowledge Base Builder from YouTube Videos
413 " 🔵 Clustering Algorithm Is Single-Membership Greedy — Videos Can Only Belong to One Cluster
414 " 🔵 Tags Are Fully Manual — Auto-Tagging Explicitly Deferred to Future
415 " 🔵 Architecture Doc Confirms SQLite→PostgreSQL Migration History and Rationale
416 9:48p 🔵 AI Summarization Uses Claude Tool-Use to Extract Structured Topics
418 " ✅ AI Knowledge System Roadmap Doc Created — docs/04-ai-knowledge-system-roadmap.md
417 " ⚖️ Roadmap Doc Planned — AI Tagging and Knowledge Base Evolution
### May 7, 2026
521 9:44a 🔵 youtube-queue-app current state and roadmap grounded for new session
523 " ⚖️ User initiated design audit of youtube-queue-app using impeccable-design skill
526 9:49a 🔵 Impeccable design skill found in skills registry with 67.6K installs
524 " 🔵 youtube-queue-app current state confirmed and grounded
525 " ⚖️ User flagged UI as low-quality; agent initiated impeccable-design skill search
527 " 🟣 pbakaus/impeccable@impeccable design skill installed globally
528 9:50a 🟣 impeccable design skill successfully installed and workflow understood
529 " 🔵 PRODUCT.md and DESIGN.md absent from youtube-queue-app — impeccable teach required before critique
530 " 🔵 impeccable teach and audit workflows loaded — ready to run teach to generate PRODUCT.md
531 " 🔵 Untitled
532 9:51a 🔵 npm run dev fails with EPERM on port 3000 in Codex sandbox
533 " 🔵 Dev server starts on port 3000 with escalated sandbox permissions
534 " 🔵 Current design system tokens and component structure audited from source
535 " 🔵 Full UI component structure audited — key design issues identified pre-critique
544 9:52a ⚖️ User Pivoting to Design System + Mockups via Claude Design
552 9:54a ⚖️ User Seeking App Rename Before Design System Creation
553 9:55a ⚖️ Design System Selection Criteria: Anti-AI-Slop Requirements
554 2:41p ⚖️ Design Direction Chosen: Shopify Polaris / Shopify Dev Docs Aesthetic
**561** 2:59p 🔵 **Claude Design Defaulted to Beige Despite Shopify Reference**
Even with an explicit reference to Shopify's developer documentation (which uses cool, dark-on-light or dark-mode slate palettes), Claude design defaulted to a beige/warm-neutral background. This is a recurring LLM design anti-pattern: without hard-coded color constraints in the prompt, AI design tools reach for warm beige/cream neutrals as a "safe" default. The fix is to provide explicit color specifications in the Claude design prompt — not just a reference URL — including specific background colors, primary colors, and explicit prohibitions on warm neutrals and beige. This learning should inform all future design prompt construction for this project.

**562** 3:04p ⚖️ **Design System Palette Converging: Chalk/Fog/Graphite + Ember Accent**
The Claude design session is iterating toward a chalk/fog/graphite palette with an ember accent. This is a significant improvement over the original near-white + orange-500 combination — "chalk" implies a slightly off-white with cool undertones (not beige), "fog" is a mid-gray secondary, and "graphite" handles borders/dark elements. The "ember" accent is positioned as a warmer touch against the cooler field. The user's instinct to use sans-serif typography aligns well with the Shopify dev docs reference and the app's data-dense, functional character. The key pending decision is whether ember (warm orange) feels intentional against the cool chalk ground, or whether a cooler accent (steel-blue or graphite) would be more distinctive and less reminiscent of generic SaaS orange.


Access 849k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
