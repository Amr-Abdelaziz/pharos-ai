import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { assertEnum , assertRequired, safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import { ActorResponseStance } from '@/generated/prisma/client';

const STANCES = Object.values(ActorResponseStance);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const missing = assertRequired(body, ['eventId', 'stance', 'type', 'statement']);
  if (missing) return err('VALIDATION', missing);

  const stanceErr = assertEnum(body.stance, STANCES, 'stance');
  if (stanceErr) return err('VALIDATION', stanceErr);

  // Validate event exists
  const event = await prisma.intelEvent.findFirst({
    where: { id: body.eventId, conflictId },
  });
  if (!event) return err('VALIDATION', `Event ${body.eventId} not found`);

  const response = await prisma.eventActorResponse.create({
    data: {
      eventId: body.eventId,
      actorId,
      actorName: actor.name,
      stance: body.stance,
      type: body.type,
      statement: body.statement,
    },
  });

  return ok({ id: response.id, created: true });
}
