const CHIPS = [
  { label: 'KHAMENEI KILLED', danger: true  },
  { label: 'HORMUZ CLOSED',   danger: true  },
  { label: '3 US KIA',        danger: true  },
  { label: 'OIL +35%',        danger: true  },
  { label: '201 IR DEAD',     danger: true  },
  { label: 'DAY 2',           danger: false },
] as const;

export function SummaryBar() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 shrink-0 overflow-x-auto h-9 bg-[var(--bg-app)] border-b border-[var(--bd)]"
    >
      <span className="label shrink-0 text-[8px] text-[var(--t4)]">KEY FACTS</span>
      <div className="shrink-0 w-px h-3.5 bg-[var(--bd)]" />
      {CHIPS.map(chip => (
        <div
          key={chip.label}
          className={`flex items-center shrink-0 px-2 py-0.5 border ${chip.danger ? 'bg-[var(--danger-dim)] border-[var(--danger-bd)]' : 'bg-[var(--bg-2)] border-[var(--bd)]'}`}
        >
          <span className={`mono text-[9px] font-bold tracking-[0.06em] ${chip.danger ? 'text-[var(--danger)]' : 'text-[var(--t2)]'}`}>
            {chip.label}
          </span>
        </div>
      ))}
      <div className="ml-auto shrink-0">
        <span className="mono text-[9px] text-[var(--t4)]">
          Feb 28 – Mar 1, 2026 · OPERATIONS ONGOING
        </span>
      </div>
    </div>
  );
}
