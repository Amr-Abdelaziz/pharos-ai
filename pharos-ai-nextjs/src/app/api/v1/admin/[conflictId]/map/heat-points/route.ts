import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, parseISODate , safeJson } from '@/lib/admin-validate';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const missing = assertRequired(body, ['id', 'actor', 'priority', 'category', 'type']);
  if (missing) return err('VALIDATION', missing);

  // Heat point needs position
  if (!body.geometry?.position) {
    return err('VALIDATION', 'Heat point geometry requires position [lng, lat]');
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const existing = await prisma.mapFeature.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Map feature ${body.id} already exists`, 409);

  let timestamp: Date | null = null;
  if (body.timestamp) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    timestamp = ts;
  }

  const feature = await prisma.mapFeature.create({
    data: {
      id: body.id,
      conflictId,
      featureType: 'HEAT_POINT',
      actor: body.actor,
      priority: body.priority,
      category: body.category,
      type: body.type,
      status: body.status ?? null,
      timestamp,
      geometry: body.geometry,
      properties: body.properties ?? {},
    },
  });

  return ok({ id: feature.id, created: true });
}
