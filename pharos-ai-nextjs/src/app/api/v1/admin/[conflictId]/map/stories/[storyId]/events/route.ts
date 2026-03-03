import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertEnum , safeJson } from '@/lib/admin-validate';
import { StoryEventType } from '@/generated/prisma/client';

const EVENT_TYPES = Object.values(StoryEventType);

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

  // Validate event types
  for (const e of body.events) {
    const typeErr = assertEnum(e.type, EVENT_TYPES, 'type');
    if (typeErr) return err('VALIDATION', typeErr);
  }

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
