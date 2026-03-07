import { NextRequest } from 'next/server';

import { err } from './api-utils';

// Map feature enums

/** Valid actor values for map features — must match Actor.mapKey, always UPPERCASE */
export const MAP_ACTOR_KEYS = [
  'US', 'ISRAEL', 'IRAN', 'IRGC', 'HOUTHI', 'NATO', 'USIL', 'HEZBOLLAH', 'PMF',
] as const;

export const MAP_PRIORITIES = ['P1', 'P2', 'P3'] as const;

export const KINETIC_TYPES = ['AIRSTRIKE', 'NAVAL_STRIKE', 'BALLISTIC', 'CRUISE', 'DRONE'] as const;
export const INSTALLATION_TYPES = ['CARRIER', 'AIR_BASE', 'NAVAL_BASE', 'ARMY_BASE', 'NUCLEAR_SITE', 'COMMAND', 'INFRASTRUCTURE'] as const;
export const ZONE_TYPES = ['CLOSURE', 'PATROL', 'NFZ', 'THREAT_CORRIDOR'] as const;

export const KINETIC_STATUSES = ['COMPLETE', 'INTERCEPTED', 'IMPACTED'] as const;
export const INSTALLATION_STATUSES = ['ACTIVE', 'DEGRADED', 'STRUCK', 'DAMAGED', 'DESTROYED'] as const;

// Story enums

/** Valid iconName values — must exactly match StoryIcon.tsx ICON_MAP keys */
export const POST_TYPES = ['XPOST', 'NEWS_ARTICLE', 'OFFICIAL_STATEMENT', 'PRESS_RELEASE', 'ANALYSIS'] as const;
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'VERIFIED', 'FAILED', 'PARTIAL', 'SKIPPED'] as const;

export const STORY_ICON_NAMES = [
  'Plane', 'Radiation', 'Anchor', 'Crosshair', 'Ship', 'Skull',
  'Zap', 'Target', 'Swords', 'Shield', 'Flame', 'AlertTriangle', 'Building2',
] as const;

/** Admin validation helpers — return error string or null. */

/** Parse JSON body; returns parsed object or NextResponse error. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeJson(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON';
    return err('BAD_JSON', `Malformed JSON body: ${msg}`);
  }
}

export function assertRequired(
  body: Record<string, unknown>,
  fields: string[],
): string | null {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      return `Missing required field: ${f}`;
    }
  }
  return null;
}

export function assertEnum(
  value: unknown,
  allowed: readonly string[],
  field: string,
): string | null {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return `Invalid ${field}: must be one of ${allowed.join(', ')}`;
  }
  return null;
}

export function assertIntRange(
  value: unknown,
  min: number,
  max: number,
  field: string,
): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return `Invalid ${field}: must be integer between ${min} and ${max}`;
  }
  return null;
}

export function parseISODate(value: unknown, field: string): Date | string {
  if (typeof value !== 'string') {
    return `Invalid ${field}: must be an ISO date string`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return `Invalid ${field}: could not parse as date`;
  }
  return d;
}
