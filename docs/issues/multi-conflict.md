# Multi-Conflict Support

## Current State

The app is scoped to a single conflict via the `NEXT_PUBLIC_CONFLICT_ID` environment variable (default: `iran-2026`). Every hook, API route, and data query uses this value to filter data.

## Goal

Native multi-conflict support — the platform should handle multiple conflicts simultaneously without requiring separate deployments.

## Proposed Approach

### Domain-based routing
- **Main domain** defaults to the Iran conflict
- **Subdomains** (e.g. `ukraine.conflicts.app`) load other conflicts
- Conflict ID derived from subdomain at runtime instead of env var

### Cross-conflict navigation
- Events are often intertwined between conflicts (e.g. geopolitical spillover, shared actors)
- Need cross-links between conflicts where relationships exist
- Timeline events could reference related events in other conflicts

### Open Questions
- **"All conflicts" view vs separate conflicts with cross-links?** An aggregated view adds significant complexity but may be valuable for seeing global patterns. Cross-links between separate conflict views is simpler and may be sufficient.
- How to handle actors that appear in multiple conflicts?
- Should the map support viewing multiple conflict regions simultaneously?

## Key Code Areas

| Area | Details |
|------|---------|
| `NEXT_PUBLIC_CONFLICT_ID` usage | All hooks in `src/api/` pass this as a query param |
| API routes | `src/app/api/v1/` — all routes filter by `conflictId` |
| Bootstrap data | `src/api/bootstrap/` — loads conflict-scoped config |
| DB schema | Already has `conflict_id` foreign keys on most tables (Prisma schema) |
| Redux store | `src/store/map-slice.ts` — `loadMapData` uses conflict ID |
| Static constants | `iranActors.ts`, `predictionGroups.ts` — currently Iran-specific, need to generalize or make per-conflict |

## Migration Path

1. Replace env var reads with a runtime conflict resolver (subdomain → conflict ID)
2. Thread the resolved conflict ID through React context instead of importing env var directly
3. Generalize Iran-specific constants into per-conflict DB records
4. Add cross-conflict relationship model to DB schema
5. Build conflict switcher / cross-link UI
