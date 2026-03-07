import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET() {
  const feeds = await prisma.rssFeed.findMany({
    orderBy: { tier: 'asc' },
  });

  return ok(
    feeds.map(f => ({
      id: f.id,
      name: f.name,
      url: f.url,
      perspective: f.perspective,
      country: f.country,
      tags: f.tags,
      stateFunded: f.stateFunded,
      tier: f.tier,
    })),
    {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}
