import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import {
  INSTALLATION_STATUSES,
  INSTALLATION_TYPES,
  KINETIC_STATUSES,
  KINETIC_TYPES,
  MAP_ACTOR_KEYS,
  MAP_PRIORITIES,
  STORY_ICON_NAMES,
  ZONE_TYPES,
} from '@/server/lib/admin-validate';
import { buildAgentManual } from '@/server/lib/agent-manual';
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

  // Fetch live context in parallel
  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(today + 'T00:00:00Z');

  const [actors, eventCount, storyCount, todaySnapshot, lastEvent] = await Promise.all([
    prisma.actor.findMany({
      where: { conflictId },
      select: { id: true, name: true, mapKey: true },
      orderBy: { name: 'asc' },
    }),
    prisma.intelEvent.count({ where: { conflictId } }),
    prisma.mapStory.count({ where: { conflictId } }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: todayDate },
      select: { escalation: true },
    }),
    prisma.intelEvent.findFirst({
      where: { conflictId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  const generatedAt = new Date().toISOString();

  // Resolve base URL from request
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  const markdown = buildAgentManual({
    conflictId,
    baseUrl,
    actors: actors.map(a => ({ id: a.id, name: a.name, mapKey: a.mapKey ?? a.id.toUpperCase() })),
    currentState: {
      eventCount,
      storyCount,
      actorCount: actors.length,
      hasTodaySnapshot: !!todaySnapshot,
      escalation: todaySnapshot?.escalation ?? conflict.escalation ?? null,
      lastEventAt: lastEvent?.timestamp.toISOString() ?? null,
      today,
    },
    generatedAt,
  });

  return ok({
    markdown,
    meta: {
      conflictId,
      generatedAt,
      currentState: {
        eventCount,
        storyCount,
        actorCount: actors.length,
        hasTodaySnapshot: !!todaySnapshot,
        escalation: todaySnapshot?.escalation ?? conflict.escalation ?? null,
        lastEventAt: lastEvent?.timestamp.toISOString() ?? null,
        today,
      },
    },
    validValues: {
      mapActorKeys: [...MAP_ACTOR_KEYS],
      mapPriorities: [...MAP_PRIORITIES],
      kineticTypes: [...KINETIC_TYPES],
      installationTypes: [...INSTALLATION_TYPES],
      zoneTypes: [...ZONE_TYPES],
      kineticStatuses: [...KINETIC_STATUSES],
      installationStatuses: [...INSTALLATION_STATUSES],
      storyIconNames: [...STORY_ICON_NAMES],
    },
  });
}
