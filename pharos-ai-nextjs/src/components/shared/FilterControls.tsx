'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

/** Labelled group of filter rows. */
export function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--bd-s)' }}>
      <div className="label px-3 mb-1">{label}</div>
      {children}
    </div>
  );
}

/** Checkbox-based filter row — uses shadcn Checkbox. */
export function CheckboxRow({
  label, color, checked, onChange,
}: { label: string; color: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        style={{
          width: 11, height: 11, flexShrink: 0, borderRadius: 1,
          borderColor: checked ? color : 'var(--bd)',
          backgroundColor: checked ? color : 'transparent',
        }}
      />
      <span style={{ fontSize: 10, color: checked ? 'var(--t1)' : 'var(--t2)' }}>{label}</span>
    </label>
  );
}

/** Switch-based toggle row — no manual role/keyboard handling. */
export function ToggleRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Button
      variant="ghost"
      onClick={() => onChange(!checked)}
      style={{
        width: '100%', height: 'auto', borderRadius: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '7px 12px',
      }}
    >
      <span style={{ fontSize: 10, color: checked ? 'var(--t1)' : 'var(--t2)' }}>{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={e => e.stopPropagation()}
      />
    </Button>
  );
}
