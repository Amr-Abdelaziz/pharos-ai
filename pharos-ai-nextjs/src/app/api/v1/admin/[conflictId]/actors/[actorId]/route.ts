import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertEnum , safeJson } from '@/lib/admin-validate';
import { ActivityLevel, Stance } from '@/generated/prisma/client';

const ACTIVITY_LEVELS = Object.values(ActivityLevel);
const STANCES = Object.values(Stance);

export async function PUT(
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

  const data: Record<string, unknown> = {};

  if (body.activityLevel !== undefined) {
    const e = assertEnum(body.activityLevel, ACTIVITY_LEVELS, 'activityLevel');
    if (e) return err('VALIDATION', e);
    data.activityLevel = body.activityLevel;
  }
  if (body.stance !== undefined) {
    const e = assertEnum(body.stance, STANCES, 'stance');
    if (e) return err('VALIDATION', e);
    data.stance = body.stance;
  }
  if (body.activityScore !== undefined) data.activityScore = body.activityScore;
  if (body.saying !== undefined) data.saying = body.saying;
  if (body.doing !== undefined) data.doing = body.doing;
  if (body.assessment !== undefined) data.assessment = body.assessment;
  if (body.keyFigures !== undefined) data.keyFigures = body.keyFigures;
  if (body.linkedEventIds !== undefined) data.linkedEventIds = body.linkedEventIds;

  const updated = await prisma.actor.update({ where: { id: actorId }, data });

  return ok({ id: updated.id, updated: true });
}
