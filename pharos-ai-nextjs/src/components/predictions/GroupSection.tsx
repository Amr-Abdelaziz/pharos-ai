'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import type { PredictionMarket } from '@/app/api/polymarket/route';
import type { MarketGroup } from '@/data/predictionGroups';
import { MarketRow } from './MarketRow';
import { fmtVol, getLeadProb } from './utils';

type Props = {
  group: MarketGroup;
  markets: PredictionMarket[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  globalRankOffset: number;
  sortBy: 'volume' | 'volume24hr' | 'probability';
};

export function GroupSection({ group, markets, expandedId, onToggle, globalRankOffset, sortBy }: Props) {
  const [open, setOpen] = useState(true);
  if (markets.length === 0) return null;

  const groupVol = markets.reduce((s, m) => s + m.volume, 0);
  const sorted   = [...markets].sort((a, b) => {
    if (sortBy === 'volume')     return b.volume - a.volume;
    if (sortBy === 'volume24hr') return b.volume24hr - a.volume24hr;
    return getLeadProb(b) - getLeadProb(a);
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          style={{
            width: '100%', height: 30, borderRadius: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            padding: '0 14px', gap: 8,
            background: group.bg,
            borderBottom: `1px solid ${group.border}`,
            borderLeft: `3px solid ${group.color}`,
          }}
        >
          {open
            ? <ChevronDown  size={11} style={{ color: group.color, flexShrink: 0 }} />
            : <ChevronRight size={11} style={{ color: group.color, flexShrink: 0 }} />}

          <span className="mono" style={{ fontWeight: 700, color: group.color, letterSpacing: '0.10em', fontSize: 9 }}>
            {group.label}
          </span>
          <span className="mono" style={{ color: 'var(--t4)', letterSpacing: '0.04em', fontSize: 9 }}>
            {group.description}
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <span className="mono" style={{ color: 'var(--t4)', fontSize: 9 }}>
              {markets.length} {markets.length === 1 ? 'MARKET' : 'MARKETS'}
            </span>
            <span className="mono" style={{ color: 'var(--t3)', fontWeight: 700, fontSize: 9 }}>
              {fmtVol(groupVol)} VOL
            </span>
          </div>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {sorted.map((market, i) => (
          <MarketRow
            key={market.id}
            market={market}
            rank={globalRankOffset + i + 1}
            isExpanded={expandedId === market.id}
            onToggle={() => onToggle(market.id)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
