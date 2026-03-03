# Pharos AI — OpenClaw Agent Manual

> Complete reference for the autonomous agent ingesting intelligence data into the Pharos dashboard.

---

## Table of Contents

1. [What is Pharos AI](#1-what-is-pharos-ai)
2. [Authentication](#2-authentication)
3. [API Conventions](#3-api-conventions)
4. [Data Model Overview](#4-data-model-overview)
5. [Recommended Workflow](#5-recommended-workflow)
6. [Endpoint Reference](#6-endpoint-reference)
   - [Health](#61-health)
   - [Context & Discovery](#62-context--discovery)
   - [Events](#63-events)
   - [X Posts](#64-x-posts)
   - [Actors](#65-actors)
   - [Day Snapshots](#66-day-snapshots)
   - [Conflict Meta](#67-conflict-meta)
   - [Casualties](#68-casualties)
   - [Map Features](#69-map-features)
   - [Map Stories](#610-map-stories)
   - [Search](#611-search)
   - [Validate](#612-validate)
   - [Bulk Operations](#613-bulk-operations)
7. [Enum Reference](#7-enum-reference)
8. [Error Handling](#8-error-handling)
9. [ID Generation](#9-id-generation)
10. [Tips & Gotchas](#10-tips--gotchas)

---

## 1. What is Pharos AI

Pharos AI is a real-time geopolitical intelligence dashboard that tracks armed conflicts. The dashboard visualizes:

- **Events** — timestamped intelligence reports (military strikes, diplomatic moves, economic actions)
- **X Posts** — social media signals from military officials, journalists, analysts, government accounts
- **Actors** — state and non-state actors involved in the conflict, each with daily snapshots of their activity level, stance, and assessment
- **Day Snapshots** — daily summaries of the conflict including escalation score (0-100), casualties, economic impact chips, and scenario forecasts
- **Map Features** — geographic data: strike arcs, missile tracks, targets, military assets, threat zones, and heat points
- **Map Stories** — narrative overlays that tie together map features with a timeline of events

All data is scoped to a **conflict** (e.g., `iran-2026`). The agent's job is to monitor news and social media, then ingest structured data through this API every ~5 minutes.

---

## 2. Authentication

Every request must include:

```
Authorization: Bearer pharos_abf0daf1781732710bb0572ae67a9de3004486d4505ce5a00a55ddfc20fab4ed
```

### Error responses

| Status | Code | Meaning |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or malformed `Authorization` header |
| 403 | `FORBIDDEN` | Invalid API key |
| 500 | `SERVER_ERROR` | `PHAROS_ADMIN_API_KEY` env var not set on server |

---

## 3. API Conventions

**Base URL:** `https://<host>/api/v1/admin`

**Conflict scope:** Almost all endpoints are under `/admin/{conflictId}/...`. The current conflict ID is:

```
iran-2026
```

### Response envelope

Every response follows this shape:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": { "code": "VALIDATION", "message": "Missing required field: title" } }
```

### Common status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error (bad input) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Duplicate ID (resource already exists) |
| 503 | Database unavailable |

### Agent-generated IDs

You (the agent) generate IDs for events, X posts, map features, and map stories. This enables **idempotent retries** — if a request fails mid-flight, retry with the same ID. If the resource was already created, you'll get a `409` instead of a duplicate.

**ID format recommendation:** Use descriptive slugs like `evt-2026-03-03-tehran-strike-001` or `xp-@IranMilitary-2026-03-03-01`.

### Timestamps

All timestamps are ISO 8601 strings: `2026-03-03T14:30:00.000Z`

### Dates (day fields)

Day fields are `YYYY-MM-DD` strings: `2026-03-03`

---

## 4. Data Model Overview

```
Conflict
├── ConflictDaySnapshot (one per day)
│   ├── CasualtySummary[] (one per faction)
│   ├── EconomicImpactChip[] (ordered)
│   └── Scenario[] (ordered)
├── Actor[]
│   ├── ActorDaySnapshot[] (one per actor per day)
│   ├── ActorAction[]
│   └── EventActorResponse[]
├── IntelEvent[]
│   ├── EventSource[]
│   └── EventActorResponse[]
├── XPost[] (optionally linked to event and/or actor)
├── MapFeature[] (discriminated by featureType)
└── MapStory[]
    └── MapStoryEvent[] (ordered timeline)
```

### Key relationships

- An **XPost** can be linked to one **IntelEvent** (`eventId`) and/or one **Actor** (`actorId`). Both are optional.
- An **EventActorResponse** links an **Actor** to an **IntelEvent** with a stance and statement.
- **MapFeatures** are generic rows discriminated by `featureType` (STRIKE_ARC, MISSILE_TRACK, TARGET, ASSET, THREAT_ZONE, HEAT_POINT). Geometry and properties are JSON columns.
- **MapStories** reference map feature IDs via `highlightStrikeIds`, `highlightMissileIds`, etc.

---

## 5. Recommended Workflow

This is the sequence the agent should follow on each cycle (~5 minutes):

### Step 1: Get context

```
GET /admin/iran-2026/context?hours=48
```

This returns everything you need to know:
- What events, X posts, and map features exist in the last 48 hours
- Which actors exist and when their last snapshot was
- **Hints** — actionable items like missing day snapshots, actors without today's snapshot, unlinked X posts, events without sources

### Step 2: Create today's day snapshot (if missing)

Check `hints.missingDaySnapshot`. If `true`:

```
POST /admin/iran-2026/days
```

Include casualties, economic chips, and scenarios if available.

### Step 3: Ingest new events

For each new intelligence event discovered:

```
POST /admin/iran-2026/events
```

Include inline `sources` and `actorResponses` if available. If sources come later, use the separate endpoint.

For multiple events at once (up to 50):

```
POST /admin/iran-2026/bulk/events
```

### Step 4: Ingest X posts

For each new social media signal:

```
POST /admin/iran-2026/x-posts
```

Link to an event via `eventId` if the post discusses a known event. For multiple posts:

```
POST /admin/iran-2026/bulk/x-posts
```

### Step 5: Update actors

For actors whose situation has changed:

```
PUT /admin/iran-2026/actors/{actorId}
```

Create daily snapshots for actors listed in `hints.actorsWithoutTodaySnapshot`:

```
POST /admin/iran-2026/actors/{actorId}/snapshots
```

### Step 6: Add map features (if applicable)

When events have geographic relevance, create typed map features:

```
POST /admin/iran-2026/map/strike-arcs
POST /admin/iran-2026/map/missile-tracks
POST /admin/iran-2026/map/targets
POST /admin/iran-2026/map/assets
POST /admin/iran-2026/map/threat-zones
POST /admin/iran-2026/map/heat-points
```

### Step 7: Create map stories (if applicable)

When a narrative thread connects multiple events/features:

```
POST /admin/iran-2026/map/stories
```

### Step 8: Validate (periodic)

Every ~30 minutes, run the validation endpoint to catch orphans and gaps:

```
GET /admin/iran-2026/validate
```

---

## 6. Endpoint Reference

### 6.1 Health

#### `GET /admin/health`

Auth check + database ping. Use this to verify connectivity.

**Response:**
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "db": "connected",
    "timestamp": "2026-03-03T12:00:00.000Z"
  }
}
```

---

### 6.2 Context & Discovery

#### `GET /admin/{conflictId}/context`

**The most important endpoint.** Call this first every cycle.

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `hours` | int | 48 | Lookback window (max 168 = 7 days) |

**Response shape:**
```json
{
  "ok": true,
  "data": {
    "conflict": {
      "id": "iran-2026",
      "name": "Iran Crisis 2026",
      "status": "ONGOING",
      "threatLevel": "CRITICAL",
      "escalation": 78
    },
    "window": {
      "from": "2026-03-01T12:00:00.000Z",
      "to": "2026-03-03T12:00:00.000Z",
      "hours": 48
    },
    "currentDay": {
      "today": "2026-03-03",
      "snapshotExists": true,
      "latestDay": "2026-03-03"
    },
    "recentEvents": {
      "total": 12,
      "items": [
        {
          "id": "evt-2026-03-03-tehran-strike-001",
          "timestamp": "2026-03-03T08:15:00.000Z",
          "severity": "CRITICAL",
          "type": "MILITARY",
          "title": "Missile strike on Tehran air defense site",
          "sourceCount": 3,
          "xPostCount": 5
        }
      ]
    },
    "recentXPosts": {
      "total": 45,
      "items": [
        {
          "id": "xp-@PentagonPress-2026-03-03-01",
          "timestamp": "2026-03-03T09:00:00.000Z",
          "handle": "@PentagonPress",
          "significance": "BREAKING",
          "eventId": "evt-2026-03-03-tehran-strike-001"
        }
      ]
    },
    "recentMapFeatures": {
      "total": 8,
      "items": [
        { "id": "feat-strike-tehran-001", "featureType": "STRIKE_ARC", "actor": "us" }
      ]
    },
    "actors": [
      {
        "id": "us",
        "name": "United States",
        "type": "STATE",
        "activityLevel": "CRITICAL",
        "stance": "AGGRESSOR",
        "latestSnapshotDay": "2026-03-03"
      }
    ],
    "mapStories": {
      "total": 3,
      "latestTimestamp": "2026-03-03T06:00:00.000Z"
    },
    "hints": {
      "missingDaySnapshot": false,
      "actorsWithoutTodaySnapshot": ["hezbollah", "houthis"],
      "unlinkedXPosts": 12,
      "eventsWithoutSources": ["evt-2026-03-02-basra-incident"]
    }
  }
}
```

**How to use hints:**

| Hint | Action |
|------|--------|
| `missingDaySnapshot: true` | Create today's day snapshot via `POST /admin/{id}/days` |
| `actorsWithoutTodaySnapshot: [...]` | Create snapshots via `POST /admin/{id}/actors/{actorId}/snapshots` |
| `unlinkedXPosts > 0` | Consider linking X posts to events via `PUT /admin/{id}/x-posts/{postId}` with `eventId` |
| `eventsWithoutSources: [...]` | Add sources via `POST /admin/{id}/events/{eventId}/sources` |

---

### 6.3 Events

Events are the core intelligence records. Each represents a discrete incident or development.

#### `POST /admin/{conflictId}/events` — Create event

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent-generated unique ID |
| `timestamp` | string | ISO 8601 datetime of when the event occurred |
| `severity` | enum | `CRITICAL`, `HIGH`, or `STANDARD` |
| `type` | enum | `MILITARY`, `DIPLOMATIC`, `INTELLIGENCE`, `ECONOMIC`, `HUMANITARIAN`, `POLITICAL` |
| `title` | string | Short headline (under 120 chars) |
| `location` | string | Where it happened (e.g., "Tehran, Iran" or "Strait of Hormuz") |
| `summary` | string | 1-3 sentence summary |
| `fullContent` | string | Full analytical report (multiple paragraphs) |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `verified` | boolean | false | Whether verified by multiple sources |
| `tags` | string[] | [] | Categorization tags |
| `sources` | object[] | — | Inline source creation (see below) |
| `actorResponses` | object[] | — | Inline actor response creation (see below) |

**Source object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Source name (e.g., "Reuters", "OSINT analyst") |
| `tier` | int | yes | Source tier: 1 (most reliable) to 5 |
| `reliability` | int | yes | Reliability score: 0-100 |
| `url` | string | no | Source URL |

**Actor response object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actorId` | string | yes | Must match an existing actor ID |
| `actorName` | string | yes | Actor display name |
| `stance` | enum | yes | `SUPPORTING`, `OPPOSING`, `NEUTRAL`, `UNKNOWN` |
| `type` | string | yes | Response type (e.g., "official_statement", "military_action") |
| `statement` | string | yes | What they said or did |

**Example:**
```json
{
  "id": "evt-2026-03-03-hormuz-naval-001",
  "timestamp": "2026-03-03T14:30:00.000Z",
  "severity": "HIGH",
  "type": "MILITARY",
  "title": "IRGC Navy deploys fast-attack craft in Strait of Hormuz",
  "location": "Strait of Hormuz",
  "summary": "Iranian Revolutionary Guard Corps Navy has deployed approximately 20 fast-attack craft near the Strait of Hormuz in what appears to be a show of force following overnight airstrikes.",
  "fullContent": "Satellite imagery and shipping reports confirm that the IRGC Navy has deployed approximately 20 fast-attack craft...(full report)...",
  "verified": true,
  "tags": ["naval", "hormuz", "irgc", "escalation"],
  "sources": [
    { "name": "Reuters", "tier": 1, "reliability": 95, "url": "https://reuters.com/..." },
    { "name": "Maritime Traffic OSINT", "tier": 3, "reliability": 70 }
  ],
  "actorResponses": [
    {
      "actorId": "iran",
      "actorName": "Iran",
      "stance": "SUPPORTING",
      "type": "military_action",
      "statement": "IRGC Navy Commander stated: 'We will defend our waters against any aggression.'"
    },
    {
      "actorId": "us",
      "actorName": "United States",
      "stance": "OPPOSING",
      "type": "official_statement",
      "statement": "CENTCOM: 'We are monitoring Iranian naval activity and remain prepared to ensure freedom of navigation.'"
    }
  ]
}
```

**Success:** `{ "ok": true, "data": { "id": "evt-...", "created": true } }`

**409 on duplicate:** `{ "ok": false, "error": { "code": "DUPLICATE", "message": "Event evt-... already exists" } }`

#### `PUT /admin/{conflictId}/events/{eventId}` — Update event

Send only the fields you want to change. All fields from the create endpoint are accepted (except `id`).

```json
{
  "severity": "CRITICAL",
  "verified": true,
  "tags": ["naval", "hormuz", "irgc", "escalation", "confirmed"]
}
```

**Response:** `{ "ok": true, "data": { "id": "evt-...", "updated": true } }`

#### `DELETE /admin/{conflictId}/events/{eventId}` — Delete event

Cascades to sources and actor responses.

**Response:** `{ "ok": true, "data": { "id": "evt-...", "deleted": true } }`

#### `POST /admin/{conflictId}/events/{eventId}/sources` — Add sources

Add sources to an existing event (useful when sources arrive after initial event creation).

```json
{
  "sources": [
    { "name": "AP News", "tier": 1, "reliability": 90, "url": "https://apnews.com/..." }
  ]
}
```

**Response:** `{ "ok": true, "data": { "eventId": "evt-...", "added": 1 } }`

---

### 6.4 X Posts

Social media signals from key accounts. These are the "pulse" of real-time reactions.

#### `POST /admin/{conflictId}/x-posts` — Create X post

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent-generated unique ID |
| `handle` | string | Twitter/X handle (e.g., "@PentagonPress") |
| `displayName` | string | Display name (e.g., "Pentagon Press Secretary") |
| `content` | string | Full post text |
| `accountType` | enum | `military`, `government`, `journalist`, `analyst`, `official` |
| `significance` | enum | `BREAKING`, `HIGH`, `STANDARD` |
| `timestamp` | string | ISO 8601 datetime |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `avatar` | string | "" | Avatar URL or emoji placeholder |
| `avatarColor` | string | "#6B7280" | Hex color for avatar background |
| `verified` | boolean | false | Whether account is verified |
| `images` | string[] | [] | Image URLs |
| `videoThumb` | string | null | Video thumbnail URL |
| `likes` | int | 0 | Like count |
| `retweets` | int | 0 | Retweet count |
| `replies` | int | 0 | Reply count |
| `views` | int | 0 | View count |
| `pharosNote` | string | null | Analyst note about why this post matters |
| `eventId` | string | null | Link to an IntelEvent (FK validated) |
| `actorId` | string | null | Link to an Actor (FK validated) |

**Example:**
```json
{
  "id": "xp-@PentagonPress-2026-03-03-02",
  "handle": "@PentagonPress",
  "displayName": "Pentagon Press Secretary",
  "content": "CENTCOM: U.S. naval forces in the Fifth Fleet area of operations are monitoring increased IRGC Navy activity in the Strait of Hormuz. Freedom of navigation operations continue as scheduled.",
  "accountType": "military",
  "significance": "HIGH",
  "timestamp": "2026-03-03T15:00:00.000Z",
  "verified": true,
  "likes": 12400,
  "retweets": 5200,
  "views": 890000,
  "pharosNote": "Official confirmation of IRGC naval deployment. Matches OSINT reporting from 30 minutes prior.",
  "eventId": "evt-2026-03-03-hormuz-naval-001",
  "actorId": "us"
}
```

#### `PUT /admin/{conflictId}/x-posts/{postId}` — Update X post

Send only changed fields. Commonly used to:
- Link a post to an event: `{ "eventId": "evt-..." }`
- Update engagement metrics: `{ "likes": 15000, "retweets": 6100 }`
- Unlink from event: `{ "eventId": null }`

#### `DELETE /admin/{conflictId}/x-posts/{postId}` — Delete X post

**Response:** `{ "ok": true, "data": { "id": "xp-...", "deleted": true } }`

---

### 6.5 Actors

Actors are the state and non-state entities involved in the conflict. Actors are **pre-seeded** — you update them but don't create new ones.

#### `PUT /admin/{conflictId}/actors/{actorId}` — Update actor

Updates the actor's "current" top-level state. Use this when the overall picture changes.

**Updatable fields:**

| Field | Type | Description |
|-------|------|-------------|
| `activityLevel` | enum | `CRITICAL`, `HIGH`, `ELEVATED`, `MODERATE` |
| `activityScore` | int | 0-100 numeric activity score |
| `stance` | enum | `AGGRESSOR`, `DEFENDER`, `RETALIATING`, `PROXY`, `NEUTRAL`, `CONDEMNING` |
| `saying` | string | Current public messaging (quote or paraphrase) |
| `doing` | string[] | List of current actions |
| `assessment` | string | Analyst assessment paragraph |
| `keyFigures` | string[] | Key people involved |
| `linkedEventIds` | string[] | IDs of related events |

**Example:**
```json
{
  "activityLevel": "CRITICAL",
  "activityScore": 92,
  "stance": "RETALIATING",
  "saying": "Supreme Leader: 'The response will be decisive and at a time of our choosing.'",
  "doing": [
    "Deploying fast-attack craft to Strait of Hormuz",
    "Activating air defense systems across western Iran",
    "Mobilizing IRGC Quds Force"
  ],
  "assessment": "Iran is signaling imminent retaliation following overnight strikes. The naval deployment in Hormuz suggests they may attempt to disrupt shipping lanes as leverage."
}
```

#### `POST /admin/{conflictId}/actors/{actorId}/snapshots` — Create daily snapshot

Creates a point-in-time record for an actor on a specific day. **One per actor per day.**

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `day` | string | `YYYY-MM-DD` format |
| `activityLevel` | enum | `CRITICAL`, `HIGH`, `ELEVATED`, `MODERATE` |
| `activityScore` | int | 0-100 |
| `stance` | enum | `AGGRESSOR`, `DEFENDER`, `RETALIATING`, `PROXY`, `NEUTRAL`, `CONDEMNING` |
| `saying` | string | Key quote or paraphrase |
| `doing` | string[] | Current actions list |
| `assessment` | string | Analyst assessment |

**Example:**
```json
{
  "day": "2026-03-03",
  "activityLevel": "HIGH",
  "activityScore": 75,
  "stance": "PROXY",
  "saying": "Nasrallah: 'We stand in solidarity with the axis of resistance.'",
  "doing": [
    "Increased drone surveillance over northern Israel",
    "Repositioning rocket launchers in southern Lebanon"
  ],
  "assessment": "Hezbollah is posturing but has not engaged directly. Likely awaiting Iranian direction before committing to a second front."
}
```

**409 on duplicate:** Snapshot for this actor+day already exists.

#### `PUT /admin/{conflictId}/actors/{actorId}/snapshots/{day}` — Update snapshot

Send only changed fields. Day is in the URL as `YYYY-MM-DD`.

#### `POST /admin/{conflictId}/actors/{actorId}/actions` — Add action

Records a discrete action taken by an actor.

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date string (e.g., "2026-03-03") |
| `type` | enum | `MILITARY`, `DIPLOMATIC`, `POLITICAL`, `ECONOMIC`, `INTELLIGENCE` |
| `description` | string | What happened |
| `significance` | enum | `HIGH`, `MEDIUM`, `LOW` |

**Optional:** `verified` (boolean, default false)

**Example:**
```json
{
  "date": "2026-03-03",
  "type": "MILITARY",
  "description": "IRGC Navy deployed 20+ fast-attack craft to Strait of Hormuz",
  "significance": "HIGH",
  "verified": true
}
```

#### `POST /admin/{conflictId}/actors/{actorId}/responses` — Record event response

Links an actor's reaction to a specific event.

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Must reference an existing event (FK validated) |
| `stance` | enum | `SUPPORTING`, `OPPOSING`, `NEUTRAL`, `UNKNOWN` |
| `type` | string | Response category (e.g., "official_statement", "military_action", "diplomatic_note") |
| `statement` | string | What they said/did |

The `actorName` is auto-populated from the actor record.

---

### 6.6 Day Snapshots

A day snapshot is the daily "state of the conflict" — summary, escalation level, casualties, economic impacts, and scenario forecasts.

#### `POST /admin/{conflictId}/days` — Create day snapshot

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `day` | string | `YYYY-MM-DD` |
| `dayLabel` | string | Display label (e.g., "Day 12 — Escalation Continues") |
| `summary` | string | Multi-paragraph daily summary |
| `escalation` | int | 0-100 escalation score |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `keyFacts` | string[] | [] | Bullet-point key facts |
| `economicNarrative` | string | "" | Economic impact summary |
| `casualties` | object[] | — | Casualty summaries per faction |
| `economicChips` | object[] | — | Economic impact indicator chips |
| `scenarios` | object[] | — | Forecast scenarios |

**Casualty object:**

| Field | Type | Description |
|-------|------|-------------|
| `faction` | string | Faction key: "us", "israel", "iran", "lebanon", or any regional faction |
| `killed` | int | Killed count |
| `wounded` | int | Wounded count |
| `civilians` | int | Civilian casualties |
| `injured` | int | Injured count |

**Economic chip object:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Indicator name (e.g., "Brent Crude") |
| `val` | string | Current value (e.g., "$127.40") |
| `sub` | string | Change indicator (e.g., "+8.2% today") |
| `color` | string | CSS color class (e.g., "red", "green", "amber") |

**Scenario object:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Scenario name (e.g., "Full Escalation") |
| `subtitle` | string | Short descriptor |
| `color` | string | CSS color class |
| `prob` | string | Probability (e.g., "35%") |
| `body` | string | Detailed scenario description |

**Example:**
```json
{
  "day": "2026-03-03",
  "dayLabel": "Day 12 — Strait of Hormuz Standoff",
  "summary": "Tensions escalated dramatically as IRGC naval forces deployed to the Strait of Hormuz following overnight U.S. airstrikes on Iranian air defense sites...",
  "escalation": 82,
  "keyFacts": [
    "IRGC Navy deploys 20+ fast-attack craft to Hormuz",
    "Oil prices spike 8% to $127/barrel",
    "UN Security Council emergency session called"
  ],
  "casualties": [
    { "faction": "iran", "killed": 23, "injured": 47 },
    { "faction": "us", "killed": 0, "wounded": 2, "civilians": 0 }
  ],
  "economicChips": [
    { "label": "Brent Crude", "val": "$127.40", "sub": "+8.2%", "color": "red" },
    { "label": "Gold", "val": "$2,890", "sub": "+3.1%", "color": "green" },
    { "label": "VIX", "val": "38.5", "sub": "+45%", "color": "red" }
  ],
  "scenarios": [
    {
      "label": "Full Escalation",
      "subtitle": "Regional war",
      "color": "red",
      "prob": "25%",
      "body": "Iran retaliates with direct missile strikes on U.S. bases in Iraq and the Gulf. Hezbollah opens second front. Shipping through Hormuz halted."
    },
    {
      "label": "Contained Response",
      "subtitle": "Proxy retaliation",
      "color": "amber",
      "prob": "45%",
      "body": "Iran responds through proxies — Houthis escalate Red Sea attacks, Hezbollah conducts limited cross-border operations. Direct Iran-U.S. confrontation avoided."
    }
  ]
}
```

**409 on duplicate:** Day snapshot for this conflict+day already exists.

#### `PUT /admin/{conflictId}/days/{day}` — Update day snapshot

Send only changed fields. If you send `casualties`, `economicChips`, or `scenarios`, the existing records for that category are **replaced entirely** (delete + recreate).

---

### 6.7 Conflict Meta

#### `PUT /admin/{conflictId}/conflict` — Update conflict

Updates top-level conflict fields.

**Updatable fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Conflict display name |
| `status` | enum | `ONGOING`, `PAUSED`, `CEASEFIRE`, `RESOLVED` |
| `threatLevel` | enum | `CRITICAL`, `HIGH`, `ELEVATED`, `MONITORING` |
| `escalation` | int | 0-100 overall escalation score |
| `summary` | string | Overall conflict summary |
| `keyFacts` | string[] | Overall key facts |

---

### 6.8 Casualties

#### `POST /admin/{conflictId}/casualties` — Upsert casualties for a day

Replaces all casualty records for a given day. The day snapshot must already exist.

```json
{
  "day": "2026-03-03",
  "casualties": [
    { "faction": "iran", "killed": 23, "injured": 47 },
    { "faction": "us", "killed": 0, "wounded": 2, "civilians": 0 },
    { "faction": "israel", "killed": 3, "wounded": 8, "civilians": 1, "injured": 5 }
  ]
}
```

**Response:** `{ "ok": true, "data": { "day": "2026-03-03", "upserted": 3 } }`

**404:** If the day snapshot doesn't exist yet (create it first via `POST /admin/{id}/days`).

---

### 6.9 Map Features

Map features represent geographic elements on the intelligence map. Each type has specific geometry requirements.

#### Geometry types

| Feature Type | Geometry Shape | Required Fields |
|-------------|---------------|-----------------|
| STRIKE_ARC | Arc (line) | `geometry.from: [lng, lat]`, `geometry.to: [lng, lat]` |
| MISSILE_TRACK | Arc (line) | `geometry.from: [lng, lat]`, `geometry.to: [lng, lat]` |
| TARGET | Point | `geometry.position: [lng, lat]` |
| ASSET | Point | `geometry.position: [lng, lat]` |
| THREAT_ZONE | Polygon | `geometry.coordinates: [[lng, lat], ...]` |
| HEAT_POINT | Point | `geometry.position: [lng, lat]` |

#### Common required fields (all feature types)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent-generated unique ID |
| `actor` | string | Actor key (e.g., "us", "iran", "irgc") |
| `priority` | string | Display priority (e.g., "primary", "secondary") |
| `category` | string | Feature category (e.g., "KINETIC", "INSTALLATION", "ZONE") |
| `type` | string | Specific subtype (e.g., "BALLISTIC", "CRUISE", "AIR_BASE") |

#### Common optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | null | Status label (e.g., "active", "destroyed") |
| `timestamp` | string | null | ISO 8601 when this feature became relevant |
| `properties` | object | {} | Type-specific display properties (label, name, description, severity, color, weight, etc.) |

#### `POST /admin/{conflictId}/map/strike-arcs`

```json
{
  "id": "strike-us-tehran-001",
  "actor": "us",
  "priority": "primary",
  "category": "KINETIC",
  "type": "CRUISE",
  "status": "confirmed",
  "timestamp": "2026-03-03T02:00:00.000Z",
  "geometry": {
    "from": [47.5, 29.0],
    "to": [51.4, 35.7]
  },
  "properties": {
    "label": "Tomahawk strike — Tehran AD site",
    "severity": "CRITICAL"
  }
}
```

#### `POST /admin/{conflictId}/map/missile-tracks`

Same geometry as strike arcs (`from` + `to`). Used for adversary missile launches.

```json
{
  "id": "missile-iran-base-001",
  "actor": "iran",
  "priority": "primary",
  "category": "KINETIC",
  "type": "BALLISTIC",
  "timestamp": "2026-03-03T06:30:00.000Z",
  "geometry": {
    "from": [52.0, 33.5],
    "to": [47.2, 29.8]
  },
  "properties": {
    "label": "Fateh-110 launch — Al Udeid",
    "severity": "HIGH"
  }
}
```

#### `POST /admin/{conflictId}/map/targets`

Point geometry. Represents a targeted location.

```json
{
  "id": "target-tehran-ad-001",
  "actor": "iran",
  "priority": "primary",
  "category": "INSTALLATION",
  "type": "AIR_DEFENSE",
  "status": "destroyed",
  "timestamp": "2026-03-03T02:15:00.000Z",
  "geometry": {
    "position": [51.35, 35.72]
  },
  "properties": {
    "name": "Tehran S-300 Battery",
    "description": "S-300PMU2 air defense battery, confirmed destroyed by CENTCOM"
  }
}
```

#### `POST /admin/{conflictId}/map/assets`

Point geometry. Represents a military asset (carrier, base, etc.).

```json
{
  "id": "asset-uss-eisenhower",
  "actor": "us",
  "priority": "primary",
  "category": "INSTALLATION",
  "type": "CARRIER",
  "geometry": {
    "position": [56.5, 24.8]
  },
  "properties": {
    "name": "USS Dwight D. Eisenhower (CVN-69)",
    "description": "Carrier Strike Group 2 — Gulf of Oman"
  }
}
```

#### `POST /admin/{conflictId}/map/threat-zones`

Polygon geometry. Represents an area of threat or control.

```json
{
  "id": "zone-hormuz-threat",
  "actor": "iran",
  "priority": "primary",
  "category": "ZONE",
  "type": "NAVAL_THREAT",
  "geometry": {
    "coordinates": [
      [55.5, 26.5], [56.5, 26.0], [57.0, 26.8], [56.0, 27.2], [55.5, 26.5]
    ]
  },
  "properties": {
    "name": "IRGC Naval Threat Zone",
    "color": "red"
  }
}
```

#### `POST /admin/{conflictId}/map/heat-points`

Point geometry with weight. Used for heat map visualization.

```json
{
  "id": "heat-tehran-strikes",
  "actor": "us",
  "priority": "secondary",
  "category": "KINETIC",
  "type": "STRIKE_ZONE",
  "geometry": {
    "position": [51.4, 35.7]
  },
  "properties": {
    "weight": 0.9
  }
}
```

#### `PUT /admin/{conflictId}/map/features/{featureId}` — Update any feature

Works for all feature types. Send only changed fields.

```json
{
  "status": "destroyed",
  "properties": {
    "name": "Tehran S-300 Battery",
    "description": "Confirmed destroyed per satellite imagery analysis"
  }
}
```

#### `DELETE /admin/{conflictId}/map/features/{featureId}` — Delete any feature

**Response:** `{ "ok": true, "data": { "id": "feat-...", "deleted": true } }`

---

### 6.10 Map Stories

Narrative threads that tie together map features with a timeline.

#### `POST /admin/{conflictId}/map/stories` — Create story

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent-generated unique ID |
| `title` | string | Story headline |
| `tagline` | string | One-line summary |
| `iconName` | string | Icon identifier (e.g., "missile", "ship", "shield") |
| `category` | enum | `STRIKE`, `RETALIATION`, `NAVAL`, `INTEL`, `DIPLOMATIC` |
| `narrative` | string | Multi-paragraph narrative |
| `viewState` | object | Map camera: `{ longitude, latitude, zoom }` |
| `timestamp` | string | ISO 8601 datetime |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `highlightStrikeIds` | string[] | [] | Strike arc feature IDs to highlight |
| `highlightMissileIds` | string[] | [] | Missile track feature IDs to highlight |
| `highlightTargetIds` | string[] | [] | Target feature IDs to highlight |
| `highlightAssetIds` | string[] | [] | Asset feature IDs to highlight |
| `keyFacts` | string[] | [] | Key facts for the story sidebar |
| `events` | object[] | — | Inline timeline events |

**Timeline event object:**

| Field | Type | Description |
|-------|------|-------------|
| `time` | string | Display time (e.g., "02:00 UTC", "Day 12 AM") |
| `label` | string | What happened at this time |
| `type` | enum | `STRIKE`, `RETALIATION`, `INTEL`, `NAVAL`, `POLITICAL` |

**Example:**
```json
{
  "id": "story-hormuz-standoff-001",
  "title": "Strait of Hormuz Standoff",
  "tagline": "IRGC naval deployment threatens global shipping",
  "iconName": "ship",
  "category": "NAVAL",
  "narrative": "Following overnight U.S. airstrikes on Iranian air defense sites, the IRGC Navy deployed over 20 fast-attack craft to the Strait of Hormuz...",
  "viewState": { "longitude": 56.0, "latitude": 26.5, "zoom": 7 },
  "timestamp": "2026-03-03T14:00:00.000Z",
  "highlightAssetIds": ["asset-uss-eisenhower"],
  "highlightStrikeIds": ["strike-us-tehran-001"],
  "keyFacts": [
    "20+ IRGC fast-attack craft deployed",
    "Oil prices +8.2%",
    "U.S. 5th Fleet on high alert"
  ],
  "events": [
    { "time": "02:00 UTC", "label": "U.S. cruise missile strikes on Tehran AD sites", "type": "STRIKE" },
    { "time": "06:30 UTC", "label": "IRGC retaliatory missile launch detected", "type": "RETALIATION" },
    { "time": "10:00 UTC", "label": "IRGC Navy fast-attack craft deploy to Hormuz", "type": "NAVAL" },
    { "time": "14:00 UTC", "label": "UN Security Council emergency session begins", "type": "POLITICAL" }
  ]
}
```

#### `PUT /admin/{conflictId}/map/stories/{storyId}` — Update story

Send only changed fields.

#### `DELETE /admin/{conflictId}/map/stories/{storyId}` — Delete story

Cascades to timeline events.

#### `POST /admin/{conflictId}/map/stories/{storyId}/events` — Add timeline events

Appends events to an existing story's timeline (auto-increments `ord`).

```json
{
  "events": [
    { "time": "16:00 UTC", "label": "Iran closes airspace over western provinces", "type": "POLITICAL" }
  ]
}
```

**Response:** `{ "ok": true, "data": { "storyId": "story-...", "added": 1 } }`

---

### 6.11 Search

#### `GET /admin/{conflictId}/search`

Consolidated search across all entity types.

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query (case-insensitive substring match) |
| `type` | string | no | Filter to one type: `events`, `xposts`, `actors`, `map`, `stories` |
| `limit` | int | no | Max results per type (default 20, max 100) |

**Example:** `GET /admin/iran-2026/search?q=hormuz&type=events`

**Response:**
```json
{
  "ok": true,
  "data": {
    "query": "hormuz",
    "results": {
      "events": [
        {
          "id": "evt-2026-03-03-hormuz-naval-001",
          "title": "IRGC Navy deploys fast-attack craft in Strait of Hormuz",
          "timestamp": "2026-03-03T14:30:00.000Z",
          "severity": "HIGH",
          "type": "MILITARY"
        }
      ]
    }
  }
}
```

**Search fields by type:**
- `events` — title, summary, location
- `xposts` — content, handle, displayName
- `actors` — name, fullName
- `map` — actor, category, type
- `stories` — title, narrative

---

### 6.12 Validate

#### `GET /admin/{conflictId}/validate`

Returns data quality issues. Run periodically (~30 min).

**Response:**
```json
{
  "ok": true,
  "data": {
    "today": "2026-03-03",
    "missingDaySnapshot": false,
    "issues": {
      "eventsWithoutSources": {
        "count": 2,
        "items": [
          { "id": "evt-...", "title": "...", "timestamp": "..." }
        ]
      },
      "eventsWithoutResponses": {
        "count": 5,
        "items": [...]
      },
      "unlinkedXPosts": {
        "count": 12,
        "items": [
          { "id": "xp-...", "handle": "@...", "timestamp": "..." }
        ]
      },
      "actorsWithoutTodaySnapshot": {
        "count": 2,
        "items": [
          { "id": "hezbollah", "name": "Hezbollah" }
        ]
      },
      "orphanedXPostEventRefs": {
        "count": 0,
        "items": []
      }
    }
  }
}
```

---

### 6.13 Bulk Operations

For high-throughput ingestion. Max 50 items per request. All-or-nothing transaction.

#### `POST /admin/{conflictId}/bulk/events`

```json
{
  "events": [
    {
      "id": "evt-001",
      "timestamp": "2026-03-03T10:00:00.000Z",
      "severity": "STANDARD",
      "type": "DIPLOMATIC",
      "title": "...",
      "location": "...",
      "summary": "...",
      "fullContent": "...",
      "sources": [{ "name": "Reuters", "tier": 1, "reliability": 90 }]
    },
    {
      "id": "evt-002",
      "timestamp": "2026-03-03T10:30:00.000Z",
      "severity": "HIGH",
      "type": "MILITARY",
      "title": "...",
      "location": "...",
      "summary": "...",
      "fullContent": "..."
    }
  ]
}
```

**Success:** `{ "ok": true, "data": { "created": ["evt-001", "evt-002"], "errors": [] } }`

**Validation failure:** Returns 400 if any items fail validation (none are created).

**Duplicate:** Returns 409 if any IDs already exist (none are created).

#### `POST /admin/{conflictId}/bulk/x-posts`

Same pattern but with `posts` array key:

```json
{
  "posts": [
    {
      "id": "xp-001",
      "handle": "@analyst",
      "displayName": "OSINT Analyst",
      "content": "...",
      "accountType": "analyst",
      "significance": "STANDARD",
      "timestamp": "2026-03-03T10:00:00.000Z"
    }
  ]
}
```

---

## 7. Enum Reference

### Severity (events)
`CRITICAL` | `HIGH` | `STANDARD`

### EventType
`MILITARY` | `DIPLOMATIC` | `INTELLIGENCE` | `ECONOMIC` | `HUMANITARIAN` | `POLITICAL`

### SignificanceLevel (X posts)
`BREAKING` | `HIGH` | `STANDARD`

### AccountType (X posts)
`military` | `government` | `journalist` | `analyst` | `official`

Note: AccountType uses **lowercase** values. All other enums use UPPERCASE.

### ActivityLevel (actors)
`CRITICAL` | `HIGH` | `ELEVATED` | `MODERATE`

### Stance (actors)
`AGGRESSOR` | `DEFENDER` | `RETALIATING` | `PROXY` | `NEUTRAL` | `CONDEMNING`

### ActorResponseStance
`SUPPORTING` | `OPPOSING` | `NEUTRAL` | `UNKNOWN`

### ActionType (actor actions)
`MILITARY` | `DIPLOMATIC` | `POLITICAL` | `ECONOMIC` | `INTELLIGENCE`

### ActionSignificance
`HIGH` | `MEDIUM` | `LOW`

### ConflictStatus
`ONGOING` | `PAUSED` | `CEASEFIRE` | `RESOLVED`

### ThreatLevel
`CRITICAL` | `HIGH` | `ELEVATED` | `MONITORING`

### MapFeatureType
`STRIKE_ARC` | `MISSILE_TRACK` | `TARGET` | `ASSET` | `THREAT_ZONE` | `HEAT_POINT`

### StoryCategory
`STRIKE` | `RETALIATION` | `NAVAL` | `INTEL` | `DIPLOMATIC`

### StoryEventType
`STRIKE` | `RETALIATION` | `INTEL` | `NAVAL` | `POLITICAL`

---

## 8. Error Handling

### Error codes

| Code | Meaning | What to do |
|------|---------|------------|
| `UNAUTHORIZED` | Missing auth header | Add `Authorization: Bearer <key>` |
| `FORBIDDEN` | Wrong API key | Check the key |
| `NOT_FOUND` | Conflict/resource doesn't exist | Check the ID |
| `VALIDATION` | Bad input | Read the message, fix the field |
| `DUPLICATE` | ID already exists | This is safe — the resource was already created. Skip it. |
| `DB_ERROR` | Database unavailable | Wait and retry |
| `SERVER_ERROR` | Internal error | Wait and retry, report if persistent |

### Retry strategy

- **409 DUPLICATE** — Do NOT retry. The resource exists. Move on.
- **400 VALIDATION** — Do NOT retry with the same data. Fix the input.
- **404 NOT_FOUND** — Check if the parent resource exists. For actor snapshots, make sure the actor ID is correct.
- **500/503** — Retry with exponential backoff (1s, 2s, 4s, max 3 attempts).
- **401/403** — Stop. The key is wrong.

---

## 9. ID Generation

You generate IDs for: events, X posts, map features, and map stories. Use descriptive, collision-resistant formats:

| Entity | Recommended format | Example |
|--------|-------------------|---------|
| Event | `evt-{YYYY-MM-DD}-{location-slug}-{seq}` | `evt-2026-03-03-tehran-strike-001` |
| X Post | `xp-{handle}-{YYYY-MM-DD}-{seq}` | `xp-@PentagonPress-2026-03-03-01` |
| Map Feature | `{type}-{actor}-{location}-{seq}` | `strike-us-tehran-001`, `asset-uss-eisenhower` |
| Map Story | `story-{slug}-{seq}` | `story-hormuz-standoff-001` |

IDs must be globally unique within their entity type. Using descriptive IDs also helps with debugging and the search endpoint.

---

## 10. Tips & Gotchas

1. **Always start with context.** The `/context` endpoint tells you what exists and what's missing. Don't blindly create — check first.

2. **Day snapshots must exist before casualties.** If you want to upsert casualties for a day, the day snapshot must already be created.

3. **Actor IDs are pre-seeded.** Don't try to create actors. The existing actor IDs for `iran-2026` are returned in the context response. Common ones: `us`, `israel`, `iran`, `hezbollah`, `houthis`, etc.

4. **Coordinates are [longitude, latitude]** (GeoJSON order), NOT [lat, lng].

5. **AccountType is lowercase**, all other enums are UPPERCASE. Getting this wrong returns a validation error.

6. **409 is your friend.** If you get a 409, the data is already there. Log it and move on. Don't treat it as an error.

7. **Bulk is all-or-nothing.** If one item in a bulk request has a validation error or duplicate ID, the entire batch fails. Pre-validate on your side.

8. **FK validation is strict.** If you link an X post to an event (`eventId`), that event must exist in the same conflict. Same for `actorId` references.

9. **Replacing nested records.** When you PUT a day snapshot with `casualties`, `economicChips`, or `scenarios`, the existing records are **deleted and replaced**. Send the complete set, not just the changes.

10. **Timestamp vs date.** Events and X posts use full ISO timestamps (`2026-03-03T14:30:00.000Z`). Day snapshots and actor snapshots use date strings (`2026-03-03`).

11. **The `properties` JSON field on map features is freeform.** Use it for display data that varies by feature type (labels, names, descriptions, severity, color, weight). The frontend reads these for rendering.

12. **Story highlight IDs are not validated.** You can reference map feature IDs that don't exist yet — useful when creating stories and features in parallel. But ensure they exist before the frontend reads them.
