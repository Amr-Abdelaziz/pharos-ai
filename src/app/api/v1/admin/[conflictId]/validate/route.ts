import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { MAP_ACTOR_KEYS, MAP_PRIORITIES } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(today + 'T00:00:00Z');

  const [
    eventsWithoutSources,
    eventsWithoutResponses,
    unlinkedXPosts,
    actorsWithoutSnapshot,
    todaySnapshot,
    orphanedXPosts,
    verificationCoverage,
    failedVerificationPosts,
    allMapFeatures,
    allMapStories,
  ] = await Promise.all([
    // Events with no sources
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        sources: { none: {} },
      },
      select: { id: true, title: true, timestamp: true },
    }),
    // Events with no actor responses
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        actorResponses: { none: {} },
      },
      select: { id: true, title: true, timestamp: true },
    }),
    // X posts not linked to any event
    prisma.xPost.findMany({
      where: { conflictId, eventId: null },
      select: { id: true, handle: true, timestamp: true },
    }),
    // Actors without a snapshot for today
    prisma.actor.findMany({
      where: {
        conflictId,
        daySnapshots: { none: { day: todayDate } },
      },
      select: { id: true, name: true },
    }),
    // Whether today's day snapshot exists
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: todayDate },
      select: { id: true },
    }),
    // X posts referencing non-existent events (orphaned eventId)
    prisma.$queryRaw<{ id: string; eventId: string }[]>`
      SELECT xp.id, xp."eventId"
      FROM "XPost" xp
      LEFT JOIN "IntelEvent" ie ON xp."eventId" = ie.id
      WHERE xp."conflictId" = ${conflictId}
        AND xp."eventId" IS NOT NULL
        AND ie.id IS NULL
    `,
    // Unverified X posts (verification coverage)
    prisma.xPost.groupBy({
      by: ['verificationStatus'],
      where: { conflictId },
      _count: true,
    }),
    // Failed verification posts
    prisma.xPost.findMany({
      where: { conflictId, verificationStatus: 'FAILED' },
      select: { id: true, handle: true, tweetId: true, postType: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    }),
    // All map features — for actor/priority integrity check
    prisma.mapFeature.findMany({
      where: { conflictId },
      select: { id: true, actor: true, priority: true, type: true },
    }),
    // All map stories — for highlight ref integrity check
    prisma.mapStory.findMany({
      where: { conflictId },
      select: {
        id: true,
        title: true,
        highlightStrikeIds: true,
        highlightMissileIds: true,
        highlightTargetIds: true,
        highlightAssetIds: true,
      },
    }),
  ]);

  // Map feature integrity: check for invalid actor or priority values
  const featureIdSet = new Set(allMapFeatures.map(f => f.id));
  const invalidActorFeatures = allMapFeatures.filter(f => !(MAP_ACTOR_KEYS as readonly string[]).includes(f.actor));
  const invalidPriorityFeatures = allMapFeatures.filter(f => !(MAP_PRIORITIES as readonly string[]).includes(f.priority));

  // Story highlight ref integrity: check each highlight ID exists as a MapFeature
  const brokenStoryHighlights: { storyId: string; storyTitle: string; field: string; missingId: string }[] = [];
  for (const story of allMapStories) {
    const checks: [string, string[]][] = [
      ['highlightStrikeIds',  story.highlightStrikeIds],
      ['highlightMissileIds', story.highlightMissileIds],
      ['highlightTargetIds',  story.highlightTargetIds],
      ['highlightAssetIds',   story.highlightAssetIds],
    ];
    for (const [field, ids] of checks) {
      for (const id of ids) {
        if (!featureIdSet.has(id)) {
          brokenStoryHighlights.push({ storyId: story.id, storyTitle: story.title, field, missingId: id });
        }
      }
    }
  }

  return ok({
    today,
    missingDaySnapshot: !todaySnapshot,
    issues: {
      eventsWithoutSources: {
        count: eventsWithoutSources.length,
        items: eventsWithoutSources.map(e => ({
          id: e.id,
          title: e.title,
          timestamp: e.timestamp.toISOString(),
        })),
      },
      eventsWithoutResponses: {
        count: eventsWithoutResponses.length,
        items: eventsWithoutResponses.map(e => ({
          id: e.id,
          title: e.title,
          timestamp: e.timestamp.toISOString(),
        })),
      },
      unlinkedXPosts: {
        count: unlinkedXPosts.length,
        items: unlinkedXPosts.map(p => ({
          id: p.id,
          handle: p.handle,
          timestamp: p.timestamp.toISOString(),
        })),
      },
      actorsWithoutTodaySnapshot: {
        count: actorsWithoutSnapshot.length,
        items: actorsWithoutSnapshot,
      },
      orphanedXPostEventRefs: {
        count: orphanedXPosts.length,
        items: orphanedXPosts,
      },
      invalidActorOnMapFeatures: {
        count: invalidActorFeatures.length,
        items: invalidActorFeatures.map(f => ({ id: f.id, actor: f.actor, validActors: MAP_ACTOR_KEYS })),
      },
      invalidPriorityOnMapFeatures: {
        count: invalidPriorityFeatures.length,
        items: invalidPriorityFeatures.map(f => ({ id: f.id, priority: f.priority })),
      },
      brokenStoryHighlightRefs: {
        count: brokenStoryHighlights.length,
        items: brokenStoryHighlights,
      },
      verificationCoverage: {
        breakdown: Object.fromEntries(
          verificationCoverage.map(g => [g.verificationStatus, g._count]),
        ),
        failedPosts: {
          count: failedVerificationPosts.length,
          items: failedVerificationPosts.map(p => ({
            id: p.id,
            handle: p.handle,
            tweetId: p.tweetId,
            postType: p.postType,
            timestamp: p.timestamp.toISOString(),
          })),
        },
      },
    },
  });
}
