import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId');

  const collections = await prisma.conflictCollection.findMany({
    where: conflictId ? { conflictId } : {},
    include: {
      channels: {
        orderBy: { ord: 'asc' },
        include: {
          feeds: {
            orderBy: { ord: 'asc' },
            select: { feedId: true },
          },
        },
      },
    },
  });

  const data = collections.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    channels: c.channels.map(ch => ({
      label: ch.label,
      description: ch.description,
      perspective: ch.perspective,
      color: ch.color,
      feedIds: ch.feeds.map(f => f.feedId),
    })),
  }));

  return ok(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
