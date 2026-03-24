/**
 * WebGISLayout.tsx
 * 
 * Responsive layout wrapper for the Searibu WebGIS dashboard.
 * 
 * Breakpoints:
 *   - Desktop (≥768px): Map fills left, InfoPanel slides in from right as sidebar
 *   - Mobile (<768px):  Map fills full screen, InfoPanel appears as bottom sheet / full overlay
 */

import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer } from './MapContainer';
import { InfoPanel } from './InfoPanel';
import { BasemapToggle, BasemapType } from './BasemapToggle';

interface ClickedCoords {
  lat: number;
  lon: number;
}

export const WebGISLayout: React.FC = () => {
  const [clickedCoords, setClickedCoords] = useState<ClickedCoords | null>(null);
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [basemap,       setBasemap]       = useState<BasemapType>('osm');
  const [isMobile,      setIsMobile]      = useState(false);

  // Detect viewport width
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleGridClick = useCallback((lat: number, lon: number) => {
    setClickedCoords({ lat, lon });
    setPanelOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100vw',
        height: '100dvh',   // dvh = dynamic viewport height, accounts for mobile browser chrome
        overflow: 'hidden',
        background: '#e2e8f0',
      }}
    >
      {/* ── Map area ── */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          // On mobile with panel open: map shrinks to give space to panel
          height: isMobile && panelOpen ? '45%' : isMobile ? '100%' : '100%',
          transition: 'height 0.3s ease',
          minHeight: 0,
        }}
      >
        <MapContainer basemap={basemap} onGridClick={handleGridClick} />

        {/* Basemap toggle — positioned bottom-right of map */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}>
          <BasemapToggle current={basemap} onChange={setBasemap} />
        </div>
      </div>

      {/* ── InfoPanel ── */}
      {panelOpen && clickedCoords && (
        <div
          style={{
            // Desktop: fixed-width sidebar
            // Mobile: full-width bottom sheet
            width: isMobile ? '100%' : 'min(560px, 45vw)',
            height: isMobile ? '55%' : '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // Smooth slide-in
            animation: 'panel-slide-in 0.25s ease-out',
            boxShadow: isMobile
              ? '0 -4px 24px rgba(0,0,0,0.12)'
              : '-4px 0 24px rgba(0,0,0,0.08)',
            // On mobile, add rounded top corners
            borderRadius: isMobile ? '16px 16px 0 0' : 0,
            borderTop: isMobile ? '1px solid #e2e8f0' : 'none',
          }}
        >
          <InfoPanel
            coordinates={clickedCoords}
            onClose={handleClose}
          />
        </div>
      )}

      <style>{`
        @keyframes panel-slide-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 767px) {
          @keyframes panel-slide-in {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
        /* Prevent pull-to-refresh on mobile */
        body { overscroll-behavior: none; }
        /* Safe area insets for notched phones */
        .info-panel-inner { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};