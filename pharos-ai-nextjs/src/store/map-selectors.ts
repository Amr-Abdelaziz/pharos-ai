import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '@/lib/map-filter-engine';

import { ACTOR_META } from '@/data/map-tokens';

import type { RootState } from './index';
import type { FilterState, FilteredData, FilterFacets } from '@/lib/map-filter-engine';

// ─── Base selectors ──────────────────────────────────────────────────────────

const selectSerializableFilters = (state: RootState) => state.map.filters;
const selectInitialFilters      = (state: RootState) => state.map.initialFilters;
const selectRawData             = (state: RootState) => state.map.rawData;

// ─── Convert serializable arrays → Set-based FilterState ─────────────────────

export const selectFilterState = createSelector(
  [selectSerializableFilters],
  (f): FilterState => ({
    datasets:   new Set(f.datasets),
    types:      new Set(f.types),
    actors:     new Set(f.actors),
    statuses:   new Set(f.statuses),
    priorities: new Set(f.priorities),
    heat:       f.heat,
    timeRange:  f.timeRange,
  }),
);

// ─── Filtered data — only recomputes when filter state or raw data changes ───

const EMPTY_RESULT: { filtered: FilteredData; facets: FilterFacets } = {
  filtered: { strikes: [], missiles: [], targets: [], assets: [], zones: [], heat: [] },
  facets:   { datasets: [], perDataset: {}, totalVisible: 0, totalAll: 0 },
};

export const selectFilteredData = createSelector(
  [selectRawData, selectFilterState],
  (rawData, filterState) =>
    rawData ? applyFilters(rawData, filterState, ACTOR_META) : EMPTY_RESULT,
);

// ─── Derived boolean: are any filters active? ────────────────────────────────

export const selectIsFiltered = createSelector(
  [selectSerializableFilters, selectInitialFilters],
  (f, initial) =>
    f.datasets.length   < initial.datasets.length   ||
    f.types.length      < initial.types.length      ||
    f.actors.length     < initial.actors.length     ||
    f.priorities.length < initial.priorities.length ||
    f.statuses.length   < initial.statuses.length   ||
    !f.heat ||
    f.timeRange !== null,
);
