import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { assertEnum, parseISODate, safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import { StoryEventType } from '@/generated/prisma/client';

const EVENT_TYPES = Object.values(StoryEventType);

function validateEvents(events: unknown[]): string | null {
  for (let i = 0; i < events.length; i++) {
    const e = events[i] as Record<string, unknown>;
    const typeErr = assertEnum(e.type, EVENT_TYPES, 'type');
    if (typeErr) return `events[${i}]: ${typeErr}`;
    const timeCheck = parseISODate(e.time, `events[${i}].time`);
    if (typeof timeCheck === 'string') return timeCheck;
    if (!e.label || typeof e.label !== 'string') return `events[${i}]: label is required`;
  }
  return null;
}

/** POST — append events to a story */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return err('VALIDATION', 'events array is required and must not be empty');
  }

  const validErr = validateEvents(body.events);
  if (validErr) return err('VALIDATION', validErr);

  // Get current max ord
  const lastEvent = await prisma.mapStoryEvent.findFirst({
    where: { storyId },
    orderBy: { ord: 'desc' },
    select: { ord: true },
  });
  const startOrd = (lastEvent?.ord ?? -1) + 1;

  const created = await prisma.mapStoryEvent.createMany({
    data: body.events.map(
      (e: { time: string; label: string; type: string }, i: number) => ({
        storyId,
        ord: startOrd + i,
        time: e.time,
        label: e.label,
        type: e.type,
      }),
    ),
  });

  return ok({ storyId, added: created.count });
}

/**
 * PUT — replace all events on a story.
 * Deletes existing events and creates the new set in a single transaction.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  if (!Array.isArray(body.events)) {
    return err('VALIDATION', 'events array is required');
  }

  if (body.events.length > 0) {
    const validErr = validateEvents(body.events);
    if (validErr) return err('VALIDATION', validErr);
  }

  const [, created] = await prisma.$transaction([
    prisma.mapStoryEvent.deleteMany({ where: { storyId } }),
    prisma.mapStoryEvent.createMany({
      data: body.events.map(
        (e: { time: string; label: string; type: string }, i: number) => ({
          storyId,
          ord: i,
          time: e.time,
          label: e.label,
          type: e.type,
        }),
      ),
    }),
  ]);

  return ok({ storyId, replaced: created.count });
}
