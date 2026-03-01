'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ExternalLink, RefreshCw, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import type { PredictionMarket } from '@/app/api/polymarket/route';
import type { PricePoint }       from '@/app/api/polymarket/chart/route';
import { assignGroup, MARKET_GROUPS, UNCATEGORIZED_GROUP, type MarketGroup } from '@/data/predictionGroups';

/* ─── helpers ─── */
function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase();
}
function probColor(p: number) {
  if (p >= 0.65) return '#23A26D';
  if (p >= 0.50) return '#2D72D2';
  if (p >= 0.35) return '#EC9A3C';
  return '#E76A6E';
}
function probBg(p: number) {
  if (p >= 0.65) return 'rgba(35,162,109,0.12)';
  if (p >= 0.50) return 'rgba(45,114,210,0.12)';
  if (p >= 0.35) return 'rgba(236,154,60,0.12)';
  return 'rgba(231,106,110,0.12)';
}
function getLeadProb(m: PredictionMarket): number {
  const yesIdx = m.outcomes.findIndex(o => o.toUpperCase() === 'YES');
  return yesIdx >= 0 ? (m.prices[yesIdx] ?? 0) : (m.prices[0] ?? 0);
}
function statusLabel(m: PredictionMarket) {
  if (m.closed)  return { label: 'CLOSED',   color: 'var(--t4)',   bg: 'rgba(92,112,128,0.12)', border: 'rgba(92,112,128,0.25)' };
  if (m.active)  return { label: 'LIVE',     color: '#23A26D',     bg: 'rgba(35,162,109,0.12)', border: 'rgba(35,162,109,0.3)'  };
  return           { label: 'RESOLVED', color: 'var(--blue-l)', bg: 'var(--blue-dim)',       border: 'rgba(76,144,240,0.3)'  };
}

/* ─── Price chart (resizable + hover tooltip) ─── */
const MIN_W = 220, MIN_H = 80, MAX_W = 900, MAX_H = 400;
const PAD   = { top: 12, right: 12, bottom: 22, left: 36 };

function PriceChart({ yesTokenId }: { yesTokenId: string }) {
  const [history,  setHistory]  = useState<PricePoint[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [size,     setSize]     = useState({ w: 360, h: 130 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const svgRef     = useRef<SVGSVGElement>(null);
  const resizeRef  = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  /* fetch */
  useEffect(() => {
    if (!yesTokenId) { setLoading(false); setError(true); return; }
    fetch(`/api/polymarket/chart?id=${encodeURIComponent(yesTokenId)}`)
      .then(r => r.json())
      .then((d: { history?: PricePoint[] }) => { setHistory(d.history ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [yesTokenId]);

  /* resize drag */
  const onResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const nw = Math.max(MIN_W, Math.min(MAX_W, resizeRef.current.sw + ev.clientX - resizeRef.current.sx));
      const nh = Math.max(MIN_H, Math.min(MAX_H, resizeRef.current.sh + ev.clientY - resizeRef.current.sy));
      setSize({ w: nw, h: nh });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  /* hover: find nearest point by x */
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || history.length < 2) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pts    = history;
    const minT   = pts[0].t, maxT = pts[pts.length - 1].t;
    const cW     = size.w - PAD.left - PAD.right;
    const ratio  = (mouseX - PAD.left) / cW;
    const tAtX   = minT + ratio * (maxT - minT);
    // binary-search nearest point
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].t < tAtX) lo = mid + 1; else hi = mid;
    }
    const idx = lo > 0 && Math.abs(pts[lo - 1].t - tAtX) < Math.abs(pts[lo].t - tAtX) ? lo - 1 : lo;
    setHoverIdx(idx);
  }, [history, size.w]);

  const { w, h } = size;
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;
  const gradId = `fill-${yesTokenId.slice(-8)}`;

  const placeholder = (msg: string) => (
    <div style={{ width: w, height: h + 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em' }}>PRICE HISTORY</span>
      </div>
      <div style={{ flex: 1, border: '1px solid var(--bd)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.06em' }}>{msg}</span>
      </div>
    </div>
  );

  if (loading) return placeholder('LOADING CHART...');
  if (error || history.length < 2) return placeholder('NO PRICE HISTORY');

  const pts    = history;
  const minT   = pts[0].t, maxT = pts[pts.length - 1].t;
  const lastP  = pts[pts.length - 1].p;
  const firstP = pts[0].p;
  const change = lastP - firstP;
  const color  = probColor(lastP);

  const scaleX = (t: number) => PAD.left + ((t - minT) / (maxT - minT || 1)) * chartW;
  const scaleY = (p: number) => PAD.top  + (1 - p) * chartH;

  const linePts = pts.map(pt => `${scaleX(pt.t).toFixed(1)},${scaleY(pt.p).toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${scaleX(pts[0].t).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    ...pts.map(pt => `L ${scaleX(pt.t).toFixed(1)} ${scaleY(pt.p).toFixed(1)}`),
    `L ${scaleX(pts[pts.length - 1].t).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  /* hover state */
  const hPt    = hoverIdx !== null ? pts[hoverIdx] : null;
  const hX     = hPt ? scaleX(hPt.t) : null;
  const hY     = hPt ? scaleY(hPt.p) : null;
  const hColor = hPt ? probColor(hPt.p) : color;
  const hDate  = hPt ? new Date(hPt.t * 1000) : null;
  const hDelta = hPt ? hPt.p - firstP : null;
  /* tooltip flips when cursor is in right half */
  const tooltipLeft = hX !== null && hX > w / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, userSelect: 'none' }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em' }}>
          PRICE HISTORY
        </span>
        <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, letterSpacing: '0.06em', color: change >= 0 ? '#23A26D' : '#E76A6E' }}>
          {change >= 0 ? '+' : ''}{(change * 100).toFixed(1)}%
        </span>
        {hPt && (
          <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', marginLeft: 4 }}>
            {hDate!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            {' '}
            {hDate!.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {'  '}
            <span style={{ color: hColor, fontWeight: 700 }}>{Math.round(hPt.p * 100)}%</span>
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', opacity: 0.5 }}>
          {pts.length} pts
        </span>
      </div>

      {/* chart + resize wrapper */}
      <div style={{ position: 'relative', width: w, height: h }}>
        <svg
          ref={svgRef}
          width={w}
          height={h}
          style={{ display: 'block', cursor: 'crosshair' }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={`clip-${gradId}`}>
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* chart border */}
          <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH}
            fill="none" stroke="var(--bd)" strokeWidth={0.5} />

          {/* grid lines */}
          {gridLines.map(g => (
            <g key={g}>
              <line x1={PAD.left} y1={scaleY(g)} x2={w - PAD.right} y2={scaleY(g)}
                stroke="var(--bd)" strokeWidth={0.5} strokeDasharray={g === 0 || g === 1 ? 'none' : '3,4'} />
              <text x={PAD.left - 5} y={scaleY(g) + 3.5} fontSize={7} fill="var(--t4)"
                textAnchor="end" fontFamily="SFMono-Regular, Menlo, monospace">
                {Math.round(g * 100)}
              </text>
            </g>
          ))}

          {/* area + line clipped */}
          <g clipPath={`url(#clip-${gradId})`}>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <polyline points={linePts} fill="none" stroke={color} strokeWidth={1.5}
              strokeLinejoin="round" strokeLinecap="round" />
          </g>

          {/* last price dot */}
          {hoverIdx === null && (
            <circle cx={scaleX(pts[pts.length - 1].t)} cy={scaleY(lastP)} r={3}
              fill={color} stroke="var(--bg-2)" strokeWidth={1.5} />
          )}

          {/* bottom axis labels */}
          {[pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]].map((pt, i) => {
            const x = scaleX(pt.t);
            const lbl = new Date(pt.t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
            const anchor = i === 0 ? 'start' : i === 2 ? 'end' : 'middle';
            return (
              <text key={i} x={x} y={h - 5} fontSize={7} fill="var(--t4)"
                textAnchor={anchor} fontFamily="SFMono-Regular, Menlo, monospace">
                {lbl}
              </text>
            );
          })}

          {/* hover crosshair */}
          {hX !== null && hY !== null && (
            <>
              <line x1={hX} y1={PAD.top} x2={hX} y2={PAD.top + chartH}
                stroke="var(--t3)" strokeWidth={1} strokeDasharray="3,3" />
              <line x1={PAD.left} y1={hY} x2={w - PAD.right} y2={hY}
                stroke={hColor} strokeWidth={0.5} strokeDasharray="2,4" opacity={0.5} />
              <circle cx={hX} cy={hY} r={4} fill={hColor} stroke="var(--bg-1)" strokeWidth={2} />
              {/* price callout on y-axis */}
              <rect x={0} y={hY - 7} width={PAD.left - 2} height={14} rx={1}
                fill="var(--bg-2)" stroke={hColor} strokeWidth={0.5} />
              <text x={PAD.left - 5} y={hY + 3.5} fontSize={7} fill={hColor}
                textAnchor="end" fontFamily="SFMono-Regular, Menlo, monospace" fontWeight="bold">
                {Math.round(hPt!.p * 100)}
              </text>
            </>
          )}
        </svg>

        {/* hover tooltip */}
        {hX !== null && hY !== null && hPt && hDate && hDelta !== null && (
          <div style={{
            position: 'absolute',
            top: Math.max(PAD.top, Math.min(h - 80, hY - 40)),
            ...(tooltipLeft
              ? { right: w - hX + 10 }
              : { left: hX + 10 }),
            pointerEvents: 'none',
            background: 'var(--bg-app)',
            border: `1px solid ${hColor}`,
            borderRadius: 2,
            padding: '6px 8px',
            minWidth: 120,
            zIndex: 10,
          }}>
            <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 4 }}>
              {hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase()}
              {'  '}
              {hDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t3)' }}>YES</span>
              <span style={{ fontSize: 16, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: hColor, lineHeight: 1 }}>
                {Math.round(hPt.p * 100)}%
              </span>
            </div>
            <div style={{ marginTop: 4, fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: hDelta >= 0 ? '#23A26D' : '#E76A6E', letterSpacing: '0.04em' }}>
              {hDelta >= 0 ? '▲' : '▼'} {Math.abs(hDelta * 100).toFixed(1)}% from open
            </div>
          </div>
        )}

        {/* resize handle */}
        <div
          onMouseDown={onResizeDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={8} height={8} viewBox="0 0 8 8" fill="none">
            <line x1="2" y1="8" x2="8" y2="2" stroke="var(--t4)" strokeWidth={1.2} />
            <line x1="5" y1="8" x2="8" y2="5" stroke="var(--t4)" strokeWidth={1.2} />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Market Row ─── */
const COL = '36px 1fr 120px 96px 72px 80px 64px 28px';

function MarketRow({ market, rank, isExpanded, onToggle }: {
  market: PredictionMarket;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const prob   = getLeadProb(market);
  const color  = probColor(prob);
  const bg     = probBg(prob);
  const status = statusLabel(market);
  const isBinary = market.outcomes.length === 2;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        style={{
          display: 'grid',
          gridTemplateColumns: COL,
          alignItems: 'center',
          height: 44,
          borderBottom: '1px solid var(--bd)',
          cursor: 'pointer',
          background: isExpanded ? 'var(--bg-2)' : 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'rgba(56,62,71,0.45)'; }}
        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {/* Rank */}
        <div style={{ paddingLeft: 14, fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', fontWeight: 700 }}>
          {rank}
        </div>

        {/* Title */}
        <div style={{ paddingRight: 20, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {market.title}
          </div>
        </div>

        {/* Probability */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ width: `${prob * 100}%`, height: '100%', background: color, borderRadius: 1 }} />
          </div>
          <div style={{
            fontSize: 12, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700,
            color, background: bg, padding: '1px 5px', borderRadius: 2, minWidth: 40, textAlign: 'right',
          }}>
            {Math.round(prob * 100)}%
          </div>
        </div>

        {/* Volume */}
        <div style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t2)', textAlign: 'right', paddingRight: 12 }}>
          {fmtVol(market.volume)}
        </div>

        {/* 24h vol */}
        <div style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Menlo, monospace', color: market.volume24hr > 0 ? '#23A26D' : 'var(--t4)', textAlign: 'right', paddingRight: 12 }}>
          {market.volume24hr > 0 ? fmtVol(market.volume24hr) : '—'}
        </div>

        {/* End date */}
        <div style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t3)', textAlign: 'right', paddingRight: 12 }}>
          {fmtDate(market.endDate)}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 8 }}>
          <span style={{
            padding: '2px 5px', background: status.bg, border: `1px solid ${status.border}`,
            borderRadius: 2, fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace',
            fontWeight: 700, color: status.color, letterSpacing: '0.06em',
          }}>
            {status.label}
          </span>
        </div>

        {/* Chevron */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--t4)' }}>
          <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{
          background: 'var(--bg-2)',
          borderBottom: '1px solid var(--bd)',
          padding: '14px 50px 18px 50px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {/* Price chart */}
          <PriceChart yesTokenId={market.yesTokenId} />

          {/* Description + outcome bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 220 }}>
            {market.description && (
              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.65, maxWidth: 580 }}>
                {market.description}
              </p>
            )}
            {!isBinary && market.outcomes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: 2 }}>
                  OUTCOMES
                </div>
                {market.outcomes.slice(0, 6).map((outcome, i) => {
                  const p = market.prices[i] ?? 0;
                  const c = probColor(p);
                  return (
                    <div key={outcome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t2)', width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {outcome}
                      </span>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: 1, overflow: 'hidden', maxWidth: 180 }}>
                        <div style={{ width: `${p * 100}%`, height: '100%', background: c }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: c, width: 32, textAlign: 'right', flexShrink: 0 }}>
                        {Math.round(p * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: stats + link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 130 }}>
            {[
              { label: 'LIQUIDITY', val: fmtVol(market.liquidity) },
              { label: '7D VOLUME', val: fmtVol(market.volume1wk) },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--t1)' }}>{val}</div>
              </div>
            ))}
            <a
              href={market.polyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                marginTop: 6,
                display: 'flex', alignItems: 'center', gap: 4,
                textDecoration: 'none',
                color: 'var(--blue-l)', fontSize: 9,
                fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700,
                letterSpacing: '0.08em', padding: '4px 8px',
                border: '1px solid rgba(76,144,240,0.3)', borderRadius: 2,
                background: 'rgba(45,114,210,0.08)',
              }}
            >
              <ExternalLink size={10} />
              POLYMARKET ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Group section ─── */
function GroupSection({
  group, markets, expandedId, onToggle, globalRankOffset,
  sortBy,
}: {
  group: MarketGroup;
  markets: PredictionMarket[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  globalRankOffset: number;
  sortBy: 'volume' | 'volume24hr' | 'probability';
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (markets.length === 0) return null;

  const groupVol = markets.reduce((s, m) => s + m.volume, 0);
  const sorted = [...markets].sort((a, b) => {
    if (sortBy === 'volume')      return b.volume - a.volume;
    if (sortBy === 'volume24hr')  return b.volume24hr - a.volume24hr;
    return getLeadProb(b) - getLeadProb(a);
  });

  return (
    <div>
      {/* Group header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCollapsed(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setCollapsed(v => !v)}
        style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          background: group.bg,
          borderBottom: `1px solid ${group.border}`,
          borderLeft: `3px solid ${group.color}`,
          cursor: 'pointer',
          gap: 8,
        }}
      >
        {collapsed
          ? <ChevronRight size={11} style={{ color: group.color, flexShrink: 0 }} />
          : <ChevronDown  size={11} style={{ color: group.color, flexShrink: 0 }} />}
        <span style={{
          fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700,
          color: group.color, letterSpacing: '0.10em',
        }}>
          {group.label}
        </span>
        <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.04em' }}>
          {group.description}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>
            {markets.length} {markets.length === 1 ? 'MARKET' : 'MARKETS'}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t3)', fontWeight: 700 }}>
            {fmtVol(groupVol)} VOL
          </span>
        </div>
      </div>

      {/* Markets */}
      {!collapsed && sorted.map((market, i) => (
        <MarketRow
          key={market.id}
          market={market}
          rank={globalRankOffset + i + 1}
          isExpanded={expandedId === market.id}
          onToggle={() => onToggle(market.id)}
        />
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function PredictionsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [sortBy, setSortBy]   = useState<'volume' | 'volume24hr' | 'probability'>('volume');
  const [showActiveOnly, setShowActiveOnly]  = useState(true);
  const [fetchedAt, setFetchedAt]            = useState('');
  const [isRefreshing, setIsRefreshing]      = useState(false);
  const [expandedId, setExpandedId]          = useState<string | null>(null);

  const fetchMarkets = async () => {
    setLoading(true); setIsRefreshing(true); setError(null);
    try {
      const res  = await fetch('/api/polymarket');
      const data = await res.json() as { markets: PredictionMarket[]; fetchedAt: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMarkets(data.markets);
      setFetchedAt(data.fetchedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchMarkets(); }, []);

  const filtered = useMemo(() => {
    let m = markets;
    if (showActiveOnly) m = m.filter(x => x.active && !x.closed);
    return m;
  }, [markets, showActiveOnly]);

  // Group markets
  const grouped = useMemo(() => {
    const map = new Map<string, PredictionMarket[]>();
    const allGroups = [...MARKET_GROUPS, UNCATEGORIZED_GROUP];
    for (const g of allGroups) map.set(g.id, []);
    for (const m of filtered) {
      const g = assignGroup(m.title);
      map.get(g.id)!.push(m);
    }
    return map;
  }, [filtered]);

  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const totalVol24h = markets.reduce((s, m) => s + m.volume24hr, 0);
  const activeCount = markets.filter(m => m.active && !m.closed).length;
  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const SORT_COLS: { key: typeof sortBy; label: string }[] = [
    { key: 'volume',      label: 'TOTAL VOL' },
    { key: 'volume24hr',  label: '24H VOL'   },
    { key: 'probability', label: 'PROB'       },
  ];

  // For global rank numbers across groups
  const rankOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let total = 0;
    for (const g of [...MARKET_GROUPS, UNCATEGORIZED_GROUP]) {
      offsets[g.id] = total;
      total += (grouped.get(g.id)?.length ?? 0);
    }
    return offsets;
  }, [grouped]);

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-1)',
      overflow: 'hidden',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 44,
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} strokeWidth={2.5} style={{ color: 'var(--blue-l)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 11, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.10em' }}>
            PREDICTION MARKETS
          </span>
          <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 9, color: 'var(--t4)', letterSpacing: '0.06em' }}>
            VIA POLYMARKET
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>MARKETS </span>
            <span style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--t1)' }}>{markets.length}</span>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: '#23A26D', marginLeft: 6 }}>({activeCount} LIVE)</span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>TOTAL VOL </span>
            <span style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: 'var(--t1)' }}>{fmtVol(totalVolume)}</span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>24H VOL </span>
            <span style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700, color: totalVol24h > 0 ? '#23A26D' : 'var(--t4)' }}>{fmtVol(totalVol24h)}</span>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)' }}>{lastUpdated}</span>
          <button
            onClick={fetchMarkets} disabled={loading}
            style={{ background: 'none', border: '1px solid var(--bd)', borderRadius: 2, padding: '4px 6px', cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', opacity: loading ? 0.5 : 1 }}
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Column header ── */}
      <div style={{
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--bd)',
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: COL,
        alignItems: 'center',
        height: 30,
      }}>
        <div />
        <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', paddingLeft: 2 }}>MARKET</div>

        {SORT_COLS.map(col => (
          <button key={col.key} onClick={() => setSortBy(col.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', paddingRight: col.key === 'probability' ? 0 : 12,
            display: 'flex', justifyContent: col.key === 'probability' ? 'flex-start' : 'flex-end', alignItems: 'center',
          }}>
            <span style={{
              fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace',
              fontWeight: sortBy === col.key ? 700 : 400,
              color: sortBy === col.key ? 'var(--blue-l)' : 'var(--t4)',
              letterSpacing: '0.08em',
            }}>
              {col.label}{sortBy === col.key ? ' ▼' : ''}
            </span>
          </button>
        ))}

        <div style={{ fontSize: 8, fontFamily: 'SFMono-Regular, Menlo, monospace', color: 'var(--t4)', letterSpacing: '0.08em', textAlign: 'right', paddingRight: 12 }}>ENDS</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 8 }}>
          <button
            onClick={() => setShowActiveOnly(v => !v)}
            style={{
              padding: '1px 5px',
              background: showActiveOnly ? 'rgba(35,162,109,0.15)' : 'transparent',
              border: `1px solid ${showActiveOnly ? 'rgba(35,162,109,0.4)' : 'var(--bd)'}`,
              borderRadius: 2, cursor: 'pointer', fontSize: 7,
              fontFamily: 'SFMono-Regular, Menlo, monospace', fontWeight: 700,
              color: showActiveOnly ? '#23A26D' : 'var(--t4)',
              letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}
          >
            LIVE ONLY
          </button>
        </div>
        <div />
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--blue)' }} />
            <span style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Menlo, monospace', letterSpacing: '0.1em', color: 'var(--t4)' }}>FETCHING MARKET DATA...</span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--danger)', fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
            ERROR: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--t4)', fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 11, letterSpacing: '0.1em' }}>
            NO MARKETS FOUND
          </div>
        ) : (
          <>
            {[...MARKET_GROUPS, UNCATEGORIZED_GROUP].map(group => (
              <GroupSection
                key={group.id}
                group={group}
                markets={grouped.get(group.id) ?? []}
                expandedId={expandedId}
                onToggle={id => setExpandedId(expandedId === id ? null : id)}
                globalRankOffset={rankOffsets[group.id] ?? 0}
                sortBy={sortBy}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
