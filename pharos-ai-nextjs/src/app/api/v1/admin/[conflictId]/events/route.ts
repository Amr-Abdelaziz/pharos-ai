import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { Severity, EventType } from '@/generated/prisma/client';

const SEVERITIES = Object.values(Severity);
const EVENT_TYPES = Object.values(EventType);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  // Validate required fields
  const missing = assertRequired(body, [
    'id', 'timestamp', 'severity', 'type', 'title', 'location', 'summary', 'fullContent',
  ]);
  if (missing) return err('VALIDATION', missing);

  const sevErr = assertEnum(body.severity, SEVERITIES, 'severity');
  if (sevErr) return err('VALIDATION', sevErr);

  const typeErr = assertEnum(body.type, EVENT_TYPES, 'type');
  if (typeErr) return err('VALIDATION', typeErr);

  const ts = parseISODate(body.timestamp, 'timestamp');
  if (typeof ts === 'string') return err('VALIDATION', ts);

  // Check conflict exists
  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  // Check for duplicate
  const existing = await prisma.intelEvent.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Event ${body.id} already exists`, 409);

  // Validate actor response FKs if provided
  if (body.actorResponses?.length) {
    const actorIds = body.actorResponses.map((r: { actorId: string }) => r.actorId);
    const actors = await prisma.actor.findMany({
      where: { id: { in: actorIds }, conflictId },
      select: { id: true },
    });
    const foundIds = new Set(actors.map(a => a.id));
    const missing = actorIds.filter((id: string) => !foundIds.has(id));
    if (missing.length) return err('VALIDATION', `Unknown actor IDs: ${missing.join(', ')}`);
  }

  const event = await prisma.intelEvent.create({
    data: {
      id: body.id,
      conflictId,
      timestamp: ts,
      severity: body.severity,
      type: body.type,
      title: body.title,
      location: body.location,
      summary: body.summary,
      fullContent: body.fullContent,
      verified: body.verified ?? false,
      tags: body.tags ?? [],
      sources: body.sources?.length
        ? {
            create: body.sources.map((s: { name: string; tier: number; reliability: number; url?: string }) => ({
              name: s.name,
              tier: s.tier,
              reliability: s.reliability,
              url: s.url ?? null,
            })),
          }
        : undefined,
      actorResponses: body.actorResponses?.length
        ? {
            create: body.actorResponses.map(
              (r: { actorId: string; actorName: string; stance: string; type: string; statement: string }) => ({
                actorId: r.actorId,
                actorName: r.actorName,
                stance: r.stance,
                type: r.type,
                statement: r.statement,
              }),
            ),
          }
        : undefined,
    },
    include: { sources: true, actorResponses: true },
  });

  return ok({ id: event.id, created: true });
}
