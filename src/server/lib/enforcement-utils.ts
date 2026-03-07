/**
 * enforcement-utils.ts
 *
 * Shared helpers for ?enforcement=true dry-run mode.
 */

import { NextRequest, NextResponse } from 'next/server';

import { ok } from './api-utils';
import type { EnforcementIssue } from './enforcement';

/** Returns true if the request has ?enforcement=true */
export function isEnforcementMode(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get('enforcement') === 'true';
}

/**
 * Build and return the enforcement dry-run response.
 * Call this instead of writing to the DB.
 */
export function enforcementResponse(
  wouldCreate: Record<string, unknown>,
  issues: EnforcementIssue[],
): NextResponse {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const suggestions = issues.filter(i => i.severity === 'suggestion');

  return ok({
    dryRun: true,
    enforcement: true,
    passed: errors.length === 0,
    wouldCreate,
    errors,
    warnings,
    suggestions,
    summary:
      errors.length > 0
        ? `${errors.length} error(s) must be fixed before creating.`
        : warnings.length > 0
          ? `Passed — ${warnings.length} warning(s) to review before creating.`
          : 'Passed — no issues found.',
  });
}
