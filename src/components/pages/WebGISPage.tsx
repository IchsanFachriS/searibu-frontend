import React, { useState } from "react";
import { MapContainer }  from "../webgis/MapContainer";
import { BasemapToggle } from "../webgis/BasemapToggle";
import { InfoPanel }     from "../webgis/InfoPanel";
import type { BasemapType } from "../../types";

interface Coords { lat: number; lon: number }

export const WebGISPage: React.FC = () => {
  const [basemap,     setBasemap]     = useState<BasemapType>("satellite");
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);

  const handleGridClick = (coords: Coords) => {
    setSelectedCoords(coords);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedCoords(null), 400);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        html, body, #root {
          overscroll-behavior: none !important;
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

        .webgis-map-area {
          position: relative;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          overscroll-behavior: none;
        }

        /* ── Desktop panel ── */
        @media (min-width: 769px) {
          .webgis-panel-desktop {
            width: 480px;
            min-width: 480px;
            max-width: 480px;
            transition: width .35s cubic-bezier(.4,0,.2,1),
                        min-width .35s cubic-bezier(.4,0,.2,1),
                        max-width .35s cubic-bezier(.4,0,.2,1);
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
          .webgis-panel-mobile  { display: none !important; }
          .webgis-mobile-backdrop { display: none !important; }
        }

        @media (min-width: 769px) and (max-width: 1100px) {
          .webgis-panel-desktop {
            width: 380px;
            min-width: 380px;
            max-width: 380px;
          }
        }

        /* ── Mobile panel ── */
        @media (max-width: 768px) {
          .webgis-panel-desktop { display: none !important; }

          .webgis-panel-mobile {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 500;
            height: 78vh;
            max-height: 78vh;
            transform: translateY(100%);
            transition: transform .35s cubic-bezier(.4,0,.2,1);
            border-radius: 18px 18px 0 0;
            overflow: hidden;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.22);
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
            width: 40px;
            height: 4px;
            background: rgba(0,0,0,0.15);
            border-radius: 2px;
            z-index: 10;
            cursor: grab;
          }

          .webgis-mobile-backdrop {
            position: fixed;
            inset: 0;
            z-index: 499;
            background: rgba(0,0,0,0.3);
            opacity: 0;
            pointer-events: none;
            transition: opacity .3s;
          }
          .webgis-mobile-backdrop.visible {
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (max-width: 480px) {
          .webgis-panel-mobile {
            height: 85vh;
            max-height: 85vh;
          }
        }

        /* Landscape mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .webgis-panel-mobile {
            height: 90vh;
            max-height: 90vh;
            border-radius: 0 18px 18px 0;
            left: auto;
            right: 0;
            top: 62px;
            bottom: 0;
            width: 340px;
            max-width: 340px;
            transform: translateX(100%);
            border-radius: 12px 0 0 12px;
          }
          .webgis-panel-mobile.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <div
        className="webgis-wrapper"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => { if (!panelOpen) e.preventDefault(); }}
      >
        <div className="webgis-map-area">
          <BasemapToggle currentBasemap={basemap} onBasemapChange={setBasemap} />
          <MapContainer
            basemap={basemap}
            onGridClick={handleGridClick}
            onCoordinateSearch={handleGridClick}
            panelOpen={panelOpen} 
          />
        </div>

        {/* Desktop side panel */}
        <div className={`webgis-panel-desktop ${panelOpen ? "" : "closed"}`}>
          {selectedCoords && (
            <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel} />
          )}
        </div>

        {/* Mobile backdrop */}
        <div
          className={`webgis-mobile-backdrop ${panelOpen ? "visible" : ""}`}
          onClick={handleClosePanel}
        />

        {/* Mobile bottom sheet */}
        <div className={`webgis-panel-mobile ${panelOpen ? "open" : ""}`}>
          <div className="mobile-drag-handle" />
          {selectedCoords && (
            <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel} />
          )}
        </div>
      </div>
    </>
  );
};