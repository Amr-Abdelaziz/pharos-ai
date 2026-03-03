import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { StoryCategory } from '@/generated/prisma/client';

const CATEGORIES = Object.values(StoryCategory);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const missing = assertRequired(body, [
    'id', 'title', 'tagline', 'iconName', 'category', 'narrative', 'viewState', 'timestamp',
  ]);
  if (missing) return err('VALIDATION', missing);

  const catErr = assertEnum(body.category, CATEGORIES, 'category');
  if (catErr) return err('VALIDATION', catErr);

  const ts = parseISODate(body.timestamp, 'timestamp');
  if (typeof ts === 'string') return err('VALIDATION', ts);

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const existing = await prisma.mapStory.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Map story ${body.id} already exists`, 409);

  const story = await prisma.mapStory.create({
    data: {
      id: body.id,
      conflictId,
      title: body.title,
      tagline: body.tagline,
      iconName: body.iconName,
      category: body.category,
      narrative: body.narrative,
      highlightStrikeIds: body.highlightStrikeIds ?? [],
      highlightMissileIds: body.highlightMissileIds ?? [],
      highlightTargetIds: body.highlightTargetIds ?? [],
      highlightAssetIds: body.highlightAssetIds ?? [],
      viewState: body.viewState,
      keyFacts: body.keyFacts ?? [],
      timestamp: ts,
      events: body.events?.length
        ? {
            create: body.events.map(
              (e: { time: string; label: string; type: string }, i: number) => ({
                ord: i,
                time: e.time,
                label: e.label,
                type: e.type,
              }),
            ),
          }
        : undefined,
    },
  });

  return ok({ id: story.id, created: true });
}
