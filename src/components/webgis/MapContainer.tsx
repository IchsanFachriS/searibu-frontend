import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export type BasemapType = 'osm' | 'satellite';

interface MapContainerProps {
  basemap: BasemapType;
  onGridClick?: (coordinates: { lat: number; lon: number }) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({ basemap, onGridClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);

  const SERIBU_ISLANDS_CENTER: [number, number] = [-5.6167, 106.5833];
  const DEFAULT_ZOOM = 11;

  const basemaps = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19,
    },
  };

  useEffect(() => {
    fetch('/GRID_TPXO_SERIBU.geojson')
      .then(response => response.json())
      .then(data => setGeojsonData(data))
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SERIBU_ISLANDS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    const tileLayer = L.tileLayer(basemaps[basemap].url, {
      attribution: basemaps[basemap].attribution,
      maxZoom: basemaps[basemap].maxZoom,
    }).addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    map.zoomControl.setPosition('topright');

    L.control.scale({
      position: 'bottomright',
      imperial: false,
      metric: true,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    const newTileLayer = L.tileLayer(basemaps[basemap].url, {
      attribution: basemaps[basemap].attribution,
      maxZoom: basemaps[basemap].maxZoom,
    }).addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [basemap]);

  useEffect(() => {
    if (!mapRef.current || !geojsonData) return;

    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
    }

    const geoJsonLayer = L.geoJSON(geojsonData, {
      style: {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2,
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const popupContent = `
            <div class="p-3 min-w-[200px]">
              <div class="font-semibold text-blue-700 mb-2 text-sm">Grid Information</div>
              <div class="text-xs space-y-1">
                <div><strong>Grid ID:</strong> ${feature.properties.id || 'N/A'}</div>
                <div><strong>Row:</strong> ${feature.properties.row_index || 'N/A'}</div>
                <div><strong>Col:</strong> ${feature.properties.col_index || 'N/A'}</div>
              </div>
              <div class="mt-3 text-xs text-gray-600 italic">
                Click grid to view tide prediction
              </div>
            </div>
          `;
          layer.bindPopup(popupContent);
        }

        layer.on('click', () => {
          const center = (layer as any).getBounds().getCenter();
          if (onGridClick) {
            onGridClick({ lat: center.lat, lon: center.lng });
          }
          
          geoJsonLayer.eachLayer((l: any) => {
            (l as L.Path).setStyle({
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.2,
            });
          });

          (layer as L.Path).setStyle({
            color: '#ef4444',
            weight: 3,
            fillOpacity: 0.4,
          });
        });

        layer.on('mouseover', () => {
          if ((layer as L.Path).options.fillOpacity !== 0.4) {
            (layer as L.Path).setStyle({
              fillOpacity: 0.35,
              weight: 3,
            });
          }
        });

        layer.on('mouseout', () => {
          if ((layer as L.Path).options.fillOpacity !== 0.4) {
            (layer as L.Path).setStyle({
              fillOpacity: 0.2,
              weight: 2,
            });
          }
        });
      }
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;
    mapRef.current.fitBounds(geoJsonLayer.getBounds());

  }, [geojsonData, onGridClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
};