import type { FeedItem } from '@/types/domain';

/** A cached feed result on the client side. */
export type CachedFeed = {
  feedId: string;
  items: FeedItem[];
  fetchedAt: number;
};

/** Module-level client cache — persists across re-renders within same session. */
export const clientCache = new Map<string, CachedFeed>();

/** 5 minutes — how long client considers cached feed data fresh. */
export const CLIENT_FRESH_TTL = 5 * 60 * 1000;
