'use client';

import { useCallback, useState } from 'react';

import '@/lib/deckgl-device';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useAppSelector, useAppDispatch } from '@/store';
import {
  setViewState    as setViewStateAction,
  activateStory   as activateStoryAction,
  setActiveStory  as setActiveStoryAction,
  setSelectedItem as setSelectedItemAction,
  toggleSidebar   as toggleSidebarAction,
  setMapStyle     as setMapStyleAction,
} from '@/store/map-slice';

import { useMapFilters } from '@/hooks/use-map-filters';
import { useMapLayers } from '@/hooks/use-map-layers';
import { buildTooltip } from '@/lib/map-tooltip';
import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/components/map/map-styles';

import MapSidebar        from '@/components/map/MapSidebar';
import MapControls       from '@/components/map/MapControls';
import MapOverlays       from '@/components/map/MapOverlays';
import MapDetailPanel    from '@/components/map/MapDetailPanel';
import MapLegend         from '@/components/map/MapLegend';
import MapFilterPanel    from '@/components/map/MapFilterPanel';
import MapTimeline       from '@/components/map/MapTimeline';
import MapVisibilityMenu from '@/components/map/MapVisibilityMenu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePanelLayout } from '@/hooks/use-panel-layout';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone } from '@/data/mapData';
import type { OverlayVisibility } from '@/components/map/MapVisibilityMenu';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullMapPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useAppDispatch();
  const viewState    = useAppSelector(s => s.map.viewState);
  const activeStory  = useAppSelector(s => s.map.activeStory);
  const selectedItem = useAppSelector(s => s.map.selectedItem);
  const sidebarOpen  = useAppSelector(s => s.map.sidebarOpen);
  const mapStyle     = useAppSelector(s => s.map.mapStyle);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'map', panelIds: ['sidebar', 'canvas'] });

  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>({
    timeline: true,
    filters:  true,
    legend:   true,
  });

  const toggleOverlay = useCallback((key: keyof OverlayVisibility) => {
    setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const f = useMapFilters();

  const layers = useMapLayers({
    filtered:    f.filtered,
    activeStory,
    isSatellite: mapStyle === 'satellite',
  });

  const handleMapClick = useCallback(({ object, layer }: PickingInfo) => {
    if (!object || !layer) { dispatch(setSelectedItemAction(null)); return; }
    const id = layer.id;
    if (id === 'strikes')                                dispatch(setSelectedItemAction({ type: 'strike',  data: object as StrikeArc   }));
    else if (id === 'missiles')                          dispatch(setSelectedItemAction({ type: 'missile', data: object as MissileTrack }));
    else if (id === 'targets' || id === 'target-labels') dispatch(setSelectedItemAction({ type: 'target',  data: object as Target      }));
    else if (id === 'assets'  || id === 'asset-labels')  dispatch(setSelectedItemAction({ type: 'asset',   data: object as Asset       }));
    else if (id === 'zones')                             dispatch(setSelectedItemAction({ type: 'zone',    data: object as ThreatZone  }));
    else dispatch(setSelectedItemAction(null));
  }, [dispatch]);

  return (
    <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0">

      {sidebarOpen && (
        <>
          <ResizablePanel id="sidebar" defaultSize="25%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[280px]">
            <MapSidebar
              isOpen={sidebarOpen}
              activeStory={activeStory}
              onToggle={() => dispatch(toggleSidebarAction())}
              onActivateStory={story => dispatch(activateStoryAction(story))}
              onClearStory={() => dispatch(setActiveStoryAction(null))}
            />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}

      <ResizablePanel id="canvas" defaultSize="75%" minSize="40%" className="relative overflow-hidden">
        <DeckGL
          viewState={{ ...viewState }}
          onViewStateChange={({ viewState: vs }) => { dispatch(setViewStateAction(vs as MapViewState)); }}
          controller layers={layers} getTooltip={buildTooltip} onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT} />
        </DeckGL>

        <MapOverlays activeStory={activeStory} onClearStory={() => dispatch(setActiveStoryAction(null))} sidebarOpen={sidebarOpen} onToggleSidebar={() => dispatch(toggleSidebarAction())} embedded={embedded} />
        {overlayVisibility.legend && <MapLegend hasPanel={!!selectedItem} />}
        <MapControls viewState={viewState} mapStyle={mapStyle} hasPanel={!!selectedItem} onStyleChange={style => dispatch(setMapStyleAction(style))} />

        {/* Visibility menu — above map controls */}
        <div style={{
          position: 'absolute',
          bottom:   118,
          right:    selectedItem ? 332 : 12,
          zIndex:   10,
          transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} />
        </div>

        {/* Filter panel — top right */}
        {overlayVisibility.filters && (
          <div style={{ position: 'absolute', top: 12, right: selectedItem ? 332 : 12, zIndex: 10, transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
            <MapFilterPanel
              state={f.state}
              facets={f.facets}
              isFiltered={f.isFiltered}
              onToggleDataset={f.toggleDataset}
              onToggleType={f.toggleType}
              onToggleActor={f.toggleActor}
              onTogglePriority={f.togglePriority}
              onToggleStatus={f.toggleStatus}
              onToggleHeat={f.toggleHeat}
              onReset={f.resetFilters}
            />
          </div>
        )}

        <MapDetailPanel item={selectedItem} onClose={() => dispatch(setSelectedItemAction(null))} onSelectItem={item => dispatch(setSelectedItemAction(item))} onActivateStory={story => dispatch(activateStoryAction(story))} />

        {/* Timeline scrubber — bottom */}
        {overlayVisibility.timeline && (
          <MapTimeline
            dataExtent={f.dataExtent} viewExtent={f.viewExtent} onViewExtent={f.setViewExtent}
            timeRange={f.state.timeRange} onTimeRange={f.setTimeRange}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
