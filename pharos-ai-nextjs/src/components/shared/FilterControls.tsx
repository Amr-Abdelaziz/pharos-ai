'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

/** Labelled group of filter rows. */
export function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-[var(--bd-s)]">
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
        className="w-[11px] h-[11px] shrink-0 rounded-[1px]"
        style={{
          borderColor: checked ? color : 'var(--bd)',
          backgroundColor: checked ? color : 'transparent',
        }}
      />
      <span
        className="text-[10px]"
        style={{ color: checked ? 'var(--t1)' : 'var(--t2)' }}
      >
        {label}
      </span>
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
      className="w-full h-auto rounded-none flex justify-between items-center px-3 py-[7px]"
    >
      <span
        className="text-[10px]"
        style={{ color: checked ? 'var(--t1)' : 'var(--t2)' }}
      >
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={e => e.stopPropagation()}
      />
    </Button>
  );
}
