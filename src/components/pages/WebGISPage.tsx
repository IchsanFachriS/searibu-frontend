import React, { useState, useEffect, useRef } from "react";
import { MapContainer }  from "../webgis/MapContainer";
import { InfoPanel }     from "../webgis/InfoPanel";
import { useLanguage }   from "../../context/LanguageContext";
import { Layers }        from "lucide-react";
import type { BasemapType } from "../../types";

/* ── GridLayer type ──────────────────────────────────────────────────────── */
export type GridLayer = "tpxo" | "ecmwf" | "smoc";

interface GridOption {
  key:     GridLayer;
  color:   string;
  labelEn: string;
  labelId: string;
  descEn:  string;
  descId:  string;
}

const GRID_OPTIONS: GridOption[] = [
  { key: "tpxo",  color: "#3b82f6", labelEn: "TPXO9",       labelId: "TPXO9",        descEn: "Tidal prediction",        descId: "Prediksi pasut"         },
  { key: "ecmwf", color: "#f59e0b", labelEn: "ECMWF IFS",   labelId: "ECMWF IFS",    descEn: "Weather forecast (~9 km)", descId: "Prakiraan cuaca (~9 km)" },
  { key: "smoc",  color: "#10b981", labelEn: "SMOC / MFWAM", labelId: "SMOC / MFWAM", descEn: "Wave & current (0.083°)",  descId: "Gelombang & arus (0,083°)" },
];

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

interface Coords { lat: number; lon: number }

export const WebGISPage: React.FC = () => {
  const { language } = useLanguage();
  const [basemap, setBasemap] = useState<BasemapType>("satellite");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [gridLayer, setGridLayer] = useState<GridLayer>("tpxo");

  /* State untuk kustomisasi lebar desktop panel */
  const [panelWidth, setPanelWidth] = useState(480);
  const isResizing = useRef(false);

  const handleGridClick = (coords: Coords) => {
    setSelectedCoords(coords);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedCoords(null), 400);
  };

  /* Handler untuk Resize Panel Desktop */
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Menghitung sisa ruang dari sisi kanan layar
      const newWidth = window.innerWidth - e.clientX;
      // Batasi lebar minimum 340px dan maksimum 65% dari lebar layar
      if (newWidth >= 340 && newWidth <= window.innerWidth * 0.65) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap');

        html, body, #root {
          overscroll-behavior: none !important;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }

        .webgis-wrapper {
          display: flex;
          height: calc(100vh - 70px);
          width: 100%;
          overflow: hidden;
          margin-top: 70px;
          position: relative;
          background: #1a1e2e;
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

        .webgis-toolbar {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 6px;
          overscroll-behavior: contain;
          touch-action: manipulation;
        }

        .webgis-basemap-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }
        .webgis-basemap-btn.active  { background: #0284c7; color: #fff; box-shadow: 0 2px 8px rgba(2,132,199,0.4); }
        .webgis-basemap-btn.inactive{ background: transparent; color: #1e293b; }

        .webgis-toolbar-card {
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(255,255,255,0.98);
          border-radius: 10px;
          padding: 3px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .webgis-toolbar-divider {
          width: 1px;
          height: 20px;
          background: #e2e8f0;
          flex-shrink: 0;
          margin: 0 2px;
        }

        .webgis-grid-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.15s;
          background: transparent;
          color: #1e293b;
        }
        .webgis-grid-btn:hover { background: #f1f5f9; }
        .webgis-grid-btn.open  { background: #f1f5f9; }

        /* ── Desktop Panel & Resize Handle ── */
        @media (min-width: 769px) {
          .webgis-panel-desktop {
            position: relative;
            height: 100%;
            background: #f7f4ef;
            flex-shrink: 0;
            overflow: hidden;
            display: flex;
            transition: transform .35s cubic-bezier(.4,0,.2,1);
          }
          
          /* Handle Penyeret Lebar */
          .webgis-resize-handle {
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 5px;
            cursor: ew-resize;
            background: transparent;
            z-index: 100;
            transition: background 0.2s;
          }
          .webgis-resize-handle:hover, .webgis-resize-handle:active {
            background: rgba(2, 132, 199, 0.4);
            width: 5px;
          }

          .webgis-panel-desktop.closed {
            transform: translateX(100%);
            position: absolute;
            right: 0;
          }
          .webgis-panel-mobile    { display: none !important; }
          .webgis-mobile-backdrop { display: none !important; }
        }

        @media (max-width: 400px) {
          .webgis-toolbar { gap: 4px; }
          .webgis-basemap-btn { padding: 5px 8px; font-size: 10px; }
          .webgis-grid-btn    { padding: 5px 7px; }
        }

        /* ── Mobile panel ── */
        @media (max-width: 768px) {
          .webgis-panel-desktop { display: none !important; }

          .webgis-panel-mobile {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            z-index: 500;
            height: 72vh;
            max-height: 72vh;
            transform: translateY(100%);
            transition: transform .35s cubic-bezier(.4,0,.2,1);
            border-radius: 16px 16px 0 0;
            overflow: hidden;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
            background: #f7f4ef;
            overscroll-behavior: contain;
          }
          .webgis-panel-mobile.open { transform: translateY(0); }

          .mobile-drag-handle {
            position: absolute; top: 8px; left: 50%;
            transform: translateX(-50%);
            width: 36px; height: 4px;
            background: rgba(0,0,0,0.12);
            border-radius: 2px; z-index: 10; cursor: grab;
          }

          .webgis-mobile-backdrop {
            position: fixed; inset: 0; z-index: 499;
            background: rgba(0,0,0,0.28);
            opacity: 0; pointer-events: none;
            transition: opacity .3s;
          }
          .webgis-mobile-backdrop.visible {
            opacity: 1; pointer-events: auto;
          }
        }

        @media (max-width: 480px) {
          .webgis-panel-mobile { height: 80vh; max-height: 80vh; }
        }

        @media (max-width: 768px) and (orientation: landscape) {
          .webgis-panel-mobile {
            height: 90vh; max-height: 90vh;
            left: auto; right: 0; top: 70px; bottom: 0;
            width: 340px; max-width: 340px;
            transform: translateX(100%);
            border-radius: 12px 0 0 12px;
          }
          .webgis-panel-mobile.open { transform: translateX(0); }
        }
      `}</style>

      <div
        className="webgis-wrapper"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => { if (!panelOpen) e.preventDefault(); }}
      >
        <div className="webgis-map-area">
          <div className="webgis-toolbar">
            <div className="webgis-toolbar-card">
              <button
                className={`webgis-basemap-btn ${basemap === "osm" ? "active" : "inactive"}`}
                onClick={() => setBasemap("osm")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                </svg>
                {language === "id" ? "Peta" : "Map"}
              </button>

              <button
                className={`webgis-basemap-btn ${basemap === "satellite" ? "active" : "inactive"}`}
                onClick={() => setBasemap("satellite")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
                </svg>
                {language === "id" ? "Sat." : "Sat."}
              </button>

              <div className="webgis-toolbar-divider" />

              <GridLayerToggleInline
                current={gridLayer}
                onChange={setGridLayer}
                language={language}
              />
            </div>
          </div>

          <MapContainer
            basemap={basemap}
            gridLayer={gridLayer}
            onGridLayerChange={setGridLayer}
            onGridClick={handleGridClick}
            onCoordinateSearch={handleGridClick}
            panelOpen={panelOpen}
          />
        </div>

        {/* Desktop side panel (Dengan lebar dinamis hasil drag) */}
        <div 
          className={`webgis-panel-desktop ${panelOpen ? "" : "closed"}`}
          style={{ width: panelOpen ? panelWidth : 0 }}
        >
          <div className="webgis-resize-handle" onMouseDown={startResize} />
          {selectedCoords && (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel} />
            </div>
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

/* ── GridLayerToggleInline ── */
const GridLayerToggleInline: React.FC<{
  current:  GridLayer;
  onChange: (l: GridLayer) => void;
  language: string;
}> = ({ current, onChange, language }) => {
  const [open, setOpen] = useState(false);
  const cfg = GRID_OPTIONS.find(o => o.key === current)!;
  const label = language === "id" ? cfg.labelId : cfg.labelEn;
  const desc  = language === "id" ? cfg.descId  : cfg.descEn;

  return (
    <div style={{ position: "relative" }}>
      <button
        className={`webgis-grid-btn${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
        title={language === "id" ? "Pilih layer grid" : "Select grid layer"}
      >
        <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
        <div style={{ textAlign: "left" as const, lineHeight: 1.25 }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{label}</div>
          <div style={{ fontFamily: SANS, fontSize: 9,  fontWeight: 400, color: "#64748b" }}>{desc}</div>
        </div>
        <Layers size={11} style={{ color: "#94a3b8", flexShrink: 0, marginLeft: 1 }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            background: "rgba(255,255,255,0.99)", borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.08)",
            overflow: "hidden", minWidth: 210, zIndex: 999,
          }}>
            <div style={{ padding: "8px 12px 7px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "#94a3b8", margin: 0 }}>
                {language === "id" ? "Model Grid" : "Grid Model"}
              </p>
            </div>
            {GRID_OPTIONS.map(opt => {
              const lbl = language === "id" ? opt.labelId : opt.labelEn;
              const dsc = language === "id" ? opt.descId  : opt.descEn;
              const active = current === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: active ? `${opt.color}10` : "none",
                    border: "none", cursor: "pointer",
                    textAlign: "left" as const,
                    borderBottom: "1px solid #f8fafc",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${opt.color}10` : "none"; }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: `${opt.color}18`, border: `1.5px solid ${opt.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 11, height: 11, borderRadius: 2, background: opt.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.3, color: active ? opt.color : "#0f172a" }}>{lbl}</p>
                    <p style={{ fontFamily: SANS, fontSize: 10.5, margin: 0, color: active ? opt.color : "#94a3b8", opacity: active ? 0.8 : 1 }}>{dsc}</p>
                  </div>
                  {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};