# YouTube Queue — Product Vision

## Problem Statement

YouTube playlists are a dumping ground. You find a great video — especially in fast-moving spaces like AI — hit "Save to Playlist," and it disappears into a growing backlog you'll never scroll through again. YouTube offers no way to prioritize, no reminders, and no meaningful organization beyond flat lists. The result: hundreds of saved videos, zero system for actually watching them.

## Target Audience

Solo user (Patrick). A technically-minded professional who consumes a high volume of YouTube content across topics (AI, coding, DIY, etc.) and needs a system — not just a list — to manage a growing watch backlog.

## Product Overview

YouTube Queue is a personal web app that syncs multiple YouTube playlists via the YouTube Data API and presents them as a prioritized, categorized watch queue. It combines manual priority controls with smart surfacing of aging/stale videos so nothing falls through the cracks. The dashboard is the single surface you check to decide what to watch next.

## Goals and Success Metrics

- **Primary goal:** Reduce the "saved but never watched" problem. Actually watch the videos you save.
- **Success metric:** Percentage of synced videos that get watched within 30 days of being added.
- **Secondary goal:** Spend less than 30 seconds deciding what to watch next.
- **Secondary metric:** Time-to-click from opening the dashboard to starting a video.

## Scope

### In Scope (v1)
- YouTube Data API integration to sync multiple playlists
- Prioritized watch queue with manual priority + smart aging logic
- Tag/category system for organizing videos by topic
- Dashboard view showing "watch next" recommendations
- Video metadata display (title, thumbnail, channel, duration, publish date)
- Mark videos as watched/unwatched
- Responsive web UI

### Explicitly Out of Scope (v1)
- User authentication (single-user app, no login)
- Notes/annotations per video (fast follow)
- Watch progress tracking — partially watched, timestamps (fast follow)
- Mobile native app
- Social/sharing features
- Video playback within the app (link out to YouTube)
- Multi-user support
- Email/push/SMS notifications (dashboard-only for v1)

## Assumptions and Risks

### Assumptions
- YouTube Data API quota (10,000 units/day default) is sufficient for personal use with periodic sync
- A single playlist sync fetches all items without hitting pagination limits that would complicate the UX
- The user will check the dashboard regularly enough that in-app prioritization (without external reminders) is sufficient

### Risks
- **YouTube API quota limits:** Default quota is 10,000 units/day. A playlist items list request costs 1 unit per call (50 items per page). For personal use this is fine, but aggressive polling could hit limits. Mitigation: sync on-demand or on a reasonable interval (every 6-12 hours).
- **API deprecation/changes:** Google has a history of changing API terms. Mitigation: abstract the YouTube integration behind a clean interface so it can be swapped.
- **Stale data:** Videos can be deleted or made private after syncing. Mitigation: handle 404s gracefully during sync, mark videos as unavailable.
- **Scope creep:** This is a personal tool — resist the urge to over-engineer. Ship the MVP and iterate from actual usage.
