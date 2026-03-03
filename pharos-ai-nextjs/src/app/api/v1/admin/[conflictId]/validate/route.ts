import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';

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

  // Run all validation queries in parallel
  const [
    eventsWithoutSources,
    eventsWithoutResponses,
    unlinkedXPosts,
    actorsWithoutSnapshot,
    todaySnapshot,
    orphanedXPosts,
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
  ]);

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
    },
  });
}
