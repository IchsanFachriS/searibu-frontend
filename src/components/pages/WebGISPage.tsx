import React, { useState, useEffect, useRef } from "react";
import { MapContainer }  from "../webgis/MapContainer";
import { InfoPanel }     from "../webgis/InfoPanel";
import { useLanguage }   from "../../context/LanguageContext";
import { Layers, Map, Satellite } from "lucide-react";
import type { BasemapType } from "../../types";

export type GridLayer = "tpxo" | "ecmwf" | "smoc";

interface GridOption {
  key: GridLayer; color: string;
  labelEn: string; labelId: string;
  descEn: string;  descId: string;
}

const GRID_OPTIONS: GridOption[] = [
  { key:"tpxo",  color:"#38bdf8", labelEn:"TPXO10 Atlas",        labelId:"TPXO10 Atlas",        descEn:"Tidal prediction",        descId:"Prediksi pasut"          },
  { key:"ecmwf", color:"#f59e0b", labelEn:"ECMWF IFS",    labelId:"ECMWF IFS",    descEn:"Weather forecast (~9 km)", descId:"Prakiraan cuaca (~9 km)" },
  { key:"smoc",  color:"#34d399", labelEn:"SMOC / MFWAM", labelId:"SMOC / MFWAM", descEn:"Wave & current (0.083°)",  descId:"Gelombang & arus (0,083°)"},
];

/* ── Design tokens ── */
const FONT  = "'Inter', system-ui, sans-serif";
const C = {
  bg:      "#0f1824",
  surface: "#111d2c",
  card:    "#152232",
  border:  "#1e3044",
  border2: "#243548",
  sky:     "#38bdf8",
  text1:   "#e8f4fd",
  text2:   "#7fa8c9",
  text3:   "#3d5a75",
};

interface Coords { lat: number; lon: number }

/* ══════════════════════════════════════════════════════════════════
   BasemapToggle — standalone pill
══════════════════════════════════════════════════════════════════ */
const BasemapToggle: React.FC<{
  basemap: BasemapType;
  onChange: (b: BasemapType) => void;
  language: string;
}> = ({ basemap, onChange, language }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 3,
    background: "rgba(15,24,36,0.90)",
    border: `1px solid ${C.border}`,
    borderRadius: 10, padding: 3,
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.40)",
  }}
    onWheel={e => e.stopPropagation()}
    onTouchMove={e => e.stopPropagation()}
  >
    {(["osm","satellite"] as BasemapType[]).map(type => {
      const active = basemap === type;
      return (
        <button key={type} onClick={() => onChange(type)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 11px", borderRadius: 7, border: "none",
            cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600,
            transition: "all 0.18s",
            background: active ? C.sky : "transparent",
            color: active ? C.bg : C.text3,
            boxShadow: active ? "0 2px 8px rgba(56,189,248,0.35)" : "none",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.text2; e.currentTarget.style.background = `rgba(255,255,255,0.06)`; }}}
          onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.text3; e.currentTarget.style.background = "transparent"; }}}
        >
          {type === "osm"
            ? <Map size={12} />
            : <Satellite size={12} />}
          {type === "osm"
            ? (language === "id" ? "Peta" : "Map")
            : (language === "id" ? "Satelit" : "Sat.")}
        </button>
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   GridLayerToggle — standalone pill with dropdown
══════════════════════════════════════════════════════════════════ */
const GridLayerToggle: React.FC<{
  current:  GridLayer;
  onChange: (l: GridLayer) => void;
  language: string;
}> = ({ current, onChange, language }) => {
  const [open, setOpen] = useState(false);
  const cfg = GRID_OPTIONS.find(o => o.key === current)!;

  return (
    <div style={{ position: "relative" }}
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
    >
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 11px 6px 9px",
          background: open ? "rgba(56,189,248,0.10)" : "rgba(15,24,36,0.90)",
          border: `1px solid ${open ? "rgba(56,189,248,0.30)" : C.border}`,
          borderRadius: 10, cursor: "pointer",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.40)",
          transition: "all .18s",
          fontFamily: FONT,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = `rgba(56,189,248,0.25)`; e.currentTarget.style.background = `rgba(56,189,248,0.07)`; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "rgba(15,24,36,0.90)"; }}}
      >
        {/* Color dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.color, flexShrink: 0,
          boxShadow: `0 0 6px ${cfg.color}80`,
        }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text1, lineHeight: 1.2, whiteSpace: "nowrap" }}>
            {language === "id" ? cfg.labelId : cfg.labelEn}
          </div>
          <div style={{ fontSize: 9, color: C.text3, lineHeight: 1.1, whiteSpace: "nowrap" }}>
            {language === "id" ? cfg.descId : cfg.descEn}
          </div>
        </div>
        <Layers size={11} style={{ color: open ? C.sky : C.text3, flexShrink: 0, marginLeft: 2, transition: "color .15s" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 376 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            background: "rgba(15,24,36,0.97)",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            minWidth: 220,
            zIndex: 377,
            boxShadow: "0 16px 40px rgba(0,0,0,0.60)",
            backdropFilter: "blur(16px)",
          }}>
            {/* Header */}
            <div style={{ padding: "8px 12px 7px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.text3 }}>
                {language === "id" ? "Model Grid" : "Grid Model"}
              </span>
            </div>
            {/* Options */}
            {GRID_OPTIONS.map(opt => {
              const active = current === opt.key;
              const lbl = language === "id" ? opt.labelId : opt.labelEn;
              const dsc = language === "id" ? opt.descId  : opt.descEn;
              return (
                <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 13px",
                    background: active ? `rgba(56,189,248,0.07)` : "none",
                    border: "none", cursor: "pointer",
                    textAlign: "left" as const,
                    borderBottom: `1px solid ${C.border}`,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = `rgba(255,255,255,0.03)`; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}
                >
                  {/* Icon box */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${opt.color}12`,
                    border: `1.5px solid ${opt.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: opt.color, opacity: active ? 1 : 0.7 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, margin: 0, lineHeight: 1.3, color: active ? opt.color : C.text1 }}>{lbl}</p>
                    <p style={{ fontFamily: FONT, fontSize: 10.5, margin: 0, color: C.text3 }}>{dsc}</p>
                  </div>
                  {active && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: opt.color, flexShrink: 0, boxShadow: `0 0 6px ${opt.color}` }} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   WebGISPage
══════════════════════════════════════════════════════════════════ */
export const WebGISPage: React.FC = () => {
  const { language } = useLanguage();
  const [basemap,        setBasemap]        = useState<BasemapType>("satellite");
  const [panelOpen,      setPanelOpen]      = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [gridLayer,      setGridLayer]      = useState<GridLayer>("tpxo");
  const [panelWidth,     setPanelWidth]     = useState(480);
  const isResizing = useRef(false);

  const handleGridClick = (coords: Coords) => {
    setSelectedCoords(coords);
    setPanelOpen(true);
  };
  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedCoords(null), 400);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 340 && newWidth <= window.innerWidth * 0.65) setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, []);

  return (
    <>
      <style>{`
        html, body, #root {
          overscroll-behavior: none !important;
          overflow: hidden;
          height: 100%; width: 100%;
        }

        /* ── Map wrapper ── */
        .webgis-wrapper {
          display: flex;
          height: calc(100vh - 70px);
          width: 100%;
          overflow: hidden;
          margin-top: 70px;
          position: relative;
          background: #0f1824;
          overscroll-behavior: none;
          touch-action: none;
        }
        .webgis-map-area {
          position: relative;
          flex: 1; min-width: 0;
          overflow: hidden;
          overscroll-behavior: none;
        }

        /* ── Toolbar: two separate pills, fixed ──────────────────────
           z-index 380 — below navbar (500), mobile drawer (400), overlay (390)
           Top: 82px = navbar (70) + gap (12)
        ─────────────────────────────────────────────────────────────── */
        .webgis-toolbar {
          position: fixed;
          top: 82px;
          left: 12px;
          z-index: 380;
          display: flex;
          align-items: center;
          gap: 8px;
          overscroll-behavior: contain;
          touch-action: manipulation;
        }

        /* ── Desktop side panel ── */
        @media (min-width: 769px) {
          .webgis-panel-desktop {
            position: relative;
            height: 100%;
            background: #0f1824;
            flex-shrink: 0;
            overflow: hidden;
            display: flex;
            transition: transform .35s cubic-bezier(.4,0,.2,1);
          }
          .webgis-resize-handle {
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 4px;
            cursor: ew-resize;
            background: transparent;
            z-index: 100;
            transition: background 0.2s;
          }
          .webgis-resize-handle:hover,
          .webgis-resize-handle:active { background: rgba(56,189,248,0.35); }
          .webgis-panel-desktop.closed {
            transform: translateX(100%);
            position: absolute; right: 0;
          }
          .webgis-panel-mobile    { display: none !important; }
          .webgis-mobile-backdrop { display: none !important; }
        }

        /* ── Mobile panel — FIXED: top accounts for navbar (70px) ── */
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
            box-shadow: 0 -8px 40px rgba(0,0,0,0.60);
            background: #0f1824;
            overscroll-behavior: contain;
          }
          .webgis-panel-mobile.open { transform: translateY(0); }

          .mobile-drag-handle {
            position: absolute; top: 8px; left: 50%;
            transform: translateX(-50%);
            width: 36px; height: 4px;
            background: rgba(56,189,248,0.18);
            border-radius: 2px; z-index: 10;
            cursor: grab;
          }

          /* Backdrop sits below navbar — zIndex 499 */
          .webgis-mobile-backdrop {
            position: fixed;
            /* Top at navbar bottom so it doesn't cover navbar */
            top: 70px;
            left: 0; right: 0; bottom: 0;
            z-index: 499;
            background: rgba(0,0,0,0.45);
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

        /* Landscape phone */
        @media (max-width: 768px) and (orientation: landscape) {
          .webgis-panel-mobile {
            height: 90vh; max-height: 90vh;
            left: auto; right: 0;
            /* Start BELOW navbar */
            top: 70px; bottom: 0;
            width: 340px; max-width: 340px;
            transform: translateX(100%);
            border-radius: 0;
          }
          .webgis-panel-mobile.open { transform: translateX(0); }
        }
      `}</style>

      {/* ── Toolbar: two separate pills ── */}
      <div className="webgis-toolbar">
        {/* Pill 1: Basemap toggle */}
        <BasemapToggle basemap={basemap} onChange={setBasemap} language={language} />
        {/* Pill 2: Grid layer toggle */}
        <GridLayerToggle current={gridLayer} onChange={setGridLayer} language={language} />
      </div>

      <div className="webgis-wrapper"
        onWheel={e => e.preventDefault()}
        onTouchMove={e => { if (!panelOpen) e.preventDefault(); }}
      >
        {/* Map */}
        <div className="webgis-map-area">
          <MapContainer
            basemap={basemap}
            gridLayer={gridLayer}
            onGridLayerChange={setGridLayer}
            onGridClick={handleGridClick}
            onCoordinateSearch={handleGridClick}
            panelOpen={panelOpen}
          />
        </div>

        {/* Desktop side panel */}
        <div className={`webgis-panel-desktop ${panelOpen ? "" : "closed"}`} style={{ width: panelOpen ? panelWidth : 0 }}>
          <div className="webgis-resize-handle" onMouseDown={startResize} />
          {selectedCoords && (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel} />
            </div>
          )}
        </div>

        {/* Mobile backdrop — below navbar */}
        <div className={`webgis-mobile-backdrop ${panelOpen ? "visible" : ""}`} onClick={handleClosePanel} />

        {/* Mobile bottom sheet */}
        <div className={`webgis-panel-mobile ${panelOpen ? "open" : ""}`}>
          <div className="mobile-drag-handle" />
          {selectedCoords && <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel} />}
        </div>
      </div>
    </>
  );
};