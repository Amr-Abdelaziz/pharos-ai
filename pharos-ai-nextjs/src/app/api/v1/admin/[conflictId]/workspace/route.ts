/** GET workspace — daily work plan for the Pharos agent. */

import { NextRequest } from 'next/server';
import { prisma } from '@/server/lib/db';
import { ok, err } from '@/server/lib/api-utils';
import { requireAdmin } from '@/server/lib/admin-auth';
import { MAP_ACTOR_KEYS } from '@/server/lib/admin-validate';
import type { Priority } from '@/data/map-tokens';

type TodoItem = {
  priority: Priority;
  category: string;
  title: string;
  description: string;
  action: string;
  count?: number;
  items?: unknown[];
  suggestSubagent?: boolean;
  subagentHint?: string;
};

// Daily content targets — add data continuously throughout the day
const TARGETS = {
  events: 20,
  xPosts: 100,
  mapFeatures: 40,
  stories: 6,
  actorActions: 40,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const todayStart = new Date(today + 'T00:00:00Z');

  // ── Parallel DB queries ───────────────────────────────────────────────────

  // Fetch actors first (needed for actorActions query below)
  const actors = await prisma.actor.findMany({
    where: { conflictId },
    select: { id: true, name: true, mapKey: true },
  });

  const [
    todaySnapshot,
    actorSnapshotsToday,
    eventsToday,
    eventsWithoutSources,
    eventsWithoutResponses,
    xPostsToday,
    unlinkedXPosts,
    mapFeaturesToday,
    allMapFeatures,
    allMapStories,
    storiesToday,
    actorActionsToday,
    unverifiedPostCount,
    failedVerificationCount,
  ] = await Promise.all([
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: todayStart },
      select: { id: true, escalation: true, keyFacts: true },
    }),
    prisma.actorDaySnapshot.findMany({
      where: { day: todayStart },
      select: { actorId: true },
    }),
    prisma.intelEvent.findMany({
      where: { conflictId, timestamp: { gte: todayStart } },
      select: { id: true, title: true, timestamp: true, type: true, severity: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.intelEvent.findMany({
      where: { conflictId, sources: { none: {} } },
      select: { id: true, title: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 30,
    }),
    prisma.$queryRaw<{ id: string; title: string; timestamp: Date }[]>`
      SELECT ie.id, ie.title, ie.timestamp
      FROM "IntelEvent" ie
      WHERE ie."conflictId" = ${conflictId}
        AND NOT EXISTS (
          SELECT 1 FROM "EventActorResponse" ear WHERE ear."eventId" = ie.id
        )
      ORDER BY ie.timestamp DESC
      LIMIT 30
    `,
    prisma.xPost.count({
      where: { conflictId, timestamp: { gte: todayStart } },
    }),
    prisma.xPost.findMany({
      where: { conflictId, eventId: null },
      select: { id: true, handle: true, significance: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 20,
    }),
    prisma.mapFeature.count({
      where: { conflictId, timestamp: { gte: todayStart } },
    }),
    prisma.mapFeature.findMany({
      where: { conflictId },
      select: { id: true, actor: true, priority: true, featureType: true },
    }),
    prisma.mapStory.findMany({
      where: { conflictId },
      select: {
        id: true,
        title: true,
        timestamp: true,
        highlightStrikeIds: true,
        highlightMissileIds: true,
        highlightTargetIds: true,
        highlightAssetIds: true,
      },
    }),
    prisma.mapStory.count({
      where: { conflictId, timestamp: { gte: todayStart } },
    }),
    prisma.actorAction.count({
      where: { actorId: { in: actors.map(a => a.id) }, date: { startsWith: today } },
    }),
    // Verification coverage
    prisma.xPost.count({
      where: { conflictId, verificationStatus: 'UNVERIFIED', postType: { not: 'ANALYSIS' } },
    }),
    prisma.xPost.count({
      where: { conflictId, verificationStatus: 'FAILED' },
    }),
  ]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const actorIdsWithSnapshot = new Set(actorSnapshotsToday.map(s => s.actorId));
  const actorsWithoutSnapshot = actors.filter(a => !actorIdsWithSnapshot.has(a.id));

  const featureIdSet = new Set(allMapFeatures.map(f => f.id));
  const brokenStoryRefs: { storyId: string; storyTitle: string; missingIds: string[] }[] = [];
  for (const story of allMapStories) {
    const allHighlightIds = [
      ...story.highlightStrikeIds,
      ...story.highlightMissileIds,
      ...story.highlightTargetIds,
      ...story.highlightAssetIds,
    ];
    const missing = allHighlightIds.filter(id => !featureIdSet.has(id));
    if (missing.length > 0) {
      brokenStoryRefs.push({ storyId: story.id, storyTitle: story.title, missingIds: missing });
    }
  }

  const invalidActorFeatures = allMapFeatures.filter(
    f => !(MAP_ACTOR_KEYS as readonly string[]).includes(f.actor),
  );

  const eventGap = Math.max(0, TARGETS.events - eventsToday.length);
  const xPostGap = Math.max(0, TARGETS.xPosts - xPostsToday);
  const mapFeatureGap = Math.max(0, TARGETS.mapFeatures - mapFeaturesToday);
  const storyGap = Math.max(0, TARGETS.stories - storiesToday);
  const actionGap = Math.max(0, TARGETS.actorActions - actorActionsToday);

  // ── Build todo list ───────────────────────────────────────────────────────

  const todos: TodoItem[] = [];

  // ── P1: Broken infrastructure ─────────────────────────────────────────────

  if (!todaySnapshot) {
    todos.push({
      priority: 'P1',
      category: 'Day Snapshot',
      title: `Create today's day snapshot (${today})`,
      description: 'No day snapshot exists for today. Required for the dashboard. Must be created first — everything else depends on it.',
      action: `POST /api/v1/admin/${conflictId}/days`,
    });
  } else {
    todos.push({
      priority: 'P2',
      category: 'Day Snapshot',
      title: 'Update day snapshot with latest casualties, escalation, and economic data',
      description: 'The day snapshot should be updated multiple times per day as the situation evolves. Update: escalation score, casualty figures per faction, economic chips (oil price, markets, shipping), scenarios, keyFacts, summary. Use PUT /days/{day}.',
      action: `PUT /api/v1/admin/${conflictId}/days/${today}`,
    });
  }

  if (brokenStoryRefs.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Map Stories',
      title: `Fix ${brokenStoryRefs.length} story/stories with broken map feature references`,
      description: 'Stories reference feature IDs that do not exist. Map highlights won\'t render. Fix by removing broken IDs or creating the missing features.',
      action: `PUT /api/v1/admin/${conflictId}/map/stories/{storyId}`,
      count: brokenStoryRefs.length,
      items: brokenStoryRefs.map(r => ({ storyId: r.storyId, title: r.storyTitle, missingIds: r.missingIds })),
    });
  }

  if (invalidActorFeatures.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Map Features',
      title: `Fix ${invalidActorFeatures.length} map feature(s) with invalid actor value`,
      description: `These features have non-valid actor values and will be hidden on the map. Valid: ${MAP_ACTOR_KEYS.join(', ')}`,
      action: `PUT /api/v1/admin/${conflictId}/map/features/{featureId}`,
      count: invalidActorFeatures.length,
      items: invalidActorFeatures.map(f => ({ id: f.id, currentActor: f.actor })),
    });
  }

  // ── P1/P2: Daily content production ──────────────────────────────────────

  if (eventGap > 0) {
    todos.push({
      priority: eventsToday.length === 0 ? 'P1' : 'P2',
      category: 'Events',
      title: `Events — ${eventsToday.length} created, target ${TARGETS.events} (${eventGap} remaining)`,
      description: `Add intelligence events continuously throughout the day. Cover every development: airstrikes, retaliation, missiles, diplomatic moves, casualties, economic shocks, regional spillover. Each event needs fullContent (400+ chars), sources, actor responses. Use ?enforcement=true before creating.`,
      action: `POST /api/v1/admin/${conflictId}/events?enforcement=true → POST /api/v1/admin/${conflictId}/events`,
      count: eventGap,
      suggestSubagent: eventGap >= 20,
      subagentHint: eventGap >= 20 ? `Consider spawning a subagent to research and write events in parallel.` : undefined,
    });
  }

  if (actorsWithoutSnapshot.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Actor Snapshots',
      title: `Create daily snapshots for ${actorsWithoutSnapshot.length} actor(s)`,
      description: `These actors don't have a snapshot for ${today}. Each needs: activityLevel, activityScore, stance, saying (a real quote or paraphrase), doing[] (3-5 current actions), and assessment (2-3 paragraph analysis).`,
      action: `POST /api/v1/admin/${conflictId}/actors/{actorId}/snapshots`,
      count: actorsWithoutSnapshot.length,
      items: actorsWithoutSnapshot.map(a => ({ id: a.id, name: a.name })),
    });
  }

  if (xPostGap > 0) {
    todos.push({
      priority: xPostsToday === 0 ? 'P1' : 'P2',
      category: 'X Posts',
      title: `X Posts — ${xPostsToday} created, target ${TARGETS.xPosts} (${xPostGap} remaining)`,
      description: `Ingest X/social posts from all relevant accounts throughout the day: military (CENTCOM, IDF, IRGC, Pentagon), government (Trump, Netanyahu, Iranian FM, Macron, UK MoD), journalists, analysts. Link each post to an actorId and eventId where relevant. pharosNote explains the intelligence significance.`,
      action: `POST /api/v1/admin/${conflictId}/x-posts?enforcement=true → POST /api/v1/admin/${conflictId}/x-posts`,
      count: xPostGap,
      suggestSubagent: xPostGap >= 50,
      subagentHint: xPostGap >= 50 ? `Consider spawning a subagent to write X posts in parallel.` : undefined,
    });
  }

  if (mapFeatureGap > 0) {
    todos.push({
      priority: mapFeaturesToday === 0 ? 'P1' : 'P2',
      category: 'Map Features',
      title: `Map Features — ${mapFeaturesToday} today, target ${TARGETS.mapFeatures} (${mapFeatureGap} remaining)`,
      description: `Add kinetic and installation features for every geographic development: strike-arcs (US/Israel strikes), missile-tracks (Iranian/IRGC/Hezbollah retaliation), targets (struck sites), assets (carriers, bases, command posts), threat-zones (Hormuz closure, NFZs). Each feature needs actor (UPPERCASE mapKey), priority (P1/P2/P3), type, geometry, timestamp. Run ?enforcement=true first.`,
      action: `POST /api/v1/admin/${conflictId}/map/strike-arcs | missile-tracks | targets | assets | threat-zones`,
      count: mapFeatureGap,
      suggestSubagent: mapFeatureGap >= 15,
      subagentHint: mapFeatureGap >= 15 ? 'Consider spawning a subagent to write map features in parallel.' : undefined,
    });
  }

  if (storyGap > 0) {
    todos.push({
      priority: storiesToday === 0 ? 'P1' : 'P2',
      category: 'Map Stories',
      title: `Map Stories — ${storiesToday} today, target ${TARGETS.stories} (${storyGap} remaining)`,
      description: `Stories explain the narrative arc of specific event windows on the map. Each story covers a 2-6 hour window — one key development, not the whole day. Needs: title (event-focused, no "Day N"), tagline, iconName, narrative (400+ chars), keyFacts (3+), timeline events[], highlight feature IDs (map connections). Run ?enforcement=true first.`,
      action: `POST /api/v1/admin/${conflictId}/map/stories?enforcement=true → POST /api/v1/admin/${conflictId}/map/stories`,
      count: storyGap,
    });
  }

  // ── P2: Actor actions (timeline entries per actor) ────────────────────────

  if (actionGap > 0 && eventsToday.length >= 3) {
    todos.push({
      priority: actorActionsToday === 0 ? 'P1' : 'P2',
      category: 'Actor Actions',
      title: `Actor Actions — ${actorActionsToday} created, target ${TARGETS.actorActions} (${actionGap} remaining)`,
      description: `Timeline entries for what each actor did today. Add actions for all major actors throughout the day: US, IDF, IRAN, IRGC, HEZBOLLAH, HOUTHI, NATO, PMF, RUSSIA. Each action needs: actorId, date (${today}), type (MILITARY/DIPLOMATIC/POLITICAL/ECONOMIC/INTELLIGENCE), description, significance (HIGH/MEDIUM/LOW), verified.`,
      action: `POST /api/v1/admin/${conflictId}/actors/{actorId}/actions`,
      count: actionGap,
    });
  }

  // ── P2: Data quality ──────────────────────────────────────────────────────

  if (eventsWithoutSources.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Event Sources',
      title: `Add sources to ${eventsWithoutSources.length} event(s)`,
      description: 'Events without sources fail /validate and reduce dashboard credibility. Add at least 1 source per event: name (e.g. "CENTCOM Press Release"), tier (1=official/2=major media/3=regional/4=social/5=unverified), reliability (0-100), url (optional).',
      action: `POST /api/v1/admin/${conflictId}/events/{eventId}/sources`,
      count: eventsWithoutSources.length,
      items: eventsWithoutSources.slice(0, 10).map(e => ({
        id: e.id,
        title: e.title,
        timestamp: e.timestamp,
      })),
    });
  }

  if (eventsWithoutResponses.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Actor Responses',
      title: `Add actor responses to ${eventsWithoutResponses.length} event(s)`,
      description: 'Actor responses connect events to actors — who did what, what stance did they take. Add 1-3 responses per event from the most relevant actors. Each needs: actorId, actorName, stance (SUPPORTING/OPPOSING/NEUTRAL/UNKNOWN), type (e.g. "Military Strike"), statement (what they said or did).',
      action: `POST /api/v1/admin/${conflictId}/actors/{actorId}/responses`,
      count: eventsWithoutResponses.length,
      items: eventsWithoutResponses.slice(0, 10).map(e => ({
        id: e.id,
        title: e.title,
        timestamp: e.timestamp,
      })),
    });
  }

  const breakingUnlinked = unlinkedXPosts.filter(p => p.significance === 'BREAKING');
  if (breakingUnlinked.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'X Posts',
      title: `Link ${breakingUnlinked.length} BREAKING X post(s) to events`,
      description: 'BREAKING posts without an eventId are disconnected from the intelligence record. Link via PUT with the relevant eventId.',
      action: `PUT /api/v1/admin/${conflictId}/x-posts/{postId}`,
      count: breakingUnlinked.length,
      items: breakingUnlinked.map(p => ({ id: p.id, handle: p.handle })),
    });
  }

  // ── Verification todos ──────────────────────────────────────────────────

  if (failedVerificationCount > 0) {
    todos.push({
      priority: 'P1',
      category: 'Verification',
      title: `${failedVerificationCount} X post(s) failed verification — remove or replace`,
      description: 'These posts were checked against the X AI API and the tweets were found to be non-existent or content mismatched. Delete them and use POST /verify/search to find real tweets to replace them with.',
      action: `DELETE /api/v1/admin/${conflictId}/x-posts/{postId} → POST /api/v1/admin/${conflictId}/verify/search`,
      count: failedVerificationCount,
    });
  }

  if (unverifiedPostCount > 0) {
    todos.push({
      priority: 'P2',
      category: 'Verification',
      title: `Verify ${unverifiedPostCount} unverified X post(s)`,
      description: 'These posts have not been checked against the X AI API. Run batch verification to confirm they are real. New posts with postType=XPOST are now auto-verified on creation.',
      action: `POST /api/v1/admin/${conflictId}/verify/batch`,
      count: unverifiedPostCount,
    });
  }


  // ── Subagent hints ────────────────────────────────────────────────────────

  const subagentHints: { priority: string; task: string }[] = [];
  if (eventGap >= 8) {
    subagentHints.push({
      priority: 'HIGH',
      task: `Spawn a research subagent: give it the conflict context and ask it to research and write ${eventGap} events for today. While it works, main session can handle X posts and actor responses.`,
    });
  }
  if (mapFeatureGap >= 6 && eventGap <= 3) {
    subagentHints.push({
      priority: 'MEDIUM',
      task: `Spawn a subagent for map features: ${mapFeatureGap} kinetic/installation features needed for Day 5. Give it the existing event IDs and coordinates from the agent manual.`,
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const p1Count = todos.filter(t => t.priority === 'P1').length;
  const p2Count = todos.filter(t => t.priority === 'P2').length;
  const p3Count = todos.filter(t => t.priority === 'P3').length;

  return ok({
    conflictId,
    today,
    generatedAt: now.toISOString(),
    overview: {
      hasTodaySnapshot: !!todaySnapshot,
      escalation: todaySnapshot?.escalation ?? conflict.escalation,
      eventsToday: eventsToday.length,
      xPostsToday,
      mapFeaturesToday,
      storiesToday,
      actorActionsToday,
    },
    targets: {
      events: TARGETS.events,
      xPosts: TARGETS.xPosts,
      mapFeatures: TARGETS.mapFeatures,
      stories: TARGETS.stories,
      actorActions: TARGETS.actorActions,
    },
    todos,
    subagentHints,
    summary: {
      total: todos.length,
      p1: p1Count,
      p2: p2Count,
      p3: p3Count,
      allClear: todos.length === 0,
      message:
        todos.length === 0
          ? 'All clear — dashboard is fully populated.'
          : `${p1Count} critical, ${p2Count} standard items need attention. Add data continuously throughout the day.`,
    },
  });
}
