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
    <div className="flex items-center gap-1.5 px-4 flex-shrink-0 overflow-x-auto" style={{ height: 36, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)' }}>
      <span className="label flex-shrink-0" style={{ fontSize: 8, color: 'var(--t4)' }}>KEY FACTS</span>
      <div className="flex-shrink-0" style={{ width: 1, height: 14, background: 'var(--bd)' }} />
      {CHIPS.map(chip => (
        <div
          key={chip.label}
          className="flex items-center flex-shrink-0"
          style={{
            padding: '2px 8px',
            background: chip.danger ? 'var(--danger-dim)' : 'var(--bg-2)',
            border: `1px solid ${chip.danger ? 'rgba(231,106,110,.3)' : 'var(--bd)'}`,
          }}
        >
          <span className="mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: chip.danger ? 'var(--danger)' : 'var(--t2)' }}>
            {chip.label}
          </span>
        </div>
      ))}
      <div className="ml-auto flex-shrink-0">
        <span className="mono" style={{ fontSize: 9, color: 'var(--t4)' }}>
          Feb 28 – Mar 1, 2026 · OPERATIONS ONGOING
        </span>
      </div>
    </div>
  );
}
