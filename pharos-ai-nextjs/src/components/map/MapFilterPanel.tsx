'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import FilterSection from '@/components/map/FilterSection';
import DatasetDrilldown from '@/components/map/DatasetDrilldown';

import { LAYER_DISPLAY } from '@/data/map-tokens';
import { ALL_DATASETS, DATASET_LABEL } from '@/hooks/use-map-filters';

import type { FilterFacets, FilterState } from '@/lib/map-filter-engine';
import type { DatasetName } from '@/hooks/use-map-filters';

type Props = {
  state: FilterState; facets: FilterFacets; isFiltered: boolean;
  onToggleDataset: (d: string) => void; onToggleType: (t: string) => void;
  onToggleActor: (a: string) => void; onTogglePriority: (p: string) => void;
  onToggleStatus: (s: string) => void; onToggleHeat: () => void; onReset: () => void;
};

function DatasetBtn({ name, isOn, isActive, onToggle, onDrill }: {
  name: DatasetName; isOn: boolean; isActive: boolean; onToggle: () => void; onDrill: () => void;
}) {
  const m = LAYER_DISPLAY[name];
  return (
    <div className="flex items-center">
      <Button
        variant="ghost" size="xs" onClick={onToggle}
        className="mono rounded-none rounded-l-sm px-1.5 py-0 h-5 text-[8px] font-bold tracking-wider"
        style={{
          border: `1px solid ${isOn ? m.border : 'var(--bd)'}`,
          borderRight: 'none',
          background: isOn ? m.bg : 'var(--bg-1)',
          color: isOn ? m.color : 'var(--t4)',
        }}
      >
        {DATASET_LABEL[name]}
      </Button>
      <Button
        variant="ghost" size="xs" onClick={onDrill}
        className="rounded-none rounded-r-sm px-0.5 py-0 h-5"
        style={{
          border: `1px solid ${isActive ? m.border : isOn ? m.border : 'var(--bd)'}`,
          background: isActive ? m.bg : isOn ? m.bg : 'var(--bg-1)',
          color: isActive ? m.color : isOn ? m.color : 'var(--t4)',
        }}
      >
        {isActive ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
      </Button>
    </div>
  );
}

export default function MapFilterPanel(props: Props) {
  const { state, facets, isFiltered } = props;
  const { onToggleDataset, onToggleType, onToggleActor, onTogglePriority, onToggleStatus, onToggleHeat, onReset } = props;
  const [drillDataset, setDrillDataset] = useState<string | null>(null);

  const heatMeta = LAYER_DISPLAY.heat;
  const drill = drillDataset ? facets.perDataset[drillDataset] : null;

  return (
    <div className="flex flex-col items-end gap-1">
      {/* Dataset bar */}
      <div
        className="flex items-center gap-0.5 rounded-sm"
        style={{ background: 'rgba(28,33,39,0.95)', border: '1px solid var(--bd)', padding: '4px 6px' }}
      >
        {ALL_DATASETS.map(d => (
          <DatasetBtn key={d} name={d} isOn={state.datasets.has(d)}
            isActive={drillDataset === d}
            onToggle={() => onToggleDataset(d)}
            onDrill={() => setDrillDataset(drillDataset === d ? null : d)}
          />
        ))}

        <Button variant="ghost" size="xs" onClick={onToggleHeat}
          className="mono rounded-sm px-1.5 py-0 h-5 text-[8px] font-bold tracking-wider"
          style={{
            border: `1px solid ${state.heat ? heatMeta.border : 'var(--bd)'}`,
            background: state.heat ? heatMeta.bg : 'var(--bg-1)',
            color: state.heat ? heatMeta.color : 'var(--t4)',
          }}
        >HEAT</Button>

        {isFiltered && (
          <>
            <div className="w-px h-3.5 bg-[var(--bd)] mx-0.5 flex-shrink-0" />
            <Button variant="ghost" size="xs" onClick={onReset}
              className="mono rounded-sm px-1.5 py-0 h-5 text-[8px] font-bold tracking-wider"
              style={{ border: '1px solid var(--danger)', background: 'var(--danger-dim)', color: 'var(--danger)' }}
            ><X size={8} /></Button>
          </>
        )}
      </div>

      {/* Per-dataset drilldown */}
      {drill && drillDataset && (
        <DatasetDrilldown
          dataset={drillDataset}
          facets={drill}
          state={state}
          onToggleType={onToggleType}
          onToggleActor={onToggleActor}
          onToggleStatus={onToggleStatus}
          onTogglePriority={onTogglePriority}
        />
      )}
    </div>
  );
}
