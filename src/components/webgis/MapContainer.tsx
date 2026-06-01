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

/* ── Design tokens — dark nautical (same as all other Searibu components) ── */
const SANS  = "'Inter', system-ui, sans-serif";
const M = {
  bg:      "#0f1824",
  surface: "#162030",
  card:    "#1a2840",
  border:  "#1e3044",
  border2: "#243548",
  amber:   "#f5c518",
  sky:     "#38bdf8",
  text1:   "#f0f6ff",
  text2:   "#8ba3be",
  text3:   "#4a6580",
  green:   "#4ade80",
  red:     "#f87171",
};

/* Marker accent colors */
const ISLAND_COLOR  = "#0ea5e9";   // sky-500
const LUWES_COLOR   = "#ef4444";   // red-500
const PORT_COLOR    = "#475569";   // slate-600

/* ── Grid config ───────────────────────────────────────────────────────────── */
interface GridConfig {
  file: string; color: string; fillColor: string;
  labelEn: string; labelId: string; tipEn: string; tipId: string;
}

const GRID_CONFIG: Record<GridLayer, GridConfig> = {
  tpxo:  { file: "/GRID_TPXO_SERIBU.geojson",       color: "#3b82f6", fillColor: "#3b82f6", labelEn: "TPXO9",        labelId: "TPXO9",        tipEn: "Click for tide & weather",     tipId: "Klik untuk pasut & cuaca"      },
  ecmwf: { file: "/GRID_ECMWF_SERIBU.geojson",       color: "#f59e0b", fillColor: "#f59e0b", labelEn: "ECMWF IFS",    labelId: "ECMWF IFS",    tipEn: "Click for weather forecast",   tipId: "Klik untuk prakiraan cuaca"    },
  smoc:  { file: "/GRID_SMOC-MFWAM_SERIBU.geojson",  color: "#10b981", fillColor: "#10b981", labelEn: "SMOC / MFWAM", labelId: "SMOC / MFWAM", tipEn: "Click for wave & current data", tipId: "Klik untuk gelombang & arus"  },
};

/* ── Types ─────────────────────────────────────────────────────────────────── */
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

/* ── Static data ───────────────────────────────────────────────────────────── */
const ISLANDS: Island[] = [
  { id: "bidadari",    name: "Pulau Bidadari",    nameEn: "Bidadari Island",    lat: -6.035347, lon: 106.746234, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau resort terdekat dari Jakarta, dilengkapi cottage, kolam renang, dan situs benteng VOC abad ke-17.", descEn: "Closest resort island to Jakarta with cottages, pools, and a 17th-century VOC fortress ruin.", facilities: ["Cottage","Restoran","Snorkeling","Diving","Benteng Martello"] },
  { id: "tidung",      name: "Pulau Tidung",      nameEn: "Tidung Island",      lat: -5.797360, lon: 106.497220, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau terpopuler dengan Jembatan Cinta ikonik.", descEn: "Most popular island featuring the iconic Love Bridge.", facilities: ["Jembatan Cinta","Sewa Sepeda","Snorkeling","Penginapan","Restoran"] },
  { id: "pari",        name: "Pulau Pari",        nameEn: "Pari Island",        lat: -5.857626, lon: 106.617560, adminZone: "Kepulauan Seribu Selatan", descId: "Terkenal dengan hamparan bintang laut dan padang lamun.", descEn: "Famous for starfish and seagrass beds.", facilities: ["Snorkeling","Bintang Laut","Padang Lamun","Penelitian LIPI","Penginapan"] },
  { id: "kelapa",      name: "Pulau Kelapa",      nameEn: "Kelapa Island",      lat: -5.653659, lon: 106.569023, adminZone: "Kepulauan Seribu Utara",   descId: "Pulau dengan fasilitas lengkap dan akses ke spot diving terbaik.", descEn: "Well-equipped island with access to top diving spots.", facilities: ["Diving","Snorkeling","Cottage","Restoran","Speedboat Charter"] },
  { id: "pramuka",     name: "Pulau Pramuka",     nameEn: "Pramuka Island",     lat: -5.745159, lon: 106.613782, adminZone: "Kepulauan Seribu Utara",   descId: "Pusat administrasi Kabupaten Kepulauan Seribu.", descEn: "Administrative centre of Kepulauan Seribu.", facilities: ["Resort Bintang 4","Kolam Renang","Tennis","Diving","Spa"] },
  { id: "untung_jawa", name: "Pulau Untung Jawa", nameEn: "Untung Jawa Island", lat: -5.977321, lon: 106.705921, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau terdekat dari Muara Angke.", descEn: "Closest island to Muara Angke.", facilities: ["Pantai Berpasir","Warung Makan","Banana Boat","Snorkeling"] },
  { id: "kotok",       name: "Pulau Kotok",       nameEn: "Kotok Island",       lat: -5.700621, lon: 106.538661, adminZone: "Kepulauan Seribu Utara",   descId: "Kawasan konservasi penyu dengan spot diving kelas dunia.", descEn: "Sea turtle conservation area with world-class diving spots.", facilities: ["Konservasi Penyu","Diving","Snorkeling","Resort Ekologi"] },
  { id: "putri",       name: "Pulau Putri",       nameEn: "Putri Island",       lat: -5.593901, lon: 106.560171, adminZone: "Kepulauan Seribu Utara",   descId: "Pulau resort premium dengan underwater observatory.", descEn: "Premium resort island with an underwater observatory.", facilities: ["Underwater Observatory","Resort Premium","Snorkeling","Glass Bottom Boat"] },
  { id: "ayer",        name: "Pulau Ayer",        nameEn: "Ayer Island",        lat: -5.763737, lon: 106.583138, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau resort bergaya vintage dengan bungalow terapung.", descEn: "Vintage-style resort island featuring iconic overwater bungalows.", facilities: ["Bungalow Terapung","Restoran Seafood","Snorkeling","Kayak"] },
  { id: "rambut",      name: "Pulau Rambut",      nameEn: "Rambut Island",      lat: -5.975101, lon: 106.692101, adminZone: "Kepulauan Seribu Selatan", descId: "Suaka margasatwa untuk koloni burung laut.", descEn: "Wildlife sanctuary for seabird colonies.", facilities: ["Birdwatching","Mangrove","Suaka Burung"] },
  { id: "lancang",     name: "Pulau Lancang",     nameEn: "Lancang Island",     lat: -5.929764, lon: 106.586512, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau nelayan tradisional dengan potensi memancing.", descEn: "Traditional fishing island.", facilities: ["Memancing","Snorkeling","Penginapan Sederhana"] },
  { id: "bokor",       name: "Pulau Bokor",       nameEn: "Bokor Island",       lat: -5.978006, lon: 106.706506, adminZone: "Kepulauan Seribu Selatan", descId: "Pulau kecil tak berpenghuni, ideal untuk piknik.", descEn: "Small uninhabited island, ideal for a picnic.", facilities: ["Pantai Sepi","Snorkeling","Piknik"] },
];

const PORT_LOCATIONS = [
  { id: "marina_ancol", name: "Marina Ancol", lat: -6.122, lon: 106.833, descId: "Pelabuhan utama untuk kapal cepat ke pulau-pulau resort", descEn: "Main port for speedboats to resort islands" },
  { id: "muara_angke",  name: "Muara Angke",  lat: -6.108, lon: 106.740, descId: "Pelabuhan kapal tradisional, lebih ekonomis",             descEn: "Traditional ferry port, more economical option" },
];

const LUWES_STATION = {
  name: "Sta. Pasut Luwes", nameEn: "Luwes Tidal Station",
  lat: -5.7439, lon: 106.6128,
  descId: "Stasiun pengamatan pasut otomatis Luwes milik PT Luwes Inovasi Mandiri.",
  descEn: "Luwes automatic tide gauge station operated by PT Luwes Inovasi Mandiri.",
};

const BASEMAPS = {
  osm:       { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                                                   attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" },
};

/* ══════════════════════════════════════════════════════════════════════════════
   POPUP HTML BUILDERS
   All three return a self-contained HTML string rendered by Leaflet.
   Uses inline styles only — no external CSS classes needed.
   Max-width is constrained so they don't overflow on small screens.
══════════════════════════════════════════════════════════════════════════════ */

function buildIslandPopup(island: Island, language: string): string {
  const title  = language === "id" ? island.name   : island.nameEn;
  const desc   = language === "id" ? island.descId : island.descEn;
  const facLbl = language === "id" ? "Fasilitas"   : "Facilities";

  const pills = island.facilities.map(f =>
    `<span style="
      display:inline-block;
      padding:3px 10px;
      border-radius:99px;
      background:rgba(14,165,233,0.12);
      border:1px solid rgba(14,165,233,0.28);
      color:#7dd3fc;
      font-size:11px;
      font-weight:600;
      margin:3px 3px 0 0;
      font-family:${SANS};
      line-height:1.4;
      white-space:nowrap;
    ">${f}</span>`
  ).join("");

  return `
<div style="
  font-family:${SANS};
  background:${M.bg};
  border-radius:14px;
  overflow:hidden;
  width:260px;
  max-width:calc(100vw - 48px);
  box-shadow:0 16px 40px rgba(0,0,0,0.60);
">
  <!-- Header -->
  <div style="
    background:linear-gradient(135deg,${M.card} 0%,rgba(14,165,233,0.18) 100%);
    padding:14px 16px 12px;
    position:relative;
    border-bottom:1px solid ${M.border};
  ">
    <!-- Sky top accent bar -->
    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,${ISLAND_COLOR},#38bdf8);"></div>
    <!-- Type badge -->
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:2px 9px;border-radius:99px;
      background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.28);
      font-size:9.5px;font-weight:700;color:#7dd3fc;
      letter-spacing:0.06em;text-transform:uppercase;
      margin-bottom:8px;
    ">${language === "id" ? "Pulau Wisata" : "Tourism Island"}</div>
    <!-- Island name -->
    <p style="font-size:16px;font-weight:800;color:${M.text1};margin:0 0 3px;line-height:1.2;letter-spacing:-0.01em;">${title}</p>
    <!-- Admin zone -->
    <p style="font-size:11px;color:${M.text3};margin:0;font-weight:500;">${island.adminZone}</p>
  </div>
  <!-- Body -->
  <div style="padding:14px 16px 16px;">
    <!-- Description -->
    <p style="font-size:12.5px;color:${M.text2};line-height:1.65;margin:0 0 14px;">${desc}</p>
    <!-- Facilities label -->
    <p style="font-size:9.5px;color:${M.text3};font-weight:700;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 8px;">${facLbl}</p>
    <!-- Pills -->
    <div style="display:flex;flex-wrap:wrap;gap:0;">${pills}</div>
  </div>
</div>`;
}

function buildPortPopup(port: typeof PORT_LOCATIONS[0], language: string): string {
  const desc  = language === "id" ? port.descId : port.descEn;
  const badge = language === "id" ? "Pelabuhan" : "Port";

  return `
<div style="
  font-family:${SANS};
  background:${M.bg};
  border-radius:14px;
  overflow:hidden;
  width:240px;
  max-width:calc(100vw - 48px);
  box-shadow:0 16px 40px rgba(0,0,0,0.60);
">
  <div style="
    background:linear-gradient(135deg,${M.card} 0%,rgba(71,85,105,0.30) 100%);
    padding:14px 16px 12px;
    position:relative;
    border-bottom:1px solid ${M.border};
  ">
    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,${PORT_COLOR},#94a3b8);"></div>
    <div style="
      display:inline-flex;align-items:center;
      padding:2px 9px;border-radius:99px;
      background:rgba(71,85,105,0.20);border:1px solid rgba(148,163,184,0.22);
      font-size:9.5px;font-weight:700;color:#94a3b8;
      letter-spacing:0.06em;text-transform:uppercase;
      margin-bottom:8px;
    ">${badge}</div>
    <p style="font-size:16px;font-weight:800;color:${M.text1};margin:0;line-height:1.2;letter-spacing:-0.01em;">${port.name}</p>
  </div>
  <div style="padding:14px 16px 16px;">
    <p style="font-size:12.5px;color:${M.text2};line-height:1.65;margin:0;">${desc}</p>
  </div>
</div>`;
}

function buildLuwesPopup(language: string): string {
  const title = language === "id" ? LUWES_STATION.name    : LUWES_STATION.nameEn;
  const desc  = language === "id" ? LUWES_STATION.descId  : LUWES_STATION.descEn;
  const badge = language === "id" ? "Stasiun Pasut"       : "Tide Station";
  const coordLabel = language === "id" ? "Koordinat" : "Coordinates";
  const coords = `${Math.abs(LUWES_STATION.lat).toFixed(4)}°S · ${LUWES_STATION.lon.toFixed(4)}°E`;

  return `
<div style="
  font-family:${SANS};
  background:${M.bg};
  border-radius:14px;
  overflow:hidden;
  width:268px;
  max-width:calc(100vw - 48px);
  box-shadow:0 16px 40px rgba(0,0,0,0.60);
">
  <div style="
    background:linear-gradient(135deg,${M.card} 0%,rgba(239,68,68,0.18) 100%);
    padding:14px 16px 12px;
    position:relative;
    border-bottom:1px solid ${M.border};
  ">
    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,${LUWES_COLOR},#f87171);"></div>
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:2px 9px;border-radius:99px;
      background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.28);
      font-size:9.5px;font-weight:700;color:#fca5a5;
      letter-spacing:0.06em;text-transform:uppercase;
      margin-bottom:8px;
    ">${badge}</div>
    <p style="font-size:16px;font-weight:800;color:${M.text1};margin:0 0 4px;line-height:1.2;letter-spacing:-0.01em;">${title}</p>
    <!-- Coordinate chip -->
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:3px 9px;border-radius:99px;
      background:rgba(255,255,255,0.05);border:1px solid ${M.border2};
    ">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4a6580" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
      <span style="font-size:10px;font-weight:600;color:${M.text3};font-family:${SANS};">${coords}</span>
    </div>
  </div>
  <div style="padding:14px 16px 16px;">
    <p style="font-size:12.5px;color:${M.text2};line-height:1.65;margin:0 0 12px;">${desc}</p>
    <!-- Live indicator -->
    <div style="display:flex;align-items:center;gap:7px;padding:8px 10px;background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.18);border-radius:8px;">
      <span style="display:block;width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;flex-shrink:0;animation:luwes-pulse 2s ease-in-out infinite;"></span>
      <span style="font-size:11px;font-weight:600;color:#4ade80;font-family:${SANS};">
        ${language === "id" ? "Telemetri real-time aktif" : "Real-time telemetry active"}
      </span>
    </div>
  </div>
</div>
<style>
  @keyframes luwes-pulse {
    0%,100% { opacity:1; }
    50%      { opacity:0.4; }
  }
</style>`;
}

/* ── Icon factories ─────────────────────────────────────────────────────────── */
function createIslandIcon(): L.DivIcon {
  // Glowing circle with a short stem — sky blue
  const size = 26;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
    <defs>
      <filter id="isl-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${ISLAND_COLOR}" stroke="#fff" stroke-width="2" filter="url(#isl-glow)" opacity="0.9"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" fill="rgba(255,255,255,0.20)"/>
    <line x1="${size/2}" y1="${size - 2}" x2="${size/2}" y2="${size + 6}" stroke="${ISLAND_COLOR}" stroke-width="2" stroke-linecap="round"/>
  </svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [size, size + 8], iconAnchor: [size/2, size + 8], popupAnchor: [0, -(size + 8)] });
}

function createLuwesIcon(): L.DivIcon {
  // Hexagon marker — red
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32">
    <defs><filter id="l-sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(239,68,68,0.55)"/></filter></defs>
    <polygon points="13,2 23,7.5 23,20.5 13,26 3,20.5 3,7.5" fill="${LUWES_COLOR}" stroke="rgba(255,255,255,0.85)" stroke-width="1.5" filter="url(#l-sh)"/>
    <text x="13" y="17.5" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="10" font-weight="800" letter-spacing="0">T</text>
  </svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [26, 32], iconAnchor: [13, 32], popupAnchor: [0, -34] });
}

function createPortIcon(): L.DivIcon {
  // Diamond/shield marker — slate
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28">
    <defs><filter id="p-sh"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.40)"/></filter></defs>
    <path d="M12 2 L22 8 L22 20 L12 26 L2 20 L2 8 Z" fill="${PORT_COLOR}" stroke="rgba(255,255,255,0.70)" stroke-width="1.5" filter="url(#p-sh)"/>
    <text x="12" y="17" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="9" font-weight="800">P</text>
  </svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [24, 28], iconAnchor: [12, 28], popupAnchor: [0, -30] });
}

/* ── LegendPanel ────────────────────────────────────────────────────────────── */
const LegendPanel: React.FC<{ language: string; activeGrid: GridLayer; defaultCollapsed?: boolean }> = ({ language, activeGrid, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const gc = GRID_CONFIG[activeGrid];

  const items = [
    {
      icon: (
        <svg width="11" height="13" viewBox="0 0 26 34"><circle cx="13" cy="13" r="11" fill={ISLAND_COLOR} stroke="#fff" strokeWidth="2" opacity="0.9"/><circle cx="13" cy="13" r="6" fill="rgba(255,255,255,0.20)"/><line x1="13" y1="24" x2="13" y2="32" stroke={ISLAND_COLOR} strokeWidth="2" strokeLinecap="round"/></svg>
      ),
      label: language === "id" ? "Pulau Wisata" : "Tourism Island",
    },
    {
      icon: (
        <svg width="11" height="12" viewBox="0 0 24 28"><path d="M12 2L22 8L22 20L12 26L2 20L2 8Z" fill={PORT_COLOR} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/><text x="12" y="17" textAnchor="middle" fill="#e2e8f0" fontFamily="sans-serif" fontSize="9" fontWeight="800">P</text></svg>
      ),
      label: language === "id" ? "Pelabuhan" : "Port",
    },
    {
      icon: (
        <svg width="11" height="13" viewBox="0 0 26 32"><polygon points="13,2 23,7.5 23,20.5 13,26 3,20.5 3,7.5" fill={LUWES_COLOR} stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/><text x="13" y="17.5" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="10" fontWeight="800">T</text></svg>
      ),
      label: language === "id" ? "Sta. Pasut" : "Tide Station",
    },
    {
      icon: <div style={{ width: 11, height: 11, borderRadius: 2, background: `${gc.fillColor}25`, border: `1.5px solid ${gc.color}` }} />,
      label: language === "id" ? `Grid ${gc.labelId}` : `${gc.labelEn} Grid`,
    },
  ];

  return (
    <div style={{
      background: "rgba(15,24,36,0.94)", backdropFilter: "blur(12px)",
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
      border: `1px solid ${M.border}`,
      width: collapsed ? "auto" : 158, minWidth: collapsed ? 0 : 158,
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 10px",
          background: "none", border: "none", cursor: "pointer",
          borderBottom: collapsed ? "none" : `1px solid ${M.border}`,
          gap: 6, whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Layers size={12} style={{ color: M.text3 }} />
          {!collapsed && (
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: M.text3 }}>
              {language === "id" ? "Legenda" : "Legend"}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown size={11} style={{ color: M.text3 }} />
          : <ChevronUp   size={11} style={{ color: M.text3 }} />}
      </button>
      {!collapsed && (
        <div style={{ padding: "5px 0 7px" }} onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 10px" }}>
              <div style={{ width: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: M.text2, whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── GridLayerToggle ─────────────────────────────────────────────────────────── */
const GridLayerToggleInline: React.FC<{ current: GridLayer; onChange: (l: GridLayer) => void; language: string }> = ({ current, onChange, language }) => {
  const [open, setOpen] = useState(false);
  const cfg   = GRID_CONFIG[current];
  const label = language === "id" ? cfg.labelId : cfg.labelEn;
  const desc  = language === "id" ? cfg.tipId   : cfg.tipEn;

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
          <div style={{ fontFamily: SANS, fontSize: 9,  fontWeight: 400, color: "#64748b" }}>
            {language === "id" ? cfg.tipId : cfg.tipEn}
          </div>
        </div>
        <Layers size={11} style={{ color: "#94a3b8", flexShrink: 0, marginLeft: 1 }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 377 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            background: "rgba(15,24,36,0.97)", borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
            border: `1px solid ${M.border}`,
            overflow: "hidden", minWidth: 215, zIndex: 379,
          }}>
            <div style={{ padding: "8px 12px 7px", borderBottom: `1px solid ${M.border}` }}>
              <p style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: M.text3, margin: 0 }}>
                {language === "id" ? "Model Grid" : "Grid Model"}
              </p>
            </div>
            {(Object.keys(GRID_CONFIG) as GridLayer[]).map(key => {
              const opt    = GRID_CONFIG[key];
              const active = current === key;
              const lbl    = language === "id" ? opt.labelId : opt.labelEn;
              const dsc    = language === "id" ? opt.tipId   : opt.tipEn;
              return (
                <button key={key} onClick={() => { onChange(key); setOpen(false); }} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  background: active ? `${opt.color}16` : "none",
                  border: "none", cursor: "pointer",
                  textAlign: "left" as const,
                  borderBottom: `1px solid ${M.border}`,
                  transition: "background 0.12s",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = `rgba(255,255,255,0.04)`; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: `${opt.color}18`, border: `1.5px solid ${opt.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 11, height: 11, borderRadius: 2, background: opt.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.3, color: active ? opt.color : M.text1 }}>{lbl}</p>
                    <p style={{ fontFamily: SANS, fontSize: 10.5, margin: 0, color: active ? opt.color : M.text3, opacity: active ? 0.8 : 1 }}>{dsc}</p>
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

/* ── BottomSearchBar ─────────────────────────────────────────────────────────── */
const BottomSearchBar: React.FC<{
  language: string;
  onIslandSelect: (island: Island) => void;
  onCoordinateSearch: (lat: number, lon: number) => void;
  panelOpen: boolean;
  isMobile: boolean;
}> = ({ language, onIslandSelect, onCoordinateSearch, panelOpen, isMobile }) => {
  const [query,    setQuery]    = useState("");
  const [focused,  setFocused]  = useState(false);
  const [locating, setLocating] = useState(false);
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
      ()  => setLocating(false),
      { timeout: 8000, maximumAge: 30000 },
    );
  };

  if (isMobile && panelOpen) return null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {showDropdown && (
        <div
          style={{
            position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 6,
            background: "rgba(15,24,36,0.97)",
            border: `1px solid ${M.border}`,
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 -8px 28px rgba(0,0,0,0.55)",
            zIndex: 2100,
          }}
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
        >
          {results.map((isl, idx) => (
            <button
              key={isl.id}
              onMouseDown={() => handleSelect(isl)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", background: "none", border: "none",
                borderBottom: idx < results.length - 1 ? `1px solid ${M.border}` : "none",
                cursor: "pointer", textAlign: "left" as const, transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `rgba(14,165,233,0.12)`, border: `1px solid rgba(14,165,233,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={13} style={{ color: ISLAND_COLOR }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: M.text1, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {language === "id" ? isl.name : isl.nameEn}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 11, color: M.text3, margin: 0 }}>{isl.adminZone}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(15,24,36,0.94)",
          border: focused ? `1.5px solid ${M.sky}` : `1.5px solid ${M.border}`,
          borderRadius: 14, padding: "7px 7px 7px 14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.40)",
          backdropFilter: "blur(12px)",
          transition: "border-color 0.18s",
          boxSizing: "border-box" as const,
          overscrollBehavior: "contain" as const,
          touchAction: "manipulation" as const,
        }}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <Search size={15} style={{ color: focused ? M.sky : M.text3, flexShrink: 0, transition: "color 0.18s" }} />
        <input
          ref={inputRef}
          type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          placeholder={language === "id" ? "Cari pulau..." : "Search island..."}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: M.text1, minWidth: 0 }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: M.text3, padding: 4, display: "flex", flexShrink: 0 }}>
            <X size={13} />
          </button>
        )}
        <button
          onClick={handleMyLocation}
          disabled={locating}
          title={language === "id" ? "Lokasi saya" : "My location"}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${M.border}`, background: M.surface, cursor: locating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}
          onMouseEnter={e => { if (!locating) { e.currentTarget.style.background = "rgba(14,165,233,0.12)"; e.currentTarget.style.borderColor = "rgba(14,165,233,0.35)"; } }}
          onMouseLeave={e => { if (!locating) { e.currentTarget.style.background = M.surface; e.currentTarget.style.borderColor = M.border; } }}
        >
          {locating
            ? <div style={{ width: 14, height: 14, border: `2px solid ${M.sky}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <Locate size={14} style={{ color: M.sky }} />}
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MapContainer
══════════════════════════════════════════════════════════════════════════════ */
export const MapContainer: React.FC<MapContainerProps> = ({
  basemap, gridLayer, onGridLayerChange,
  onGridClick, onCoordinateSearch, panelOpen = false,
}) => {
  const { language } = useLanguage();
  const mapRef           = useRef<L.Map | null>(null);
  const mapContainerRef  = useRef<HTMLDivElement>(null);
  const tileLayerRef     = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef  = useRef<L.GeoJSON | null>(null);
  const islandMarkersRef = useRef<L.Marker[]>([]);
  const portMarkersRef   = useRef<L.Marker[]>([]);
  const luwesMarkerRef   = useRef<L.Marker | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Map init ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-5.6167, 106.5833], zoom: 11, zoomControl: false, attributionControl: true });
    tileLayerRef.current = L.tileLayer(BASEMAPS[basemap].url, { attribution: BASEMAPS[basemap].attribution, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ position: "bottomright", imperial: false }).addTo(map);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  /* ── Basemap swap ── */
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(BASEMAPS[basemap].url, { attribution: BASEMAPS[basemap].attribution, maxZoom: 19 }).addTo(mapRef.current);
  }, [basemap]);

  /* ── Island markers ── */
  const buildIsland = useCallback((island: Island) => buildIslandPopup(island, language), [language]);
  useEffect(() => {
    if (!mapRef.current) return;
    islandMarkersRef.current.forEach(m => m.remove());
    islandMarkersRef.current = [];
    ISLANDS.forEach(island => {
      const marker = L.marker([island.lat, island.lon], { icon: createIslandIcon(), zIndexOffset: 500 });
      marker.bindPopup(buildIsland(island), { maxWidth: 280, minWidth: 260, className: "seribu-popup" });
      marker.bindTooltip(island.name, { permanent: false, direction: "top", offset: [0, -7], className: "seribu-tooltip", opacity: 1 });
      marker.addTo(mapRef.current!);
      islandMarkersRef.current.push(marker);
    });
  }, [buildIsland]);

  /* ── Port markers ── */
  const buildPort = useCallback((port: typeof PORT_LOCATIONS[0]) => buildPortPopup(port, language), [language]);
  useEffect(() => {
    if (!mapRef.current) return;
    portMarkersRef.current.forEach(m => m.remove());
    portMarkersRef.current = [];
    PORT_LOCATIONS.forEach(port => {
      const marker = L.marker([port.lat, port.lon], { icon: createPortIcon(), zIndexOffset: 600 });
      marker.bindPopup(buildPort(port), { maxWidth: 260, minWidth: 240, className: "seribu-popup" });
      marker.bindTooltip(port.name, { permanent: false, direction: "top", offset: [0, -7], className: "seribu-tooltip", opacity: 1 });
      marker.addTo(mapRef.current!);
      portMarkersRef.current.push(marker);
    });
  }, [buildPort]);

  /* ── Luwes marker ── */
  const buildLuwes = useCallback(() => buildLuwesPopup(language), [language]);
  useEffect(() => {
    if (!mapRef.current) return;
    if (luwesMarkerRef.current) luwesMarkerRef.current.remove();
    const marker = L.marker([LUWES_STATION.lat, LUWES_STATION.lon], { icon: createLuwesIcon(), zIndexOffset: 700 });
    marker.bindPopup(buildLuwes(), { maxWidth: 290, minWidth: 268, className: "seribu-popup" });
    marker.bindTooltip(language === "id" ? LUWES_STATION.name : LUWES_STATION.nameEn, { permanent: false, direction: "top", offset: [0, -9], className: "seribu-tooltip", opacity: 1 });
    marker.addTo(mapRef.current!);
    luwesMarkerRef.current = marker;
  }, [buildLuwes]);

  /* ── Grid layer ── */
  useEffect(() => {
    if (!mapRef.current) return;
    let active = true;
    if (geoJsonLayerRef.current) { mapRef.current.removeLayer(geoJsonLayerRef.current); geoJsonLayerRef.current = null; }

    const cfg = GRID_CONFIG[gridLayer];
    const tip = language === "id" ? cfg.tipId : cfg.tipEn;

    fetch(cfg.file)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (!mapRef.current || !active) return;
        if (geoJsonLayerRef.current) mapRef.current.removeLayer(geoJsonLayerRef.current);

        const layer = L.geoJSON(data, {
          style: { color: cfg.color, weight: 1.5, opacity: 0.7, fillColor: cfg.fillColor, fillOpacity: 0.12 },
          onEachFeature: (_f, fl) => {
            fl.bindTooltip(
              `<div style="font-family:${SANS};font-size:11px;color:${cfg.color};font-weight:600;padding:2px 4px;">${tip}</div>`,
              { sticky: true, opacity: 1, className: "grid-tooltip" },
            );
            fl.on("click", () => {
              const center = (fl as any).getBounds().getCenter();
              if (onGridClick) onGridClick({ lat: center.lat, lon: center.lng });
              layer.eachLayer((l: any) => (l as L.Path).setStyle({ color: cfg.color, weight: 1.5, fillOpacity: 0.12 }));
              (fl as L.Path).setStyle({ color: "#ef4444", weight: 2.5, fillOpacity: 0.35 });
            });
            fl.on("mouseover", () => { if ((fl as L.Path).options.fillOpacity !== 0.35) (fl as L.Path).setStyle({ fillOpacity: 0.26, weight: 2 }); });
            fl.on("mouseout",  () => { if ((fl as L.Path).options.fillOpacity !== 0.35) (fl as L.Path).setStyle({ fillOpacity: 0.12, weight: 1.5 }); });
          },
        }).addTo(mapRef.current);
        geoJsonLayerRef.current = layer;

        const validBounds = L.latLngBounds([]);
        layer.eachLayer((l: any) => { if (typeof l.getBounds === "function") { const b = l.getBounds(); if (b.isValid() && b.getSouth() > -10 && b.getNorth() < 0 && b.getWest() > 100 && b.getEast() < 120) validBounds.extend(b); } });
        if (validBounds.isValid()) mapRef.current.fitBounds(validBounds, { padding: [30, 30], maxZoom: 13 });
        else mapRef.current.setView([-5.65, 106.60], 11);
      })
      .catch(err => { if (active) console.warn(`[Searibu] Failed to load ${cfg.file}:`, err); });

    return () => {
      active = false;
      if (geoJsonLayerRef.current && mapRef.current) { mapRef.current.removeLayer(geoJsonLayerRef.current); geoJsonLayerRef.current = null; }
    };
  }, [gridLayer, language, onGridClick]);

  /* ── Fly helpers ── */
  const flyToIsland = useCallback((island: Island) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([island.lat, island.lon], 13, { duration: 1.1, easeLinearity: 0.3 });
    setTimeout(() => {
      const idx = ISLANDS.findIndex(i => i.id === island.id);
      if (idx >= 0 && islandMarkersRef.current[idx]) islandMarkersRef.current[idx].openPopup();
    }, 1200);
  }, []);

  const flyToCoords = useCallback((lat: number, lon: number) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([lat, lon], 13, { duration: 1.1, easeLinearity: 0.3 });
    if (onCoordinateSearch) onCoordinateSearch({ lat, lon });
    if (onGridClick)        onGridClick({ lat, lon });
  }, [onCoordinateSearch, onGridClick]);

  return (
    <>
      <style>{`
        /* ═══ Leaflet popup wrapper — dark nautical reset ═══ */
        .seribu-popup .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          background: transparent !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(30,48,68,0.80) !important;
          border: none !important;
          /* Constrain width on narrow screens */
          max-width: min(290px, calc(100vw - 40px)) !important;
        }
        .seribu-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
          line-height: 1 !important;
        }
        /* Tip (triangle) — match popup bg */
        .seribu-popup .leaflet-popup-tip {
          background: ${M.bg} !important;
          box-shadow: none !important;
        }
        .seribu-popup .leaflet-popup-tip-container {
          margin-top: -1px !important;
        }
        /* Close button */
        .seribu-popup .leaflet-popup-close-button {
          color: ${M.text3} !important;
          font-size: 18px !important;
          padding: 6px 8px !important;
          top: 4px !important;
          right: 4px !important;
          z-index: 10 !important;
          background: rgba(30,48,68,0.60) !important;
          border-radius: 6px !important;
          line-height: 1 !important;
          transition: color 0.15s, background 0.15s !important;
        }
        .seribu-popup .leaflet-popup-close-button:hover {
          color: ${M.amber} !important;
          background: rgba(245,193,24,0.12) !important;
        }

        /* ═══ Tooltip — dark nautical ═══ */
        .seribu-tooltip {
          background: rgba(15,24,36,0.92) !important;
          border: 1px solid ${M.border} !important;
          color: ${M.text1} !important;
          font-family: ${SANS} !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.45) !important;
          white-space: nowrap !important;
        }
        .seribu-tooltip::before { display: none !important; }

        /* ═══ Grid tooltip ═══ */
        .grid-tooltip {
          background: rgba(15,24,36,0.94) !important;
          border: 1px solid rgba(59,130,246,0.30) !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.40) !important;
        }
        .grid-tooltip::before { display: none !important; }

        /* ═══ Zoom control ═══ */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.45) !important;
          margin-top: 12px !important;
          margin-right: 12px !important;
          border-radius: 10px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          font-family: ${SANS} !important;
          background: rgba(15,24,36,0.94) !important;
          color: ${M.text2} !important;
          border: none !important;
          border-bottom: 1px solid ${M.border} !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 18px !important;
          font-weight: 300 !important;
          transition: background 0.15s, color 0.15s !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-zoom a:hover {
          background: ${M.card} !important;
          color: ${M.amber} !important;
        }
        .leaflet-control-zoom-out { border-bottom: none !important; }

        /* ═══ Attribution ═══ */
        .leaflet-control-attribution {
          background: rgba(15,24,36,0.85) !important;
          color: ${M.text3} !important;
          font-size: 10px !important;
          font-family: ${SANS} !important;
          border-radius: 6px 0 0 0 !important;
          padding: 2px 8px !important;
        }
        .leaflet-control-attribution a { color: ${M.sky} !important; }

        /* ═══ Scale ═══ */
        .leaflet-control-scale-line {
          background: rgba(15,24,36,0.85) !important;
          border-color: ${M.border} !important;
          color: ${M.text3} !important;
          font-size: 10px !important;
          font-family: ${SANS} !important;
        }

        /* ═══ WebGIS toolbar buttons ═══ */
        .webgis-basemap-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 7px; border: none;
          cursor: pointer; font-family: ${SANS}; font-size: 11px; font-weight: 600;
          transition: all 0.2s; white-space: nowrap;
        }
        .webgis-basemap-btn.active   { background: #0284c7; color: #fff; box-shadow: 0 2px 8px rgba(2,132,199,0.45); }
        .webgis-basemap-btn.inactive { background: transparent; color: #1e293b; }
        .webgis-grid-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 7px; border: none;
          cursor: pointer; font-family: ${SANS}; font-size: 11px;
          font-weight: 600; white-space: nowrap; transition: all 0.15s;
          background: transparent; color: #1e293b;
        }
        .webgis-grid-btn:hover, .webgis-grid-btn.open { background: #f1f5f9; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .leaflet-control-zoom { display: none !important; }
          .seribu-popup .leaflet-popup-content-wrapper {
            max-width: calc(100vw - 32px) !important;
          }
        }
      `}</style>

      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} onWheel={e => e.stopPropagation()} />

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? 80 : 20,
          left: 12,
          zIndex: 1001,
          overscrollBehavior: "contain",
          touchAction: "none",
          display: isMobile && panelOpen ? "none" : "block",
        }}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <LegendPanel language={language} activeGrid={gridLayer} defaultCollapsed={isMobile} />
      </div>

      {/* Search bar */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "calc(100% - 32px)",
          maxWidth: 420,
          boxSizing: "border-box" as const,
          overscrollBehavior: "contain",
          touchAction: "manipulation",
        }}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
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