import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { assertEnum, assertIntRange , assertRequired, safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import { ActivityLevel, Stance } from '@/generated/prisma/client';

const ACTIVITY_LEVELS = Object.values(ActivityLevel);
const STANCES = Object.values(Stance);

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

  const missing = assertRequired(body, [
    'day', 'activityLevel', 'activityScore', 'stance', 'saying', 'doing', 'assessment',
  ]);
  if (missing) return err('VALIDATION', missing);

  const alErr = assertEnum(body.activityLevel, ACTIVITY_LEVELS, 'activityLevel');
  if (alErr) return err('VALIDATION', alErr);

  const stErr = assertEnum(body.stance, STANCES, 'stance');
  if (stErr) return err('VALIDATION', stErr);

  const scoreErr = assertIntRange(body.activityScore, 0, 100, 'activityScore');
  if (scoreErr) return err('VALIDATION', scoreErr);

  const day = new Date(body.day + 'T00:00:00Z');
  if (isNaN(day.getTime())) return err('VALIDATION', 'Invalid day format');

  // Check for duplicate
  const existing = await prisma.actorDaySnapshot.findUnique({
    where: { actorId_day: { actorId, day } },
  });
  if (existing) return err('DUPLICATE', `Snapshot for ${actorId} on ${body.day} already exists`, 409);

  const snapshot = await prisma.actorDaySnapshot.create({
    data: {
      actorId,
      day,
      activityLevel: body.activityLevel,
      activityScore: body.activityScore,
      stance: body.stance,
      saying: body.saying,
      doing: body.doing,
      assessment: body.assessment,
    },
  });

  return ok({ id: snapshot.id, created: true });
}
