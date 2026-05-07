# YouTube Queue - AI Knowledge System Roadmap

## Purpose

This document defines the next major evolution of the app:

- ingest videos from playlists
- extract durable knowledge from each video
- connect related videos across overlapping topics
- turn those relationships into reusable knowledge bases

The current app already supports playlist sync, manual tags, AI summaries, embeddings, and similarity clusters. The work below turns those pieces into a coherent knowledge system instead of a queue with optional AI metadata.

## Product Goal

Move from:

- "a personal queue of YouTube videos"

to:

- "a personal research system that converts saved videos into topic-centered knowledge bases"

## End State

For every saved video, the app should be able to answer:

- What is this video about?
- What are the best takeaways from it?
- What topics does it belong to?
- What other videos deepen or challenge the same ideas?
- Which larger knowledge base should it contribute to?

For every topic or knowledge base, the app should be able to show:

- the canonical topic summary
- the videos that support it
- the extracted insights across those videos
- related subtopics and adjacent topics
- an exportable source pack for deeper study

## Current State

The current implementation already provides the foundation:

- playlist sync and video upsert in [src/lib/sync.ts](../src/lib/sync.ts)
- video-level AI processing in [src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts)
- transcript fetching in [src/lib/ai/transcript.ts](../src/lib/ai/transcript.ts)
- summary and topic extraction in [src/lib/ai/summarize.ts](../src/lib/ai/summarize.ts)
- embeddings and clustering in [src/lib/ai/clustering.ts](../src/lib/ai/clustering.ts)
- manual tags and tag filters in [src/app/api/tags/route.ts](../src/app/api/tags/route.ts) and [src/components/tags/tag-filter.tsx](../src/components/tags/tag-filter.tsx)
- cluster browsing UI in [src/app/clusters/page.tsx](../src/app/clusters/page.tsx)

The current gaps are structural:

- tags are flat and fully manual
- `keyTopics` live on the video row instead of as first-class entities
- clusters are useful for discovery but too unstable to serve as the canonical taxonomy
- the AI pipeline extracts summaries, not reusable knowledge objects
- there is no durable concept of a topic page or knowledge base

## Core Product Decisions

### 1. Keep three distinct layers

Do not collapse everything into "tags".

- `Manual tags`: user-owned labels for organization and filtering
- `Topics`: AI-suggested or user-curated concepts that describe subject matter
- `Knowledge bases`: durable collections of videos and insights built around a topic or question

### 2. Use clusters as a signal, not the source of truth

The current clustering system should remain useful for:

- discovering related videos
- proposing topic groupings
- suggesting knowledge base membership

It should not define the final taxonomy by itself.

### 3. Make the user the final editor of the taxonomy

AI should suggest:

- topics
- related videos
- candidate knowledge bases
- merged summaries

The user should approve, reject, merge, rename, or pin the canonical structure.

### 4. Store extracted knowledge as structured records

The app should not stop at one freeform summary per video. It should persist:

- takeaways
- methods / frameworks
- named tools and concepts
- confidence-scored topic assignments
- optional timestamped snippets when transcript quality permits

## Target Data Model

Add these new entities.

### `topics`

Canonical subject areas that can overlap.

Suggested fields:

- `id`
- `name`
- `slug`
- `description`
- `status` (`suggested`, `active`, `merged`, `archived`)
- `source` (`ai`, `user`, `system`)
- `parentTopicId` nullable
- `createdAt`
- `updatedAt`

### `video_topics`

Many-to-many join between videos and topics.

Suggested fields:

- `videoId`
- `topicId`
- `confidence`
- `source` (`ai`, `user`)
- `accepted`
- `rejected`
- `createdAt`

### `video_insights`

Atomic knowledge extracted from a single video.

Suggested fields:

- `id`
- `videoId`
- `kind` (`takeaway`, `framework`, `claim`, `tool`, `example`)
- `text`
- `timestampSeconds` nullable
- `confidence`
- `createdAt`

### `knowledge_bases`

Durable topic-centered collections.

Suggested fields:

- `id`
- `title`
- `slug`
- `description`
- `canonicalSummary`
- `status` (`draft`, `active`, `archived`)
- `createdFromTopicId` nullable
- `createdAt`
- `updatedAt`

### `knowledge_base_videos`

Membership table for videos included in a knowledge base.

Suggested fields:

- `knowledgeBaseId`
- `videoId`
- `source` (`ai`, `user`)
- `relevance`
- `createdAt`

### `knowledge_base_topics`

Join table between knowledge bases and topics.

Suggested fields:

- `knowledgeBaseId`
- `topicId`
- `isPrimary`

### `knowledge_base_insights`

Curated subset of insights surfaced on a knowledge base page.

Suggested fields:

- `knowledgeBaseId`
- `videoInsightId`
- `rank`

## Schema Change Plan

### Phase 1 schema changes

Extend [src/lib/db/schema.ts](../src/lib/db/schema.ts) with:

- `topics`
- `video_topics`
- `video_insights`

Keep the existing `videos.keyTopics` field during migration as a compatibility bridge. Do not remove it in the first pass. Populate both until the new reads are stable.

### Phase 2 schema changes

Add:

- `knowledge_bases`
- `knowledge_base_videos`
- `knowledge_base_topics`
- `knowledge_base_insights`

### Phase 3 cleanup

After the new reads and UI are fully adopted:

- stop using `videos.keyTopics` as the primary source
- keep clusters as secondary discovery data
- decide whether `video_clusters` remain user-visible or become internal suggestions only

## AI Pipeline Redesign

## Current behavior

[src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts) currently does:

1. fetch transcript
2. generate one summary plus `keyTopics`
3. embed the summary
4. store results on the `videos` row

## Target behavior

Change the AI pipeline to produce a structured extraction payload.

### New extraction output

For each processed video, store:

- `summary`: concise full-video summary
- `topics`: canonical topic labels with confidence
- `insights`: atomic takeaways
- `tools`: named tools, products, libraries, or strategies mentioned
- `frameworks`: named methods or repeatable approaches
- `suggestedKnowledgeBases`: optional proposed KB titles or slugs

### Implementation detail

Replace the current `record_video_summary` tool in [src/lib/ai/summarize.ts](../src/lib/ai/summarize.ts) with a richer extraction tool, for example:

- `record_video_knowledge`

It should return:

- `summary`
- `topics`
- `insights`
- `tools`
- `frameworks`

Each topic should include a confidence score or importance rank. Each insight should be short, atomic, and suitable for later aggregation.

### Storage flow

Update [src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts) so that after extraction it:

1. updates the `videos` row with the high-level summary and processing metadata
2. upserts `topics`
3. inserts `video_topics`
4. inserts `video_insights`
5. generates embeddings from the summary plus normalized topics

## Taxonomy Workflow

The app needs a review layer between AI suggestions and canonical structure.

### Proposed review states

- `suggested`
- `accepted`
- `rejected`
- `merged`

### User workflow

For a newly processed video:

1. AI suggests topics
2. user sees those suggestions on the video card or detail panel
3. user can accept an existing topic
4. user can merge a suggestion into another canonical topic
5. user can promote a topic into a new knowledge base

### Important rule

Manual tags stay available as quick filters. They are not replaced. But they should no longer carry the whole semantic load of the app.

## Knowledge Base Generation

Knowledge bases should be built after video-level extraction, not before.

### Creation paths

Support three creation paths:

- user creates a knowledge base manually
- user promotes an accepted topic into a knowledge base
- AI suggests a new knowledge base from a strong cluster or repeated topic pattern

### Membership rules

A video may belong to multiple knowledge bases.

Initial membership signals:

- accepted topic assignments
- high similarity to other videos already in the KB
- explicit user addition

### Synthesis rules

For each knowledge base, generate:

- canonical summary
- major themes
- recurring tools / frameworks
- top insights ranked by support across source videos

Do not synthesize from embeddings alone. Always synthesize from extracted insights and source summaries.

## API Roadmap

### Phase 1 APIs

Add topic and insight review APIs.

Suggested routes:

- `GET /api/topics`
- `POST /api/topics`
- `PATCH /api/topics/:id`
- `GET /api/videos/:id/topics`
- `POST /api/videos/:id/topics`
- `PATCH /api/videos/:id/topics/:topicId`
- `GET /api/videos/:id/insights`

File targets:

- `src/app/api/topics/route.ts`
- `src/app/api/topics/[id]/route.ts`
- `src/app/api/videos/[id]/topics/route.ts`
- `src/app/api/videos/[id]/topics/[topicId]/route.ts`
- `src/app/api/videos/[id]/insights/route.ts`

### Phase 2 APIs

Add knowledge base APIs.

Suggested routes:

- `GET /api/knowledge-bases`
- `POST /api/knowledge-bases`
- `GET /api/knowledge-bases/:id`
- `PATCH /api/knowledge-bases/:id`
- `POST /api/knowledge-bases/:id/videos`
- `DELETE /api/knowledge-bases/:id/videos/:videoId`
- `POST /api/knowledge-bases/:id/regenerate`

File targets:

- `src/app/api/knowledge-bases/route.ts`
- `src/app/api/knowledge-bases/[id]/route.ts`
- `src/app/api/knowledge-bases/[id]/videos/route.ts`
- `src/app/api/knowledge-bases/[id]/videos/[videoId]/route.ts`
- `src/app/api/knowledge-bases/[id]/regenerate/route.ts`

### Phase 3 APIs

Add discovery and recommendation endpoints.

Suggested routes:

- `GET /api/videos/:id/related`
- `GET /api/topics/:id/related`
- `GET /api/knowledge-bases/:id/related`

These should use a mix of:

- embeddings
- accepted shared topics
- existing cluster membership

## UI Roadmap

### Phase 1 UI

Extend the current queue UX instead of building a separate app surface first.

Add to the video card or a lightweight detail panel:

- AI suggested topics
- accepted topics
- extracted takeaways
- related videos
- actions to accept / reject / merge a topic

Primary file targets:

- `src/components/video/video-card.tsx`
- `src/components/dashboard/watch-next.tsx`

### Phase 2 UI

Add first-class topic pages.

Suggested routes:

- `/topics`
- `/topics/[slug]`

Each topic page should show:

- topic summary
- related videos
- extracted insights
- adjacent topics
- candidate knowledge bases

### Phase 3 UI

Add first-class knowledge base pages.

Suggested routes:

- `/knowledge-bases`
- `/knowledge-bases/[slug]`

Each knowledge base page should show:

- canonical summary
- member videos
- top insights
- related topics
- export actions

### Cluster UI repositioning

The current [src/app/clusters/page.tsx](../src/app/clusters/page.tsx) should eventually be reframed as:

- "Discovery"

instead of:

- "final categorization"

This page should help you find emerging patterns and promote them into topics or knowledge bases.

## Rollout Phases

## Phase A - Structured extraction foundation

Goal:

- make the AI output reusable beyond a single summary string

Deliverables:

- add `topics`, `video_topics`, `video_insights`
- redesign [src/lib/ai/summarize.ts](../src/lib/ai/summarize.ts)
- update [src/lib/ai/pipeline.ts](../src/lib/ai/pipeline.ts) to persist structured output
- add read APIs for per-video topics and insights

Exit criteria:

- a processed video has durable topic links and atomic insight records

## Phase B - Human-in-the-loop taxonomy

Goal:

- prevent topic sprawl and low-quality auto-tagging

Deliverables:

- topic review actions
- accept / reject / merge workflows
- UI for AI suggestions on videos

Exit criteria:

- AI-suggested topics can be curated into a stable taxonomy

## Phase C - Knowledge base entities

Goal:

- create durable topic-centered research artifacts

Deliverables:

- add `knowledge_bases` and membership tables
- create KB APIs
- create KB list and detail pages
- generate canonical KB summaries

Exit criteria:

- a topic can be promoted into a reusable knowledge base with aggregated insights

## Phase D - Discovery and refinement

Goal:

- use embeddings and clusters to strengthen discovery without letting them control taxonomy

Deliverables:

- related video endpoints
- topic suggestions from similarity and shared concepts
- cluster page reframed as discovery workflow

Exit criteria:

- discovery helps the user find connections while canonical structure remains curated

## Recommended Build Order

Build in this exact order:

1. schema for `topics`, `video_topics`, `video_insights`
2. richer extraction tool in `summarize.ts`
3. persistence changes in `pipeline.ts`
4. video topic / insight read APIs
5. video-level review UI
6. topic CRUD and merge flows
7. `knowledge_bases` schema and APIs
8. KB pages and aggregated synthesis
9. discovery endpoints and cluster page repositioning

This order gives the fastest path to user value without overcommitting to a brittle auto-generated taxonomy.

## First Milestone

The first milestone should be intentionally narrow:

- process a video
- extract atomic insights
- suggest 3 to 8 canonical topics
- let the user accept or reject those topics
- show related videos using accepted topics plus embedding similarity

Why this first:

- it upgrades the app from "queue plus summary" to "curated research assistant"
- it reuses the current AI pipeline instead of replacing it wholesale
- it de-risks the taxonomy before knowledge base synthesis is introduced

## Risks and Controls

### Risk: topic explosion

Control:

- add review states
- support merge and alias flows
- make user-approved topics canonical

### Risk: weak transcript quality

Control:

- keep source tracking from [src/lib/ai/transcript.ts](../src/lib/ai/transcript.ts)
- store confidence
- allow insight generation to degrade gracefully when using description fallback

### Risk: clusters create misleading categories

Control:

- treat clusters as suggestions only
- never use cluster membership as the sole reason for canonical topic assignment

### Risk: over-automated summaries become vague

Control:

- store atomic insights, not only prose summaries
- surface source videos behind every synthesized knowledge base

## Suggested Follow-on Work

After this roadmap is accepted, the next implementation artifact should be a build plan with:

- exact schema definitions for each new table
- the route-by-route API contract
- UI wireframes for video review, topic pages, and knowledge base pages
- a migration plan for existing `keyTopics` and cluster data
