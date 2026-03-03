import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertEnum , safeJson } from '@/lib/admin-validate';
import { ActionType, ActionSignificance } from '@/generated/prisma/client';

const ACTION_TYPES = Object.values(ActionType);
const ACTION_SIGNIFICANCES = Object.values(ActionSignificance);

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

  const missing = assertRequired(body, ['date', 'type', 'description', 'significance']);
  if (missing) return err('VALIDATION', missing);

  const typeErr = assertEnum(body.type, ACTION_TYPES, 'type');
  if (typeErr) return err('VALIDATION', typeErr);

  const sigErr = assertEnum(body.significance, ACTION_SIGNIFICANCES, 'significance');
  if (sigErr) return err('VALIDATION', sigErr);

  const action = await prisma.actorAction.create({
    data: {
      actorId,
      date: body.date,
      type: body.type,
      description: body.description,
      verified: body.verified ?? false,
      significance: body.significance,
    },
  });

  return ok({ id: action.id, created: true });
}
