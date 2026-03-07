import { useQuery } from '@tanstack/react-query';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MilSpendPoint = {
  year: number;
  value: number;
};

export type MilitarySpendingData = {
  spending: MilSpendPoint[]; // current USD, sorted by year asc
  gdpPct: MilSpendPoint[];  // percentage of GDP
  armedForces: MilSpendPoint[];
  inflation: MilSpendPoint[];
  gdpGrowth: MilSpendPoint[];
  refugeePopulation: MilSpendPoint[];
  gini: MilSpendPoint[];
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMilitarySpending(iso3Codes: string[]) {
  return useQuery({
    queryKey: queryKeys.worldBank.military(iso3Codes),
    queryFn: () =>
      api.get<Record<string, MilitarySpendingData>>(
        buildUrl('/world-bank/military', { countries: iso3Codes.join(',') }),
      ),
    staleTime: STALE.DAY,
    enabled: iso3Codes.length > 0,
  });
}
