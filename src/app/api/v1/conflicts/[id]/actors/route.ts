import { NextRequest } from 'next/server';

import { err, mapActorTypeToApi,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const day = req.nextUrl.searchParams.get('day');
  const lite = req.nextUrl.searchParams.get('lite') === 'true';
  const dayDate = day ? new Date(day + 'T00:00:00Z') : null;

  const actors = lite
    ? await prisma.actor.findMany({
        where: { conflictId: id },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          fullName: true,
          countryCode: true,
          type: true,
          mapKey: true,
          cssVar: true,
          colorRgb: true,
          affiliation: true,
          mapGroup: true,
          activityLevel: true,
          activityScore: true,
          stance: true,
          saying: true,
          doing: true,
          assessment: true,
          keyFigures: true,
          linkedEventIds: true,
          daySnapshots: dayDate
            ? {
                where: { day: dayDate },
                take: 1,
                select: {
                  day: true,
                  activityLevel: true,
                  activityScore: true,
                  stance: true,
                  saying: true,
                  doing: true,
                  assessment: true,
                },
              }
            : false,
          actions: {
            orderBy: { date: 'desc' },
            take: 5,
            select: { date: true, type: true, description: true, verified: true, significance: true },
          },
        },
      })
    : await prisma.actor.findMany({
        where: { conflictId: id },
        include: {
          daySnapshots: { orderBy: { day: 'asc' } },
          actions: { orderBy: { date: 'desc' } },
        },
      });

  if (actors.length === 0) return err('NOT_FOUND', `No actors for conflict ${id}`, 404);

  const data = actors.map(a => {
    // Build daySnapshots Record<day, snapshot>
    const daySnapshotsRecord: Record<string, {
      activityLevel: string; activityScore: number; stance: string;
      saying: string; doing: string[]; assessment: string;
    }> = {};
    if (lite) {
      const ds = day ? a.daySnapshots?.[0] : undefined;
      if (ds) {
        daySnapshotsRecord[ds.day.toISOString().slice(0, 10)] = {
          activityLevel: ds.activityLevel,
          activityScore: ds.activityScore,
          stance: ds.stance,
          saying: ds.saying,
          doing: ds.doing,
          assessment: ds.assessment,
        };
      }
    } else {
      for (const ds of a.daySnapshots) {
        daySnapshotsRecord[ds.day.toISOString().slice(0, 10)] = {
          activityLevel: ds.activityLevel,
          activityScore: ds.activityScore,
          stance: ds.stance,
          saying: ds.saying,
          doing: ds.doing,
          assessment: ds.assessment,
        };
      }
    }

    // If day param is provided, overlay snapshot values for that day
    const snapshot = day ? daySnapshotsRecord[day] : null;

    return {
      id: a.id,
      name: a.name,
      fullName: a.fullName,
      countryCode: a.countryCode,
      type: mapActorTypeToApi(a.type),
      mapKey: a.mapKey,
      cssVar: a.cssVar,
      colorRgb: a.colorRgb,
      affiliation: a.affiliation,
      mapGroup: a.mapGroup,
      activityLevel: snapshot?.activityLevel ?? a.activityLevel,
      activityScore: snapshot?.activityScore ?? a.activityScore,
      stance: snapshot?.stance ?? a.stance,
      saying: snapshot?.saying ?? a.saying,
      doing: snapshot?.doing ?? a.doing,
      assessment: snapshot?.assessment ?? a.assessment,
      recentActions: a.actions.map(act => ({
        date: act.date,
        type: act.type,
        description: act.description,
        verified: act.verified,
        significance: act.significance,
      })),
      keyFigures: a.keyFigures,
      linkedEventIds: a.linkedEventIds,
      daySnapshots: daySnapshotsRecord,
    };
  });

  return ok(data, {
    headers: {
      'Cache-Control': lite
        ? 'public, s-maxage=60, stale-while-revalidate=300'
        : 'public, s-maxage=10, stale-while-revalidate=60',
    },
  });
}
