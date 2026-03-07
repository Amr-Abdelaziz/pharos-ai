import { NextRequest } from 'next/server';

import { err, ok, parseDayRange } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import type { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const day = sp.get('day');
  const severity = sp.get('severity');
  const type = sp.get('type');
  const verified = sp.get('verified');
  const lite = sp.get('lite') === 'true';
  const limitParam = sp.get('limit');
  const parsedLimit = limitParam ? Number(limitParam) : NaN;
  const take = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : undefined;

  const where: Prisma.IntelEventWhereInput = { conflictId: id };

  if (day) {
    const range = parseDayRange(day);
    where.timestamp = { gte: range.gte, lt: range.lt };
  }
  if (severity) where.severity = severity as Prisma.EnumSeverityFilter['equals'];
  if (type) where.type = type as Prisma.EnumEventTypeFilter['equals'];
  if (verified !== null && verified !== undefined) where.verified = verified === 'true';

  const baseSelect = {
    id: true,
    timestamp: true,
    severity: true,
    type: true,
    title: true,
    location: true,
    summary: true,
    verified: true,
    tags: true,
  } satisfies Prisma.IntelEventSelect;

  const fullSelect = {
    ...baseSelect,
    fullContent: true,
    sources: { select: { name: true, tier: true, reliability: true, url: true } },
    actorResponses: { select: { actorId: true, actorName: true, stance: true, type: true, statement: true } },
  } satisfies Prisma.IntelEventSelect;

  if (lite) {
    const events = await prisma.intelEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      ...(take ? { take } : {}),
      select: baseSelect,
    });

    if (events.length === 0 && !(await prisma.conflict.findUnique({ where: { id } }))) {
      return err('NOT_FOUND', `Conflict ${id} not found`, 404);
    }

    const data = events.map(e => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      severity: e.severity,
      type: e.type,
      title: e.title,
      location: e.location,
      summary: e.summary,
      fullContent: e.summary,
      verified: e.verified,
      sources: [],
      actorResponses: [],
      tags: e.tags,
    }));

    return ok(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  }

  const events = await prisma.intelEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    ...(take ? { take } : {}),
    select: fullSelect,
  });

  if (events.length === 0 && !(await prisma.conflict.findUnique({ where: { id } }))) {
    return err('NOT_FOUND', `Conflict ${id} not found`, 404);
  }

  const data = events.map(e => ({
    id: e.id,
    timestamp: e.timestamp.toISOString(),
    severity: e.severity,
    type: e.type,
    title: e.title,
    location: e.location,
    summary: e.summary,
    fullContent: e.fullContent,
    verified: e.verified,
    sources: e.sources.map(s => ({
      name: s.name,
      tier: s.tier,
      reliability: s.reliability,
      url: s.url,
    })),
    actorResponses: e.actorResponses.map(r => ({
      actorId: r.actorId,
      actorName: r.actorName,
      stance: r.stance,
      type: r.type,
      statement: r.statement,
    })),
    tags: e.tags,
  }));

  return ok(data, {
    headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60' },
  });
}
