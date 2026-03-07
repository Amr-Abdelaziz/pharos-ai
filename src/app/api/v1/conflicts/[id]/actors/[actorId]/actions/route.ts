import { NextRequest } from 'next/server';

import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  const { id, actorId } = await params;

  const actor = await prisma.actor.findFirst({
    where: { id: actorId, conflictId: id },
  });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const actions = await prisma.actorAction.findMany({
    where: { actorId },
    orderBy: { date: 'desc' },
  });

  return ok(actions.map(a => ({
    date: a.date,
    type: a.type,
    description: a.description,
    verified: a.verified,
    significance: a.significance,
  })));
}
