const LEGEND_ITEMS = [
  { color: '#2D72D2', shape: 'rect', label: 'US STRIKE TRACK' },
  { color: '#32C878', shape: 'rect', label: 'IDF STRIKE TRACK' },
  { color: '#32C8C8', shape: 'rect', label: 'NAVAL STRIKE' },
  { color: '#D23232', shape: 'rect', label: 'HOSTILE MISSILE' },
  { color: '#FFC800', shape: 'rect', label: 'INTERCEPTED MISSILE' },
  { color: '#DC3232', shape: 'circle', label: 'DESTROYED TARGET' },
  { color: '#DC9632', shape: 'circle', label: 'DAMAGED TARGET' },
  { color: '#DCC832', shape: 'circle', label: 'TARGETED' },
  { color: '#2D72D2', shape: 'circle', label: 'US ASSET' },
  { color: '#32C8C8', shape: 'circle', label: 'IDF ASSET' },
  { color: '#DC3232', shape: 'zone', label: 'CLOSURE ZONE' },
  { color: '#DC9632', shape: 'zone', label: 'PATROL ZONE' },
] as const;

export function IntelMapLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        background: 'rgba(28,33,39,0.92)',
        border: '1px solid #404854',
        borderRadius: 2,
        padding: '10px 12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 8, color: '#5C7080', marginBottom: 6 }}>LEGEND</div>
      {LEGEND_ITEMS.map(({ color, shape, label }) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 9, color: '#8F99A8' }}
        >
          {shape === 'rect' ? (
            <div style={{ width: 12, height: 3, background: color, flexShrink: 0 }} />
          ) : shape === 'zone' ? (
            <div style={{ width: 10, height: 8, background: color + '44', border: `1px solid ${color}`, flexShrink: 0 }} />
          ) : (
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}
            />
          )}
          {label}
        </div>
      ))}
    </div>
  );
}
