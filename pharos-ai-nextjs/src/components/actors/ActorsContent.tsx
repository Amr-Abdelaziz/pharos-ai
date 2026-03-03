'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePanelLayout } from '@/hooks/use-panel-layout';
import { useConflictDay } from '@/hooks/use-conflict-day';
import { useActors } from '@/api/actors';
import { ActorList } from '@/components/actors/ActorList';
import { ActorDossier } from '@/components/actors/ActorDossier';
import { EmptyState } from '@/components/shared/EmptyState';

export function ActorsContent() {
  const searchParams = useSearchParams();
  const initActor    = searchParams.get('actor');
  const { currentDay, setDay } = useConflictDay();

  const [selId, setSelId] = useState<string | null>(initActor);
  const [tab,   setTab]   = useState<'intel' | 'signals' | 'military'>('intel');
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'actors' });

  useEffect(() => { if (initActor) setSelId(initActor); }, [initActor]);

  const { data: actors } = useActors();
  const selected = actors?.find(a => a.id === selId) ?? null;

  return (
    <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="flex-1 min-w-0">
      <ResizablePanel id="list" defaultSize="22%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[180px]">
        <ActorList
          selectedId={selId}
          onSelect={id => { setSelId(id); if (id) setTab('intel'); }}
          currentDay={currentDay}
          onDayChange={setDay}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="dossier" defaultSize="78%" minSize="40%" className="flex flex-col overflow-hidden">
        {selected
          ? <ActorDossier actor={selected} tab={tab} onTabChange={setTab} currentDay={currentDay} />
          : <EmptyState icon={Users} message="Select an actor" />
        }
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
