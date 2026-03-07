import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const sp = req.nextUrl.searchParams;
  const hours = Math.min(Number(sp.get('hours')) || 48, 168); // max 7 days

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: { id: true, name: true, status: true, threatLevel: true, escalation: true },
  });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const now = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);
  const todayDate = new Date(today + 'T00:00:00Z');

  // Run queries in parallel
  const [
    recentEvents,
    recentXPosts,
    recentMapFeatures,
    actors,
    mapStoryAgg,
    todaySnapshot,
    latestDay,
  ] = await Promise.all([
    prisma.intelEvent.findMany({
      where: { conflictId, timestamp: { gte: from } },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        severity: true,
        type: true,
        title: true,
        _count: { select: { sources: true, xPosts: true } },
      },
    }),
    prisma.xPost.findMany({
      where: { conflictId, timestamp: { gte: from } },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        handle: true,
        significance: true,
        eventId: true,
      },
    }),
    prisma.mapFeature.findMany({
      where: { conflictId, createdAt: { gte: from } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, featureType: true, actor: true },
    }),
    prisma.actor.findMany({
      where: { conflictId },
      select: {
        id: true,
        name: true,
        type: true,
        activityLevel: true,
        stance: true,
        daySnapshots: {
          orderBy: { day: 'desc' },
          take: 1,
          select: { day: true },
        },
      },
    }),
    prisma.mapStory.aggregate({
      where: { conflictId },
      _count: true,
      _max: { timestamp: true },
    }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: todayDate },
      select: { id: true },
    }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId },
      orderBy: { day: 'desc' },
      select: { day: true },
    }),
  ]);

  // Build hints
  const eventsWithoutSources = recentEvents
    .filter(e => e._count.sources === 0)
    .map(e => e.id);
  const unlinkedXPosts = recentXPosts.filter(p => !p.eventId).length;
  const actorsWithoutTodaySnapshot = actors
    .filter(a => {
      const snap = a.daySnapshots[0];
      return !snap || snap.day.toISOString().slice(0, 10) !== today;
    })
    .map(a => a.id);

  return ok({
    conflict,
    window: { from: from.toISOString(), to: now.toISOString(), hours },
    currentDay: {
      today,
      snapshotExists: !!todaySnapshot,
      latestDay: latestDay?.day.toISOString().slice(0, 10) ?? null,
    },
    recentEvents: {
      total: recentEvents.length,
      items: recentEvents.map(e => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        severity: e.severity,
        type: e.type,
        title: e.title,
        sourceCount: e._count.sources,
        xPostCount: e._count.xPosts,
      })),
    },
    recentXPosts: {
      total: recentXPosts.length,
      items: recentXPosts.map(p => ({
        id: p.id,
        timestamp: p.timestamp.toISOString(),
        handle: p.handle,
        significance: p.significance,
        eventId: p.eventId,
      })),
    },
    recentMapFeatures: {
      total: recentMapFeatures.length,
      items: recentMapFeatures,
    },
    actors: actors.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      activityLevel: a.activityLevel,
      stance: a.stance,
      latestSnapshotDay: a.daySnapshots[0]?.day.toISOString().slice(0, 10) ?? null,
    })),
    mapStories: {
      total: mapStoryAgg._count,
      latestTimestamp: mapStoryAgg._max.timestamp?.toISOString() ?? null,
    },
    hints: {
      missingDaySnapshot: !todaySnapshot,
      actorsWithoutTodaySnapshot,
      unlinkedXPosts,
      eventsWithoutSources,
    },
  });
}
