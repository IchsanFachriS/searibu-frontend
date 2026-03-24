import React, { useState } from 'react';
import { MapContainer } from '../webgis/MapContainer';
import { BasemapToggle } from '../webgis/BasemapToggle';
import { InfoPanel } from '../webgis/InfoPanel';

export type BasemapType = 'osm' | 'satellite';

const PANEL_WIDTH = '560px';

export const WebGISPage: React.FC = () => {
  const [basemap, setBasemap] = useState<BasemapType>('satellite');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const handleGridClick = (coordinates: { lat: number; lon: number }) => {
    setSelectedCoordinates(coordinates);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedCoordinates(null), 400);
  };

  return (
    /* 62px = navbar height */
    <div style={{ display: 'flex', height: 'calc(100vh - 62px)', width: '100%',
      overflow: 'hidden', marginTop: 62 }}>
      {/* Map area */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <BasemapToggle currentBasemap={basemap} onBasemapChange={setBasemap} />
        <MapContainer basemap={basemap} onGridClick={handleGridClick} />
      </div>

      {/* Info Panel — slides in from right, width konsisten dengan InfoPanel */}
      <div style={{
        width: panelOpen ? PANEL_WIDTH : '0px',
        minWidth: panelOpen ? PANEL_WIDTH : '0px',
        transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), min-width 0.35s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {selectedCoordinates && (
          <InfoPanel coordinates={selectedCoordinates} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
};