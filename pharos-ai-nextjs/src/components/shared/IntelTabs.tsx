'use client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface IntelTabsProps<T extends string> {
  value: T;
  onValueChange: (v: T) => void;
  tabs: TabItem<T>[];
  children: React.ReactNode;
}

export function IntelTabBar<T extends string>({
  value, onValueChange, tabs, children,
}: IntelTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={v => onValueChange(v as T)}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <TabsList
        variant="line"
        className="h-[38px] w-full rounded-none border-b border-[var(--bd)] bg-[var(--bg-2)] flex gap-0 p-0 justify-start"
      >
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none h-full px-[18px] text-[10px] font-bold tracking-[0.06em] uppercase shrink-0 transition-[color,border-color,background] duration-100"
            style={{
              color: value === tab.value ? 'var(--t1)' : 'var(--t2)',
              borderBottom: value === tab.value ? '2px solid var(--blue)' : '2px solid transparent',
              background: value === tab.value ? 'var(--bg-1)' : 'transparent',
            }}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
