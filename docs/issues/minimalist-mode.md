# Minimalist Mode

## Current State

The app uses a dense, dark-mode tactical UI. All data is shown at once with detailed visualizations (progress bars, charts, dense tables).

## Goal

Introduce a "minimalist" mode — lighter, cleaner, less visual noise. Users can choose between the current tactical mode and a simplified view.

## Key Changes

### Light mode support
- Add a light color scheme via CSS custom properties
- Toggle between dark (tactical) and light (minimalist) themes
- Respect `prefers-color-scheme` as default, allow manual override

### Simplified components
- Conflict score: colored number instead of progress bar
- Event feed: condensed list instead of detailed cards
- Map: fewer default layers, cleaner markers
- Dashboard: show summary stats instead of full breakdowns

### Show less data by default
- Progressive disclosure — show headlines, expand for detail
- Collapse secondary panels by default
- Reduce information density on mobile especially

### Settings page
- New settings page or modal for mode selection
- Persist preference (localStorage or user profile if auth exists)
- Options: Tactical (current) / Minimalist / Auto (follow system)

## Key Code Areas

| Area | Details |
|------|---------|
| CSS variables / theming | Root-level custom properties need light variants |
| Dashboard components | `src/features/dashboard/components/` — need simplified alternatives or conditional rendering |
| Shared UI components | Buttons, cards, panels — need theme-aware styling |
| Mobile components | `MobileOverview.tsx` and others — already cramped, minimalist mode helps here |
| Map styling | `src/store/map-slice.ts`, map layer configs — lighter map style option |

## Implementation Path

1. Define CSS custom properties for both themes (dark = tactical, light = minimalist)
2. Add theme context/provider with persistence
3. Build settings UI for mode selection
4. Create simplified component variants for key dashboard widgets
5. Adjust default visibility/density per mode
6. Test across breakpoints — minimalist mode should especially improve mobile
