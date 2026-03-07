import { useQuery } from '@tanstack/react-query';
import type { MarketGroup } from '@/types/domain';
import { api } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

export function usePredictionGroups() {
  return useQuery({
    queryKey: queryKeys.predictions.groups(),
    queryFn: () => api.get<MarketGroup[]>('/predictions/groups'),
    staleTime: STALE.LONG,
  });
}
