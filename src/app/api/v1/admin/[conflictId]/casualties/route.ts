import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { assertRequired , safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const missing = assertRequired(body, ['day', 'casualties']);
  if (missing) return err('VALIDATION', missing);

  if (!Array.isArray(body.casualties) || body.casualties.length === 0) {
    return err('VALIDATION', 'casualties must be a non-empty array');
  }

  const day = new Date(body.day + 'T00:00:00Z');
  if (isNaN(day.getTime())) return err('VALIDATION', 'Invalid day format');

  const snapshot = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
  });
  if (!snapshot) return err('NOT_FOUND', `Day snapshot for ${body.day} not found — create the day first`, 404);

  // Upsert: delete existing then create
  await prisma.$transaction(async (tx) => {
    await tx.casualtySummary.deleteMany({ where: { snapshotId: snapshot.id } });
    await tx.casualtySummary.createMany({
      data: body.casualties.map(
        (c: { faction: string; killed?: number; wounded?: number; civilians?: number; injured?: number }) => ({
          snapshotId: snapshot.id,
          faction: c.faction,
          killed: c.killed ?? 0,
          wounded: c.wounded ?? 0,
          civilians: c.civilians ?? 0,
          injured: c.injured ?? 0,
        }),
      ),
    });
  });

  return ok({ day: body.day, upserted: body.casualties.length });
}
