import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { assertEnum, assertRequired, parseISODate , safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import { EventType,Severity } from '@/generated/prisma/client';

const SEVERITIES = Object.values(Severity);
const EVENT_TYPES = Object.values(EventType);

const MAX_BULK = 50;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return err('VALIDATION', 'events array is required and must not be empty');
  }
  if (body.events.length > MAX_BULK) {
    return err('VALIDATION', `Maximum ${MAX_BULK} events per bulk request`);
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  // Pre-validate all items
  const errors: { index: number; error: string }[] = [];
  const validated: {
    id: string;
    timestamp: Date;
    severity: string;
    type: string;
    title: string;
    location: string;
    summary: string;
    fullContent: string;
    verified: boolean;
    tags: string[];
    sources?: { name: string; tier: number; reliability: number; url?: string }[];
  }[] = [];

  for (let i = 0; i < body.events.length; i++) {
    const item = body.events[i];

    const missing = assertRequired(item, [
      'id', 'timestamp', 'severity', 'type', 'title', 'location', 'summary', 'fullContent',
    ]);
    if (missing) { errors.push({ index: i, error: missing }); continue; }

    const sevErr = assertEnum(item.severity, SEVERITIES, 'severity');
    if (sevErr) { errors.push({ index: i, error: sevErr }); continue; }

    const typeErr = assertEnum(item.type, EVENT_TYPES, 'type');
    if (typeErr) { errors.push({ index: i, error: typeErr }); continue; }

    const ts = parseISODate(item.timestamp, 'timestamp');
    if (typeof ts === 'string') { errors.push({ index: i, error: ts }); continue; }

    validated.push({
      id: item.id,
      timestamp: ts,
      severity: item.severity,
      type: item.type,
      title: item.title,
      location: item.location,
      summary: item.summary,
      fullContent: item.fullContent,
      verified: item.verified ?? false,
      tags: item.tags ?? [],
      sources: item.sources,
    });
  }

  if (errors.length > 0) {
    return err('VALIDATION', `${errors.length} items failed validation`, 400);
  }

  // Check for duplicates
  const ids = validated.map(v => v.id);
  const existing = await prisma.intelEvent.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (existing.length > 0) {
    const dupes = existing.map(e => e.id);
    return err('DUPLICATE', `Events already exist: ${dupes.join(', ')}`, 409);
  }

  // Create in transaction
  const created: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const item of validated) {
      await tx.intelEvent.create({
        data: {
          id: item.id,
          conflictId,
          timestamp: item.timestamp,
          severity: item.severity as Severity,
          type: item.type as EventType,
          title: item.title,
          location: item.location,
          summary: item.summary,
          fullContent: item.fullContent,
          verified: item.verified,
          tags: item.tags,
          sources: item.sources?.length
            ? {
                create: item.sources.map(s => ({
                  name: s.name,
                  tier: s.tier,
                  reliability: s.reliability,
                  url: s.url ?? null,
                })),
              }
            : undefined,
        },
      });
      created.push(item.id);
    }
  });

  return ok({ created, errors });
}
