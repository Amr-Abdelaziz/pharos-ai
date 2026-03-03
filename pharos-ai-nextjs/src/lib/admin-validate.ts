import { NextRequest, NextResponse } from 'next/server';
import { err } from './api-utils';

/**
 * Validation helpers for admin API request bodies.
 * Each returns an error string on failure or null on success.
 */

/**
 * Safely parse JSON body. Returns the parsed object, or a NextResponse error.
 * Usage:
 *   const body = await safeJson(req);
 *   if (body instanceof NextResponse) return body;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeJson(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON';
    return err('BAD_JSON', `Malformed JSON body: ${msg}`);
  }
}

/** Check that all required fields are present and non-empty in a body object */
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

/** Check that a value is one of the allowed enum values */
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

/** Check that a value is an integer within [min, max] */
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

/** Parse an ISO date string, return Date or error string */
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
