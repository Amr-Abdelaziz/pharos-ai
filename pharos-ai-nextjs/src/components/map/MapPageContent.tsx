'use client';

import '@/lib/deckgl-device';
import { useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import type { StyleSpecification } from 'maplibre-gl';
import type { MapStory } from '@/data/mapStories';
import type { SelectedItem } from '@/components/map/MapDetailPanel';
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

const INITIAL_VIEW: MapViewState = { longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0 };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullMapPage() {
  const [viewState,    setViewState]    = useState<MapViewState>(INITIAL_VIEW);
  const [activeStory,  setActiveStory]  = useState<MapStory | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [mapStyle,     setMapStyle]     = useState<'dark' | 'satellite'>('dark');

  const f = useMapFilters();

  const layers = useMapLayers({
    filtered:    f.filtered,
    activeStory,
    isSatellite: mapStyle === 'satellite',
  });

  const handleActivateStory = useCallback((story: MapStory) => {
    setActiveStory(story);
    setViewState(prev => ({ ...prev, ...story.viewState, transitionDuration: 1200 }));
  }, []);

  const handleMapClick = useCallback(({ object, layer }: PickingInfo) => {
    if (!object || !layer) { setSelectedItem(null); return; }
    const id = layer.id;
    if (id === 'strikes')                              setSelectedItem({ type: 'strike',  data: object as StrikeArc   });
    else if (id === 'missiles')                        setSelectedItem({ type: 'missile', data: object as MissileTrack });
    else if (id === 'targets' || id === 'target-labels') setSelectedItem({ type: 'target',  data: object as Target      });
    else if (id === 'assets'  || id === 'asset-labels')  setSelectedItem({ type: 'asset',   data: object as Asset       });
    else if (id === 'zones')                           setSelectedItem({ type: 'zone',    data: object as ThreatZone  });
    else setSelectedItem(null);
  }, []);

  return (
    <div className="flex" style={{ width: '100%', height: '100%', background: 'var(--bg-app)', overflow: 'hidden' }}>

      <MapSidebar
        isOpen={sidebarOpen}
        activeStory={activeStory}
        onToggle={() => setSidebarOpen(o => !o)}
        onActivateStory={handleActivateStory}
        onClearStory={() => setActiveStory(null)}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
          controller layers={layers} getTooltip={buildTooltip} onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT} />
        </DeckGL>

        <MapOverlays activeStory={activeStory} onClearStory={() => setActiveStory(null)} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <MapLegend hasPanel={!!selectedItem} />
        <MapControls viewState={viewState} mapStyle={mapStyle} hasPanel={!!selectedItem} onStyleChange={setMapStyle} />

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

        <MapDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} onSelectItem={setSelectedItem} onActivateStory={handleActivateStory} />

        {/* Timeline scrubber — bottom */}
        <MapTimeline
          dataExtent={f.dataExtent} viewExtent={f.viewExtent} onViewExtent={f.setViewExtent}
          timeRange={f.state.timeRange} onTimeRange={f.setTimeRange}
        />
      </div>
    </div>
  );
}
