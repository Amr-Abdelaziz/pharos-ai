import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import type { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get('tier');
  const category = req.nextUrl.searchParams.get('category');

  const where: Prisma.EconomicIndexWhereInput = {};
  if (tier) where.tier = parseInt(tier, 10);
  if (category) where.category = category as Prisma.EnumEconCategoryFilter['equals'];

  const indexes = await prisma.economicIndex.findMany({
    where,
    orderBy: [{ tier: 'asc' }, { category: 'asc' }],
  });

  return ok(
    indexes.map(idx => ({
      id: idx.id,
      ticker: idx.ticker,
      name: idx.name,
      shortName: idx.shortName,
      category: idx.category,
      tier: idx.tier,
      unit: idx.unit,
      description: idx.description,
      color: idx.color,
    })),
    {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}
