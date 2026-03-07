import type { StyleSpecification } from 'maplibre-gl';

export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const MAP_STYLE_SAT: StyleSpecification = {
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
