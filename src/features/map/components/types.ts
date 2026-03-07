import type { Asset, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';

export type SelectedItem =
  | { type: 'strike'; data: StrikeArc }
  | { type: 'missile'; data: MissileTrack }
  | { type: 'target'; data: Target }
  | { type: 'asset'; data: Asset }
  | { type: 'zone'; data: ThreatZone };
