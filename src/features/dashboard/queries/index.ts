import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

import type { BootstrapData } from '@/types/domain';

export function useBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap.all(),
    queryFn: () => api.get<BootstrapData>('/bootstrap'),
    staleTime: STALE.MEDIUM,
  });
}
