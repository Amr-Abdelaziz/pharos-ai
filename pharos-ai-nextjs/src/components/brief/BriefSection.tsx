import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function BriefSection({ number, title, children }: {
  number: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)' }}>
          {number}.
        </span>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          {title}
        </h2>
        <Separator className="flex-1" style={{ background: 'var(--bd)' }} />
      </div>
      {children}
    </div>
  );
}

export function EconChip({ label, val, sub, color }: {
  label: string; val: string; sub: string; color: string;
}) {
  return (
    <div style={{ padding: '10px 14px', background: color + '12', border: `1px solid ${color}40`, minWidth: 110 }}>
      <div className="label mb-1" style={{ fontSize: 8, color: 'var(--t4)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
      <div className="mono" style={{ fontSize: 9, color, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

export function ScenarioCard({ label, subtitle, color, prob, body }: {
  label: string; subtitle: string; color: string; prob: string; body: string;
}) {
  return (
    <div style={{ padding: '14px 16px', background: color + '08', border: `1px solid ${color}35`, borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--t2)', fontStyle: 'italic' }}>{subtitle}</span>
        <Badge
          variant="outline"
          className="mono ml-auto"
          style={{ fontSize: 9, fontWeight: 700, color, background: color + '20', borderColor: color + '50', borderRadius: 2 }}
        >
          P={prob}
        </Badge>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}
