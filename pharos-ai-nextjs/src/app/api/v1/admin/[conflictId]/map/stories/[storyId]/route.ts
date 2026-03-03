import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { StoryCategory } from '@/generated/prisma/client';

const CATEGORIES = Object.values(StoryCategory);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  const data: Record<string, unknown> = {};

  if (body.category !== undefined) {
    const e = assertEnum(body.category, CATEGORIES, 'category');
    if (e) return err('VALIDATION', e);
    data.category = body.category;
  }
  if (body.timestamp !== undefined) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    data.timestamp = ts;
  }
  if (body.title !== undefined) data.title = body.title;
  if (body.tagline !== undefined) data.tagline = body.tagline;
  if (body.iconName !== undefined) data.iconName = body.iconName;
  if (body.narrative !== undefined) data.narrative = body.narrative;
  if (body.highlightStrikeIds !== undefined) data.highlightStrikeIds = body.highlightStrikeIds;
  if (body.highlightMissileIds !== undefined) data.highlightMissileIds = body.highlightMissileIds;
  if (body.highlightTargetIds !== undefined) data.highlightTargetIds = body.highlightTargetIds;
  if (body.highlightAssetIds !== undefined) data.highlightAssetIds = body.highlightAssetIds;
  if (body.viewState !== undefined) data.viewState = body.viewState;
  if (body.keyFacts !== undefined) data.keyFacts = body.keyFacts;

  const updated = await prisma.mapStory.update({ where: { id: storyId }, data });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  await prisma.mapStory.delete({ where: { id: storyId } });

  return ok({ id: storyId, deleted: true });
}
