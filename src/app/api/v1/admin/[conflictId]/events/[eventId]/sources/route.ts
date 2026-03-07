import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; eventId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, eventId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
  });
  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  if (!Array.isArray(body.sources) || body.sources.length === 0) {
    return err('VALIDATION', 'sources array is required and must not be empty');
  }

  const created = await prisma.eventSource.createMany({
    data: body.sources.map((s: { name: string; tier: number; reliability: number; url?: string }) => ({
      eventId,
      name: s.name,
      tier: s.tier,
      reliability: s.reliability,
      url: s.url ?? null,
    })),
  });

  return ok({ eventId, added: created.count });
}
