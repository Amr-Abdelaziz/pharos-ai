import { NextRequest } from 'next/server';

import { err, mapActorTypeToApi,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  const { id, actorId } = await params;
  const day = req.nextUrl.searchParams.get('day');

  const actor = await prisma.actor.findFirst({
    where: { id: actorId, conflictId: id },
    include: {
      daySnapshots: { orderBy: { day: 'asc' } },
      actions: { orderBy: { date: 'desc' } },
    },
  });

  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const daySnapshotsRecord: Record<string, {
    activityLevel: string; activityScore: number; stance: string;
    saying: string; doing: string[]; assessment: string;
  }> = {};
  for (const ds of actor.daySnapshots) {
    daySnapshotsRecord[ds.day.toISOString().slice(0, 10)] = {
      activityLevel: ds.activityLevel,
      activityScore: ds.activityScore,
      stance: ds.stance,
      saying: ds.saying,
      doing: ds.doing,
      assessment: ds.assessment,
    };
  }

  const snapshot = day ? daySnapshotsRecord[day] : null;

  return ok(
    {
      id: actor.id,
      name: actor.name,
      fullName: actor.fullName,
      countryCode: actor.countryCode,
      type: mapActorTypeToApi(actor.type),
      activityLevel: snapshot?.activityLevel ?? actor.activityLevel,
      activityScore: snapshot?.activityScore ?? actor.activityScore,
      stance: snapshot?.stance ?? actor.stance,
      saying: snapshot?.saying ?? actor.saying,
      doing: snapshot?.doing ?? actor.doing,
      assessment: snapshot?.assessment ?? actor.assessment,
      recentActions: actor.actions.map(act => ({
        date: act.date,
        type: act.type,
        description: act.description,
        verified: act.verified,
        significance: act.significance,
      })),
      keyFigures: actor.keyFigures,
      linkedEventIds: actor.linkedEventIds,
      daySnapshots: daySnapshotsRecord,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    },
  );
}
