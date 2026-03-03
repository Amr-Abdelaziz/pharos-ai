import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertEnum, parseISODate , safeJson } from '@/lib/admin-validate';
import { SignificanceLevel, AccountType } from '@/generated/prisma/client';

const SIGNIFICANCE_LEVELS = Object.values(SignificanceLevel);
const ACCOUNT_TYPES = Object.values(AccountType);

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

  if (!Array.isArray(body.posts) || body.posts.length === 0) {
    return err('VALIDATION', 'posts array is required and must not be empty');
  }
  if (body.posts.length > MAX_BULK) {
    return err('VALIDATION', `Maximum ${MAX_BULK} posts per bulk request`);
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  // Pre-validate
  const errors: { index: number; error: string }[] = [];
  const validated: {
    id: string;
    handle: string;
    displayName: string;
    content: string;
    accountType: string;
    significance: string;
    timestamp: Date;
    avatar: string;
    avatarColor: string;
    verified: boolean;
    images: string[];
    videoThumb: string | null;
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    pharosNote: string | null;
    eventId: string | null;
    actorId: string | null;
  }[] = [];

  for (let i = 0; i < body.posts.length; i++) {
    const item = body.posts[i];

    const missing = assertRequired(item, [
      'id', 'handle', 'displayName', 'content', 'accountType', 'significance', 'timestamp',
    ]);
    if (missing) { errors.push({ index: i, error: missing }); continue; }

    const sigErr = assertEnum(item.significance, SIGNIFICANCE_LEVELS, 'significance');
    if (sigErr) { errors.push({ index: i, error: sigErr }); continue; }

    const accErr = assertEnum(item.accountType, ACCOUNT_TYPES, 'accountType');
    if (accErr) { errors.push({ index: i, error: accErr }); continue; }

    const ts = parseISODate(item.timestamp, 'timestamp');
    if (typeof ts === 'string') { errors.push({ index: i, error: ts }); continue; }

    validated.push({
      id: item.id,
      handle: item.handle,
      displayName: item.displayName,
      content: item.content,
      accountType: item.accountType,
      significance: item.significance,
      timestamp: ts,
      avatar: item.avatar ?? '',
      avatarColor: item.avatarColor ?? '#6B7280',
      verified: item.verified ?? false,
      images: item.images ?? [],
      videoThumb: item.videoThumb ?? null,
      likes: item.likes ?? 0,
      retweets: item.retweets ?? 0,
      replies: item.replies ?? 0,
      views: item.views ?? 0,
      pharosNote: item.pharosNote ?? null,
      eventId: item.eventId ?? null,
      actorId: item.actorId ?? null,
    });
  }

  if (errors.length > 0) {
    return err('VALIDATION', `${errors.length} items failed validation`, 400);
  }

  // Check for duplicates
  const ids = validated.map(v => v.id);
  const existing = await prisma.xPost.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (existing.length > 0) {
    const dupes = existing.map(e => e.id);
    return err('DUPLICATE', `X posts already exist: ${dupes.join(', ')}`, 409);
  }

  // Create in transaction
  const created: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const item of validated) {
      await tx.xPost.create({
        data: {
          id: item.id,
          conflictId,
          handle: item.handle,
          displayName: item.displayName,
          content: item.content,
          accountType: item.accountType as AccountType,
          significance: item.significance as SignificanceLevel,
          timestamp: item.timestamp,
          avatar: item.avatar,
          avatarColor: item.avatarColor,
          verified: item.verified,
          images: item.images,
          videoThumb: item.videoThumb,
          likes: item.likes,
          retweets: item.retweets,
          replies: item.replies,
          views: item.views,
          pharosNote: item.pharosNote,
          eventId: item.eventId,
          actorId: item.actorId,
        },
      });
      created.push(item.id);
    }
  });

  return ok({ created, errors });
}
