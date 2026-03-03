# Pharos AI — Admin API Specification

## Philosophy

The admin API is designed to be consumed by an autonomous AI agent (OpenClaw instance on a VPS). The agent is powerful but forgetful — it has no persistent state between runs. Therefore:

1. **The API must guide the agent** — workflows tell it what to do step by step
2. **The API must validate** — reject incomplete or inconsistent data
3. **The API must track relationships** — the agent won't remember to link event→xpost→map→story
4. **The API must prevent duplicates** — fuzzy search before insert
5. **The API must report gaps** — "you added an event but no X post, no map feature, no story link"

## Authentication

All admin routes require `Authorization: Bearer <ADMIN_API_KEY>` header.
The key is set via `PHAROS_ADMIN_API_KEY` env var.

---

## Route Overview (74 endpoints)

### 1. Workflow Engine (7 routes)

The workflow engine is the primary interface for the monitoring agent. Instead of
calling individual CRUD endpoints, the agent starts a workflow and follows the
steps. Each step returns instructions, required fields, and validation rules.

```
GET    /v1/admin/workflows/templates          — List available workflow templates
POST   /v1/admin/workflows                    — Start a new workflow from template
GET    /v1/admin/workflows/:id                — Get workflow state + current step
POST   /v1/admin/workflows/:id/advance        — Submit current step data, advance to next
POST   /v1/admin/workflows/:id/skip           — Skip optional step with reason
POST   /v1/admin/workflows/:id/abort          — Abort workflow (rollback created entities)
GET    /v1/admin/workflows/active              — List all active (incomplete) workflows
```

#### Workflow Templates

| Template | Steps | Purpose |
|---|---|---|
| `new-event` | 9 steps | Full event ingestion with all cross-references |
| `casualty-update` | 5 steps | Update casualties across all affected entities |
| `new-day` | 11 steps | Open a new conflict day (snapshot, actors, scenarios) |
| `actor-update` | 4 steps | Update an actor's day snapshot + linked actions |
| `map-update` | 6 steps | Add map features with story/event linkage |
| `situation-report` | 8 steps | Full daily assessment (summary, escalation, predictions) |
| `breaking-event` | 7 steps | Expedited flow for critical breaking events |
| `economic-update` | 3 steps | Update economic impact chips + narrative |
| `bulk-xposts` | 4 steps | Batch import X posts with event linking |

#### Example: `new-event` workflow

```
Step 1: SEARCH_DUPLICATES
  → Agent provides: { title, timestamp, location }
  ← API returns: similar events (fuzzy match), proceed/abort decision

Step 2: CREATE_EVENT
  → Agent provides: full IntelEvent payload
  ← API returns: { eventId, created: true }
  ← Validation: requires title, timestamp, severity, type, location, summary, fullContent

Step 3: ADD_SOURCES
  → Agent provides: [{ name, tier, reliability, url? }]
  ← API returns: { sourceCount }
  ← Validation: min 1 source, tier 1-3, reliability 0-100

Step 4: ADD_ACTOR_RESPONSES
  → Agent provides: [{ actorId, actorName, stance, type, statement }]
  ← API returns: { responseCount }
  ← Validation: actorId must exist in DB

Step 5: CREATE_XPOSTS
  → Agent provides: [XPost payloads] with eventId pre-linked
  ← API returns: { postIds }
  ← Instructions: "Create 1-3 X posts representing key sources reporting this event"

Step 6: CREATE_MAP_FEATURES
  → Agent provides: [MapFeature payloads]
  ← API returns: { featureIds }
  ← Instructions: "If this is a strike/missile event, create strike arcs and/or missile tracks. If a new location, add target/heat point."

Step 7: LINK_TO_STORIES
  → API suggests: existing map stories this event could belong to
  → Agent provides: storyId to link, or new story payload
  ← API returns: { linked: true }

Step 8: UPDATE_DAY_SNAPSHOT
  → API shows: current day snapshot for the event's day
  → Agent provides: updated keyFacts, casualties if changed, escalation adjustment
  ← API returns: { updated: true }

Step 9: VALIDATION_CHECK
  → API runs: full cross-reference validation on the new event
  ← API returns: { valid: true } or { issues: [...] } with fix instructions
```

---

### 2. Search & Deduplication (6 routes)

Critical for preventing the agent from adding duplicate data.

```
GET    /v1/admin/search/events                — Fuzzy search events by title/location/timestamp
GET    /v1/admin/search/x-posts               — Search posts by content/handle/timestamp
GET    /v1/admin/search/map-features           — Search map features by label/position/type
GET    /v1/admin/search/actors                 — Search actors by name/id
POST   /v1/admin/search/similarity             — Check if a payload is similar to existing data
GET    /v1/admin/search/latest                 — Get the most recent N items of each type (for context)
```

#### Query Parameters (shared)

- `q` — free-text search
- `from` / `to` — timestamp range
- `day` — conflict day filter
- `limit` — max results (default 20)
- `threshold` — similarity threshold for dedup (0.0-1.0)

---

### 3. Conflict Management (6 routes)

```
GET    /v1/admin/conflict                      — Full conflict state (summary, facts, escalation, commanders)
PATCH  /v1/admin/conflict/summary              — Update conflict summary text
PATCH  /v1/admin/conflict/key-facts            — Add/remove/reorder key facts
PATCH  /v1/admin/conflict/escalation           — Update escalation score (0-100)
PATCH  /v1/admin/conflict/objectives           — Update stated objectives
PATCH  /v1/admin/conflict/commanders           — Update commander lists
```

---

### 4. Day Management (8 routes)

```
GET    /v1/admin/days                          — List all conflict days with summary stats
POST   /v1/admin/days                          — Create a new conflict day (opens Day N+1)
GET    /v1/admin/days/:day                     — Full day snapshot with all nested data
PATCH  /v1/admin/days/:day                     — Update day summary, keyFacts, escalation
PATCH  /v1/admin/days/:day/casualties           — Update casualty figures (per-faction)
PATCH  /v1/admin/days/:day/economic             — Update economic impact chips + narrative
PUT    /v1/admin/days/:day/scenarios            — Replace scenarios for a day
GET    /v1/admin/days/:day/gaps                 — What's missing for this day? (actors without snapshots, etc.)
```

#### `POST /v1/admin/days` — Create New Day

When the agent detects a new calendar day has started, this is the first call.
It scaffolds everything needed:

```json
{
  "day": "2026-03-04",
  "dayLabel": "DAY 5",
  "summary": "...",
  "keyFacts": ["..."],
  "escalation": 96,
  "carryForwardCasualties": true,  // copy latest casualties as starting point
  "carryForwardScenarios": true    // copy latest scenarios as starting point
}
```

Returns: scaffold with IDs for all created entities + a TODO list of what still needs filling.

---

### 5. Event CRUD (8 routes)

```
GET    /v1/admin/events                        — List/filter events (day, severity, type, tags)
GET    /v1/admin/events/:id                    — Single event with all relations
POST   /v1/admin/events                        — Create event (validates required fields)
PATCH  /v1/admin/events/:id                    — Update event fields
DELETE /v1/admin/events/:id                    — Soft-delete (marks inactive, preserves links)
POST   /v1/admin/events/:id/sources            — Add sources to event
POST   /v1/admin/events/:id/actor-responses    — Add actor responses to event
GET    /v1/admin/events/:id/links              — Show all linked entities (xposts, map features, stories)
```

#### Validation on POST/PATCH:
- `timestamp` must fall within a known conflict day
- `severity` must be CRITICAL, HIGH, or STANDARD
- `type` must be a valid EventType
- `sources` array must have ≥ 1 entry
- `fullContent` must be ≥ 200 chars
- Duplicate check: fuzzy title match within ±2 hours returns warning

---

### 6. X Post / Signal CRUD (7 routes)

```
GET    /v1/admin/x-posts                       — List/filter posts (day, significance, accountType, eventId)
GET    /v1/admin/x-posts/:id                   — Single post
POST   /v1/admin/x-posts                       — Create post (validates eventId exists if provided)
PATCH  /v1/admin/x-posts/:id                   — Update post
DELETE /v1/admin/x-posts/:id                   — Delete post
POST   /v1/admin/x-posts/bulk                  — Bulk create (up to 10 at once)
POST   /v1/admin/x-posts/:id/link              — Link post to event and/or actor
```

#### Validation:
- If `eventId` provided, event must exist
- If `actorId` provided, actor must exist
- `significance` must match event severity (BREAKING→CRITICAL, HIGH→HIGH)
- `pharosNote` required for BREAKING significance
- Content must be non-empty

---

### 7. Actor Management (8 routes)

```
GET    /v1/admin/actors                        — List all actors with latest state
GET    /v1/admin/actors/:id                    — Single actor with all day snapshots
POST   /v1/admin/actors                        — Create new actor
PATCH  /v1/admin/actors/:id                    — Update actor metadata (name, type, etc.)
GET    /v1/admin/actors/:id/day-snapshots      — All day snapshots for actor
POST   /v1/admin/actors/:id/day-snapshots      — Create day snapshot for actor
PATCH  /v1/admin/actors/:id/day-snapshots/:day — Update existing day snapshot
POST   /v1/admin/actors/:id/actions            — Add discrete action to actor
```

#### Validation on day snapshot:
- `day` must be a known conflict day
- Cannot create duplicate (actor + day must be unique)
- `activityScore` must be 0-100
- `doing` array must have ≥ 1 entry
- `assessment` must be ≥ 100 chars

---

### 8. Map Features (9 routes)

Typed creation endpoints (not generic) to enforce correct geometry:

```
GET    /v1/admin/map/features                  — List/filter features (featureType, actor, day)
GET    /v1/admin/map/features/:id              — Single feature
POST   /v1/admin/map/strike-arcs               — Create strike arc (validates from/to coords)
POST   /v1/admin/map/missile-tracks            — Create missile track (validates from/to coords)
POST   /v1/admin/map/targets                   — Create target (validates position)
POST   /v1/admin/map/assets                    — Create allied asset (validates position)
POST   /v1/admin/map/threat-zones              — Create threat zone (validates polygon)
POST   /v1/admin/map/heat-points               — Bulk create heat points
DELETE /v1/admin/map/features/:id              — Delete feature
```

#### Validation:
- Coordinates must be valid [lon, lat] ranges
- `from`/`to` for arcs must be different locations
- `actor` must be a known actor token
- `priority` must be P1/P2/P3
- `status` must be a valid status for the feature type
- Duplicate check: same from→to within ±1 hour = warning

---

### 9. Map Stories (6 routes)

```
GET    /v1/admin/map/stories                   — List all stories
GET    /v1/admin/map/stories/:id               — Single story with events
POST   /v1/admin/map/stories                   — Create story
PATCH  /v1/admin/map/stories/:id               — Update story metadata
POST   /v1/admin/map/stories/:id/events        — Add events to story timeline
POST   /v1/admin/map/stories/:id/highlights    — Set highlighted feature IDs (validates they exist)
```

#### Validation:
- All `highlightStrikeIds` must reference existing STRIKE_ARC features
- All `highlightMissileIds` must reference existing MISSILE_TRACK features
- All `highlightTargetIds` must reference existing TARGET features
- Story events must have valid timestamps and types
- `viewState` must have valid longitude/latitude/zoom

---

### 10. Casualties (4 routes)

```
GET    /v1/admin/casualties                    — Latest casualties across all factions
GET    /v1/admin/casualties/:day               — Casualties for specific day
PATCH  /v1/admin/casualties/:day/:faction      — Update single faction's casualties
POST   /v1/admin/casualties/:day/bulk          — Bulk update multiple factions at once
```

#### Validation:
- `faction` must be known (us, israel, iran, lebanon, uae, kuwait, qatar, bahrain, oman, iraq, jordan, saudi)
- Values must be ≥ 0
- Values should be ≥ previous day's values (casualties don't decrease) — warning if not
- Triggers: auto-updates the corresponding day snapshot

---

### 11. Scenarios & Predictions (4 routes)

```
GET    /v1/admin/scenarios/:day                — Scenarios for a day
PUT    /v1/admin/scenarios/:day                — Replace all scenarios for a day
POST   /v1/admin/predictions/groups            — Create prediction group
PATCH  /v1/admin/predictions/groups/:id        — Update prediction group
```

---

### 12. RSS & Feed Management (5 routes)

```
GET    /v1/admin/rss/feeds                     — List all feeds
POST   /v1/admin/rss/feeds                     — Add new RSS feed
PATCH  /v1/admin/rss/feeds/:id                 — Update feed config
DELETE /v1/admin/rss/feeds/:id                 — Remove feed
PATCH  /v1/admin/rss/collections/:id           — Update collection/channel config
```

---

### 13. Economic Indexes (3 routes)

```
POST   /v1/admin/economics/indexes             — Add new index
PATCH  /v1/admin/economics/indexes/:id         — Update index config
DELETE /v1/admin/economics/indexes/:id         — Remove index
```

---

### 14. Validation & Integrity (6 routes)

These are the agent's "health check" endpoints. Run periodically to find gaps.

```
GET    /v1/admin/validate/orphans              — Entities with missing cross-references
GET    /v1/admin/validate/coverage             — Per-day coverage report (what's missing)
GET    /v1/admin/validate/duplicates           — Likely duplicate entities
GET    /v1/admin/validate/timeline             — Timeline consistency (gaps, overlaps)
GET    /v1/admin/validate/integrity            — Foreign key / link integrity check
POST   /v1/admin/validate/fix                  — Auto-fix known issues (with dry-run option)
```

#### `GET /v1/admin/validate/orphans` response:

```json
{
  "ok": true,
  "data": {
    "eventsWithoutXPosts": ["evt-045", "evt-049"],
    "eventsWithoutMapFeatures": ["evt-046"],
    "xPostsWithoutEvents": ["xi-012"],
    "mapFeaturesWithoutStories": ["s29", "m38"],
    "actorsWithoutDaySnapshot": [
      { "actorId": "houthis", "missingDays": ["2026-03-03"] }
    ],
    "daysWithoutScenarios": [],
    "storiesWithBrokenHighlights": []
  }
}
```

#### `GET /v1/admin/validate/coverage` response:

```json
{
  "ok": true,
  "data": {
    "days": [
      {
        "day": "2026-03-03",
        "events": 8,
        "xPosts": 7,
        "mapFeatures": 12,
        "actorSnapshots": { "total": 6, "expected": 6, "missing": [] },
        "casualties": { "factionsUpdated": 12, "expected": 12 },
        "scenarios": 3,
        "economicChips": 5,
        "completeness": 0.94,
        "gaps": ["evt-049 has no linked X post"]
      }
    ]
  }
}
```

---

### 15. Context & State (3 routes)

Help the agent understand what it's working with.

```
GET    /v1/admin/context/current               — Current conflict state: latest day, event count, last updated timestamps
GET    /v1/admin/context/timeline              — Chronological event timeline with gaps highlighted
GET    /v1/admin/context/instructions          — Dynamic instructions for the agent based on current gaps
```

#### `GET /v1/admin/context/instructions` response:

This is the "brain" endpoint. It analyzes the current state and tells the agent
exactly what needs to be done:

```json
{
  "ok": true,
  "data": {
    "currentDay": "2026-03-03",
    "dayLabel": "DAY 4",
    "lastEventTimestamp": "2026-03-03T14:25:00Z",
    "lastUpdateAt": "2026-03-03T15:30:00Z",
    "priority": "HIGH",
    "tasks": [
      {
        "priority": 1,
        "type": "new-day",
        "description": "March 4 has started but no Day 5 snapshot exists yet",
        "suggestedWorkflow": "new-day",
        "params": { "day": "2026-03-04" }
      },
      {
        "priority": 2,
        "type": "missing-xpost",
        "description": "evt-049 (Assembly of Experts Qom) has no linked X post",
        "suggestedWorkflow": "bulk-xposts",
        "params": { "eventIds": ["evt-049"] }
      },
      {
        "priority": 3,
        "type": "stale-casualties",
        "description": "Casualty figures haven't been updated in 6 hours",
        "suggestedWorkflow": "casualty-update"
      },
      {
        "priority": 4,
        "type": "research-needed",
        "description": "No events recorded since 14:25 UTC — likely new developments to research",
        "suggestedWorkflow": "new-event"
      }
    ]
  }
}
```

---

## Response Envelope

All admin routes use the same envelope:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [...] } }

// Warning (data accepted but issues found)
{ "ok": true, "data": { ... }, "warnings": ["Possible duplicate: evt-041 has similar title"] }
```

---

## Workflow State Machine

```
CREATED → IN_PROGRESS → COMPLETED
                ↓
            ABORTED (triggers rollback of created entities)
```

Each step can be:
- `PENDING` — not yet attempted
- `COMPLETED` — data submitted and validated
- `SKIPPED` — agent chose to skip (with reason)
- `FAILED` — validation failed, needs retry

Workflows expire after 1 hour of inactivity (auto-abort + rollback).

---

## Rate Limiting

- 100 requests/minute per API key
- Workflows: max 5 active simultaneously
- Bulk endpoints: max 10 items per request

---

## Implementation Priority

### Phase 1 — Core (ship first)
1. Auth middleware
2. Workflow engine (templates, advance, abort)
3. Search/dedup endpoints
4. Event CRUD
5. X Post CRUD
6. Validation/integrity checks
7. Context/instructions endpoint

### Phase 2 — Full Coverage
8. Day management
9. Actor management
10. Casualty management
11. Map features
12. Map stories

### Phase 3 — Polish
13. RSS management
14. Economic indexes
15. Predictions
16. Scenario management
17. Auto-fix endpoint
