/** GET workspace - decision engine for autonomous Pharos runs. */

import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { MAP_ACTOR_KEYS, MAP_PRIORITIES } from '@/server/lib/admin-validate';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import {
  chooseCycleMode,
  PHAROS_RUNTIME_POLICY,
  SOFT_COVERAGE_GUIDANCE,
} from '@/server/lib/pharos-doctrine';
import {
  getConflictDayRange,
  getConflictLocalNow,
  getConflictTimezone,
  toConflictLocalDateString,
  zonedDateTimeToUtc,
} from '@/server/lib/pharos-time';

type TodoItem = {
  priority: 'P1' | 'P2' | 'P3';
  category: string;
  title: string;
  description: string;
  action: string;
  count?: number;
  items?: unknown[];
};

function coverageStatus(actual: number, low: number, high: number) {
  if (actual < low) return 'LIGHT';
  if (actual > high) return 'HEAVY';
  return 'ADEQUATE';
}

function severityRank(severity: string) {
  if (severity === 'CRITICAL') return 0;
  if (severity === 'HIGH') return 1;
  return 2;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: {
      id: true,
      name: true,
      escalation: true,
      timezone: true,
    },
  });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const timezone = getConflictTimezone(conflict);
  const localNow = getConflictLocalNow(timezone);
  const { today, dayDate, start: todayStart, end: todayEnd } = getConflictDayRange(timezone);

  const RECENT_WINDOW_DAYS = 8;
  const recentWindowStart = zonedDateTimeToUtc(
    Number(localNow.today.slice(0, 4)),
    Number(localNow.today.slice(5, 7)),
    Number(localNow.today.slice(8, 10)) - RECENT_WINDOW_DAYS,
    0, 0, 0, timezone,
  );

  const actors = await prisma.actor.findMany({
    where: { conflictId },
    select: { id: true, name: true, mapKey: true },
    orderBy: { name: 'asc' },
  });

  const [
    todaySnapshot,
    actorSnapshotsToday,
    eventsToday,
    xPostsToday,
    mapFeaturesCreatedToday,
    storiesToday,
    actorActionsToday,
    eventsWithoutSourcesToday,
    eventsWithoutResponsesToday,
    allMapFeatures,
    allMapStories,
    unlinkedBreakingXPosts,
    highCriticalEventsToday,
    recentEventsRaw,
  ] = await Promise.all([
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: dayDate },
      select: { id: true, escalation: true, keyFacts: true, summary: true },
    }),
    prisma.actorDaySnapshot.findMany({
      where: { day: dayDate, actor: { conflictId } },
      select: { actorId: true },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        sources: { select: { id: true } },
        actorResponses: { select: { id: true } },
      },
    }),
    prisma.xPost.count({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.mapFeature.findMany({
      where: {
        conflictId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      select: {
        id: true,
        featureType: true,
        actor: true,
        priority: true,
        sourceEventId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mapStory.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
      },
      select: {
        id: true,
        title: true,
        timestamp: true,
        primaryEventId: true,
        sourceEventIds: true,
        highlightStrikeIds: true,
        highlightMissileIds: true,
        highlightTargetIds: true,
        highlightAssetIds: true,
      },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.actorAction.count({
      where: {
        actorId: { in: actors.map(actor => actor.id) },
        date: { startsWith: today },
      },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
        sources: { none: {} },
      },
      select: { id: true, title: true, timestamp: true, severity: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
        actorResponses: { none: {} },
      },
      select: { id: true, title: true, timestamp: true, severity: true, type: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.mapFeature.findMany({
      where: { conflictId },
      select: { id: true, actor: true, priority: true, sourceEventId: true },
    }),
    prisma.mapStory.findMany({
      where: { conflictId },
      select: {
        id: true,
        title: true,
        primaryEventId: true,
        sourceEventIds: true,
        highlightStrikeIds: true,
        highlightMissileIds: true,
        highlightTargetIds: true,
        highlightAssetIds: true,
      },
    }),
    prisma.xPost.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
        significance: 'BREAKING',
        eventId: null,
      },
      select: { id: true, handle: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        timestamp: { gte: todayStart, lt: todayEnd },
        severity: { in: ['CRITICAL', 'HIGH'] },
        type: { in: ['MILITARY', 'INTELLIGENCE', 'ECONOMIC', 'HUMANITARIAN', 'POLITICAL', 'DIPLOMATIC'] },
      },
      select: { id: true, title: true, severity: true, type: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        timestamp: { gte: recentWindowStart },
      },
      select: {
        id: true,
        title: true,
        timestamp: true,
        location: true,
        severity: true,
        type: true,
      },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  const recentEvents = recentEventsRaw.map(event => ({
    id: event.id,
    title: event.title,
    timestamp: event.timestamp.toISOString(),
    day: toConflictLocalDateString(event.timestamp, timezone),
    location: event.location,
    severity: event.severity,
    type: event.type,
  }));

  const actorIdsWithSnapshot = new Set(actorSnapshotsToday.map(snapshot => snapshot.actorId));
  const actorsWithoutSnapshot = actors.filter(actor => !actorIdsWithSnapshot.has(actor.id));

  const validActorKeys = new Set<string>(MAP_ACTOR_KEYS);
  const validPriorities = new Set<string>(MAP_PRIORITIES);

  const invalidActorFeatures = allMapFeatures.filter(feature => !validActorKeys.has(feature.actor));
  const invalidPriorityFeatures = allMapFeatures.filter(feature => !validPriorities.has(feature.priority));

  const allFeatureIds = new Set(allMapFeatures.map(feature => feature.id));
  const brokenHighlights = allMapStories.flatMap(story => {
    const ids = [
      ...story.highlightStrikeIds,
      ...story.highlightMissileIds,
      ...story.highlightTargetIds,
      ...story.highlightAssetIds,
    ];
    const missingIds = ids.filter(id => !allFeatureIds.has(id));
    if (missingIds.length === 0) return [];

    return [{ storyId: story.id, title: story.title, missingIds }];
  });

  const storyCoveredEventIds = new Set<string>();
  for (const story of allMapStories) {
    if (story.primaryEventId) storyCoveredEventIds.add(story.primaryEventId);
    for (const eventId of story.sourceEventIds) storyCoveredEventIds.add(eventId);
  }

  const mappedEventIds = new Set(
    allMapFeatures
      .map(feature => feature.sourceEventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  );

  const mapCandidates = highCriticalEventsToday.filter(event => !mappedEventIds.has(event.id));
  const storyCandidates = highCriticalEventsToday.filter(event => (
    !storyCoveredEventIds.has(event.id) && mappedEventIds.has(event.id)
  ));

  const maintenanceCandidates = [
    !todaySnapshot ? 1 : 0,
    actorsWithoutSnapshot.length,
    eventsWithoutSourcesToday.length,
    eventsWithoutResponsesToday.length,
    brokenHighlights.length,
    invalidActorFeatures.length,
    invalidPriorityFeatures.length,
    unlinkedBreakingXPosts.length,
  ].reduce((sum, count) => sum + count, 0);

  const { cycleMode, recommendedAction, rationale } = chooseCycleMode({
    hasTodaySnapshot: !!todaySnapshot,
    p1Count:
      (!todaySnapshot ? 1 : 0) +
      brokenHighlights.length +
      invalidActorFeatures.length +
      invalidPriorityFeatures.length,
    newEventCandidates: 0,
    updateCandidates: 0,
    maintenanceCandidates,
    phase: localNow.phase,
  });

  const guidance = SOFT_COVERAGE_GUIDANCE[localNow.phase];
  const todos: TodoItem[] = [];

  if (!todaySnapshot) {
    todos.push({
      priority: 'P1',
      category: 'Day Snapshot',
      title: `Create today's snapshot (${today})`,
      description: 'A new local day has started. Create the day snapshot before other enrichment work.',
      action: `POST /api/v1/admin/${conflictId}/days`,
    });
  }

  if (actorsWithoutSnapshot.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Actor Snapshots',
      title: `Create ${actorsWithoutSnapshot.length} daily actor snapshot(s)`,
      description: 'Some actors do not yet have today\'s snapshot. These are foundational and safe early-day objects.',
      action: `POST /api/v1/admin/${conflictId}/actors/{actorId}/snapshots`,
      count: actorsWithoutSnapshot.length,
      items: actorsWithoutSnapshot.map(actor => ({ id: actor.id, name: actor.name })),
    });
  }

  if (eventsWithoutSourcesToday.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Event Sources',
      title: `${eventsWithoutSourcesToday.length} event(s) today are missing sources`,
      description: 'Add sources to today\'s events before creating lower-value new content.',
      action: `POST /api/v1/admin/${conflictId}/events/{eventId}/sources`,
      count: eventsWithoutSourcesToday.length,
      items: eventsWithoutSourcesToday.slice(0, 10).map(event => ({ id: event.id, title: event.title })),
    });
  }

  if (eventsWithoutResponsesToday.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Actor Responses',
      title: `${eventsWithoutResponsesToday.length} event(s) today are missing actor responses`,
      description: 'Prioritize HIGH and CRITICAL events first. Responses should be relevant, not filler.',
      action: `POST /api/v1/admin/${conflictId}/actors/{actorId}/responses`,
      count: eventsWithoutResponsesToday.length,
      items: eventsWithoutResponsesToday
        .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
        .slice(0, 12)
        .map(event => ({ id: event.id, title: event.title, severity: event.severity })),
    });
  }

  if (mapCandidates.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Map Candidates',
      title: `${mapCandidates.length} high-value event(s) appear to lack map representation`,
      description: 'Create map features only where geography materially improves the product. Skip weak spatial cases.',
      action: `POST /api/v1/admin/${conflictId}/map/...`,
      count: mapCandidates.length,
      items: mapCandidates.slice(0, 12).map(event => ({
        id: event.id,
        title: event.title,
        severity: event.severity,
      })),
    });
  }

  if (storyCandidates.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Story Candidates',
      title: `${storyCandidates.length} map-worthy narrative candidate(s) are uncovered`,
      description: 'Only create stories that are truly map-centered and operationally coherent. Stories are not quota filler.',
      action: `POST /api/v1/admin/${conflictId}/map/stories?enforcement=true`,
      count: storyCandidates.length,
      items: storyCandidates.slice(0, 8).map(event => ({
        id: event.id,
        title: event.title,
        severity: event.severity,
      })),
    });
  }

  if (unlinkedBreakingXPosts.length > 0) {
    todos.push({
      priority: 'P2',
      category: 'Breaking Signals',
      title: `${unlinkedBreakingXPosts.length} BREAKING signal(s) are unlinked`,
      description: 'Link BREAKING signals to their best-fit event and actor where the relationship is clear.',
      action: `PUT /api/v1/admin/${conflictId}/x-posts/{postId}`,
      count: unlinkedBreakingXPosts.length,
      items: unlinkedBreakingXPosts.map(post => ({ id: post.id, handle: post.handle })),
    });
  }

  if (brokenHighlights.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Broken Stories',
      title: `${brokenHighlights.length} story/stories have broken highlight references`,
      description: 'Fix broken map-story highlight references before further story creation.',
      action: `PUT /api/v1/admin/${conflictId}/map/stories/{storyId}`,
      count: brokenHighlights.length,
      items: brokenHighlights,
    });
  }

  if (invalidActorFeatures.length > 0 || invalidPriorityFeatures.length > 0) {
    todos.push({
      priority: 'P1',
      category: 'Invalid Map Features',
      title: 'Invalid actor/priority values exist on map features',
      description: 'These can silently hide features from the user-facing map.',
      action: `PUT /api/v1/admin/${conflictId}/map/features/{featureId}`,
      count: invalidActorFeatures.length + invalidPriorityFeatures.length,
      items: [
        ...invalidActorFeatures.map(feature => ({ id: feature.id, actor: feature.actor })),
        ...invalidPriorityFeatures.map(feature => ({ id: feature.id, priority: feature.priority })),
      ],
    });
  }

  const allClear = todos.length === 0;

  return ok({
    conflictId,
    timezone,
    generatedAt: new Date().toISOString(),
    localNow: localNow.label,
    phaseOfDay: localNow.phase,
    runtimePolicy: {
      ...PHAROS_RUNTIME_POLICY,
      timezone,
    },
    cycle: {
      cycleMode,
      recommendedAction,
      rationale,
      noOpAllowed: PHAROS_RUNTIME_POLICY.noOpAllowed,
    },
    overview: {
      today,
      hasTodaySnapshot: !!todaySnapshot,
      escalation: todaySnapshot?.escalation ?? conflict.escalation,
      eventsToday: eventsToday.length,
      xPostsToday,
      mapFeaturesCreatedToday: mapFeaturesCreatedToday.length,
      storiesToday: storiesToday.length,
      actorActionsToday,
    },
    coverage: {
      phase: localNow.phase,
      guidance,
      actual: {
        events: eventsToday.length,
        xPosts: xPostsToday,
        mapFeatures: mapFeaturesCreatedToday.length,
        stories: storiesToday.length,
      },
      status: {
        events: coverageStatus(eventsToday.length, guidance.events[0], guidance.events[1]),
        xPosts: coverageStatus(xPostsToday, guidance.xPosts[0], guidance.xPosts[1]),
        mapFeatures: coverageStatus(
          mapFeaturesCreatedToday.length,
          guidance.mapFeatures[0],
          guidance.mapFeatures[1],
        ),
        stories: coverageStatus(storiesToday.length, guidance.stories[0], guidance.stories[1]),
      },
      note: 'Coverage guidance is advisory only. Low counts do not create work; materially new information creates work.',
    },
    candidateCreates: {
      mapCandidates: mapCandidates.map(event => ({
        id: event.id,
        title: event.title,
        severity: event.severity,
      })),
      storyCandidates: storyCandidates.map(event => ({
        id: event.id,
        title: event.title,
        severity: event.severity,
      })),
    },
    recentEvents: {
      windowDays: RECENT_WINDOW_DAYS,
      count: recentEvents.length,
      note: 'Review before creating new events. If a candidate overlaps in incident, time, location, or actor with an existing item, prefer UPDATE over CREATE.',
      items: recentEvents,
    },
    maintenance: {
      eventsWithoutSourcesToday: eventsWithoutSourcesToday.length,
      eventsWithoutResponsesToday: eventsWithoutResponsesToday.length,
      actorsWithoutSnapshot: actorsWithoutSnapshot.length,
      unlinkedBreakingXPosts: unlinkedBreakingXPosts.length,
      brokenStoryRefs: brokenHighlights.length,
    },
    backlog: {
      note: 'Backlog is intentionally de-emphasized during active cycles. Prefer today\'s high-value work first.',
    },
    todos,
    summary: {
      total: todos.length,
      allClear,
      message: allClear
        ? 'No materially new or broken high-value items require action right now. NOOP is correct.'
        : `${todos.length} actionable item(s). Follow priority and remember that story/map creation is candidate-based, not quota-based.`,
    },
  });
}
