import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, MapPin, ChevronDown, ChevronUp, Locate, Layers } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { BasemapType } from "../../types";
import type { GridLayer } from "../pages/WebGISPage";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* ── Design tokens — light/white, index.css palette ── */
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const L_ = {
  bg:      "#ffffff",
  bg2:     "#f7f4ef",
  bg3:     "#f2ede6",
  border:  "#e4ddd4",
  borderS: "#ccc5bb",
  text1:   "#1a1a1a",
  text2:   "#3d3d3d",
  text3:   "#6b6b6b",
  text4:   "#9a9a9a",
  blue:    "#1a3bbf",
  blueH:   "#142d99",
  blueL:   "#ddf0fb",
  amber:   "#f5c518",
  shadow:  "0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
  shadowSm:"0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
};

/* Marker accent colors — kept vibrant for map visibility */
const ISLAND_COLOR = "#0ea5e9";
const LUWES_COLOR  = "#ef4444";
const PORT_COLOR   = "#475569";

/* ── Grid config ── */
interface GridConfig {
  file: string; color: string; fillColor: string;
  labelEn: string; labelId: string; tipEn: string; tipId: string;
}
const GRID_CONFIG: Record<GridLayer, GridConfig> = {
  tpxo:  { file:"/GRID_TPXO_SERIBU.geojson",       color:"#3b82f6", fillColor:"#3b82f6", labelEn:"TPXO9",        labelId:"TPXO9",        tipEn:"Click for tide & weather",      tipId:"Klik untuk pasut & cuaca"      },
  ecmwf: { file:"/GRID_ECMWF_SERIBU.geojson",       color:"#f59e0b", fillColor:"#f59e0b", labelEn:"ECMWF IFS",    labelId:"ECMWF IFS",    tipEn:"Click for weather forecast",    tipId:"Klik untuk prakiraan cuaca"    },
  smoc:  { file:"/GRID_SMOC-MFWAM_SERIBU.geojson",  color:"#10b981", fillColor:"#10b981", labelEn:"SMOC / MFWAM", labelId:"SMOC / MFWAM", tipEn:"Click for wave & current data", tipId:"Klik untuk gelombang & arus"  },
};

interface Island {
  id: string; name: string; nameEn: string;
  lat: number; lon: number; adminZone: string;
  descId: string; descEn: string; facilities: string[];
}
interface MapContainerProps {
  basemap: BasemapType; gridLayer: GridLayer;
  onGridLayerChange: (layer: GridLayer) => void;
  onGridClick?: (coords: { lat: number; lon: number }) => void;
  onCoordinateSearch?: (coords: { lat: number; lon: number }) => void;
  panelOpen?: boolean;
}

const ISLANDS: Island[] = [
  { id:"bidadari",    name:"Pulau Bidadari",    nameEn:"Bidadari Island",    lat:-6.035347, lon:106.746234, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau resort terdekat dari Jakarta, dilengkapi cottage, kolam renang, dan situs benteng VOC abad ke-17.", descEn:"Closest resort island to Jakarta with cottages, pools, and a 17th-century VOC fortress ruin.", facilities:["Cottage","Restoran","Snorkeling","Diving","Benteng Martello"] },
  { id:"tidung",      name:"Pulau Tidung",      nameEn:"Tidung Island",      lat:-5.797360, lon:106.497220, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau terpopuler dengan Jembatan Cinta ikonik.", descEn:"Most popular island featuring the iconic Love Bridge.", facilities:["Jembatan Cinta","Sewa Sepeda","Snorkeling","Penginapan","Restoran"] },
  { id:"pari",        name:"Pulau Pari",        nameEn:"Pari Island",        lat:-5.857626, lon:106.617560, adminZone:"Kepulauan Seribu Selatan", descId:"Terkenal dengan hamparan bintang laut dan padang lamun.", descEn:"Famous for starfish and seagrass beds.", facilities:["Snorkeling","Bintang Laut","Padang Lamun","Penelitian LIPI","Penginapan"] },
  { id:"kelapa",      name:"Pulau Kelapa",      nameEn:"Kelapa Island",      lat:-5.653659, lon:106.569023, adminZone:"Kepulauan Seribu Utara",   descId:"Pulau dengan fasilitas lengkap dan akses ke spot diving terbaik.", descEn:"Well-equipped island with access to top diving spots.", facilities:["Diving","Snorkeling","Cottage","Restoran","Speedboat Charter"] },
  { id:"pramuka",     name:"Pulau Pramuka",     nameEn:"Pramuka Island",     lat:-5.745159, lon:106.613782, adminZone:"Kepulauan Seribu Utara",   descId:"Pusat administrasi Kabupaten Kepulauan Seribu.", descEn:"Administrative centre of Kepulauan Seribu.", facilities:["Resort Bintang 4","Kolam Renang","Tennis","Diving","Spa"] },
  { id:"untung_jawa", name:"Pulau Untung Jawa", nameEn:"Untung Jawa Island", lat:-5.977321, lon:106.705921, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau terdekat dari Muara Angke.", descEn:"Closest island to Muara Angke.", facilities:["Pantai Berpasir","Warung Makan","Banana Boat","Snorkeling"] },
  { id:"kotok",       name:"Pulau Kotok",       nameEn:"Kotok Island",       lat:-5.700621, lon:106.538661, adminZone:"Kepulauan Seribu Utara",   descId:"Kawasan konservasi penyu dengan spot diving kelas dunia.", descEn:"Sea turtle conservation area with world-class diving spots.", facilities:["Konservasi Penyu","Diving","Snorkeling","Resort Ekologi"] },
  { id:"putri",       name:"Pulau Putri",       nameEn:"Putri Island",       lat:-5.593901, lon:106.560171, adminZone:"Kepulauan Seribu Utara",   descId:"Pulau resort premium dengan underwater observatory.", descEn:"Premium resort island with an underwater observatory.", facilities:["Underwater Observatory","Resort Premium","Snorkeling","Glass Bottom Boat"] },
  { id:"ayer",        name:"Pulau Ayer",        nameEn:"Ayer Island",        lat:-5.763737, lon:106.583138, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau resort bergaya vintage dengan bungalow terapung.", descEn:"Vintage-style resort island featuring iconic overwater bungalows.", facilities:["Bungalow Terapung","Restoran Seafood","Snorkeling","Kayak"] },
  { id:"rambut",      name:"Pulau Rambut",      nameEn:"Rambut Island",      lat:-5.975101, lon:106.692101, adminZone:"Kepulauan Seribu Selatan", descId:"Suaka margasatwa untuk koloni burung laut.", descEn:"Wildlife sanctuary for seabird colonies.", facilities:["Birdwatching","Mangrove","Suaka Burung"] },
  { id:"lancang",     name:"Pulau Lancang",     nameEn:"Lancang Island",     lat:-5.929764, lon:106.586512, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau nelayan tradisional dengan potensi memancing.", descEn:"Traditional fishing island.", facilities:["Memancing","Snorkeling","Penginapan Sederhana"] },
  { id:"bokor",       name:"Pulau Bokor",       nameEn:"Bokor Island",       lat:-5.978006, lon:106.706506, adminZone:"Kepulauan Seribu Selatan", descId:"Pulau kecil tak berpenghuni, ideal untuk piknik.", descEn:"Small uninhabited island, ideal for a picnic.", facilities:["Pantai Sepi","Snorkeling","Piknik"] },
];

const PORT_LOCATIONS = [
  { id:"marina_ancol", name:"Marina Ancol", lat:-6.122, lon:106.833, descId:"Pelabuhan utama untuk kapal cepat ke pulau-pulau resort", descEn:"Main port for speedboats to resort islands" },
  { id:"muara_angke",  name:"Muara Angke",  lat:-6.108, lon:106.740, descId:"Pelabuhan kapal tradisional, lebih ekonomis",             descEn:"Traditional ferry port, more economical option" },
];
const LUWES_STATION = {
  name:"Sta. Pasut Luwes", nameEn:"Luwes Tidal Station",
  lat:-5.7439, lon:106.6128,
  descId:"Stasiun pengamatan pasut otomatis Luwes milik PT Luwes Inovasi Mandiri.",
  descEn:"Luwes automatic tide gauge station operated by PT Luwes Inovasi Mandiri.",
};
const BASEMAPS = {
  osm:       { url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                                                  attribution:"&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" },
  satellite: { url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution:"Tiles &copy; Esri" },
};

/* ══════════════════════════════════════════════════════════
   Popup HTML builders — light theme
══════════════════════════════════════════════════════════ */
function buildIslandPopup(island: Island, language: string): string {
  const title  = language==="id" ? island.name   : island.nameEn;
  const desc   = language==="id" ? island.descId : island.descEn;
  const facLbl = language==="id" ? "Fasilitas"   : "Facilities";
  const pills  = island.facilities.map(f =>
    `<span style="display:inline-block;padding:3px 10px;border-radius:99px;background:${L_.blueL};border:1px solid rgba(26,59,191,0.20);color:${L_.blue};font-size:11px;font-weight:600;margin:3px 3px 0 0;font-family:${SANS};line-height:1.4;white-space:nowrap;">${f}</span>`
  ).join("");
  return `
<div style="font-family:${SANS};background:${L_.bg};border-radius:14px;overflow:hidden;width:270px;max-width:calc(100vw - 48px);box-shadow:0 12px 32px rgba(0,0,0,0.14);">
  <div style="background:${L_.bg2};padding:14px 16px 12px;position:relative;border-bottom:1px solid ${L_.border};">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,${L_.blue},#4fd4e8);"></div>
    <div style="display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:99px;background:${L_.blueL};border:1px solid rgba(26,59,191,0.18);font-size:9.5px;font-weight:800;color:${L_.blue};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:9px;">${language==="id"?"Pulau Wisata":"Tourism Island"}</div>
    <p style="font-size:16px;font-weight:800;color:${L_.text1};margin:0 0 3px;line-height:1.2;letter-spacing:-0.01em;">${title}</p>
    <p style="font-size:11px;color:${L_.text3};margin:0;font-weight:500;">${island.adminZone}</p>
  </div>
  <div style="padding:14px 16px 16px;">
    <p style="font-size:12.5px;color:${L_.text2};line-height:1.65;margin:0 0 12px;">${desc}</p>
    <p style="font-size:9.5px;color:${L_.text4};font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 7px;">${facLbl}</p>
    <div style="display:flex;flex-wrap:wrap;">${pills}</div>
  </div>
</div>`;
}

function buildPortPopup(port: typeof PORT_LOCATIONS[0], language: string): string {
  const desc  = language==="id" ? port.descId : port.descEn;
  const badge = language==="id" ? "Pelabuhan" : "Port";
  return `
<div style="font-family:${SANS};background:${L_.bg};border-radius:14px;overflow:hidden;width:250px;max-width:calc(100vw - 48px);box-shadow:0 12px 32px rgba(0,0,0,0.14);">
  <div style="background:${L_.bg2};padding:14px 16px 12px;position:relative;border-bottom:1px solid ${L_.border};">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,${PORT_COLOR},#94a3b8);"></div>
    <div style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;background:${L_.bg3};border:1px solid ${L_.border};font-size:9.5px;font-weight:800;color:${L_.text3};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:9px;">${badge}</div>
    <p style="font-size:16px;font-weight:800;color:${L_.text1};margin:0;line-height:1.2;letter-spacing:-0.01em;">${port.name}</p>
  </div>
  <div style="padding:14px 16px 16px;">
    <p style="font-size:12.5px;color:${L_.text2};line-height:1.65;margin:0;">${desc}</p>
  </div>
</div>`;
}

function buildLuwesPopup(language: string): string {
  const title  = language==="id" ? LUWES_STATION.name    : LUWES_STATION.nameEn;
  const desc   = language==="id" ? LUWES_STATION.descId  : LUWES_STATION.descEn;
  const badge  = language==="id" ? "Stasiun Pasut"       : "Tide Station";
  const coords = `${Math.abs(LUWES_STATION.lat).toFixed(4)}°S · ${LUWES_STATION.lon.toFixed(4)}°E`;
  return `
<div style="font-family:${SANS};background:${L_.bg};border-radius:14px;overflow:hidden;width:275px;max-width:calc(100vw - 48px);box-shadow:0 12px 32px rgba(0,0,0,0.14);">
  <div style="background:${L_.bg2};padding:14px 16px 12px;position:relative;border-bottom:1px solid ${L_.border};">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,${LUWES_COLOR},#f87171);"></div>
    <div style="display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:99px;background:#fee2e2;border:1px solid rgba(220,38,38,0.22);font-size:9.5px;font-weight:800;color:#dc2626;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:9px;">${badge}</div>
    <p style="font-size:16px;font-weight:800;color:${L_.text1};margin:0 0 6px;line-height:1.2;letter-spacing:-0.01em;">${title}</p>
    <div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;background:${L_.bg3};border:1px solid ${L_.border};">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="${L_.text4}" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
      <span style="font-size:10px;font-weight:600;color:${L_.text3};">${coords}</span>
    </div>
  </div>
  <div style="padding:14px 16px 16px;">
    <p style="font-size:12.5px;color:${L_.text2};line-height:1.65;margin:0 0 12px;">${desc}</p>
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#dcfce7;border:1px solid rgba(21,128,61,0.20);border-radius:9px;">
      <span style="display:block;width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 6px #16a34a;flex-shrink:0;animation:luwes-pulse 2s ease-in-out infinite;"></span>
      <span style="font-size:11px;font-weight:700;color:#15803d;">${language==="id"?"Telemetri real-time aktif":"Real-time telemetry active"}</span>
    </div>
  </div>
</div>
<style>@keyframes luwes-pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}</style>`;
}

/* ── Icon factories (unchanged) ── */
function createIslandIcon(): L.DivIcon {
  const size = 26;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+8}" viewBox="0 0 ${size} ${size+8}"><defs><filter id="isl-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs><circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${ISLAND_COLOR}" stroke="#fff" stroke-width="2.5" filter="url(#isl-glow)" opacity="0.95"/><circle cx="${size/2}" cy="${size/2}" r="${size/2-6}" fill="rgba(255,255,255,0.25)"/><line x1="${size/2}" y1="${size-2}" x2="${size/2}" y2="${size+6}" stroke="${ISLAND_COLOR}" stroke-width="2" stroke-linecap="round"/></svg>`.trim();
  return L.divIcon({html:svg,className:"",iconSize:[size,size+8],iconAnchor:[size/2,size+8],popupAnchor:[0,-(size+8)]});
}
function createLuwesIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32"><defs><filter id="l-sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(239,68,68,0.55)"/></filter></defs><polygon points="13,2 23,7.5 23,20.5 13,26 3,20.5 3,7.5" fill="${LUWES_COLOR}" stroke="rgba(255,255,255,0.90)" stroke-width="1.5" filter="url(#l-sh)"/><text x="13" y="17.5" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="10" font-weight="800">T</text></svg>`.trim();
  return L.divIcon({html:svg,className:"",iconSize:[26,32],iconAnchor:[13,32],popupAnchor:[0,-34]});
}
function createPortIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><defs><filter id="p-sh"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.30)"/></filter></defs><path d="M12 2L22 8L22 20L12 26L2 20L2 8Z" fill="${PORT_COLOR}" stroke="rgba(255,255,255,0.80)" stroke-width="1.5" filter="url(#p-sh)"/><text x="12" y="17" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="9" font-weight="800">P</text></svg>`.trim();
  return L.divIcon({html:svg,className:"",iconSize:[24,28],iconAnchor:[12,28],popupAnchor:[0,-30]});
}

/* ══════════════════════════════════════════════════════════
   LegendPanel — white card
══════════════════════════════════════════════════════════ */
const LegendPanel: React.FC<{language: string; activeGrid: GridLayer; defaultCollapsed?: boolean}> = ({language, activeGrid, defaultCollapsed=false}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const gc = GRID_CONFIG[activeGrid];
  const items = [
    { dot: <svg width="11" height="13" viewBox="0 0 26 34"><circle cx="13" cy="13" r="11" fill={ISLAND_COLOR} stroke="#fff" strokeWidth="2" opacity="0.95"/><circle cx="13" cy="13" r="6" fill="rgba(255,255,255,0.25)"/><line x1="13" y1="24" x2="13" y2="32" stroke={ISLAND_COLOR} strokeWidth="2" strokeLinecap="round"/></svg>, label: language==="id"?"Pulau Wisata":"Tourism Island" },
    { dot: <svg width="11" height="12" viewBox="0 0 24 28"><path d="M12 2L22 8L22 20L12 26L2 20L2 8Z" fill={PORT_COLOR} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/><text x="12" y="17" textAnchor="middle" fill="#e2e8f0" fontFamily="sans-serif" fontSize="9" fontWeight="800">P</text></svg>, label: language==="id"?"Pelabuhan":"Port" },
    { dot: <svg width="11" height="13" viewBox="0 0 26 32"><polygon points="13,2 23,7.5 23,20.5 13,26 3,20.5 3,7.5" fill={LUWES_COLOR} stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/><text x="13" y="17.5" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="10" fontWeight="800">T</text></svg>, label: language==="id"?"Sta. Pasut":"Tide Station" },
    { dot: <div style={{width:11,height:11,borderRadius:2,background:`${gc.fillColor}28`,border:`1.5px solid ${gc.color}`}}/>, label: language==="id"?`Grid ${gc.labelId}`:`${gc.labelEn} Grid` },
  ];
  return (
    <div style={{
      background: L_.bg,
      border: `1.5px solid ${L_.border}`,
      borderRadius:10, overflow:"hidden",
      boxShadow: L_.shadow,
      width: collapsed ? "auto" : 162,
      minWidth: collapsed ? 0 : 162,
    }}>
      <button onClick={() => setCollapsed(c=>!c)} style={{
        width:"100%", display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding:"7px 10px",
        background:"none", border:"none", cursor:"pointer",
        borderBottom: collapsed ? "none" : `1px solid ${L_.border}`,
        gap:6, whiteSpace:"nowrap",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Layers size={12} style={{color:L_.blue}}/>
          {!collapsed && (
            <span style={{fontFamily:SANS,fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:L_.text3}}>
              {language==="id"?"Legenda":"Legend"}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={11} style={{color:L_.text4}}/> : <ChevronUp size={11} style={{color:L_.text4}}/>}
      </button>
      {!collapsed && (
        <div style={{padding:"5px 0 7px", background:L_.bg}}
          onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
          {items.map((item,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"4px 12px"}}>
              <div style={{width:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {item.dot}
              </div>
              <span style={{fontFamily:SANS,fontSize:11,fontWeight:500,color:L_.text2,whiteSpace:"nowrap"}}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   GridLayerToggle inline (inside map) — white card
══════════════════════════════════════════════════════════ */
const GridLayerToggleInline: React.FC<{current: GridLayer; onChange: (l: GridLayer) => void; language: string}> = ({current, onChange, language}) => {
  const [open, setOpen] = useState(false);
  const cfg = GRID_CONFIG[current];
  const label = language==="id" ? cfg.labelId : cfg.labelEn;

  return (
    <div style={{position:"relative"}}>
      <button
        className={`wg-grid-btn${open?" open":""}`}
        onClick={() => setOpen(o=>!o)}
        title={language==="id"?"Pilih layer grid":"Select grid layer"}
      >
        <div style={{width:8,height:8,borderRadius:2,background:cfg.color,flexShrink:0}}/>
        <div style={{textAlign:"left" as const,lineHeight:1.25}}>
          <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,color:open?L_.blue:L_.text1}}>{label}</div>
          <div style={{fontFamily:SANS,fontSize:9,fontWeight:400,color:L_.text4}}>{language==="id"?cfg.tipId:cfg.tipEn}</div>
        </div>
        <Layers size={11} style={{color:open?L_.blue:L_.text4,flexShrink:0,marginLeft:1,transition:"color .15s"}}/>
      </button>

      {open && (<>
        <div style={{position:"fixed",inset:0,zIndex:376}} onClick={() => setOpen(false)}/>
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,background:L_.bg,borderRadius:12,boxShadow:L_.shadow,border:`1.5px solid ${L_.border}`,overflow:"hidden",minWidth:230,zIndex:377}}>
          {/* Header */}
          <div style={{padding:"8px 14px 7px",borderBottom:`1px solid ${L_.border}`,background:L_.bg2}}>
            <span style={{fontFamily:SANS,fontSize:9.5,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase" as const,color:L_.text4}}>
              {language==="id"?"Model Grid":"Grid Model"}
            </span>
          </div>
          {/* Options */}
          {(Object.keys(GRID_CONFIG) as GridLayer[]).map(key => {
            const opt=GRID_CONFIG[key], active=current===key;
            return (
              <button key={key} onClick={() => { onChange(key); setOpen(false); }} style={{
                width:"100%",display:"flex",alignItems:"center",gap:11,
                padding:"10px 14px",
                background: active ? L_.blueL : "none",
                border:"none",cursor:"pointer",
                textAlign:"left" as const,
                borderBottom:`1px solid ${L_.border}`,
                transition:"background 0.12s",
              }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=L_.bg2;}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
                <div style={{
                  width:34,height:34,borderRadius:9,flexShrink:0,
                  background:active?`${opt.color}18`:L_.bg2,
                  border:`1.5px solid ${active?opt.color:L_.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  <div style={{width:12,height:12,borderRadius:3,background:opt.color,opacity:active?1:0.65}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:SANS,fontSize:13,fontWeight:700,margin:0,lineHeight:1.3,color:active?L_.blue:L_.text1}}>
                    {language==="id"?opt.labelId:opt.labelEn}
                  </p>
                  <p style={{fontFamily:SANS,fontSize:10.5,margin:0,color:L_.text4}}>
                    {language==="id"?opt.tipId:opt.tipEn}
                  </p>
                </div>
                {active && <div style={{width:7,height:7,borderRadius:"50%",background:L_.blue,flexShrink:0}}/>}
              </button>
            );
          })}
        </div>
      </>)}
    </div>
  );
};

/* ── BottomSearchBar ── */
const BottomSearchBar: React.FC<{
  language: string;
  onIslandSelect: (island: Island) => void;
  onCoordinateSearch: (lat: number, lon: number) => void;
  panelOpen: boolean;
  isMobile: boolean;
}> = ({language, onIslandSelect, onCoordinateSearch, panelOpen, isMobile}) => {
  const [query,   setQuery]   = useState("");
  const [focused, setFocused] = useState(false);
  const [locating,setLocating]= useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length >= 1
    ? ISLANDS.filter(isl => {
        const q = query.toLowerCase();
        return isl.name.toLowerCase().includes(q) || isl.nameEn.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];
  const showDropdown = focused && results.length > 0;

  const handleSelect = (island: Island) => {
    setQuery(""); setFocused(false); inputRef.current?.blur();
    onIslandSelect(island);
  };
  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocating(false); onCoordinateSearch(pos.coords.latitude, pos.coords.longitude); },
      () => setLocating(false),
      {timeout:8000, maximumAge:30000}
    );
  };

  if (isMobile && panelOpen) return null;

  return (
    <div style={{position:"relative",width:"100%"}}>
      {showDropdown && (
        <div style={{
          position:"absolute",bottom:"100%",left:0,right:0,marginBottom:6,
          background:L_.bg,border:`1.5px solid ${L_.blue}`,
          borderRadius:12,overflow:"hidden",boxShadow:L_.shadow,zIndex:2100,
        }}
          onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
          {results.map((isl,idx) => (
            <button key={isl.id} onMouseDown={() => handleSelect(isl)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,
              padding:"10px 14px",background:"none",border:"none",
              borderBottom:idx<results.length-1?`1px solid ${L_.border}`:"none",
              cursor:"pointer",textAlign:"left" as const,transition:"background 0.12s",
            }}
              onMouseEnter={e=>(e.currentTarget.style.background=L_.bg2)}
              onMouseLeave={e=>(e.currentTarget.style.background="none")}>
              <div style={{width:30,height:30,borderRadius:8,background:L_.blueL,border:`1px solid rgba(26,59,191,0.20)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <MapPin size={13} style={{color:L_.blue}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:SANS,fontSize:13,fontWeight:700,color:L_.text1,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {language==="id"?isl.name:isl.nameEn}
                </p>
                <p style={{fontFamily:SANS,fontSize:11,color:L_.text4,margin:0}}>{isl.adminZone}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{
        display:"flex",alignItems:"center",gap:6,
        background:L_.bg,
        border: focused ? `1.5px solid ${L_.blue}` : `1.5px solid ${L_.border}`,
        borderRadius:14,padding:"7px 7px 7px 14px",
        boxShadow: focused ? `${L_.shadow}, 0 0 0 3px rgba(26,59,191,0.10)` : L_.shadow,
        transition:"border-color 0.18s, box-shadow 0.18s",
        boxSizing:"border-box" as const,
        overscrollBehavior:"contain" as const,
        touchAction:"manipulation" as const,
      }}
        onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
        <Search size={15} style={{color:focused?L_.blue:L_.text4,flexShrink:0,transition:"color 0.18s"}}/>
        <input
          ref={inputRef} type="text" value={query}
          onChange={e=>setQuery(e.target.value)}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setTimeout(()=>setFocused(false),160)}
          placeholder={language==="id"?"Cari pulau...":"Search island..."}
          style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:13,fontWeight:500,fontFamily:SANS,color:L_.text1,minWidth:0}}
        />
        {query && (
          <button onClick={()=>setQuery("")} style={{background:"none",border:"none",cursor:"pointer",color:L_.text4,padding:4,display:"flex",flexShrink:0}}>
            <X size={13}/>
          </button>
        )}
        <button onClick={handleMyLocation} disabled={locating}
          title={language==="id"?"Lokasi saya":"My location"}
          style={{
            width:36,height:36,borderRadius:10,border:`1.5px solid ${L_.border}`,
            background:L_.bg2,cursor:locating?"wait":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            transition:"all 0.18s",
          }}
          onMouseEnter={e=>{if(!locating){e.currentTarget.style.background=L_.blueL;e.currentTarget.style.borderColor=L_.blue;}}}
          onMouseLeave={e=>{if(!locating){e.currentTarget.style.background=L_.bg2;e.currentTarget.style.borderColor=L_.border;}}}>
          {locating
            ? <div style={{width:14,height:14,border:`2px solid ${L_.blue}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"wg-spin 0.8s linear infinite"}}/>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={L_.blue} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
          }
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MapContainer
══════════════════════════════════════════════════════════ */
export const MapContainer: React.FC<MapContainerProps> = ({
  basemap, gridLayer, onGridLayerChange,
  onGridClick, onCoordinateSearch, panelOpen=false,
}) => {
  const { language } = useLanguage();
  const mapRef            = useRef<L.Map | null>(null);
  const mapContainerRef   = useRef<HTMLDivElement>(null);
  const tileLayerRef      = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef   = useRef<L.GeoJSON | null>(null);
  const islandMarkersRef  = useRef<L.Marker[]>([]);
  const portMarkersRef    = useRef<L.Marker[]>([]);
  const luwesMarkerRef    = useRef<L.Marker | null>(null);
  // ── Ref untuk melacak sel grid yang sedang aktif/dipilih ─────────────────
  const selectedLayerRef  = useRef<L.Path | null>(null);
  // ── Ref untuk onGridClick — JANGAN masukkan ke dependency array grid ──────
  // Tanpa ini: setiap panel dibuka/tutup → onGridClick referensi baru
  // → grid layer rebuild → fitBounds terpanggil lagi → zoom reset.
  const onGridClickRef    = useRef(onGridClick);
  useEffect(() => { onGridClickRef.current = onGridClick; }, [onGridClick]);
  // ── Flag fitBounds per gridLayer: hanya sekali saat layer pertama dimuat ──
  const hasInitialFitRef  = useRef<Partial<Record<GridLayer, boolean>>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<=768);
    check(); window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  /* Map init */
  useEffect(()=>{
    if(!mapContainerRef.current||mapRef.current) return;
    const map=L.map(mapContainerRef.current,{center:[-5.6167,106.5833],zoom:11,zoomControl:false,attributionControl:true});
    tileLayerRef.current=L.tileLayer(BASEMAPS[basemap].url,{attribution:BASEMAPS[basemap].attribution,maxZoom:19}).addTo(map);
    mapRef.current=map;
    L.control.zoom({position:"topright"}).addTo(map);
    L.control.scale({position:"bottomright",imperial:false}).addTo(map);
    return()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;}};
  },[]);

  /* Basemap swap */
  useEffect(()=>{
    if(!mapRef.current||!tileLayerRef.current) return;
    tileLayerRef.current.remove();
    tileLayerRef.current=L.tileLayer(BASEMAPS[basemap].url,{attribution:BASEMAPS[basemap].attribution,maxZoom:19}).addTo(mapRef.current);
  },[basemap]);

  /* Island markers */
  const buildIsland=useCallback((island:Island)=>buildIslandPopup(island,language),[language]);
  useEffect(()=>{
    if(!mapRef.current) return;
    islandMarkersRef.current.forEach(m=>m.remove());islandMarkersRef.current=[];
    ISLANDS.forEach(island=>{
      const marker=L.marker([island.lat,island.lon],{icon:createIslandIcon(),zIndexOffset:500});
      marker.bindPopup(buildIsland(island),{maxWidth:290,minWidth:270,className:"seribu-popup"});
      marker.bindTooltip(island.name,{permanent:false,direction:"top",offset:[0,-7],className:"seribu-tooltip",opacity:1});
      marker.addTo(mapRef.current!);islandMarkersRef.current.push(marker);
    });
  },[buildIsland]);

  /* Port markers */
  const buildPort=useCallback((port:typeof PORT_LOCATIONS[0])=>buildPortPopup(port,language),[language]);
  useEffect(()=>{
    if(!mapRef.current) return;
    portMarkersRef.current.forEach(m=>m.remove());portMarkersRef.current=[];
    PORT_LOCATIONS.forEach(port=>{
      const marker=L.marker([port.lat,port.lon],{icon:createPortIcon(),zIndexOffset:600});
      marker.bindPopup(buildPort(port),{maxWidth:270,minWidth:250,className:"seribu-popup"});
      marker.bindTooltip(port.name,{permanent:false,direction:"top",offset:[0,-7],className:"seribu-tooltip",opacity:1});
      marker.addTo(mapRef.current!);portMarkersRef.current.push(marker);
    });
  },[buildPort]);

  /* Luwes marker */
  const buildLuwes=useCallback(()=>buildLuwesPopup(language),[language]);
  useEffect(()=>{
    if(!mapRef.current) return;
    if(luwesMarkerRef.current)luwesMarkerRef.current.remove();
    const marker=L.marker([LUWES_STATION.lat,LUWES_STATION.lon],{icon:createLuwesIcon(),zIndexOffset:700});
    marker.bindPopup(buildLuwes(),{maxWidth:295,minWidth:275,className:"seribu-popup"});
    marker.bindTooltip(language==="id"?LUWES_STATION.name:LUWES_STATION.nameEn,{permanent:false,direction:"top",offset:[0,-9],className:"seribu-tooltip",opacity:1});
    marker.addTo(mapRef.current!);luwesMarkerRef.current=marker;
  },[buildLuwes]);

  /* Grid layer ─────────────────────────────────────────────────────────────
   * Dependency array: [gridLayer, language] SAJA.
   * onGridClick TIDAK masuk deps — disimpan di onGridClickRef agar tidak
   * menyebabkan rebuild layer setiap panel dibuka/tutup.
   * fitBounds hanya berjalan SEKALI per gridLayer via hasInitialFitRef.
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(()=>{
    if(!mapRef.current) return;
    let active=true;

    // Reset sel terpilih saat tipe layer grid berganti
    selectedLayerRef.current=null;

    if(geoJsonLayerRef.current){mapRef.current.removeLayer(geoJsonLayerRef.current);geoJsonLayerRef.current=null;}
    const cfg=GRID_CONFIG[gridLayer];
    const tip=language==="id"?cfg.tipId:cfg.tipEn;

    fetch(cfg.file).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(data=>{
      if(!mapRef.current||!active) return;
      if(geoJsonLayerRef.current)mapRef.current.removeLayer(geoJsonLayerRef.current);

      const layer=L.geoJSON(data,{
        style:{color:cfg.color,weight:1.5,opacity:0.7,fillColor:cfg.fillColor,fillOpacity:0.12},
        onEachFeature:(_f,fl)=>{
          fl.bindTooltip(
            `<div style="font-family:${SANS};font-size:11px;color:${cfg.color};font-weight:700;padding:2px 4px;">${tip}</div>`,
            {sticky:true,opacity:1,className:"grid-tooltip"}
          );

          fl.on("click",()=>{
            // Gunakan ref — bukan closure — sehingga layer tidak perlu rebuild
            const center=(fl as any).getBounds().getCenter();
            onGridClickRef.current?.({lat:center.lat,lon:center.lng});

            // Reset highlight sel sebelumnya ke style default grid
            if(selectedLayerRef.current && selectedLayerRef.current!==(fl as L.Path)){
              selectedLayerRef.current.setStyle({
                color:       cfg.color,
                weight:      1.5,
                opacity:     0.7,
                fillColor:   cfg.fillColor,
                fillOpacity: 0.12,
              });
            }
            // Highlight mencolok: warna fill = warna model itu sendiri tapi opacity tinggi
            // Border putih tebal agar sel aktif mudah dikenali di basemap gelap maupun terang
            (fl as L.Path).setStyle({
              color:       "#ffffff",   // border putih — kontras di semua basemap
              weight:      3,
              opacity:     1,
              fillColor:   cfg.fillColor, // tetap warna model (biru/kuning/hijau)
              fillOpacity: 0.70,          // jauh lebih solid dari default 0.12
            });
            selectedLayerRef.current=fl as L.Path;
            // ── TIDAK ada fitBounds / setView / flyTo di sini ──
            // Zoom & center peta sama sekali tidak berubah saat klik
          });

          fl.on("mouseover",()=>{
            if((fl as L.Path)!==selectedLayerRef.current)
              (fl as L.Path).setStyle({
                color:       "#ffffff",
                weight:      2,
                opacity:     0.9,
                fillColor:   cfg.fillColor,
                fillOpacity: 0.35,
              });
          });
          fl.on("mouseout",()=>{
            if((fl as L.Path)!==selectedLayerRef.current)
              (fl as L.Path).setStyle({
                color:       cfg.color,
                weight:      1.5,
                opacity:     0.7,
                fillColor:   cfg.fillColor,
                fillOpacity: 0.12,
              });
          });
        },
      }).addTo(mapRef.current);

      geoJsonLayerRef.current=layer;

      // ── fitBounds hanya sekali saat gridLayer pertama kali dimuat ────────
      // Flag per-key (gridLayer) memastikan tidak terpanggil ulang walau
      // komponen re-render karena panel buka/tutup atau state lain berubah.
      if(!hasInitialFitRef.current[gridLayer]){
        const validBounds=L.latLngBounds([]);
        layer.eachLayer((l:any)=>{
          if(typeof l.getBounds==="function"){
            const b=l.getBounds();
            if(b.isValid()&&b.getSouth()>-10&&b.getNorth()<0&&b.getWest()>100&&b.getEast()<120)
              validBounds.extend(b);
          }
        });
        if(validBounds.isValid()){
          mapRef.current.fitBounds(validBounds,{padding:[30,30],maxZoom:13});
        }
        hasInitialFitRef.current[gridLayer]=true;
      }
    }).catch(err=>{if(active)console.warn(`[Searibu] Failed to load ${cfg.file}:`,err);});

    return()=>{
      active=false;
      if(geoJsonLayerRef.current&&mapRef.current){
        mapRef.current.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current=null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[gridLayer,language]);

  const flyToIsland=useCallback((island:Island)=>{
    if(!mapRef.current) return;
    mapRef.current.flyTo([island.lat,island.lon],13,{duration:1.1,easeLinearity:0.3});
    setTimeout(()=>{const idx=ISLANDS.findIndex(i=>i.id===island.id);if(idx>=0&&islandMarkersRef.current[idx])islandMarkersRef.current[idx].openPopup();},1200);
  },[]);

  const flyToCoords=useCallback((lat:number,lon:number)=>{
    if(!mapRef.current) return;
    mapRef.current.flyTo([lat,lon],13,{duration:1.1,easeLinearity:0.3});
    if(onCoordinateSearch)onCoordinateSearch({lat,lon});
    if(onGridClick)onGridClick({lat,lon});
  },[onCoordinateSearch,onGridClick]);

  return (
    <>
      <style>{`
        /* ── Popup — white/light ── */
        .seribu-popup .leaflet-popup-content-wrapper {
          padding:0 !important; border-radius:14px !important; overflow:hidden !important;
          background:${L_.bg} !important;
          box-shadow:0 12px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(228,221,212,0.80) !important;
          border:none !important;
          max-width:min(295px,calc(100vw - 40px)) !important;
        }
        .seribu-popup .leaflet-popup-content { margin:0 !important; width:auto !important; line-height:1 !important; }
        .seribu-popup .leaflet-popup-tip { background:${L_.bg} !important; box-shadow:none !important; }
        .seribu-popup .leaflet-popup-tip-container { margin-top:-1px !important; }
        .seribu-popup .leaflet-popup-close-button {
          color:${L_.text3} !important; font-size:18px !important; padding:6px 8px !important;
          top:4px !important; right:4px !important; z-index:10 !important;
          background:rgba(242,237,230,0.90) !important; border-radius:6px !important;
          line-height:1 !important; transition:color 0.15s, background 0.15s !important;
        }
        .seribu-popup .leaflet-popup-close-button:hover { color:${L_.blue} !important; background:${L_.blueL} !important; }

        /* ── Tooltip — white ── */
        .seribu-tooltip {
          background:${L_.bg} !important; border:1.5px solid ${L_.border} !important;
          color:${L_.text1} !important; font-family:${SANS} !important;
          font-size:11px !important; font-weight:700 !important;
          padding:4px 10px !important; border-radius:7px !important;
          box-shadow:0 4px 12px rgba(0,0,0,0.10) !important; white-space:nowrap !important;
        }
        .seribu-tooltip::before { display:none !important; }

        /* ── Grid tooltip — light ── */
        .grid-tooltip {
          background:rgba(255,255,255,0.97) !important;
          border:1.5px solid ${L_.border} !important;
          padding:4px 10px !important; border-radius:7px !important;
          box-shadow:0 4px 12px rgba(0,0,0,0.09) !important;
        }
        .grid-tooltip::before { display:none !important; }

        /* ── Leaflet zoom control ── */
        .leaflet-control-zoom {
          border:none !important; box-shadow:${L_.shadow} !important;
          margin-top:12px !important; margin-right:12px !important;
          border-radius:10px !important; overflow:hidden !important;
          border:1.5px solid ${L_.border} !important;
        }
        .leaflet-control-zoom a {
          font-family:${SANS} !important; background:${L_.bg} !important;
          color:${L_.text2} !important; border:none !important;
          border-bottom:1px solid ${L_.border} !important;
          width:34px !important; height:34px !important;
          line-height:34px !important; font-size:18px !important; font-weight:400 !important;
          transition:background 0.15s, color 0.15s !important;
        }
        .leaflet-control-zoom a:hover { background:${L_.blueL} !important; color:${L_.blue} !important; }
        .leaflet-control-zoom-out { border-bottom:none !important; }

        /* ── Attribution ── */
        .leaflet-control-attribution {
          background:rgba(255,255,255,0.92) !important; color:${L_.text4} !important;
          font-size:10px !important; font-family:${SANS} !important;
          border-radius:6px 0 0 0 !important; padding:2px 8px !important;
        }
        .leaflet-control-attribution a { color:${L_.blue} !important; }

        /* ── Scale ── */
        .leaflet-control-scale-line {
          background:rgba(255,255,255,0.92) !important; border-color:${L_.borderS} !important;
          color:${L_.text4} !important; font-size:10px !important; font-family:${SANS} !important;
        }

        /* ── Grid toggle btn ── */
        .wg-grid-btn {
          display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:7px;
          border:1.5px solid ${L_.border}; background:${L_.bg}; cursor:pointer;
          font-family:${SANS}; font-size:11px; font-weight:600; white-space:nowrap;
          transition:all 0.15s; color:${L_.text1}; box-shadow:${L_.shadowSm};
        }
        .wg-grid-btn:hover,.wg-grid-btn.open { background:${L_.blueL}; border-color:${L_.blue}; color:${L_.blue}; }

        @keyframes wg-spin { to { transform:rotate(360deg); } }
        @media (max-width:480px) { .leaflet-control-zoom { display:none !important; } }
      `}</style>

      <div ref={mapContainerRef} style={{position:"absolute",inset:0}}
        onWheel={e=>e.stopPropagation()}/>

      {/* Legend — bottom left */}
      <div style={{
        position:"absolute", bottom: isMobile ? 80 : 20, left:12, zIndex:1001,
        overscrollBehavior:"contain", touchAction:"none",
        display: isMobile && panelOpen ? "none" : "block",
      }}
        onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
        <LegendPanel language={language} activeGrid={gridLayer} defaultCollapsed={isMobile}/>
      </div>

      {/* Search bar — bottom center */}
      <div style={{
        position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)",
        zIndex:1000, width:"calc(100% - 32px)", maxWidth:420,
        boxSizing:"border-box" as const, overscrollBehavior:"contain", touchAction:"manipulation",
      }}
        onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
        <BottomSearchBar
          language={language}
          onIslandSelect={flyToIsland}
          onCoordinateSearch={flyToCoords}
          panelOpen={panelOpen}
          isMobile={isMobile}
        />
      </div>
    </>
  );
};