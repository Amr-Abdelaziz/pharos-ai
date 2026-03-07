import { NextRequest } from 'next/server';

import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId: id },
    include: {
      sources: true,
      actorResponses: true,
    },
  });

  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  return ok(
    {
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      severity: event.severity,
      type: event.type,
      title: event.title,
      location: event.location,
      summary: event.summary,
      fullContent: event.fullContent,
      verified: event.verified,
      sources: event.sources.map(s => ({
        name: s.name,
        tier: s.tier,
        reliability: s.reliability,
        url: s.url,
      })),
      actorResponses: event.actorResponses.map(r => ({
        actorId: r.actorId,
        actorName: r.actorName,
        stance: r.stance,
        type: r.type,
        statement: r.statement,
      })),
      tags: event.tags,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    },
  );
}
