'use client';

import { useCallback } from 'react';

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

import MapSidebar    from '@/components/map/MapSidebar';
import MapControls   from '@/components/map/MapControls';
import MapOverlays   from '@/components/map/MapOverlays';
import MapDetailPanel from '@/components/map/MapDetailPanel';
import MapLegend     from '@/components/map/MapLegend';
import MapFilterPanel from '@/components/map/MapFilterPanel';
import MapTimeline   from '@/components/map/MapTimeline';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePanelLayout } from '@/hooks/use-panel-layout';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import type { StyleSpecification } from 'maplibre-gl';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone } from '@/data/mapData';

// ─── Map styles ───────────────────────────────────────────────────────────────

const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MAP_STYLE_SAT: StyleSpecification = {
  version: 8,
  sources: {
    esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: '© Esri, Maxar' },
    'dark-overlay-src': { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]] }, properties: {} } },
  },
  layers: [
    { id: 'esri-satellite', type: 'raster', source: 'esri', paint: { 'raster-brightness-max': 0.65, 'raster-saturation': -0.2 } },
    { id: 'dark-overlay',   type: 'fill',   source: 'dark-overlay-src', paint: { 'fill-color': '#000814', 'fill-opacity': 0.38 } },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullMapPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useAppDispatch();
  const viewState    = useAppSelector(s => s.map.viewState);
  const activeStory  = useAppSelector(s => s.map.activeStory);
  const selectedItem = useAppSelector(s => s.map.selectedItem);
  const sidebarOpen  = useAppSelector(s => s.map.sidebarOpen);
  const mapStyle     = useAppSelector(s => s.map.mapStyle);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'map', panelIds: ['sidebar', 'canvas'] });

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
        <MapLegend hasPanel={!!selectedItem} />
        <MapControls viewState={viewState} mapStyle={mapStyle} hasPanel={!!selectedItem} onStyleChange={style => dispatch(setMapStyleAction(style))} />

        {/* Filter panel — top right */}
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

        <MapDetailPanel item={selectedItem} onClose={() => dispatch(setSelectedItemAction(null))} onSelectItem={item => dispatch(setSelectedItemAction(item))} onActivateStory={story => dispatch(activateStoryAction(story))} />

        {/* Timeline scrubber — bottom */}
        <MapTimeline
          dataExtent={f.dataExtent} viewExtent={f.viewExtent} onViewExtent={f.setViewExtent}
          timeRange={f.state.timeRange} onTimeRange={f.setTimeRange}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
