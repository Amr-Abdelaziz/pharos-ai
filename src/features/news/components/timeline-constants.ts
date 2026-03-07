import { ago } from '@/shared/lib/format';

import type { RssFeed } from '@/types/domain';

// Types

export type TimelineArticle = {
  id: string;
  title: string;
  link: string;
  snippet: string;
  time: Date;
  feed: RssFeed;
  imageUrl?: string;
};

// Tier → vertical distance from spine

export const TIER_Y_OFFSET: Record<number, number> = {
  1: 16,
  2: 90,
  3: 175,
  4: 265,
};

export const TIER_LABELS: Record<number, string> = {
  1: 'WIRE',
  2: 'MAJOR',
  3: 'REGIONAL',
  4: 'STATE',
};

// Layout
export const CARD_W = 260;
export const CARD_GAP = 16;
export const TIME_SLOT_W = CARD_W + CARD_GAP;
export const IMG_H = 100;
export const CARD_H_IMG = IMG_H + 90;   // card height with image
export const CARD_H_NO_IMG = 100;       // card height without image
export const PADDING_X = 160;
export const SPINE_Y = 620;              // enough room for T4 cards (265 offset + ~190 card height = 455px above spine)
export const CANVAS_H = SPINE_Y * 2 + 200; // symmetric below

// Zoom
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 1.2;
export const ZOOM_STEP = 0.06;
export const DEFAULT_ZOOM = 0.65;

// Helpers

export function formatHour(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatTimeAgo(d: Date): string {
  return ago(d.toISOString());
}

/** Proxy image through our cache to avoid rate limiting */
export function proxyImg(url: string): string {
  return `/api/v1/img?url=${encodeURIComponent(url)}`;
}
