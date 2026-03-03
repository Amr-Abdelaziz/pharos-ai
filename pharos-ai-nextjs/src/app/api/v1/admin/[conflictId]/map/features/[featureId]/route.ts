import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { parseISODate , safeJson } from '@/lib/admin-validate';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; featureId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, featureId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const feature = await prisma.mapFeature.findFirst({
    where: { id: featureId, conflictId },
  });
  if (!feature) return err('NOT_FOUND', `Map feature ${featureId} not found`, 404);

  const data: Record<string, unknown> = {};

  if (body.actor !== undefined) data.actor = body.actor;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.category !== undefined) data.category = body.category;
  if (body.type !== undefined) data.type = body.type;
  if (body.status !== undefined) data.status = body.status;
  if (body.geometry !== undefined) data.geometry = body.geometry;
  if (body.properties !== undefined) data.properties = body.properties;
  if (body.timestamp !== undefined) {
    if (body.timestamp === null) {
      data.timestamp = null;
    } else {
      const ts = parseISODate(body.timestamp, 'timestamp');
      if (typeof ts === 'string') return err('VALIDATION', ts);
      data.timestamp = ts;
    }
  }

  const updated = await prisma.mapFeature.update({ where: { id: featureId }, data });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; featureId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, featureId } = await params;

  const feature = await prisma.mapFeature.findFirst({
    where: { id: featureId, conflictId },
  });
  if (!feature) return err('NOT_FOUND', `Map feature ${featureId} not found`, 404);

  await prisma.mapFeature.delete({ where: { id: featureId } });

  return ok({ id: featureId, deleted: true });
}
