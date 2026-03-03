import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { Severity, EventType } from '@/generated/prisma/client';

const SEVERITIES = Object.values(Severity);
const EVENT_TYPES = Object.values(EventType);

export async function PUT(
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

  const data: Record<string, unknown> = {};

  if (body.severity !== undefined) {
    const e = assertEnum(body.severity, SEVERITIES, 'severity');
    if (e) return err('VALIDATION', e);
    data.severity = body.severity;
  }
  if (body.type !== undefined) {
    const e = assertEnum(body.type, EVENT_TYPES, 'type');
    if (e) return err('VALIDATION', e);
    data.type = body.type;
  }
  if (body.timestamp !== undefined) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    data.timestamp = ts;
  }
  if (body.title !== undefined) data.title = body.title;
  if (body.location !== undefined) data.location = body.location;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.fullContent !== undefined) data.fullContent = body.fullContent;
  if (body.verified !== undefined) data.verified = body.verified;
  if (body.tags !== undefined) data.tags = body.tags;

  const updated = await prisma.intelEvent.update({
    where: { id: eventId },
    data,
  });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; eventId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, eventId } = await params;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
  });
  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  await prisma.intelEvent.delete({ where: { id: eventId } });

  return ok({ id: eventId, deleted: true });
}
