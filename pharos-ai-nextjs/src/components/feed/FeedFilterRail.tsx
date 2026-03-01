'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterBlock, CheckboxRow } from '@/components/shared/FilterControls';
import type { Severity, EventType } from '@/data/iranEvents';

export const ALL_TYPES: EventType[] = ['MILITARY', 'DIPLOMATIC', 'INTELLIGENCE', 'ECONOMIC', 'HUMANITARIAN', 'POLITICAL'];

const SEV_C: Record<Severity, string> = {
  CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', STANDARD: 'var(--info)',
};
const TYPE_C: Record<EventType, string> = {
  MILITARY: 'var(--danger)', DIPLOMATIC: 'var(--info)', INTELLIGENCE: 'var(--cyber)',
  ECONOMIC: 'var(--warning)', HUMANITARIAN: 'var(--success)', POLITICAL: 'var(--t2)',
};

interface Props {
  sevFilter: Record<Severity, boolean>;
  typeFilter: Record<EventType, boolean>;
  verOnly: boolean;
  totalFiltered: number;
  onSevChange: (s: Severity, v: boolean) => void;
  onTypeChange: (t: EventType, v: boolean) => void;
  onVerChange: (v: boolean) => void;
}

export function FeedFilterRail({
  sevFilter, typeFilter, verOnly, totalFiltered,
  onSevChange, onTypeChange, onVerChange,
}: Props) {
  return (
    <div className="w-40 min-w-40 shrink-0 border-r border-[var(--bd)] flex flex-col overflow-hidden">
      <div className="panel-header">
        <span className="section-title">Filters</span>
      </div>
      <ScrollArea className="flex-1">
        <FilterBlock label="SEVERITY">
          {(['CRITICAL', 'HIGH', 'STANDARD'] as Severity[]).map(s => (
            <CheckboxRow key={s} label={s} color={SEV_C[s]}
              checked={sevFilter[s]} onChange={v => onSevChange(s, v)} />
          ))}
        </FilterBlock>
        <FilterBlock label="VERIFIED">
          <CheckboxRow label="ONLY VERIFIED" color="var(--success)"
            checked={verOnly} onChange={onVerChange} />
        </FilterBlock>
        <FilterBlock label="EVENT TYPE">
          {ALL_TYPES.map(t => (
            <CheckboxRow key={t} label={t} color={TYPE_C[t]}
              checked={typeFilter[t]} onChange={v => onTypeChange(t, v)} />
          ))}
        </FilterBlock>
      </ScrollArea>
      <div className="px-3 py-2 border-t border-[var(--bd)] shrink-0">
        <span className="mono text-[9px] text-[var(--t3)]">{totalFiltered} EVENTS</span>
      </div>
    </div>
  );
}
