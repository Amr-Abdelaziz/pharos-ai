import type { EventType,Severity } from '@/types/domain';

/** Severity → CSS variable color. */
export const SEV_C: Record<Severity, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
  STANDARD: 'var(--info)',
};

/** EventType → CSS variable color (canonical mapping). */
export const TYPE_C: Record<EventType, string> = {
  MILITARY: 'var(--danger)',
  DIPLOMATIC: 'var(--info)',
  INTELLIGENCE: 'var(--cyber)',
  ECONOMIC: 'var(--warning)',
  HUMANITARIAN: 'var(--success)',
  POLITICAL: 'var(--t2)',
};
