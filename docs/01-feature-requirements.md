# YouTube Queue — Feature Requirements

## MVP Features (Must Have)

### YouTube Playlist Sync
**Description:** Connect to the YouTube Data API and pull video metadata from one or more user-specified playlists. Sync runs on-demand (manual trigger) and optionally on a configurable interval (default: every 12 hours).
**User Story:** As a user, I want my YouTube playlist videos to automatically appear in my queue so that I don't have to manually add them.
**Acceptance Criteria:**
- [ ] User can configure one or more YouTube playlist IDs to sync
- [ ] Sync pulls video title, thumbnail URL, channel name, duration, publish date, and video ID
- [ ] New videos are added to the queue; existing videos are updated (title changes, etc.)
- [ ] Deleted/private videos are flagged as "unavailable" rather than silently removed
- [ ] Sync can be triggered manually from the UI
- [ ] Background sync runs on a configurable interval (default 12h)
- [ ] API errors are handled gracefully with user-visible status
**Dependencies:** YouTube Data API v3 credentials (API key — no OAuth needed for public playlists; OAuth if accessing private playlists like Watch Later)
**Complexity:** Medium
**Notes:** The "Watch Later" playlist is private and requires OAuth. If that's a target playlist, you'll need Google OAuth for API access only (not for app auth). Worth deciding early whether this is needed — it changes the auth surface.

### Prioritized Watch Queue
**Description:** A ranked list of unwatched videos combining manual priority levels with smart aging logic. Videos the user marks as high priority float up. Videos that have been sitting unwatched for a long time also get surfaced so they don't rot.
**User Story:** As a user, I want to see my most important unwatched videos at the top so I can quickly decide what to watch next.
**Acceptance Criteria:**
- [ ] Each video has a priority level: High, Medium (default), Low
- [ ] User can change priority with a single click/tap
- [ ] Queue is sorted by a composite score: manual priority weight + age penalty (older unwatched = higher score)
- [ ] Age penalty kicks in after a configurable threshold (default: 7 days unwatched)
- [ ] Dashboard shows top 10 "Watch Next" recommendations based on this scoring
- [ ] User can manually reorder within a priority tier via drag-and-drop
**Dependencies:** None
**Complexity:** Medium
**Notes:** The scoring algorithm should be simple and transparent. Something like: `score = priorityWeight + (daysSinceAdded * ageFactor)` where priorityWeight is High=100, Medium=50, Low=10 and ageFactor is 2. Expose the formula or at least the tuning knobs in settings.

### Dashboard View
**Description:** The single screen the user sees on load. Shows the prioritized watch queue, recent additions, and high-level stats (total unwatched, videos added this week, etc.).
**User Story:** As a user, I want a single dashboard that tells me what to watch next and how my backlog looks so I spend zero time navigating.
**Acceptance Criteria:**
- [ ] "Watch Next" section showing top 5-10 prioritized videos with thumbnails
- [ ] Clicking a video opens it on YouTube in a new tab
- [ ] "Recently Added" section showing latest synced videos
- [ ] Stats bar: total videos, unwatched count, watched this week, oldest unwatched video age
- [ ] Last sync timestamp and manual sync trigger button
- [ ] Responsive layout — usable on mobile browser
**Dependencies:** Playlist Sync, Prioritized Watch Queue
**Complexity:** Medium
**Notes:** This is the app. Everything else supports this view.

### Tag / Category System
**Description:** User-defined tags to organize videos by topic. Videos can have multiple tags. Tags are filterable from the dashboard.
**User Story:** As a user, I want to tag videos by topic (AI, coding, music, etc.) so I can filter my queue based on what I'm in the mood for.
**Acceptance Criteria:**
- [ ] User can create, rename, and delete tags
- [ ] Tags can be assigned to videos (multiple tags per video)
- [ ] Tags are assignable via quick-action on the video card
- [ ] Dashboard can be filtered by one or more tags
- [ ] Tag filter persists during the session
- [ ] Auto-suggest existing tags when assigning
**Dependencies:** None
**Complexity:** Low-Medium
**Notes:** Consider auto-tagging based on channel name or video title keywords as a future enhancement. For MVP, manual tagging only.

### Watch Status Management
**Description:** Mark videos as watched or unwatched. Watched videos are removed from the active queue but remain in history.
**User Story:** As a user, I want to mark videos as watched so they leave my queue and I can track what I've consumed.
**Acceptance Criteria:**
- [ ] One-click "Mark as Watched" action on any video card
- [ ] Watched videos are hidden from the active queue by default
- [ ] "Watched" section/filter to review watch history
- [ ] Ability to unmark (move back to unwatched)
- [ ] Watched timestamp is recorded
**Dependencies:** None
**Complexity:** Low
**Notes:** Keep it simple — binary watched/unwatched for MVP. Partial progress tracking is a fast follow.

---

## Post-MVP Features (Should Have)

### Notes & Annotations
**Description:** Add personal notes to any video — why you saved it, key takeaways, timestamps worth revisiting.
**User Story:** As a user, I want to jot down notes on videos so I remember why I saved them and what I learned.
**Acceptance Criteria:**
- [ ] Free-text notes field on each video detail view
- [ ] Notes are searchable from the dashboard
- [ ] Markdown support for formatting
- [ ] Timestamps in notes are clickable (link to YouTube at that timestamp)
**Dependencies:** None
**Complexity:** Low
**Notes:** High value, low effort. Strong candidate for fast follow immediately after MVP.

### Watch Progress Tracking
**Description:** Track partial watch progress — mark videos as "in progress" with an optional timestamp bookmark.
**User Story:** As a user, I want to track where I left off in a video so I can resume later without scrubbing.
**Acceptance Criteria:**
- [ ] Three-state watch status: Unwatched, In Progress, Watched
- [ ] "In Progress" videos can store a resume timestamp
- [ ] Resume link opens YouTube at the saved timestamp
- [ ] "In Progress" videos get a dedicated section on the dashboard
**Dependencies:** Watch Status Management
**Complexity:** Low-Medium
**Notes:** YouTube doesn't expose watch progress via API, so this is manual entry. Still valuable for long-form content (tutorials, conference talks).

### Bulk Operations
**Description:** Select multiple videos and apply actions in batch — tag, prioritize, mark watched, delete.
**User Story:** As a user, I want to manage multiple videos at once so I can triage a large sync quickly.
**Acceptance Criteria:**
- [ ] Multi-select mode with checkboxes
- [ ] Bulk actions: assign tag, set priority, mark watched, remove from queue
- [ ] Select all / deselect all
**Dependencies:** Tag System, Watch Status Management
**Complexity:** Low-Medium

### Search & Filter
**Description:** Full-text search across video titles, channel names, tags, and notes. Combined with tag filters for precise querying.
**User Story:** As a user, I want to search my video library so I can find something specific without scrolling.
**Acceptance Criteria:**
- [ ] Search bar on dashboard
- [ ] Searches across: title, channel name, tags, notes
- [ ] Results update as you type (debounced)
- [ ] Combinable with tag filters
**Dependencies:** None
**Complexity:** Low
**Notes:** SQLite FTS5 makes this trivial to implement.

---

## Future Considerations (Could Have)

### Auto-Tagging
Automatically suggest or apply tags based on channel name, video title keywords, or YouTube category. Reduces manual tagging friction as the library grows.

### External Notifications
Email digest (daily/weekly) summarizing unwatched queue status and surfacing aging videos. Or browser push notifications for high-priority videos that have been sitting too long.

### Playlist Analytics
Charts showing watch patterns — videos watched per week, average time-in-queue before watching, most-watched channels, tag distribution. Useful for understanding consumption habits.

### YouTube Embed Player
Play videos inline within the app instead of linking out to YouTube. Enables tighter integration with watch progress tracking.

### Import/Export
Export video library as JSON/CSV. Import from other sources (browser bookmarks, Pocket, etc.).

---

## Out of Scope (Won't Have v1)

- **User authentication / multi-user** — This is a personal tool. No login, no user management.
- **Mobile native app** — Web app with responsive design is sufficient. PWA could be a future consideration.
- **Social features** — No sharing, no collaborative playlists.
- **Video hosting / caching** — All video content stays on YouTube. The app manages metadata only.
- **Monetization** — Personal tool, no payment or subscription infrastructure.
- **AI-powered recommendations** — Tempting given the AI content focus, but way out of scope for v1. YouTube's own algo handles discovery; this app handles the backlog.
