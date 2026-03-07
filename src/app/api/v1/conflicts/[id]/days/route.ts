import { NextRequest } from 'next/server';

import { err, ok, reassembleCasualties } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lite = req.nextUrl.searchParams.get('lite') === 'true';
  if (lite) {
    const snapshots = await prisma.conflictDaySnapshot.findMany({
      where: { conflictId: id },
      orderBy: { day: 'asc' },
      select: {
        day: true,
        dayLabel: true,
        summary: true,
        escalation: true,
      },
    });

    if (snapshots.length === 0) return err('NOT_FOUND', `No day snapshots for conflict ${id}`, 404);

    const data = snapshots.map(s => ({
      day: s.day.toISOString().slice(0, 10),
      dayLabel: s.dayLabel,
      summary: s.summary,
      escalation: s.escalation,
    }));

    return ok(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  }

  const snapshots = await prisma.conflictDaySnapshot.findMany({
    where: { conflictId: id },
    orderBy: { day: 'asc' },
    include: {
      casualties: true,
      economicChips: { orderBy: { ord: 'asc' } },
      scenarios: { orderBy: { ord: 'asc' } },
    },
  });

  if (snapshots.length === 0) return err('NOT_FOUND', `No day snapshots for conflict ${id}`, 404);

  const data = snapshots.map(s => ({
    day: s.day.toISOString().slice(0, 10),
    dayLabel: s.dayLabel,
    summary: s.summary,
    keyFacts: s.keyFacts,
    escalation: s.escalation,
    casualties: reassembleCasualties(s.casualties),
    economicImpact: {
      chips: s.economicChips.map(c => ({ label: c.label, val: c.val, sub: c.sub, color: c.color })),
      narrative: s.economicNarrative,
    },
    scenarios: s.scenarios.map(sc => ({ label: sc.label, subtitle: sc.subtitle, color: sc.color, prob: sc.prob, body: sc.body })),
  }));

  return ok(data, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  });
}
