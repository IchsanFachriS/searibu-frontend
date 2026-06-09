import React, { useState, useEffect, useRef } from "react";
import { MapContainer }  from "../webgis/MapContainer";
import { InfoPanel }     from "../webgis/InfoPanel";
import { useLanguage }   from "../../context/LanguageContext";
import { Layers, Map, Satellite, LayoutGrid } from "lucide-react";
import type { BasemapType } from "../../types";
import { useSEO, PAGE_SEO } from "../../hooks/useSEO";

// "none" = no grid overlay (default)
export type GridLayer = "none" | "tpxo" | "ecmwf" | "smoc";

interface GridOption {
  key: GridLayer; color: string;
  labelEn: string; labelId: string;
  descEn: string;  descId: string;
}

const GRID_OPTIONS: GridOption[] = [
  { key:"none",  color:"#9a9a9a", labelEn:"No Grid",       labelId:"Tanpa Grid",    descEn:"Click location for data", descId:"Klik lokasi untuk data" },
  { key:"tpxo",  color:"#1a3bbf", labelEn:"TPXO10 Atlas",  labelId:"TPXO10 Atlas",  descEn:"Tidal prediction grid",        descId:"Grid prediksi pasut"           },
  { key:"ecmwf", color:"#b45309", labelEn:"ECMWF IFS",     labelId:"ECMWF IFS",     descEn:"Weather forecast (~9 km)",     descId:"Prakiraan cuaca (~9 km)"       },
  { key:"smoc",  color:"#0f766e", labelEn:"SMOC / MFWAM",  labelId:"SMOC / MFWAM",  descEn:"Wave & current (0.083°)",      descId:"Gelombang & arus (0,083°)"     },
];

/* ── Design tokens ── */
const FONT = "'Inter', system-ui, -apple-system, sans-serif";
const L = {
  bg:      "#ffffff",
  bg2:     "#f7f4ef",
  border:  "#e4ddd4",
  borderS: "#ccc5bb",
  text1:   "#1a1a1a",
  text2:   "#3d3d3d",
  text3:   "#6b6b6b",
  text4:   "#9a9a9a",
  blue:    "#1a3bbf",
  blueH:   "#142d99",
  blueL:   "#ddf0fb",
  shadow:  "0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)",
  shadowSm:"0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
};

const GRID_MAP_COLOR: Record<GridLayer, string> = {
  none:  "#9a9a9a",
  tpxo:  "#38bdf8",
  ecmwf: "#f59e0b",
  smoc:  "#34d399",
};

interface Coords { lat: number; lon: number }

/* ══════════════════════════════════════════════════════════
   BasemapToggle
══════════════════════════════════════════════════════════ */
const BasemapToggle: React.FC<{
  basemap: BasemapType;
  onChange: (b: BasemapType) => void;
  language: string;
}> = ({ basemap, onChange, language }) => (
  <div style={{
    display:"flex", alignItems:"center", gap:3,
    background: L.bg,
    border: `1.5px solid ${L.border}`,
    borderRadius: 10, padding: 3,
    boxShadow: L.shadow,
  }}
    onWheel={e=>e.stopPropagation()}
    onTouchMove={e=>e.stopPropagation()}
  >
    {(["osm","satellite"] as BasemapType[]).map(type => {
      const active = basemap === type;
      return (
        <button key={type} onClick={() => onChange(type)} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"6px 12px", borderRadius:7, border:"none",
          cursor:"pointer", fontFamily:FONT, fontSize:11, fontWeight:600,
          transition:"all 0.18s",
          background: active ? L.blue : "transparent",
          color: active ? "#fff" : L.text3,
          boxShadow: active ? "0 2px 8px rgba(26,59,191,0.30)" : "none",
          whiteSpace:"nowrap",
        }}
          onMouseEnter={e => { if (!active) { e.currentTarget.style.color=L.text1; e.currentTarget.style.background=L.bg2; }}}
          onMouseLeave={e => { if (!active) { e.currentTarget.style.color=L.text3; e.currentTarget.style.background="transparent"; }}}
        >
          {type==="osm" ? <Map size={12}/> : <Satellite size={12}/>}
          {type==="osm"
            ? (language==="id"?"Peta":"Map")
            : (language==="id"?"Satelit":"Sat.")}
        </button>
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════════════
   GridLayerToggle — includes "None" option
══════════════════════════════════════════════════════════ */
const GridLayerToggle: React.FC<{
  current: GridLayer;
  onChange: (l: GridLayer) => void;
  language: string;
}> = ({ current, onChange, language }) => {
  const [open, setOpen] = useState(false);
  const cfg  = GRID_OPTIONS.find(o => o.key === current)!;
  const dotC = GRID_MAP_COLOR[current];
  const isNone = current === "none";

  return (
    <div style={{position:"relative"}}
      onWheel={e=>e.stopPropagation()}
      onTouchMove={e=>e.stopPropagation()}
    >
      <button onClick={() => setOpen(o => !o)} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"6px 12px 6px 10px",
        background: open ? L.blueL : L.bg,
        border: `1.5px solid ${open ? L.blue : L.border}`,
        borderRadius:10, cursor:"pointer",
        boxShadow: L.shadow,
        transition:"all .18s",
        fontFamily:FONT,
      }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor=L.blue; e.currentTarget.style.background=L.blueL; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.background=L.bg; }}}
      >
        {/* Dot / icon */}
        {isNone
          ? <LayoutGrid size={12} style={{color:L.text4, flexShrink:0}}/>
          : <div style={{
              width:8, height:8, borderRadius:"50%",
              background: dotC, flexShrink:0,
              boxShadow: `0 0 0 2px ${dotC}30`,
            }}/>
        }
        <div>
          <div style={{fontSize:11, fontWeight:700, color: open?L.blue:(isNone?L.text3:L.text1), lineHeight:1.2, whiteSpace:"nowrap"}}>
            {language==="id" ? cfg.labelId : cfg.labelEn}
          </div>
          <div style={{fontSize:9, color:L.text4, lineHeight:1.1, whiteSpace:"nowrap"}}>
            {language==="id" ? cfg.descId : cfg.descEn}
          </div>
        </div>
        <Layers size={11} style={{color:open?L.blue:L.text4, flexShrink:0, marginLeft:2, transition:"color .15s"}}/>
      </button>

      {open && (<>
        <div style={{position:"fixed",inset:0,zIndex:376}} onClick={() => setOpen(false)}/>
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0,
          background: L.bg,
          border: `1.5px solid ${L.border}`,
          borderRadius:12, overflow:"hidden",
          minWidth:240, zIndex:377,
          boxShadow: L.shadow,
        }}>
          {/* Header */}
          <div style={{padding:"8px 14px 7px", borderBottom:`1px solid ${L.border}`, background:L.bg2}}>
            <span style={{fontFamily:FONT, fontSize:9.5, fontWeight:800, letterSpacing:"0.10em", textTransform:"uppercase" as const, color:L.text4}}>
              {language==="id"?"Overlay Grid":"Grid Overlay"}
            </span>
          </div>
          {/* Options */}
          {GRID_OPTIONS.map(opt => {
            const active = current === opt.key;
            const mc = GRID_MAP_COLOR[opt.key];
            const isNoneOpt = opt.key === "none";
            return (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }} style={{
                width:"100%", display:"flex", alignItems:"center", gap:11,
                padding:"10px 14px",
                background: active ? (isNoneOpt ? "rgba(0,0,0,0.04)" : L.blueL) : "none",
                border:"none", cursor:"pointer",
                textAlign:"left" as const,
                borderBottom: `1px solid ${L.border}`,
                transition:"background 0.12s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background=L.bg2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background="none"; }}
              >
                {/* Icon */}
                <div style={{
                  width:34, height:34, borderRadius:9, flexShrink:0,
                  background: active
                    ? (isNoneOpt ? "rgba(0,0,0,0.06)" : `${mc}18`)
                    : L.bg2,
                  border: `1.5px solid ${active
                    ? (isNoneOpt ? "#ccc5bb" : mc)
                    : L.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {isNoneOpt
                    ? <LayoutGrid size={14} style={{color: active ? L.text2 : L.text4}}/>
                    : <div style={{width:12, height:12, borderRadius:3, background:mc, opacity:active?1:0.65}}/>
                  }
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontFamily:FONT, fontSize:13, fontWeight:700, margin:0, lineHeight:1.3,
                    color:active ? (isNoneOpt ? L.text1 : L.blue) : L.text1}}>
                    {language==="id"?opt.labelId:opt.labelEn}
                  </p>
                  <p style={{fontFamily:FONT, fontSize:10.5, margin:0, color:L.text4}}>
                    {language==="id"?opt.descId:opt.descEn}
                  </p>
                </div>
                {active && (
                  <div style={{width:7,height:7,borderRadius:"50%",
                    background: isNoneOpt ? L.text3 : L.blue,
                    flexShrink:0}}/>
                )}
              </button>
            );
          })}
        </div>
      </>)}
    </div>
  );
};

/* ── WebGISPage ── */
export const WebGISPage: React.FC = () => {
  const { language } = useLanguage();
  const lang = language as "en" | "id";
  const [basemap,        setBasemap]        = useState<BasemapType>("satellite");
  const [panelOpen,      setPanelOpen]      = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  // Default = "none" → tidak ada grid overlay
  const [gridLayer,      setGridLayer]      = useState<GridLayer>("none");
  const [panelWidth,     setPanelWidth]     = useState(480);
  const isResizing = useRef(false);
  useSEO(PAGE_SEO.webgis[lang]);useSEO(PAGE_SEO.webgis[lang]);

  const handleGridClick = (coords: Coords) => { setSelectedCoords(coords); setPanelOpen(true); };
  const handleClosePanel = () => { setPanelOpen(false); setTimeout(()=>setSelectedCoords(null),400); };
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault(); isResizing.current=true;
    document.body.style.cursor="ew-resize"; document.body.style.userSelect="none";
  };

  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{if(!isResizing.current)return;const nw=window.innerWidth-e.clientX;if(nw>=340&&nw<=window.innerWidth*0.65)setPanelWidth(nw);};
    const onUp=()=>{if(isResizing.current){isResizing.current=false;document.body.style.cursor="default";document.body.style.userSelect="auto";}};
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[]);

  return (
    <>
      <style>{`
        html,body,#root{overscroll-behavior:none !important;overflow:hidden;height:100%;width:100%;}
        .wg-wrap{display:flex;height:calc(100vh - 70px);width:100%;overflow:hidden;margin-top:70px;position:relative;background:#1a1e2e;overscroll-behavior:none;touch-action:none;}
        .wg-map{position:relative;flex:1;min-width:0;overflow:hidden;overscroll-behavior:none;}
        .wg-toolbar{position:fixed;top:82px;left:12px;z-index:380;display:flex;align-items:center;gap:8px;overscroll-behavior:contain;touch-action:manipulation;}
        @media (min-width:769px){
          .wg-panel{position:relative;height:100%;background:#f7f4ef;flex-shrink:0;overflow:hidden;display:flex;transition:transform .35s cubic-bezier(.4,0,.2,1);}
          .wg-handle{position:absolute;top:0;left:0;bottom:0;width:4px;cursor:ew-resize;background:transparent;z-index:100;transition:background 0.2s;}
          .wg-handle:hover,.wg-handle:active{background:rgba(26,59,191,0.25);}
          .wg-panel.closed{transform:translateX(100%);position:absolute;right:0;}
          .wg-mob{display:none !important;}.wg-mob-bg{display:none !important;}
        }
        @media (max-width:768px){
          .wg-panel{display:none !important;}
          .wg-mob{position:fixed;left:0;right:0;bottom:0;z-index:500;height:75vh;max-height:75vh;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);border-radius:16px 16px 0 0;overflow:hidden;box-shadow:0 -4px 30px rgba(0,0,0,0.15);background:#f7f4ef;overscroll-behavior:contain;}
          .wg-mob.open{transform:translateY(0);}
          .wg-mob-handle{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:36px;height:4px;background:rgba(26,59,191,0.18);border-radius:2px;z-index:10;cursor:grab;}
          .wg-mob-bg{position:fixed;top:70px;left:0;right:0;bottom:0;z-index:499;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .3s;}
          .wg-mob-bg.on{opacity:1;pointer-events:auto;}
        }
        @media (max-width:480px){.wg-mob{height:82vh;max-height:82vh;}}
        @media (max-width:768px) and (orientation:landscape){
          .wg-mob{height:92vh;max-height:92vh;left:auto;right:0;top:70px;bottom:0;width:360px;max-width:360px;transform:translateX(100%);border-radius:0;}
          .wg-mob.open{transform:translateX(0);}
        }
      `}</style>

      <div className="wg-toolbar">
        <BasemapToggle basemap={basemap} onChange={setBasemap} language={language}/>
        <GridLayerToggle current={gridLayer} onChange={setGridLayer} language={language}/>
      </div>

      <div className="wg-wrap"
        onWheel={e=>e.preventDefault()}
        onTouchMove={e=>{if(!panelOpen)e.preventDefault();}}>

        <div className="wg-map">
          <MapContainer
            basemap={basemap} gridLayer={gridLayer}
            onGridLayerChange={setGridLayer}
            onGridClick={handleGridClick}
            onCoordinateSearch={handleGridClick}
            panelOpen={panelOpen}
          />
        </div>

        {/* Desktop panel */}
        <div className={`wg-panel ${panelOpen?"":"closed"}`} style={{width:panelOpen?panelWidth:0}}>
          <div className="wg-handle" onMouseDown={startResize}/>
          {selectedCoords && (
            <div style={{width:"100%",height:"100%",overflow:"hidden"}}>
              <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel}/>
            </div>
          )}
        </div>

        <div className={`wg-mob-bg ${panelOpen?"on":""}`} onClick={handleClosePanel}/>
        <div className={`wg-mob ${panelOpen?"open":""}`}>
          <div className="wg-mob-handle"/>
          {selectedCoords && <InfoPanel coordinates={selectedCoords} onClose={handleClosePanel}/>}
        </div>
      </div>
    </>
  );
};