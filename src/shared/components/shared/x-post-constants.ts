import type { XPost } from '@/types/domain';

// Account type styles
// Uses CSS tokens — no hex literals (CODEX §1.2)
export const ACCT: Record<string, { bg: string; text: string; label: string }> = {
  military:   { bg: 'var(--danger-dim)',  text: 'var(--danger)',  label: 'MILITARY' },
  government: { bg: 'var(--success-dim)', text: 'var(--success)', label: 'GOVT'     },
  official:   { bg: 'var(--blue-dim)',    text: 'var(--blue-l)',  label: 'OFFICIAL' },
  journalist: { bg: 'var(--cyber-dim)',        text: 'var(--cyber)', label: 'PRESS' },
  analyst:    { bg: 'var(--info-dim)',    text: 'var(--info)',    label: 'ANALYST'  },
};

// Left border by significance
export const SIG_BORDER: Record<string, string> = {
  BREAKING: 'var(--danger)',
  HIGH:     'var(--warning)',
  STANDARD: 'var(--bd)',
};

// Image placeholder backgrounds (unique dark tints, no token equivalent)
export const IMG_BG: Record<string, string> = {
  'strike-aerial-1':           '#0e1a0e',
  'osint-thermal-1':           '#1a0e0e',
  'osint-map-1':               '#0e0e1a',
  'iran-missile-1':            '#1a0e0e',
  'ukraine-column-geo-1':      '#0e140e',
  'ukraine-column-geo-2':      '#0e1410',
  'taiwan-radar-track-1':      '#0e0e1a',
  'uss-reagan-philippine-sea': '#06101a',
};
export const IMG_LBL: Record<string, string> = {
  'strike-aerial-1':           'AERIAL · N.GAZA',
  'osint-thermal-1':           'THERMAL · STRIKE SIG.',
  'osint-map-1':               'GEOLOC · MAP OVERLAY',
  'iran-missile-1':            'STATE MEDIA · IRGC LAUNCH',
  'ukraine-column-geo-1':      'SAT · ARMOR COLUMN',
  'ukraine-column-geo-2':      'SAT · VEHICLE ID',
  'taiwan-radar-track-1':      'ADIZ · PLAAF TRACK',
  'uss-reagan-philippine-sea': 'USN · PHILIPPINE SEA',
};

export const DEFAULT_AVATAR_COLOR = 'var(--t4)';

// Helpers

/** Build the X post URL from handle + tweetId */
export function xUrl(handle: string, tweetId?: string): string | null {
  if (!tweetId) return null;
  const bare = handle.replace(/^@/, '');
  return `https://x.com/${bare}/status/${tweetId}`;
}

export function getInitials(displayName: string, handle: string, avatar?: string): string {
  const explicit = (avatar ?? '').trim();
  if (explicit) return explicit.slice(0, 2).toUpperCase();

  const words = displayName
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  const bare = handle.replace(/^@/, '').trim();
  return (bare.slice(0, 2) || '??').toUpperCase();
}

export function hashToColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 58% 42%)`;
}

export function resolveAvatarColor(post: XPost): string {
  const hasCustom = !!post.avatarColor && post.avatarColor.toLowerCase() !== DEFAULT_AVATAR_COLOR.toLowerCase();
  if (hasCustom) return post.avatarColor;

  if (post.actorCssVar) return post.actorCssVar;
  if (post.actorColorRgb && post.actorColorRgb.length === 3) {
    const [r, g, b] = post.actorColorRgb;
    return `rgb(${r} ${g} ${b})`;
  }

  return hashToColor(post.handle || post.displayName || post.id);
}
