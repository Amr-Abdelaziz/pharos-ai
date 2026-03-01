'use client';
import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { PredictionMarket } from '@/app/api/polymarket/route';
import { assignGroup, MARKET_GROUPS, UNCATEGORIZED_GROUP } from '@/data/predictionGroups';
import { GroupSection } from '@/components/predictions/GroupSection';
import { fmtVol, getLeadProb, COL } from '@/components/predictions/utils';

const SORT_OPTS = [
  { key: 'volume',      label: 'TOTAL VOL' },
  { key: 'volume24hr',  label: '24H VOL'   },
  { key: 'probability', label: 'PROB'       },
] as const;

type SortBy = typeof SORT_OPTS[number]['key'];

export default function PredictionsPage() {
  const [markets,        setMarkets]        = useState<PredictionMarket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [sortBy,         setSortBy]         = useState<SortBy>('volume');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [fetchedAt,      setFetchedAt]      = useState('');
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  const fetchMarkets = async (isManual = false) => {
    setLoading(true); setIsRefreshing(true); setError(null);
    try {
      const res  = await fetch('/api/polymarket');
      const data = await res.json() as { markets: PredictionMarket[]; fetchedAt: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMarkets(data.markets);
      setFetchedAt(data.fetchedAt);
      if (isManual) toast.success(`${data.markets.length} markets loaded`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (isManual) toast.error(`Fetch failed: ${msg}`);
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

  const rankOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let total = 0;
    for (const g of [...MARKET_GROUPS, UNCATEGORIZED_GROUP]) {
      offsets[g.id] = total;
      total += (grouped.get(g.id)?.length ?? 0);
    }
    return offsets;
  }, [grouped]);

  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const totalVol24h = markets.reduce((s, m) => s + m.volume24hr, 0);
  const activeCount = markets.filter(m => m.active && !m.closed).length;
  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ height: '100%', background: 'var(--bg-1)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 flex-shrink-0 px-4" style={{ height: 44, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} strokeWidth={2.5} style={{ color: 'var(--blue-l)', flexShrink: 0 }} />
          <span className="section-title">PREDICTION MARKETS</span>
          <span className="label" style={{ color: 'var(--t4)' }}>VIA POLYMARKET</span>
        </div>

        <Separator orientation="vertical" className="h-5" style={{ background: 'var(--bd)' }} />

        {/* Stats */}
        <div className="flex gap-5 items-center">
          <div>
            <span className="label" style={{ color: 'var(--t4)' }}>MARKETS </span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--t1)' }}>{markets.length}</span>
            <span className="mono ml-1.5" style={{ color: 'var(--success)', fontSize: 9 }}>({activeCount} LIVE)</span>
          </div>
          <div>
            <span className="label" style={{ color: 'var(--t4)' }}>TOTAL VOL </span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--t1)' }}>{fmtVol(totalVolume)}</span>
          </div>
          <div>
            <span className="label" style={{ color: 'var(--t4)' }}>24H VOL </span>
            <span className="mono" style={{ fontWeight: 700, color: totalVol24h > 0 ? 'var(--success)' : 'var(--t4)' }}>{fmtVol(totalVol24h)}</span>
          </div>
        </div>

        {/* Refresh + timestamp */}
        <div className="flex items-center gap-2.5 ml-auto">
          <span className="mono" style={{ color: 'var(--t4)', fontSize: 9 }}>{lastUpdated}</span>
          <Button variant="outline" size="icon-sm" onClick={() => fetchMarkets(true)} disabled={loading} style={{ borderColor: 'var(--bd)', background: 'transparent', color: 'var(--t3)' }}>
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </Button>
        </div>
      </div>

      {/* ── Column header ── */}
      <div className="flex-shrink-0" style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)', display: 'grid', gridTemplateColumns: COL, alignItems: 'center', height: 30 }}>
        <div />
        <div className="label pl-0.5" style={{ fontSize: 8 }}>MARKET</div>

        <ToggleGroup type="single" value={sortBy} onValueChange={v => v && setSortBy(v as SortBy)} style={{ display: 'contents' }}>
          {SORT_OPTS.map(col => (
            <ToggleGroupItem
              key={col.key}
              value={col.key}
              className="mono"
              style={{
                background: 'none', border: 'none', height: 30, borderRadius: 0,
                padding: 0, paddingRight: col.key === 'probability' ? 0 : 12,
                display: 'flex', justifyContent: col.key === 'probability' ? 'flex-start' : 'flex-end',
                alignItems: 'center', fontSize: 8, letterSpacing: '0.08em',
                fontWeight: sortBy === col.key ? 700 : 400,
                color: sortBy === col.key ? 'var(--blue-l)' : 'var(--t4)',
              }}
            >
              {col.label}{sortBy === col.key ? ' ▼' : ''}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="label text-right pr-3" style={{ fontSize: 8 }}>ENDS</div>

        <div className="flex justify-end items-center gap-1.5 pr-2">
          <span className="label" style={{ fontSize: 7, color: showActiveOnly ? 'var(--success)' : 'var(--t4)', fontWeight: 700 }}>LIVE</span>
          <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} style={{ transform: 'scale(0.75)', transformOrigin: 'right' }} />
        </div>
        <div />
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '8px 0' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', height: 44, borderBottom: '1px solid var(--bd)', padding: '0 4px', gap: 8 }}>
                <Skeleton style={{ height: 10, width: 20, background: 'var(--bg-3)' }} />
                <Skeleton style={{ height: 12, width: `${60 + (i % 3) * 20}%`, background: 'var(--bg-3)' }} />
                <Skeleton style={{ height: 4, width: '80%', background: 'var(--bg-3)' }} />
                <Skeleton style={{ height: 10, width: 50, background: 'var(--bg-3)', marginLeft: 'auto' }} />
                <Skeleton style={{ height: 10, width: 40, background: 'var(--bg-3)', marginLeft: 'auto' }} />
                <Skeleton style={{ height: 10, width: 50, background: 'var(--bg-3)', marginLeft: 'auto' }} />
                <Skeleton style={{ height: 18, width: 44, background: 'var(--bg-3)', marginLeft: 'auto' }} />
                <div />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive" style={{ background: 'var(--danger-dim)', borderColor: 'rgba(231,106,110,0.3)', color: 'var(--danger)' }}>
              <AlertCircle size={14} />
              <AlertDescription className="mono" style={{ fontSize: 11, color: 'var(--danger)' }}>
                {error}
              </AlertDescription>
            </Alert>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--t4)' }}>
            <span className="label">NO MARKETS FOUND</span>
          </div>
        ) : (
          [...MARKET_GROUPS, UNCATEGORIZED_GROUP].map(group => (
            <GroupSection
              key={group.id}
              group={group}
              markets={grouped.get(group.id) ?? []}
              expandedId={expandedId}
              onToggle={id => setExpandedId(expandedId === id ? null : id)}
              globalRankOffset={rankOffsets[group.id] ?? 0}
              sortBy={sortBy}
            />
          ))
        )}
      </div>
    </div>
  );
}
