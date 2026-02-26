import React, { useState } from 'react';
import { MapContainer } from '../webgis/MapContainer';
import { BasemapToggle } from '../webgis/BasemapToggle';
import { TideSidebar } from '../webgis/TideSidebar';

export type BasemapType = 'osm' | 'satellite';

export const WebGISPage: React.FC = () => {
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const handleGridClick = (coordinates: { lat: number; lon: number }) => {
    setSelectedCoordinates(coordinates);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // Keep coordinates for a moment to allow smooth transition
    setTimeout(() => {
      if (!sidebarOpen) {
        setSelectedCoordinates(null);
      }
    }, 300);
  };

  return (
    <div className="relative h-screen w-full">
      {/* Basemap Toggle */}
      <BasemapToggle currentBasemap={basemap} onBasemapChange={setBasemap} />
      
      {/* Map Container */}
      <MapContainer basemap={basemap} onGridClick={handleGridClick} />

      {/* Tide Sidebar */}
      <TideSidebar 
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        coordinates={selectedCoordinates}
      />
    </div>
  );
};