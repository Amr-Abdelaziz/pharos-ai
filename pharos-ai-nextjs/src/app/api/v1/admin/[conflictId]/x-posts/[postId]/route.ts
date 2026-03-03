import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { SignificanceLevel, AccountType } from '@/generated/prisma/client';

const SIGNIFICANCE_LEVELS = Object.values(SignificanceLevel);
const ACCOUNT_TYPES = Object.values(AccountType);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; postId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, postId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const post = await prisma.xPost.findFirst({ where: { id: postId, conflictId } });
  if (!post) return err('NOT_FOUND', `X post ${postId} not found`, 404);

  const data: Record<string, unknown> = {};

  if (body.significance !== undefined) {
    const e = assertEnum(body.significance, SIGNIFICANCE_LEVELS, 'significance');
    if (e) return err('VALIDATION', e);
    data.significance = body.significance;
  }
  if (body.accountType !== undefined) {
    const e = assertEnum(body.accountType, ACCOUNT_TYPES, 'accountType');
    if (e) return err('VALIDATION', e);
    data.accountType = body.accountType;
  }
  if (body.timestamp !== undefined) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    data.timestamp = ts;
  }
  if (body.handle !== undefined) data.handle = body.handle;
  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.content !== undefined) data.content = body.content;
  if (body.avatar !== undefined) data.avatar = body.avatar;
  if (body.avatarColor !== undefined) data.avatarColor = body.avatarColor;
  if (body.verified !== undefined) data.verified = body.verified;
  if (body.images !== undefined) data.images = body.images;
  if (body.videoThumb !== undefined) data.videoThumb = body.videoThumb;
  if (body.likes !== undefined) data.likes = body.likes;
  if (body.retweets !== undefined) data.retweets = body.retweets;
  if (body.replies !== undefined) data.replies = body.replies;
  if (body.views !== undefined) data.views = body.views;
  if (body.pharosNote !== undefined) data.pharosNote = body.pharosNote;
  if (body.eventId !== undefined) {
    if (body.eventId !== null) {
      const event = await prisma.intelEvent.findFirst({ where: { id: body.eventId, conflictId } });
      if (!event) return err('VALIDATION', `Event ${body.eventId} not found`);
    }
    data.eventId = body.eventId;
  }
  if (body.actorId !== undefined) {
    if (body.actorId !== null) {
      const actor = await prisma.actor.findFirst({ where: { id: body.actorId, conflictId } });
      if (!actor) return err('VALIDATION', `Actor ${body.actorId} not found`);
    }
    data.actorId = body.actorId;
  }

  const updated = await prisma.xPost.update({ where: { id: postId }, data });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; postId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, postId } = await params;

  const post = await prisma.xPost.findFirst({ where: { id: postId, conflictId } });
  if (!post) return err('NOT_FOUND', `X post ${postId} not found`, 404);

  await prisma.xPost.delete({ where: { id: postId } });

  return ok({ id: postId, deleted: true });
}
