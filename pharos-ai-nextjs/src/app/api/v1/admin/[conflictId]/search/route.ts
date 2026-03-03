import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim();
  const type = sp.get('type'); // events, xposts, actors, map, stories
  const limit = Math.min(Number(sp.get('limit')) || 20, 100);

  if (!q) return err('VALIDATION', 'Query parameter q is required');

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const results: Record<string, unknown[]> = {};

  if (!type || type === 'events') {
    const events = await prisma.intelEvent.findMany({
      where: {
        conflictId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: { id: true, title: true, timestamp: true, severity: true, type: true },
    });
    results.events = events.map(e => ({ ...e, timestamp: e.timestamp.toISOString() }));
  }

  if (!type || type === 'xposts') {
    const xposts = await prisma.xPost.findMany({
      where: {
        conflictId,
        OR: [
          { content: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: { id: true, handle: true, content: true, timestamp: true, significance: true },
    });
    results.xposts = xposts.map(p => ({
      ...p,
      timestamp: p.timestamp.toISOString(),
      content: p.content.length > 200 ? p.content.slice(0, 200) + '...' : p.content,
    }));
  }

  if (!type || type === 'actors') {
    const actors = await prisma.actor.findMany({
      where: {
        conflictId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, type: true, activityLevel: true },
    });
    results.actors = actors;
  }

  if (!type || type === 'map') {
    const features = await prisma.mapFeature.findMany({
      where: {
        conflictId,
        OR: [
          { actor: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { type: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, featureType: true, actor: true, type: true, category: true },
    });
    results.map = features;
  }

  if (!type || type === 'stories') {
    const stories = await prisma.mapStory.findMany({
      where: {
        conflictId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { narrative: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: { id: true, title: true, category: true, timestamp: true },
    });
    results.stories = stories.map(s => ({ ...s, timestamp: s.timestamp.toISOString() }));
  }

  return ok({ query: q, results });
}
