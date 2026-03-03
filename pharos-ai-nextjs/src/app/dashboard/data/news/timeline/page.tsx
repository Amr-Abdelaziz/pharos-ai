'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RSS_FEEDS, getFeedById } from '@/data/rssFeeds';
import { NewsTimeline } from '@/components/news/NewsTimeline';
import Link from 'next/link';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  categories?: string[];
  imageUrl?: string;
}

const PERSPECTIVE_COLORS: Record<string, string> = {
  WESTERN: '#3b82f6', US_GOV: '#60a5fa', ISRAELI: '#a78bfa', IRANIAN: '#ef4444',
  ARAB: '#f59e0b', RUSSIAN: '#f97316', CHINESE: '#dc2626', INDEPENDENT: '#10b981',
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60000) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const clientCache = new Map<string, { items: FeedItem[]; fetchedAt: number }>();
const CLIENT_FRESH_TTL = 5 * 60 * 1000;

type ViewMode = 'feed' | 'timeline';

export default function TimelinePage() {
  const [feedData,    setFeedData]    = useState<Map<string, FeedItem[]>>(new Map());
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [view,        setView]        = useState<ViewMode>('feed');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFeeds = useCallback(async () => {
    setRefreshing(true);
    try {
      const allIds = RSS_FEEDS.map(f => f.id);
      const staleIds = allIds.filter(id => {
        const cached = clientCache.get(id);
        return !cached || Date.now() - cached.fetchedAt > CLIENT_FRESH_TTL;
      });

      if (staleIds.length === 0) {
        const map = new Map<string, FeedItem[]>();
        allIds.forEach(id => { const c = clientCache.get(id); if (c) map.set(id, c.items); });
        setFeedData(map);
        setRefreshing(false);
        return;
      }

      const res = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: staleIds }),
      });
      const data = await res.json();
      const now = Date.now();
      for (const feed of data.feeds ?? []) {
        if (feed.items?.length > 0) clientCache.set(feed.feedId, { items: feed.items, fetchedAt: now });
      }
      const map = new Map<string, FeedItem[]>();
      allIds.forEach(id => { const c = clientCache.get(id); if (c) map.set(id, c.items); });
      setFeedData(map);
      setLastRefresh(now);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeeds(); }, [fetchFeeds]);
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchFeeds(), 5 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchFeeds]);

  // Flatten + sort all articles newest first for the feed view
  const allArticles = useMemo(() => {
    const items: { item: FeedItem; feedId: string }[] = [];
    feedData.forEach((feedItems, feedId) => {
      for (const item of feedItems) {
        items.push({ item, feedId });
      }
    });
    return items.sort((a, b) => {
      const ta = new Date(a.item.isoDate ?? a.item.pubDate ?? 0).getTime();
      const tb = new Date(b.item.isoDate ?? b.item.pubDate ?? 0).getTime();
      return tb - ta;
    });
  }, [feedData]);

  const totalArticles = allArticles.length;

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/data/news"
            className="mono text-[10px] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
          >
            ← FEEDS
          </Link>
          <div className="w-px h-4 bg-[var(--bd)]" />
          <span className="mono text-[10px] font-bold text-[var(--t1)] tracking-wider">
            {view === 'feed' ? 'ALL ARTICLES' : 'TIMELINE VIEW'}
          </span>
          {view === 'feed' && (
            <span className="mono text-[9px] text-[var(--t4)]">{totalArticles} articles</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-[var(--bd)] overflow-hidden">
            <button
              onClick={() => setView('feed')}
              className={`px-3 py-1 mono text-[9px] font-bold tracking-wider transition-colors ${
                view === 'feed' ? 'bg-white/10 text-white' : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              ☰ FEED
            </button>
            <div className="w-px bg-[var(--bd)]" />
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1 mono text-[9px] font-bold tracking-wider transition-colors ${
                view === 'timeline' ? 'bg-white/10 text-white' : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              ↔ TIMELINE
            </button>
          </div>

          <button
            onClick={() => fetchFeeds()}
            disabled={refreshing}
            className="flex items-center gap-2 px-2 py-1 mono text-[9px] text-[var(--t4)] hover:text-[var(--t2)] transition-colors disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={refreshing ? 'animate-spin' : ''}>
              <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
              <path d="M1 1v4h4M11 11v-4h-4" />
            </svg>
            REFRESH
          </button>

          <div className="flex items-center gap-2">
            <div className={`dot ${refreshing ? 'dot-warn' : 'dot-live'}`} />
            <span className="mono text-[9px] text-[var(--t4)]">
              {refreshing ? 'loading…' : lastRefresh ? `${Math.floor((Date.now() - lastRefresh) / 1000)}s ago` : '…'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'timeline' ? (
        <NewsTimeline feedData={feedData} />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          {refreshing && allArticles.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
            </div>
          ) : (
            allArticles.map(({ item, feedId }, i) => {
              const feed = getFeedById(feedId);
              const color = feed ? (PERSPECTIVE_COLORS[feed.perspective] ?? '#6b7280') : '#6b7280';
              return (
                <a
                  key={`${feedId}-${i}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-5 py-3 border-b border-[var(--bd)] hover:bg-[var(--bg-2)] transition-colors no-underline group"
                >
                  {/* Feed logo */}
                  <div className="w-6 h-6 rounded shrink-0 mt-0.5 overflow-hidden bg-[var(--bg-3)] flex items-center justify-center">
                    <img
                      src={`/logos/feeds/${feedId}.png`}
                      alt={feed?.name ?? feedId}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="mono text-[9px] font-bold shrink-0" style={{ color }}>
                        {feed?.name ?? feedId}
                      </span>
                      <span className="mono text-[8px] text-[var(--t4)]">
                        {timeAgo(item.isoDate ?? item.pubDate)}
                      </span>
                      {feed?.stateFunded && (
                        <span className="mono text-[7px] font-bold text-amber-400/70 tracking-wider">STATE</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--t1)] leading-snug group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    {item.contentSnippet && (
                      <p className="text-[10px] text-[var(--t4)] mt-0.5 leading-relaxed line-clamp-2">
                        {item.contentSnippet}
                      </p>
                    )}
                  </div>

                  {/* Article image — right side */}
                  {item.imageUrl && (
                    <div className="w-[88px] h-[60px] rounded overflow-hidden shrink-0 bg-[var(--bg-2)]">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
