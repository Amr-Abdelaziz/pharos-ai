'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { STRIKE_ARCS, MISSILE_TRACKS, TARGETS } from '@/data/mapData';

// ─── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  /** Absolute data extent (all events min/max) */
  dataExtent:    [number, number];
  /** Current visible window — what the timeline shows */
  viewExtent:    [number, number];
  onViewExtent:  (ext: [number, number]) => void;
  /** Selected filter range within the view (or null = no filter) */
  timeRange:     [number, number] | null;
  onTimeRange:   (range: [number, number] | null) => void;
};

// ─── Constants ──────────────────────────────────────────────────────────────────

const EVENT_RECORDS = [...STRIKE_ARCS, ...MISSILE_TRACKS, ...TARGETS];
const BUCKETS = 80;

const ZOOM_LEVELS = [
  { label: '24H', ms: 24 * 3600_000 },
  { label: '3D',  ms: 3 * 86400_000 },
  { label: '7D',  ms: 7 * 86400_000 },
  { label: '2W',  ms: 14 * 86400_000 },
  { label: '1M',  ms: 30 * 86400_000 },
  { label: 'ALL', ms: 0 },
] as const;

function fmt(ms: number) {
  const d = new Date(ms);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${mon} ${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MapTimeline({ dataExtent, viewExtent, onViewExtent, timeRange, onTimeRange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | 'range' | null>(null);
  const dragRef = useRef<{ startX: number; startRange: [number, number] } | null>(null);
  const didDragRef = useRef(false);

  const [vMin, vMax] = viewExtent;
  const span = vMax - vMin;
  const rng = timeRange ?? viewExtent;

  // Histogram scoped to the visible extent
  const histogram = useMemo(() => {
    const b = new Array(BUCKETS).fill(0);
    if (span <= 0) return b;
    const step = span / BUCKETS;
    for (const r of EVENT_RECORDS) {
      const t = new Date(r.timestamp).getTime();
      if (t < vMin || t > vMax) continue;
      const i = Math.min(BUCKETS - 1, Math.max(0, Math.floor((t - vMin) / step)));
      b[i]++;
    }
    const mx = Math.max(1, ...b);
    return b.map(v => v / mx);
  }, [vMin, vMax, span]);

  // Tick marks — adapt density to zoom level
  const ticks = useMemo(() => {
    const result: { label: string; pct: number }[] = [];
    const dayMs = 86400_000;
    const hourMs = 3600_000;
    const interval = span <= 2 * dayMs ? 6 * hourMs : span <= 7 * dayMs ? dayMs : span <= 60 * dayMs ? 7 * dayMs : 30 * dayMs;

    const start = new Date(vMin);
    if (interval >= dayMs) start.setUTCHours(0, 0, 0, 0);
    else start.setUTCMinutes(0, 0, 0);

    let t = start.getTime();
    while (t <= vMax) {
      const pct = ((t - vMin) / span) * 100;
      if (pct >= 0 && pct <= 100) {
        const d = new Date(t);
        const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
        const label = interval < dayMs
          ? `${String(d.getUTCHours()).padStart(2, '0')}:00`
          : `${mon} ${d.getUTCDate()}`;
        result.push({ label, pct });
      }
      t += interval;
    }
    return result;
  }, [vMin, vMax, span]);

  const toPct = (ms: number) => ((ms - vMin) / span) * 100;
  const toMs = useCallback((clientX: number) => {
    if (!trackRef.current) return vMin;
    const rect = trackRef.current.getBoundingClientRect();
    return vMin + (Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * span);
  }, [vMin, span]);

  // Which zoom level is currently active?
  const activeZoom = useMemo(() => {
    const dataSpan = dataExtent[1] - dataExtent[0];
    if (Math.abs(span - dataSpan) < 60_000) return 'ALL';
    for (const z of ZOOM_LEVELS) {
      if (z.ms > 0 && Math.abs(span - z.ms) < 60_000) return z.label;
    }
    return null;
  }, [span, dataExtent]);

  const handleZoom = useCallback((ms: number) => {
    if (ms === 0) {
      // ALL — show full data extent, clear selection
      onViewExtent(dataExtent);
      onTimeRange(null);
      return;
    }
    // Zoom to the last N ms from the latest event
    const end = dataExtent[1];
    const start = Math.max(dataExtent[0], end - ms);
    onViewExtent([start, end]);
    onTimeRange(null); // clear selection when zooming
  }, [dataExtent, onViewExtent, onTimeRange]);

  // --- Drag logic ---
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'left' | 'right' | 'range') => {
    e.preventDefault(); e.stopPropagation();
    setDragging(handle);
    dragRef.current = { startX: e.clientX, startRange: [rng[0], rng[1]] };
    didDragRef.current = false;
  }, [rng]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      didDragRef.current = true;
      const ms = toMs(e.clientX);
      if (dragging === 'left') onTimeRange([Math.min(ms, rng[1] - span * 0.005), rng[1]]);
      else if (dragging === 'right') onTimeRange([rng[0], Math.max(ms, rng[0] + span * 0.005)]);
      else if (dragging === 'range' && dragRef.current && trackRef.current) {
        const dMs = ((e.clientX - dragRef.current.startX) / trackRef.current.getBoundingClientRect().width) * span;
        let nL = dragRef.current.startRange[0] + dMs, nR = dragRef.current.startRange[1] + dMs;
        if (nL < vMin) { nR += vMin - nL; nL = vMin; }
        if (nR > vMax) { nL -= nR - vMax; nR = vMax; }
        onTimeRange([nL, nR]);
      }
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, rng, vMin, vMax, span, toMs, onTimeRange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    const ms = toMs(e.clientX);
    const w = span * 0.12;
    onTimeRange([Math.max(vMin, ms - w / 2), Math.min(vMax, ms + w / 2)]);
  }, [toMs, span, vMin, vMax, onTimeRange]);

  const leftPct = toPct(rng[0]);
  const rightPct = toPct(rng[1]);
  const isActive = timeRange !== null;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
      background: 'rgba(28,33,39,0.92)', borderTop: '1px solid var(--bd)',
      padding: '4px 16px 6px', userSelect: 'none',
    }}>
      {/* Header: zoom buttons + selection label */}
      <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
        <div className="flex items-center gap-0.5">
          {ZOOM_LEVELS.map(z => (
            <Button key={z.label} variant="ghost" size="xs" onClick={() => handleZoom(z.ms)}
              className="mono rounded-sm px-1.5 py-0 h-4 text-[8px] font-bold tracking-wider"
              style={{
                border: `1px solid ${activeZoom === z.label ? 'var(--blue)' : 'var(--bd)'}`,
                background: activeZoom === z.label ? 'var(--blue-dim)' : 'transparent',
                color: activeZoom === z.label ? 'var(--blue-l)' : 'var(--t4)',
              }}
            >{z.label}</Button>
          ))}
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <span className="mono text-[9px] text-[var(--t2)]">{fmt(rng[0])} — {fmt(rng[1])}</span>
            <button onClick={() => onTimeRange(null)} className="mono text-[8px] cursor-pointer"
              style={{ color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 2, padding: '0 4px' }}
            >×</button>
          </div>
        )}
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative cursor-crosshair" style={{ height: 28 }} onClick={handleClick}>
        {histogram.map((h, i) => {
          const pL = (i / BUCKETS) * 100;
          const inR = !isActive || (pL >= leftPct - 2 && pL <= rightPct + 2);
          return <div key={i} className="absolute bottom-0" style={{
            left: `${pL}%`, width: `${100 / BUCKETS}%`,
            height: `${Math.max(1, h * 22)}px`,
            background: inR ? 'var(--blue)' : 'rgba(95,107,124,0.15)', opacity: inR ? 0.5 : 0.25,
          }} />;
        })}
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{ left: `${t.pct}%` }}>
            <div style={{ width: 1, height: '100%', background: 'var(--bd)' }} />
            <span className="mono absolute text-[7px] text-[var(--t4)]" style={{ top: 0, left: 3 }}>{t.label}</span>
          </div>
        ))}
        {isActive && <>
          <div className="absolute top-0 bottom-0" style={{ left: 0, width: `${leftPct}%`, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
          <div className="absolute top-0 bottom-0" style={{ left: `${rightPct}%`, right: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
          <div className="absolute top-0 bottom-0 cursor-grab" onMouseDown={e => handleMouseDown(e, 'range')}
            style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%`, borderTop: '2px solid var(--blue)', borderBottom: '2px solid var(--blue)' }} />
          <div className="absolute top-0 bottom-0 cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'left')}
            style={{ left: `${leftPct}%`, width: 6, marginLeft: -3, background: 'var(--blue)', borderRadius: 1, opacity: 0.8 }} />
          <div className="absolute top-0 bottom-0 cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'right')}
            style={{ left: `${rightPct}%`, width: 6, marginLeft: -3, background: 'var(--blue)', borderRadius: 1, opacity: 0.8 }} />
        </>}
      </div>
    </div>
  );
}
