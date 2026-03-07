/** Discover real X posts via Grok API; returns pre-formatted creation payloads. */

import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { safeJson } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { isXAIConfigured,searchXPosts } from '@/server/lib/xai-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  if (!body.query || typeof body.query !== 'string') {
    return err('VALIDATION', 'query is required (string)');
  }

  if (!isXAIConfigured()) {
    return err('SERVER_ERROR', 'XAI_API_KEY is not configured. Cannot search X posts.', 503);
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const maxResults = Math.min(body.maxResults ?? 10, 25);
  const handles = Array.isArray(body.handles) ? body.handles.slice(0, 10) : undefined;

  const result = await searchXPosts(body.query, {
    handles,
    fromDate: body.fromDate,
    toDate: body.toDate,
    maxResults,
  });

  const suggestedPosts = result.posts
    .filter(p => p.tweetId && p.handle && p.content)
    .map((p, i) => {
      const bareHandle = p.handle.replace(/^@/, '');
      const dateSlug = p.timestamp ? p.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10);

      return {
        id: `xp-@${bareHandle}-${dateSlug}-discovered-${String(i + 1).padStart(2, '0')}`,
        tweetId: p.tweetId,
        postType: 'XPOST' as const,
        handle: p.handle.startsWith('@') ? p.handle : `@${p.handle}`,
        displayName: p.displayName || bareHandle,
        content: p.content,
        accountType: 'analyst' as const, // Default — agent should adjust
        significance: 'STANDARD' as const, // Default — agent should adjust
        timestamp: p.timestamp || new Date().toISOString(),
        verificationStatus: 'VERIFIED' as const,
        verified: true,
        eventId: body.eventId ?? null,
      };
    });

  return ok({
    query: body.query,
    discovered: result.posts,
    citations: result.citations,
    suggestedPosts,
    count: result.posts.length,
  });
}
