import { useQuery } from '@tanstack/react-query';
import type { MapStory } from '@/types/domain';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone, HeatPoint } from '@/data/map-data';
import { api } from '../client';
import { queryKeys } from '../keys';

const CONFLICT_ID = process.env.NEXT_PUBLIC_CONFLICT_ID!;

export type MapDataResponse = {
  strikes: StrikeArc[];
  missiles: MissileTrack[];
  targets: Target[];
  assets: Asset[];
  threatZones: ThreatZone[];
  heatPoints: HeatPoint[];
};

export function useMapData(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.map.data(id),
    queryFn: () => api.get<MapDataResponse>(`/conflicts/${id}/map/data`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMapStories(id: string = CONFLICT_ID) {
  return useQuery({
    queryKey: queryKeys.map.stories(id),
    queryFn: () => api.get<MapStory[]>(`/conflicts/${id}/map/stories`),
    staleTime: 5 * 60 * 1000,
  });
}
