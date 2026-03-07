# PHAROS — Frontend Codex

> One decision, one way.  
> If you're wondering which of two valid approaches to use — the answer is in here.  
> If it's not — add it before writing the code.

This document exists because AI tools produce working code that drifts over time: the same problem solved three different ways across thirty files. Every rule here kills a specific drift pattern observed in this codebase.

---

## Table of Contents

1. [Styling](#1-styling)
2. [Tailwind Usage](#2-tailwind-usage)
3. [Interactive Elements](#3-interactive-elements)
4. [Utility Functions](#4-utility-functions)
5. [Component Rules](#5-component-rules)
6. [shadcn Usage](#6-shadcn-usage)
7. [State & Logic Location](#7-state--logic-location)
8. [Naming Conventions](#8-naming-conventions)
9. [Import Order](#9-import-order)
10. [Comments](#10-comments)
11. [Hover styles](#11-hover-styles)
12. [Types](#12-types)
13. [Inline components](#13-inline-components)

---

## 1. Styling

### 1.1 When to use `style={{}}` vs `className`

**Rule:** `className` (Tailwind utilities) for static layout, spacing, and typography.  
`style={{}}` **only** for values that are computed at runtime from data.

If the value is the same every time the component renders — it belongs in `className`.  
If the value depends on a variable (a probability, a colour from data, a percentage from state) — it goes in `style`.

```tsx
// ❌ Wrong — static values in style={{}}
<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>

// ✅ Correct — static layout in className
<div className="flex items-center gap-2 px-3 py-1.5">

// ✅ Correct — data-driven value in style={{}}
<div
  className="flex items-center gap-2 px-3 py-1.5"
  style={{ borderLeft: `3px solid ${severityColor}` }}
>
```

```tsx
// ❌ Wrong — static colour in style={{}}
<span style={{ color: 'var(--t4)', fontSize: 10 }}>LABEL</span>

// ✅ Correct — use the CSS class or Tailwind
<span className="mono text-[var(--t4)] text-[10px]">LABEL</span>
// or use the existing .label / .mono / .section-title class
<span className="label">LABEL</span>
```

---

### 1.2 Design tokens — always `var(--token)`, never hex literals

**Rule:** Never write a hex colour literal inside a component file.  
Hex values are defined **once** in `globals.css`. Everywhere else uses the CSS variable.

The only exception: computed rgba with opacity not covered by a dim variant. Even then, use the token inside rgba().

```tsx
// ❌ Wrong — hex literal in component
<div style={{ background: '#1C2127', borderColor: '#383E47', color: '#E76A6E' }}>

// ✅ Correct — CSS tokens
<div style={{ background: 'var(--bg-app)', borderColor: 'var(--bd)', color: 'var(--danger)' }}>

// ❌ Wrong — hex literal in computed rgba
<div style={{ background: 'rgba(231, 106, 110, 0.12)' }}>

// ✅ Correct — use the dim variant or compose from the token
<div style={{ background: 'var(--danger-dim)' }}>
```

**Full token reference:**

| Token | Value | Use for |
|---|---|---|
| `--bg-app` | `#1C2127` | App shell, deepest background |
| `--bg-1` | `#252A31` | Main panel / page background |
| `--bg-2` | `#2F343C` | Elevated: card bg, panel headers |
| `--bg-3` | `#383E47` | Hover state background |
| `--bg-sel` | `#2C3A54` | Selected state (blue-tinted) |
| `--bd` | `#383E47` | Standard border |
| `--bd-s` | `#2F343C` | Subtle separator |
| `--t1` | `#F5F8FA` | Primary text |
| `--t2` | `#ABB3BF` | Secondary text |
| `--t3` | `#8F99A8` | Muted text |
| `--t4` | `#5F6B7C` | Disabled / very muted text |
| `--blue` | `#2D72D2` | Primary blue |
| `--blue-l` | `#4C90F0` | Light blue / info accent |
| `--blue-dim` | `rgba(45,114,210,0.15)` | Blue tinted background |
| `--danger` | `#E76A6E` | Critical severity / error |
| `--warning` | `#EC9A3C` | High severity / warning |
| `--success` | `#23A26D` | Verified / active / positive |
| `--info` | `#4C90F0` | Standard severity / info |
| `--cyber` | `#A28BE0` | Cyber operations accent |
| `--danger-dim` | `rgba(231,106,110,0.12)` | Critical background tint |
| `--warning-dim` | `rgba(236,154,60,0.12)` | High background tint |
| `--success-dim` | `rgba(35,162,109,0.12)` | Positive background tint |
| `--info-dim` | `rgba(76,144,240,0.12)` | Info background tint |

---

### 1.3 The monospace font — never write the string

**Rule:** Never write `'SFMono-Regular, Menlo, monospace'` inside a component.  
Use the CSS class `mono` (defined in `globals.css`) or the Tailwind utility `font-mono`.

```tsx
// ❌ Wrong
<span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
  {value}
</span>

// ✅ Correct — CSS class
<span className="mono">{value}</span>

// ✅ Correct — when you also need a style override
<span className="mono" style={{ color: 'var(--blue-l)' }}>{value}</span>

// ✅ Correct — Tailwind
<span className="font-mono text-[11px]">{value}</span>
```

The same rule applies to `letterSpacing`. Do not write `letterSpacing: '0.08em'` inline.  
It belongs in a CSS class or a Tailwind utility.

---

### 1.4 Existing CSS classes — use them

`globals.css` already defines the following. Use them instead of recreating inline:

| Class | What it applies |
|---|---|
| `.label` | 10px, 600 weight, 0.08em spacing, uppercase, `--t3` |
| `.mono` | SFMono, 11px, `--t2`, −0.01em spacing |
| `.section-title` | 11px, 700 weight, 0.03em spacing, uppercase, `--t1` |
| `.panel-header` | flex, items-center, 36px height, `--bg-2`, bottom border |
| `.panel-body` | flex: 1, overflow-y: auto |
| `.card` | `--bg-2` background, `--bd` border |
| `.card-header` | padding, bottom border, flex |
| `.card-body` | padding |
| `.card-footer` | padding, top border, flex |
| `.dot` | 6px circle — combine with `.dot-danger`, `.dot-warning`, etc. |
| `.sev` | base severity pill — combine with `.sev-crit`, `.sev-high`, `.sev-std` |
| `.nav-item` | navigation tab styling |
| `.bar-track` / `.bar-fill` | thin progress bar |

```tsx
// ❌ Wrong — reinventing what already exists
<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 36, background: 'var(--bg-2)', borderBottom: '1px solid var(--bd)' }}>

// ✅ Correct
<div className="panel-header">
```

---

## 2. Tailwind Usage

### 2.1 Use theme variables, not Tailwind colour names

**Rule:** Use `text-[var(--token)]`, `bg-[var(--token)]` rather than Tailwind colour names like `text-blue-500`, `bg-red-400`.

Pharos has its own colour system in CSS variables. Tailwind's built-in palette (`blue-500`, `gray-800`, `red-400`) is not part of that system. Mixing them creates two parallel colour systems and breaks dark-mode token consistency.

96% of colour usage should go through Pharos tokens. The 4% exception is for Tailwind's semantic utility classes that shadow-map correctly through the shadcn bridge (`bg-background`, `text-foreground`, `border`, `text-muted-foreground`) — which you get for free when using shadcn components.

```tsx
// ❌ Wrong — Tailwind colour palette
<span className="text-blue-400 bg-gray-800">
<div className="border-red-500 text-red-400">

// ✅ Correct — Pharos tokens via arbitrary value
<span className="text-[var(--blue-l)] bg-[var(--bg-2)]">
<div className="border-[var(--danger)] text-[var(--danger)]">

// ✅ Also correct — shadcn semantic classes (these resolve through the bridge)
<span className="text-muted-foreground bg-background">
```

### 2.2 Tailwind for layout, never for magic numbers

Use Tailwind's spacing scale (`p-3`, `gap-2`, `mt-4`) for standard spacing.  
If you find yourself writing `p-[7px]` or `gap-[13px]`, consider whether the standard scale (`p-2` = 8px, `gap-3` = 12px) is close enough.  
Arbitrary pixel values in Tailwind (`px-[13px]`) defeat the purpose — they're no better than `style={{ padding: 13 }}`.

```tsx
// ❌ Arbitrary Tailwind that gains nothing over style={{}}
<div className="px-[13px] py-[7px] gap-[9px]">

// ✅ Tailwind standard scale
<div className="px-3 py-1.5 gap-2">

// ✅ Or use existing CSS class
<div className="card-body">
```

---

## 3. Interactive Elements

### 3.1 One primitive — shadcn `<Button>`

**Rule:** Every clickable non-link element is a shadcn `<Button>`.  
`role="button"` with manual `tabIndex` and `onKeyDown` is **banned** except inside third-party render constraints (e.g. DeckGL, where you cannot control the element type).

```tsx
// ❌ Wrong — manual role + keyboard handler
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={e => e.key === 'Enter' && handleClick()}
  style={{ cursor: 'pointer', ... }}
>

// ✅ Correct — shadcn Button
<Button variant="ghost" onClick={handleClick}>
```

### 3.2 Which variant for which context

| Context | Variant | Size |
|---|---|---|
| Clickable list row (full width) | `ghost` | default or omit |
| Toolbar / filter action | `outline` | `sm` |
| Icon-only button | `outline` | `icon` or `icon-sm` |
| Primary action (save, submit) | `default` | default |
| Destructive action | `destructive` | default |
| Link rendered as button | `ghost` + `asChild` | — |

```tsx
// Clickable list row — override display for grid layout via style
<Button
  variant="ghost"
  style={{ display: 'grid', gridTemplateColumns: '1fr 60px 24px', width: '100%', height: 'auto', borderRadius: 0 }}
  onClick={handleSelect}
>

// Icon button
<Button variant="outline" size="icon-sm" onClick={handleRefresh}>
  <RefreshCw size={12} />
</Button>

// Link as button
<Button variant="ghost" size="sm" asChild>
  <a href={url} target="_blank" rel="noopener noreferrer">
    <ExternalLink size={12} /> Open ↗
  </a>
</Button>
```

### 3.3 Links vs Buttons

| Element | Use when |
|---|---|
| `<Link href="...">` | Navigation within the app (Next.js router) |
| `<a href="..." target="_blank">` | External URLs — always with `rel="noopener noreferrer"` |
| `<Button>` | Any in-page interaction that is not navigation |

Never use `<a>` for in-app navigation. Never use `<Button>` for external links (use `asChild`).

---

## 4. Utility Functions

### 4.1 No local redeclarations

**Rule:** If a utility function exists in `src/lib/`, import it. Do not redefine it locally.

Currently defined in **`src/lib/format.ts`** (single source of truth):

```ts
fmtDate(ts: string): string   // "2026-03-01"
fmtTime(ts: string): string   // "14:32"
ago(ts: string): string       // "4h", "2d"
```

```tsx
// ❌ Wrong — local redeclaration inside a component or page
function fmtDate(ts: string) { return new Date(ts).toISOString().slice(0, 10); }

// ✅ Correct
import { fmtDate } from '@/lib/format';
```

If you need a new utility that would be used in more than one file — add it to `src/lib/format.ts` (or an appropriate lib file). Do not write it inline.

### 4.2 Scoped utilities are fine

Utilities that are specific to one feature and not reused elsewhere can live co-located:

```
src/components/predictions/utils.ts  ← probColor, probBg, spreadColor, statusLabel
```

This is correct. The rule against redeclaration only applies to truly shared utilities like date formatting.

---

## 5. Component Rules

### 5.1 File length — 150 lines hard limit

If a component file exceeds ~150 lines, it must be split.  
**How to split:**
- Sub-components used only by the parent → same directory, separate file
- Logic → custom hook in the same directory or `src/hooks/`
- Static data → `src/data/` or a `constants.ts` file alongside the component

```
// ❌ Wrong — 218-line MarketRow.tsx with sub-components and logic inline
// ✅ Correct split:
components/predictions/
  MarketRow.tsx          ← rendering only, ~80 lines
  MarketRowDetail.tsx    ← expanded detail panel
  OrderBook.tsx          ← order book widget
  OutcomeList.tsx        ← outcome probability bars
```

### 5.2 One exported component per file

A file may contain one primary export and small private sub-components (under ~30 lines) used only in that file. Private sub-components go above the main component, not below.

```tsx
// ✅ Correct — private sub-component above the export
function EngStat({ icon, val }: { icon: React.ReactNode; val: string }) {
  return (
    <div className="flex items-center gap-1 text-[var(--t4)]">
      {icon}
      <span className="mono">{val}</span>
    </div>
  );
}

export default function XPostCard({ post }: Props) { ... }
```

If the sub-component grows beyond 30 lines or is used in a second file — it becomes its own file.

### 5.3 No inline component definitions inside page files

Page files (`app/dashboard/X/page.tsx`) are orchestrators. They manage state and compose components. They do not define components.

```tsx
// ❌ Wrong — component defined inside page file
export default function SignalsPage() { ... }

function SectionHeader({ label, count, color }: ...) {  // ← belongs in components/
  return <div>...</div>;
}

// ✅ Correct — imported from components/
import { SectionHeader } from '@/components/signals/SectionHeader';
export default function SignalsPage() { ... }
```

### 5.4 No raw HTML strings

Template literals that generate HTML are banned. This includes DeckGL's `getTooltip` returning HTML strings.

```tsx
// ❌ Wrong — raw HTML string with inline styles
return {
  html: `<div style="font-weight:700;color:#E8E8E8">${d.name}</div>`,
};

// ✅ Correct — typed data object (render in a React component)
return { title: d.name, type: d.type, severity: d.severity };
// Then consume in a <TooltipContent /> component
```

Exception: when a third-party API (DeckGL tooltip) requires an HTML string and there is no React alternative, the HTML must use CSS variables and must not contain hex literals.

---

## 6. shadcn Usage

### 6.1 Never modify shadcn component internals for styling

Files in `src/components/ui/` are shadcn-managed. The only allowed modifications are **prop extensions** (adding a new prop with a clear type), not style changes via className overrides.

```tsx
// ✅ Allowed — extending Progress with indicatorStyle prop
function Progress({ indicatorStyle, ...props }) {
  return (
    <ProgressPrimitive.Indicator style={{ ...indicatorStyle }} />
  );
}

// ❌ Wrong — reaching into shadcn internals to override styling
// (modifying the Tailwind classes on the Indicator itself)
```

### 6.2 Custom styled variants → wrapper in `components/shared/`

If you need a consistently-styled shadcn component variant across the app, create a wrapper in `components/shared/`. Do not re-style inline at every usage site.

```tsx
// ❌ Wrong — same Badge style spelled out at 12 different usage sites
<Badge variant="outline" style={{ fontSize: 7, padding: '1px 4px', color: st.color, borderColor: st.border, background: st.bg }}>

// ✅ Correct — create StatusBadge in components/shared/
// components/shared/StatusBadge.tsx
export function StatusBadge({ status }: { status: MarketStatus }) {
  const s = statusLabel(status);
  return (
    <Badge variant="outline" style={{ fontSize: 7, padding: '1px 4px', color: s.color, borderColor: s.border, background: s.bg }}>
      {s.label}
    </Badge>
  );
}
```

### 6.3 Import paths

shadcn components are always imported from `@/components/ui/X`. Never use relative imports.

```tsx
// ❌ Wrong
import { Button } from '../../ui/button';
import { Button } from '../ui/button';

// ✅ Correct
import { Button } from '@/components/ui/button';
```

### 6.4 shadcn semantic Tailwind classes are allowed

The shadcn/Tailwind bridge in `globals.css` maps Pharos tokens to shadcn's expected CSS variable names. Classes like `bg-background`, `text-foreground`, `text-muted-foreground`, `border` are allowed and resolve correctly through this bridge. These are the 4% exception to the no-Tailwind-colour-names rule.

```tsx
// ✅ These are fine — they resolve through the Pharos token bridge
<div className="bg-background border text-foreground">
<span className="text-muted-foreground">
```

---

## 7. State & Logic Location

### 7.1 Decision tree — where does this code live?

```
Is it UI-only state (open/closed, hover, local toggle)?
  → Inside the component that owns it. No prop drilling.

Is it shared state across siblings on the same page?
  → In the page file, passed as props down to components.

Is it async data fetching?
  → Custom hook: src/hooks/use-X.ts
  → Never inline fetch() inside a page or component body.

Is it a business logic function (formatting, grouping, filtering)?
  → src/lib/ utility file. Pure function. No React.

Is it feature-specific logic used by one component tree?
  → Co-located utils file (e.g. components/predictions/utils.ts)
```

### 7.2 Custom hooks — when and where

Any `useEffect` + `useState` combination for data fetching becomes a hook.

```tsx
// ❌ Wrong — fetch logic inline in page
export default function PredictionsPage() {
  const [markets, setMarkets] = useState([]);
  useEffect(() => { fetch('/api/...').then(...) }, []);
  ...
}

// ✅ Correct — extracted to hook
// src/hooks/usePredictions.ts
export function usePredictions() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  ...
  return { markets, loading, error, refetch };
}

// page.tsx
export default function PredictionsPage() {
  const { markets, loading, error, refetch } = usePredictions();
  ...
}
```

### 7.3 Pages are orchestrators only

A page file should contain: imports, one state-declaration block (using hooks), one return with layout + component composition. That's it.

Acceptable page file size: **under 80 lines**.

---

## 8. Naming Conventions

### 8.1 Files

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `EventLog.tsx`, `SectionHeader.tsx` |
| Hook file | `use-` + kebab | `use-predictions.ts`, `use-map-state.ts` |
| Utility file | kebab | `format.ts`, `tokens.ts` |
| Data file | kebab | `iranEvents.ts`, `predictionGroups.ts` |
| Page file | always `page.tsx` | Next.js convention |

### 8.2 Identifiers

| Thing | Convention | Example |
|---|---|---|
| Component | PascalCase | `EventLog`, `SectionHeader` |
| Module-level constant | SCREAMING_SNAKE | `SORT_OPTS`, `CATEGORY_COLORS`, `MONO` |
| Type / interface | PascalCase | `IntelEvent`, `MarketGroup` |
| Prop type | `type Props = { ... }` | never `interface Props` |
| Hook | `use` prefix | `usePredictions`, `useMapState` |
| Event handler prop | `on` prefix | `onSelect`, `onToggle`, `onClose` |
| Event handler implementation | `handle` prefix | `handleSelect`, `handleToggle` |
| Boolean prop | `is` / `has` prefix | `isExpanded`, `hasError`, `isLoading` |

```tsx
// ❌ Wrong
const mono = 'SFMono-Regular, Menlo, monospace';  // should be SCREAMING_SNAKE or not exist at all
interface Props { ... }                            // use type
const click = () => ...;                           // should be handleClick
<Comp selected={...} />                            // should be isSelected

// ✅ Correct
const MONO_FONT = 'SFMono-Regular, Menlo, monospace';  // or better: don't define it, use .mono class
type Props = { ... };
const handleClick = () => ...;
<Comp isSelected={...} />
```

### 8.3 Props — `type` not `interface`

```tsx
// ❌ Wrong
interface EventLogProps {
  events: IntelEvent[];
  selectedId: string | null;
}

// ✅ Correct
type Props = {
  events: IntelEvent[];
  selectedId: string | null;
};
```

---

## 9. Import Order

Imports in every file follow this order, separated by blank lines. ESLint import plugin enforces this automatically.

```tsx
// 1. React
import { useState, useMemo, useCallback } from 'react';

// 2. Next.js
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// 3. Third-party libraries
import { ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// 4. shadcn UI primitives
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// 5. Local components
import { EventLog } from '@/components/feed/EventLog';
import { SectionHeader } from '@/components/signals/SectionHeader';

// 6. Local lib / hooks
import { fmtDate, fmtTime } from '@/lib/format';
import { usePredictions } from '@/hooks/use-predictions';

// 7. Data
import { EVENTS } from '@/data/iranEvents';
import { MARKET_GROUPS } from '@/data/predictionGroups';

// 8. Types (always last, always `import type`)
import type { IntelEvent } from '@/data/iranEvents';
import type { PredictionMarket } from '@/app/api/polymarket/route';
```

---

## 10. Comments

**Rule:** Write comments only to explain non-obvious intent, tricky algorithms, or CODEX exceptions (e.g. SVG font).
Never write comments that restate what the code does.

```tsx
// ❌ Wrong — restates code
// Map over actors and render each one
{ACTORS.map(actor => <ActorRow key={actor.id} actor={actor} />)}

// ✅ Correct — only comment when explaining WHY, not WHAT
// probColor() uses log scale so low probabilities still show meaningful colour
const color = probColor(prob);
```

---

## 11. Hover styles

**Rule:** Use Tailwind `hover:` classes for hover effects. Never use `onMouseEnter`/`onMouseLeave` to mutate `.style` directly.

```tsx
// ❌ Wrong — JS hover
<div
  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'}
  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
>

// ✅ Correct — Tailwind hover
<div className="hover:bg-[var(--bg-3)] transition-colors">
```

---

## 12. Types

**Rule:** All domain types and interfaces live in `src/types/domain.ts`. Data files (`src/data/`) contain only data — no `export type` or `export interface`. Component files never define domain types.

Exception: local-only prop interfaces (e.g. `interface Props { ... }`) stay in the component file.

---

## 13. Inline components

**Rule:** Never define a named function component inside a page file. Extract it to a named file in the relevant feature folder.

```tsx
// ❌ Wrong — component defined inside page
function CasChip({ label, val, color }: ...) { ... }
export default function OverviewPage() { ... }

// ✅ Correct — CasChip lives in src/components/overview/CasChip.tsx
import { CasChip } from '@/components/overview/CasChip';
```

---

## Quick Reference — The Decision Table

When you find yourself choosing between two approaches, look it up here.

| Decision | ✅ Do this | ❌ Not this |
|---|---|---|
| Static layout | `className="flex gap-2 p-3"` | `style={{ display:'flex', gap:8, padding:'6px 12px' }}` |
| Colour value | `var(--danger)` | `#E76A6E` |
| Monospace text | `className="mono"` | `style={{ fontFamily:'SFMono-Regular...' }}` |
| Tailwind colour | `text-[var(--blue-l)]` | `text-blue-400` |
| Clickable row | `<Button variant="ghost">` | `<div role="button" tabIndex={0}>` |
| External link | `<Button asChild><a target="_blank">` | `<button onClick={() => window.open(...)}` |
| Date formatter | `import { fmtDate } from '@/lib/format'` | local `function fmtDate() { ... }` |
| Fetch logic | `const { data } = useX()` hook | `useEffect(() => fetch(...))` in page |
| Component in page | import from `components/` | define inline in `page.tsx` |
| Props type | `type Props = { ... }` | `interface Props { ... }` |
| Boolean prop name | `isExpanded` | `expanded` / `open` (inconsistent) |
| shadcn import | `@/components/ui/button` | `../../ui/button` |
| Handler prop | `onSelect` | `selectHandler` / `handleSelect` (on props) |
