import { useQuery } from '@tanstack/react-query';

import { publicConflictId } from '@/shared/lib/env';
import type { Actor } from '@/types/domain';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, STALE } from '@/shared/lib/query/keys';

const CONFLICT_ID = publicConflictId;

export function useActors(id: string = CONFLICT_ID, day?: string) {
  return useQuery({
    queryKey: queryKeys.actors.list(id, day),
    queryFn: () =>
      api.get<Actor[]>(buildUrl(`/conflicts/${id}/actors`, { day, lite: true })),
    staleTime: STALE.SHORT,
  });
}

export function useActor(id: string = CONFLICT_ID, actorId?: string, day?: string) {
  return useQuery({
    queryKey: queryKeys.actors.detail(id, actorId, day),
    queryFn: () =>
      api.get<Actor>(buildUrl(`/conflicts/${id}/actors/${actorId}`, { day })),
    enabled: !!actorId,
    staleTime: STALE.SHORT,
  });
}
