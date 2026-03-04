'use client';

import { useCallback, useMemo, useState } from 'react';

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
  setSidebarOpen  as setSidebarOpenAction,
  setMapStyle     as setMapStyleAction,
} from '@/store/map-slice';
import { useMapStories } from '@/api/map';

import { useMapFilters } from '@/hooks/use-map-filters';
import { useMapLayers } from '@/hooks/use-map-layers';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { createBuildTooltip } from '@/lib/map-tooltip';
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
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone } from '@/data/map-data';
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
  const { data: stories = [] } = useMapStories();
  const isMobile = useIsMobile(1024);

  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
      ? { timeline: true, filters: false, legend: false }
      : { timeline: true, filters: true, legend: true }
  ));

  const toggleOverlay = useCallback((key: keyof OverlayVisibility) => {
    setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [sheetExpanded, setSheetExpanded] = useState(false);

  const f = useMapFilters();

  const tooltip = useMemo(() => createBuildTooltip(f.actorMeta), [f.actorMeta]);

  const layers = useMapLayers({
    filtered:    f.filtered,
    actorMeta:   f.actorMeta,
    activeStory,
    isSatellite: mapStyle === 'satellite',
    isMobile,
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

  const showTimeline = overlayVisibility.timeline && !(isMobile && !!selectedItem);
  const canvas = (
    <div className="relative overflow-hidden w-full h-full">
      <DeckGL
        viewState={{ ...viewState }}
        onViewStateChange={({ viewState: vs }) => { dispatch(setViewStateAction(vs as MapViewState)); }}
        controller layers={layers} getTooltip={tooltip} onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <Map mapStyle={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT} />
      </DeckGL>

      {isMobile && (sidebarOpen || selectedItem) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: sheetExpanded ? '100%' : '55%',
            transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 25,
            background: 'var(--bg-app)',
            borderTop: '1px solid var(--bd)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Detail panel above stories */}
          <MapDetailPanel
            item={selectedItem}
            onClose={() => dispatch(setSelectedItemAction(null))}
            onSelectItem={item => dispatch(setSelectedItemAction(item))}
            onActivateStory={story => dispatch(activateStoryAction(story))}
            inline
          />

          {/* Stories below */}
          {sidebarOpen && (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <MapSidebar
                isOpen={sidebarOpen}
                stories={stories}
                activeStory={activeStory}
                onToggle={() => { setSheetExpanded(false); dispatch(toggleSidebarAction()); }}
                onActivateStory={story => {
                  dispatch(setSidebarOpenAction(true));
                  dispatch(setSelectedItemAction(null));
                  dispatch(activateStoryAction(story));
                }}
                onClearStory={() => dispatch(setActiveStoryAction(null))}
                expanded={sheetExpanded}
                onToggleExpand={() => setSheetExpanded(prev => !prev)}
              />
            </div>
          )}
        </div>
      )}

      <MapOverlays activeStory={activeStory} onClearStory={() => dispatch(setActiveStoryAction(null))} sidebarOpen={sidebarOpen} onToggleSidebar={() => dispatch(toggleSidebarAction())} embedded={embedded} isMobile={isMobile} />
      {overlayVisibility.legend && <MapLegend hasPanel={!isMobile && !!selectedItem} timelineVisible={showTimeline} />}
      <MapControls viewState={viewState} mapStyle={mapStyle} hasPanel={!isMobile && !!selectedItem} timelineVisible={showTimeline} isMobile={isMobile} onStyleChange={style => dispatch(setMapStyleAction(style))} />

      {/* Visibility menu — above map controls */}
      <div style={{
        position: 'absolute',
        bottom:   isMobile
          ? (showTimeline ? 'calc(126px + var(--safe-bottom))' : 'calc(82px + var(--safe-bottom))')
          : (showTimeline ? 118 : 74),
        right:    isMobile ? 12 : (selectedItem ? 332 : 12),
        zIndex:   10,
        transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <MapVisibilityMenu visibility={overlayVisibility} onToggle={toggleOverlay} />
      </div>

      {/* Filter panel — top right */}
      {overlayVisibility.filters && (
        <div style={{ position: 'absolute', top: isMobile ? 56 : 12, right: isMobile ? 12 : (selectedItem ? 332 : 12), zIndex: 10, transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
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

      {!isMobile && <MapDetailPanel item={selectedItem} onClose={() => dispatch(setSelectedItemAction(null))} onSelectItem={item => dispatch(setSelectedItemAction(item))} onActivateStory={story => dispatch(activateStoryAction(story))} />}

      {/* Timeline scrubber — bottom */}
      {showTimeline && (
        <MapTimeline
          rawData={f.rawData}
          dataExtent={f.dataExtent} viewExtent={f.viewExtent} onViewExtent={f.setViewExtent}
          timeRange={f.state.timeRange} onTimeRange={f.setTimeRange}
          isMobile={isMobile}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0">
        {canvas}
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0">

      {sidebarOpen && !isMobile && (
        <>
          <ResizablePanel id="sidebar" defaultSize="25%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[280px]">
            <MapSidebar
              isOpen={sidebarOpen}
              stories={stories}
              activeStory={activeStory}
              onToggle={() => dispatch(toggleSidebarAction())}
              onActivateStory={story => {
                dispatch(setSelectedItemAction(null));
                dispatch(activateStoryAction(story));
              }}
              onClearStory={() => dispatch(setActiveStoryAction(null))}
            />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}

      <ResizablePanel id="canvas" defaultSize="75%" minSize="40%" className="relative overflow-hidden">
        {canvas}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
