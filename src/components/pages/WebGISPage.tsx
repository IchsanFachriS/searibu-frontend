import React, { useState } from 'react';
import { MapContainer } from '../webgis/MapContainer';
import { BasemapToggle } from '../webgis/BasemapToggle';
import { InfoPanel } from '../webgis/InfoPanel';

export type BasemapType = 'osm' | 'satellite';

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        /*
         * ── OVERSCROLL FIX ──────────────────────────────────────────────────
         * Block all pull-to-refresh and overscroll on the WebGIS page.
         * The html/body already have overscroll-behavior:none from App.tsx,
         * but we reinforce here to be certain nothing bleeds through.
         * ───────────────────────────────────────────────────────────────────
         */
        html, body, #root {
          overscroll-behavior: none !important;
          overscroll-behavior-x: none !important;
          overscroll-behavior-y: none !important;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }

        .webgis-wrapper {
          display: flex;
          height: calc(100vh - 62px);
          width: 100%;
          overflow: hidden;
          margin-top: 62px;
          position: relative;
          background: #0a1628;
          overscroll-behavior: none;
          touch-action: none;
        }

        /* ── Map area ── */
        .webgis-map-area {
          position: relative;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          overscroll-behavior: none;
        }

        /* ── Desktop: side panel ── */
        @media (min-width: 769px) {
          .webgis-panel-desktop {
            width: 520px;
            min-width: 520px;
            max-width: 520px;
            transition: width 0.35s cubic-bezier(0.4,0,0.2,1),
                        min-width 0.35s cubic-bezier(0.4,0,0.2,1),
                        max-width 0.35s cubic-bezier(0.4,0,0.2,1);
            overflow: hidden;
            flex-shrink: 0;
            background: #f8fafc;
            height: 100%;
            overscroll-behavior: contain;
          }
          .webgis-panel-desktop.closed {
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
          }
          .webgis-panel-mobile { display: none !important; }
        }

        /* ── Tablet ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .webgis-panel-desktop {
            width: 400px;
            min-width: 400px;
            max-width: 400px;
          }
        }

        /* ── Mobile: bottom sheet overlay ── */
        @media (max-width: 768px) {
          .webgis-panel-desktop { display: none !important; }

          .webgis-panel-mobile {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 500;
            height: 72vh;
            max-height: 72vh;
            transform: translateY(100%);
            transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
            border-radius: 18px 18px 0 0;
            overflow: hidden;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
            background: #f8fafc;
            overscroll-behavior: contain;
          }
          .webgis-panel-mobile.open {
            transform: translateY(0);
          }
          .mobile-drag-handle {
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 36px;
            height: 4px;
            background: rgba(0,0,0,0.15);
            border-radius: 2px;
            z-index: 10;
            cursor: grab;
          }

          /* Backdrop behind sheet */
          .webgis-mobile-backdrop {
            position: fixed;
            inset: 0;
            z-index: 499;
            background: rgba(0,0,0,0.25);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
          }
          .webgis-mobile-backdrop.visible {
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (max-width: 480px) {
          .webgis-panel-mobile {
            height: 82vh;
            max-height: 82vh;
          }
        }
      `}</style>

      <div
        className="webgis-wrapper"
        /* Capture and swallow any wheel/touch events that reach this wrapper
           so they can never propagate to the document scroll */
        onWheel={e => e.preventDefault()}
        onTouchMove={e => { if (!panelOpen) e.preventDefault(); }}
      >
        {/* Map area */}
        <div className="webgis-map-area">
          <BasemapToggle currentBasemap={basemap} onBasemapChange={setBasemap} />
          <MapContainer
            basemap={basemap}
            onGridClick={handleGridClick}
            onCoordinateSearch={handleGridClick}
          />
        </div>

        {/* Desktop: side panel */}
        <div className={`webgis-panel-desktop ${panelOpen ? '' : 'closed'}`}>
          {selectedCoordinates && (
            <InfoPanel coordinates={selectedCoordinates} onClose={handleClosePanel} />
          )}
        </div>

        {/* Mobile: bottom sheet */}
        <div
          className={`webgis-mobile-backdrop ${panelOpen ? 'visible' : ''}`}
          onClick={handleClosePanel}
        />
        <div className={`webgis-panel-mobile ${panelOpen ? 'open' : ''}`}>
          <div className="mobile-drag-handle" />
          {selectedCoordinates && (
            <InfoPanel coordinates={selectedCoordinates} onClose={handleClosePanel} />
          )}
        </div>
      </div>
    </>
  );
};