import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertIntRange , safeJson } from '@/lib/admin-validate';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const missing = assertRequired(body, ['day', 'dayLabel', 'summary', 'escalation']);
  if (missing) return err('VALIDATION', missing);

  const escErr = assertIntRange(body.escalation, 0, 100, 'escalation');
  if (escErr) return err('VALIDATION', escErr);

  const day = new Date(body.day + 'T00:00:00Z');
  if (isNaN(day.getTime())) return err('VALIDATION', 'Invalid day format');

  // Check for duplicate
  const existing = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
  });
  if (existing) return err('DUPLICATE', `Day snapshot for ${body.day} already exists`, 409);

  const snapshot = await prisma.$transaction(async (tx) => {
    const snap = await tx.conflictDaySnapshot.create({
      data: {
        conflictId,
        day,
        dayLabel: body.dayLabel,
        summary: body.summary,
        keyFacts: body.keyFacts ?? [],
        escalation: body.escalation,
        economicNarrative: body.economicNarrative ?? '',
      },
    });

    // Create related records
    if (body.casualties?.length) {
      await tx.casualtySummary.createMany({
        data: body.casualties.map(
          (c: { faction: string; killed?: number; wounded?: number; civilians?: number; injured?: number }) => ({
            snapshotId: snap.id,
            faction: c.faction,
            killed: c.killed ?? 0,
            wounded: c.wounded ?? 0,
            civilians: c.civilians ?? 0,
            injured: c.injured ?? 0,
          }),
        ),
      });
    }

    if (body.economicChips?.length) {
      await tx.economicImpactChip.createMany({
        data: body.economicChips.map(
          (c: { label: string; val: string; sub: string; color: string }, i: number) => ({
            snapshotId: snap.id,
            ord: i,
            label: c.label,
            val: c.val,
            sub: c.sub,
            color: c.color,
          }),
        ),
      });
    }

    if (body.scenarios?.length) {
      await tx.scenario.createMany({
        data: body.scenarios.map(
          (s: { label: string; subtitle: string; color: string; prob: string; body: string }, i: number) => ({
            snapshotId: snap.id,
            ord: i,
            label: s.label,
            subtitle: s.subtitle,
            color: s.color,
            prob: s.prob,
            body: s.body,
          }),
        ),
      });
    }

    return snap;
  });

  return ok({ id: snapshot.id, day: body.day, created: true });
}
