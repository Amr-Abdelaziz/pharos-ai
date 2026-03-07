import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { RssFeed, ConflictCollection, FeedResult } from '@/types/domain';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

const CONFLICT_ID = publicConflictId;

export function useRssFeeds() {
  return useQuery({
    queryKey: queryKeys.rss.feeds(),
    queryFn: () => api.get<RssFeed[]>('/rss/feeds'),
    staleTime: STALE.LONG,
  });
}

export function useRssCollections(conflictId?: string) {
  const id = conflictId ?? CONFLICT_ID;
  return useQuery({
    queryKey: queryKeys.rss.collections(id),
    queryFn: () =>
      api.get<ConflictCollection[]>(buildUrl('/rss/collections', { conflictId: id })),
    staleTime: STALE.LONG,
  });
}

export async function fetchFeedItems(ids: string[]): Promise<FeedResult[]> {
  if (ids.length === 0) return [];
  const res = await fetch('/api/v1/rss/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  return data?.feeds ?? [];
}

export async function fetchSingleFeed(id: string): Promise<FeedResult | null> {
  const res = await fetch(`/api/v1/rss/fetch?ids=${id}`);
  const data = await res.json();
  return data?.feeds?.[0] ?? null;
}
