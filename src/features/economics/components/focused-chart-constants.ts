export const RANGES = [
  { key: '1d',  label: '1D',  interval: '5m'  },
  { key: '5d',  label: '5D',  interval: '15m' },
  { key: '1mo', label: '1M',  interval: '1h'  },
  { key: '3mo', label: '3M',  interval: '1d'  },
  { key: '6mo', label: '6M',  interval: '1d'  },
  { key: '1y',  label: '1Y',  interval: '1wk' },
  { key: '5y',  label: '5Y',  interval: '1mo' },
] as const;

export function fmtPrice(v: number, unit: string): string {
  const formatted = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return unit === '$' ? `$${formatted}` : unit === '%' ? `${formatted}%` : formatted;
}

export function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
}
