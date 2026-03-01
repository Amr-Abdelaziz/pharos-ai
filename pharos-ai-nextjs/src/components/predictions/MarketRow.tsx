'use client';
import { useState } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PredictionMarket } from '@/app/api/polymarket/route';
import { PriceChart } from './PriceChart';
import { SubMarketTable } from './SubMarketTable';
import { fmtVol, fmtMarketDate, probColor, probBg, spreadColor, statusLabel, getLeadProb, COL } from './utils';

type Props = {
  market: PredictionMarket;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
};

export function MarketRow({ market, rank, isExpanded, onToggle }: Props) {
  const [selectedSubId, setSelectedSubId] = useState(
    market.yesTokenId
      ? market.subMarkets.find(s => s.yesTokenId === market.yesTokenId)?.id ?? market.subMarkets[0]?.id ?? ''
      : '',
  );

  const isGroup      = market.subMarkets.length > 1;
  const prob         = getLeadProb(market);
  const color        = probColor(prob);
  const bg           = probBg(prob);
  const status       = statusLabel(market);
  const isBinary     = market.outcomes.length === 2;
  const chartTokenId = isGroup
    ? (market.subMarkets.find(s => s.id === selectedSubId)?.yesTokenId ?? market.yesTokenId)
    : market.yesTokenId;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>

      {/* ── Row trigger ── */}
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          style={{
            display: 'grid', gridTemplateColumns: COL, gap: 0,
            width: '100%', height: 44, padding: 0, borderRadius: 0,
            borderBottom: '1px solid var(--bd)',
            background: isExpanded ? 'var(--bg-2)' : 'transparent',
          }}
        >
          {/* Rank */}
          <span className="mono flex items-center pl-3.5" style={{ color: 'var(--t4)', fontWeight: 700 }}>
            {rank}
          </span>

          {/* Title + group count badge */}
          <div className="flex items-center gap-2 overflow-hidden pr-5">
            <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>
              {market.title}
            </span>
            {isGroup && (
              <Badge variant="outline" style={{ flexShrink: 0, fontSize: 8, padding: '1px 5px', color: 'var(--blue-l)', borderColor: 'rgba(76,144,240,0.25)', background: 'var(--blue-dim)' }}>
                {market.subMarkets.length}
              </Badge>
            )}
          </div>

          {/* Probability bar + value */}
          <div className="flex items-center gap-2 pr-3">
            <Progress value={prob * 100} className="flex-1 h-1 rounded-sm" style={{ background: 'var(--bg-3)' }} indicatorStyle={{ background: color }} />
            <span className="mono" style={{ fontWeight: 700, color, background: bg, padding: '1px 5px', borderRadius: 2, minWidth: 40, textAlign: 'right' }}>
              {Math.round(prob * 100)}%
            </span>
          </div>

          {/* Total volume */}
          <span className="mono text-right pr-3" style={{ color: 'var(--t2)' }}>
            {fmtVol(market.volume)}
          </span>

          {/* 24h volume */}
          <span className="mono text-right pr-3" style={{ color: market.volume24hr > 0 ? 'var(--success)' : 'var(--t4)' }}>
            {market.volume24hr > 0 ? fmtVol(market.volume24hr) : '—'}
          </span>

          {/* End date */}
          <span className="mono text-right pr-3" style={{ fontSize: 10, color: 'var(--t3)' }}>
            {fmtMarketDate(market.endDate)}
          </span>

          {/* Status badge */}
          <div className="flex justify-end pr-2">
            <Badge variant="outline" style={{ fontSize: 8, padding: '1px 5px', color: status.color, borderColor: status.border, background: status.bg, letterSpacing: '0.06em' }}>
              {status.label}
            </Badge>
          </div>

          {/* Expand chevron */}
          <div className="flex justify-center items-center" style={{ color: 'var(--t4)' }}>
            <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </div>
        </Button>
      </CollapsibleTrigger>

      {/* ── Expanded detail panel ── */}
      <CollapsibleContent>
        <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--bd)', padding: '14px 50px 18px' }}>
          <div className="flex gap-7 items-start flex-wrap">

            {/* Chart */}
            <div style={{ flexShrink: 0 }}>
              {isGroup && (
                <div className="label mb-1.5">
                  CHART: {market.subMarkets.find(s => s.id === selectedSubId)?.groupItemTitle ?? '—'}
                </div>
              )}
              <PriceChart yesTokenId={chartTokenId} />
            </div>

            {/* Description + outcomes */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[200px]">
              {market.description && (
                <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.7, maxWidth: 600 }}>{market.description}</p>
              )}
              {!isBinary && market.outcomes.length > 0 && (
                <OutcomeList outcomes={market.outcomes} prices={market.prices} />
              )}
            </div>

            {/* Order book + stats */}
            <div className="flex flex-col gap-2.5 items-end" style={{ minWidth: 160 }}>
              <OrderBook market={market} />
              <StatGrid market={market} />
              {market.startDate && (
                <div className="text-right">
                  <div className="label">OPENED</div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>{fmtMarketDate(market.startDate)}</span>
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--blue-l)', borderColor: 'rgba(76,144,240,0.3)', background: 'var(--blue-dim)' }}>
                <a href={market.polyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={10} /> POLYMARKET ↗
                </a>
              </Button>
            </div>
          </div>

          {/* Sub-markets */}
          {isGroup && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
              <div className="label mb-1.5">
                {market.subMarkets.length} SUB-MARKETS — CLICK ROW TO VIEW CHART
              </div>
              <SubMarketTable subMarkets={market.subMarkets} selectedId={selectedSubId} onSelect={setSelectedSubId} />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Private sub-components ────────────────────────────────────────────────────

function OutcomeList({ outcomes, prices }: { outcomes: string[]; prices: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 400 }}>
      <div className="label">OUTCOMES</div>
      {outcomes.slice(0, 6).map((outcome, i) => {
        const p = prices[i] ?? 0;
        const c = p >= 0.65 ? 'var(--success)' : p >= 0.5 ? 'var(--blue)' : p >= 0.35 ? 'var(--warning)' : 'var(--danger)';
        return (
          <div key={outcome} className="flex items-center gap-2">
            <span className="mono truncate" style={{ fontSize: 10, color: 'var(--t2)', width: 150, flexShrink: 0 }}>{outcome}</span>
            <Progress value={p * 100} className="flex-1 h-px" style={{ maxWidth: 180, background: 'var(--bg-3)' }} indicatorStyle={{ background: c }} />
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: c, width: 32, textAlign: 'right', flexShrink: 0 }}>
              {Math.round(p * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderBook({ market }: { market: PredictionMarket }) {
  const { spreadColor: sc } = { spreadColor };
  const entries = [
    { label: 'BID',    val: market.bestBid  > 0 ? `${Math.round(market.bestBid * 100)}¢` : '—', color: 'var(--success)' },
    { label: 'ASK',    val: market.bestAsk  > 0 ? `${Math.round(market.bestAsk * 100)}¢` : '—', color: 'var(--danger)'  },
    { label: 'SPREAD', val: market.spread   > 0 ? `${(market.spread * 100).toFixed(1)}¢`  : '—', color: spreadColor(market.spread) },
  ];
  void sc; // used inline above
  return (
    <div className="text-right w-full">
      <div className="label mb-1">ORDER BOOK</div>
      <div className="flex gap-2.5 justify-end">
        {entries.map(({ label, val, color }) => (
          <div key={label} className="text-right">
            <div className="label" style={{ fontSize: 7 }}>{label}</div>
            <span className="mono" style={{ fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatGrid({ market }: { market: PredictionMarket }) {
  const rows = [
    { label: 'LIQUIDITY',   val: fmtVol(market.liquidity)  },
    { label: '24H VOL',     val: fmtVol(market.volume24hr) },
    { label: '7D VOL',      val: fmtVol(market.volume1wk)  },
    { label: '1MO VOL',     val: fmtVol(market.volume1mo)  },
    ...(market.openInterest > 0 ? [{ label: 'OPEN INT', val: fmtVol(market.openInterest) }] : []),
    { label: 'COMPETITIVE', val: `${(market.competitive * 100).toFixed(0)}%` },
  ];
  return (
    <div className="grid gap-x-4 gap-y-1 w-full" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {rows.map(({ label, val }) => (
        <div key={label} className="text-right">
          <div className="label" style={{ fontSize: 7 }}>{label}</div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>{val}</span>
        </div>
      ))}
    </div>
  );
}
