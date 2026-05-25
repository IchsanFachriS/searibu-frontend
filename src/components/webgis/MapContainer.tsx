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

const SANS         = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const ISLAND_COLOR = "#0284c7";

/* ── Grid layer configuration ───────────────────────────────────────────── */
interface GridConfig {
  file:      string;
  color:     string;
  fillColor: string;
  labelEn:   string;
  labelId:   string;
  tipEn:     string;
  tipId:     string;
}

const GRID_CONFIG: Record<GridLayer, GridConfig> = {
  tpxo: {
    file:      "/GRID_TPXO_SERIBU.geojson",
    color:     "#3b82f6",
    fillColor: "#3b82f6",
    labelEn:   "TPXO9",
    labelId:   "TPXO9",
    tipEn:     "Click for tide & weather",
    tipId:     "Klik untuk pasut & cuaca",
  },
  ecmwf: {
    file:      "/GRID_ECMWF_SERIBU.geojson",
    color:     "#f59e0b",
    fillColor: "#f59e0b",
    labelEn:   "ECMWF IFS",
    labelId:   "ECMWF IFS",
    tipEn:     "Click for weather forecast",
    tipId:     "Klik untuk prakiraan cuaca",
  },
  smoc: {
    file:      "/GRID_SMOC-MFWAM_SERIBU.geojson",
    color:     "#10b981",
    fillColor: "#10b981",
    labelEn:   "SMOC / MFWAM",
    labelId:   "SMOC / MFWAM",
    tipEn:     "Click for wave & current data",
    tipId:     "Klik untuk gelombang & arus",
  },
};

/* ── Interfaces ─────────────────────────────────────────────────────────── */
interface Island {
  id: string; name: string; nameEn: string;
  lat: number; lon: number; adminZone: string;
  descId: string; descEn: string; facilities: string[];
}

interface MapContainerProps {
  basemap:             BasemapType;
  gridLayer:           GridLayer;
  onGridLayerChange:   (layer: GridLayer) => void;
  onGridClick?:        (coords: { lat: number; lon: number }) => void;
  onCoordinateSearch?: (coords: { lat: number; lon: number }) => void;
  panelOpen?:          boolean;
}

/* ── Static data ─────────────────────────────────────────────────────────── */
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
  descId: "Stasiun pengamatan pasut otomatis Luwes milik PT Luwes Inovasi Mandiri. Data observasi digunakan sebagai koreksi terhadap prediksi TPXO dalam sistem Searibu.",
  descEn: "Luwes automatic tide gauge station operated by PT Luwes Inovasi Mandiri. Observation data is used as correction against TPXO prediction.",
};

const BASEMAPS = {
  osm:       { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                                                   attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" },
};

/* ── Icon factories ─────────────────────────────────────────────────────── */
function createLuwesIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 24 30"><polygon points="12,2 22,9 22,21 12,28 2,21 2,9" fill="#ef4444" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))"/><text x="12" y="17" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="8" font-weight="700">T</text></svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [24, 30], iconAnchor: [12, 30], popupAnchor: [0, -30] });
}

function createIslandIcon(color: string): L.DivIcon {
  const size = 24; const border = 1.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+7}" viewBox="0 0 ${size} ${size+7}"><filter id="sh"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.28)"/></filter><circle cx="${size/2}" cy="${size/2}" r="${size/2-border}" fill="${color}" stroke="#fff" stroke-width="${border}" filter="url(#sh)"/><circle cx="${size/2}" cy="${size/2}" r="${size/2-border-3}" fill="#fff" fill-opacity="0.22"/><line x1="${size/2}" y1="${size-border}" x2="${size/2}" y2="${size+5}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [size, size+7], iconAnchor: [size/2, size+7], popupAnchor: [0, -(size+7)] });
}

function createPortIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 22 28"><polygon points="11,2 20,8 17,22 5,22 2,8" fill="#374151" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 1.5px 3px rgba(0,0,0,0.35))"/><text x="11" y="16" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="9" font-weight="700">P</text></svg>`.trim();
  return L.divIcon({ html: svg, className: "", iconSize: [22, 28], iconAnchor: [11, 28], popupAnchor: [0, -28] });
}

/* ── LegendPanel ─────────────────────────────────────────────────────────── */
const LegendPanel: React.FC<{ language: string; activeGrid: GridLayer; defaultCollapsed?: boolean }> = ({ language, activeGrid, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const gc = GRID_CONFIG[activeGrid];

  const items = [
    {
      icon: <svg width="10" height="12" viewBox="0 0 24 31"><circle cx="12" cy="12" r="10.5" fill={ISLAND_COLOR} stroke="#fff" strokeWidth="1.5"/><circle cx="12" cy="12" r="6.5" fill="#fff" fillOpacity="0.22"/><line x1="12" y1="22.5" x2="12" y2="29" stroke={ISLAND_COLOR} strokeWidth="1.5" strokeLinecap="round"/></svg>,
      label: language === "id" ? "Pulau Wisata" : "Tourism Island",
    },
    {
      icon: <svg width="10" height="12" viewBox="0 0 22 28"><polygon points="11,2 20,8 17,22 5,22 2,8" fill="#374151" stroke="#fff" strokeWidth="1.5"/><text x="11" y="16" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="9" fontWeight="700">P</text></svg>,
      label: language === "id" ? "Pelabuhan" : "Port",
    },
    {
      icon: <svg width="10" height="12" viewBox="0 0 24 30"><polygon points="12,2 22,9 22,21 12,28 2,21 2,9" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><text x="12" y="17" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="8" fontWeight="700">T</text></svg>,
      label: language === "id" ? "Sta. Pasut" : "Tide Station",
    },
    {
      icon: <div style={{ width: 10, height: 10, borderRadius: 2, background: `${gc.fillColor}30`, border: `1.5px solid ${gc.color}` }} />,
      label: language === "id" ? `Grid ${gc.labelId}` : `${gc.labelEn} Grid`,
    },
  ];

  return (
    <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.11)", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden", width: collapsed ? "auto" : 152, minWidth: collapsed ? 0 : 152 }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", background: "none", border: "none", cursor: "pointer", borderBottom: collapsed ? "none" : "1px solid #f1f5f9", gap: 6, whiteSpace: "nowrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Layers size={12} style={{ color: "#64748b" }} />
          {!collapsed && <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "#64748b" }}>{language === "id" ? "Legenda" : "Legend"}</span>}
        </div>
        {collapsed ? <ChevronDown size={11} style={{ color: "#94a3b8" }} /> : <ChevronUp size={11} style={{ color: "#94a3b8" }} />}
      </button>
      {!collapsed && (
        <div style={{ padding: "4px 0 6px" }} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 10px" }}>
              <div style={{ width: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── BottomSearchBar ─────────────────────────────────────────────────────── */
const BottomSearchBar: React.FC<{
  language:           string;
  onIslandSelect:     (island: Island) => void;
  onCoordinateSearch: (lat: number, lon: number) => void;
  panelOpen:          boolean;
  isMobile:           boolean;
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
          style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 6, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.08)", zIndex: 2100 }}
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
        >
          {results.map((isl, idx) => (
            <button
              key={isl.id}
              onMouseDown={() => handleSelect(isl)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: idx < results.length - 1 ? "1px solid #f1f5f9" : "none", textAlign: "left" as const, transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={13} style={{ color: ISLAND_COLOR }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {language === "id" ? isl.name : isl.nameEn}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", margin: 0 }}>{isl.adminZone}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.98)", borderRadius: 14, padding: "6px 6px 6px 14px", boxShadow: "0 4px 24px rgba(0,0,0,0.14)", border: focused ? "1.5px solid #0284c7" : "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(12px)", transition: "border-color 0.18s", boxSizing: "border-box" as const, overscrollBehavior: "contain" as const, touchAction: "manipulation" as const }}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <Search size={15} style={{ color: focused ? "#0284c7" : "#94a3b8", flexShrink: 0, transition: "color 0.18s" }} />
        <input
          ref={inputRef}
          type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          placeholder={language === "id" ? "Cari pulau..." : "Search island..."}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#0f172a", minWidth: 0 }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex", flexShrink: 0 }}>
            <X size={13} />
          </button>
        )}
        <button
          onClick={handleMyLocation}
          disabled={locating}
          title={language === "id" ? "Lokasi saya" : "My location"}
          style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: locating ? "#e0f2fe" : "#f1f5f9", cursor: locating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.18s" }}
          onMouseEnter={e => { if (!locating) e.currentTarget.style.background = "#e0f2fe"; }}
          onMouseLeave={e => { if (!locating) e.currentTarget.style.background = "#f1f5f9"; }}
        >
          {locating
            ? <div style={{ width: 14, height: 14, border: "2px solid #0284c7", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <Locate size={14} style={{ color: "#0284c7" }} />}
        </button>
      </div>
    </div>
  );
};

/* ── MapContainer ────────────────────────────────────────────────────────── */
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

  /* ── Popup builders ── */
  const buildIslandPopup = useCallback((island: Island): string => {
    const title = language === "id" ? island.name : island.nameEn;
    const desc  = language === "id" ? island.descId : island.descEn;
    const pills = island.facilities.map(f =>
      `<span style="display:inline-block;padding:3px 9px;border-radius:99px;background:${ISLAND_COLOR}16;color:${ISLAND_COLOR};font-size:11px;font-weight:600;margin:2px 2px 2px 0;font-family:${SANS};border:1px solid ${ISLAND_COLOR}28;">${f}</span>`
    ).join("");
    return `<div style="font-family:${SANS};width:260px;"><div style="background:${ISLAND_COLOR};padding:12px 14px 10px;"><p style="font-size:15px;font-weight:700;color:#fff;line-height:1.25;margin:0 0 3px;">${title}</p><p style="font-size:11px;color:rgba(255,255,255,0.70);margin:0;">${island.adminZone}</p></div><div style="padding:12px 14px 14px;"><p style="font-size:12.5px;color:#475569;line-height:1.6;margin:0 0 11px;">${desc}</p><p style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 6px;">${language === "id" ? "Fasilitas" : "Facilities"}</p><div style="display:flex;flex-wrap:wrap;gap:2px;">${pills}</div></div></div>`;
  }, [language]);

  const buildPortPopup = useCallback((port: typeof PORT_LOCATIONS[0]): string => {
    const desc = language === "id" ? port.descId : port.descEn;
    return `<div style="font-family:${SANS};width:220px;"><div style="background:#1e293b;padding:10px 13px 8px;"><p style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin:0 0 3px;">${language === "id" ? "Pelabuhan" : "Port"}</p><p style="font-size:15px;font-weight:700;color:#fff;margin:0;">${port.name}</p></div><div style="padding:10px 13px 12px;"><p style="font-size:12.5px;color:#475569;margin:0;line-height:1.55;">${desc}</p></div></div>`;
  }, [language]);

  const buildLuwesPopup = useCallback((): string => {
    const title = language === "id" ? LUWES_STATION.name : LUWES_STATION.nameEn;
    const desc  = language === "id" ? LUWES_STATION.descId : LUWES_STATION.descEn;
    return `<div style="font-family:${SANS};width:260px;"><div style="background:#ef4444;padding:10px 14px 8px;"><div style="display:inline-block;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.18);font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#fff;margin-bottom:5px;">${language === "id" ? "Stasiun Pasut" : "Tide Station"}</div><p style="font-size:15px;font-weight:700;color:#fff;line-height:1.25;margin:0 0 3px;">${title}</p><p style="font-size:11px;color:rgba(255,255,255,0.70);margin:0;">${LUWES_STATION.lat.toFixed(4)}°S · ${LUWES_STATION.lon.toFixed(4)}°E</p></div><div style="padding:12px 14px 14px;"><p style="font-size:12.5px;color:#475569;line-height:1.6;margin:0;">${desc}</p></div></div>`;
  }, [language]);

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
  useEffect(() => {
    if (!mapRef.current) return;
    islandMarkersRef.current.forEach(m => m.remove());
    islandMarkersRef.current = [];
    ISLANDS.forEach(island => {
      const marker = L.marker([island.lat, island.lon], { icon: createIslandIcon(ISLAND_COLOR), zIndexOffset: 500 });
      marker.bindPopup(buildIslandPopup(island), { maxWidth: 280, minWidth: 260, className: "island-popup" });
      marker.bindTooltip(island.name, { permanent: false, direction: "top", offset: [0, -7], className: "island-label-tooltip", opacity: 1 });
      marker.addTo(mapRef.current!);
      islandMarkersRef.current.push(marker);
    });
  }, [buildIslandPopup]);

  /* ── Port markers ── */
  useEffect(() => {
    if (!mapRef.current) return;
    portMarkersRef.current.forEach(m => m.remove());
    portMarkersRef.current = [];
    PORT_LOCATIONS.forEach(port => {
      const marker = L.marker([port.lat, port.lon], { icon: createPortIcon(), zIndexOffset: 600 });
      marker.bindPopup(buildPortPopup(port), { maxWidth: 240, minWidth: 220, className: "island-popup" });
      marker.bindTooltip(port.name, { permanent: false, direction: "top", offset: [0, -7], opacity: 1, className: "island-label-tooltip" });
      marker.addTo(mapRef.current!);
      portMarkersRef.current.push(marker);
    });
  }, [buildPortPopup]);

  /* ── Luwes marker ── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (luwesMarkerRef.current) luwesMarkerRef.current.remove();
    const marker = L.marker([LUWES_STATION.lat, LUWES_STATION.lon], { icon: createLuwesIcon(), zIndexOffset: 700 });
    marker.bindPopup(buildLuwesPopup(), { maxWidth: 280, minWidth: 260, className: "island-popup" });
    marker.bindTooltip(language === "id" ? LUWES_STATION.name : LUWES_STATION.nameEn, { permanent: false, direction: "top", offset: [0, -9], opacity: 1, className: "island-label-tooltip" });
    marker.addTo(mapRef.current!);
    luwesMarkerRef.current = marker;
  }, [buildLuwesPopup, language]);

  /* ── Grid layer — THE MUTLUK REACE-CONDITION & AUTOZOOM FIX ── */
  useEffect(() => {
    if (!mapRef.current) return;

    let isCurrentRequest = true;

    /* ✅ Copot layer grid lama yang terpasang secara instan */
    if (geoJsonLayerRef.current) {
      if (mapRef.current.hasLayer(geoJsonLayerRef.current)) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }
      geoJsonLayerRef.current = null;
    }

    const cfg = GRID_CONFIG[gridLayer];
    const tooltipText = language === "id" ? cfg.tipId : cfg.tipEn;

    fetch(cfg.file)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!mapRef.current || !isCurrentRequest) return;

        // Double check pengaman agar grid tidak menumpuk
        if (geoJsonLayerRef.current && mapRef.current.hasLayer(geoJsonLayerRef.current)) {
          mapRef.current.removeLayer(geoJsonLayerRef.current);
        }

        const layer = L.geoJSON(data, {
          style: {
            color: cfg.color, weight: 1.5, opacity: 0.7,
            fillColor: cfg.fillColor, fillOpacity: 0.12,
          },
          onEachFeature: (_feature, fl) => {
            fl.bindTooltip(
              `<div style="font-family:${SANS};font-size:11px;color:${cfg.color};font-weight:500;padding:2px 4px;">${tooltipText}</div>`,
              { sticky: true, opacity: 1, className: "grid-tooltip" },
            );
            fl.on("click", () => {
              const center = (fl as any).getBounds().getCenter();
              if (onGridClick) onGridClick({ lat: center.lat, lon: center.lng });
              layer.eachLayer((l: any) => (l as L.Path).setStyle({ color: cfg.color, weight: 1.5, fillOpacity: 0.12 }));
              (fl as L.Path).setStyle({ color: "#ef4444", weight: 2.5, fillOpacity: 0.35 });
            });
            fl.on("mouseover", () => { if ((fl as L.Path).options.fillOpacity !== 0.35) (fl as L.Path).setStyle({ fillOpacity: 0.28, weight: 2 }); });
            fl.on("mouseout",  () => { if ((fl as L.Path).options.fillOpacity !== 0.35) (fl as L.Path).setStyle({ fillOpacity: 0.12, weight: 1.5 }); });
          },
        }).addTo(mapRef.current);

        geoJsonLayerRef.current = layer;

        /* ── ✅ AUTOZOOM PRESEISI WILAYAH KEPULAUAN SERIBU ── */
        const validBounds = L.latLngBounds([]);

        layer.eachLayer((l: any) => {
          if (typeof l.getBounds === "function") {
            const b = l.getBounds();
            // Hanya akumulasikan polygon yang berada di cakupan area regional Indonesia / Kepulauan Seribu
            if (b.isValid() && b.getSouth() > -10 && b.getNorth() < 0 && b.getWest() > 100 && b.getEast() < 120) {
              validBounds.extend(b);
            }
          }
        });

        if (validBounds.isValid()) {
          mapRef.current.fitBounds(validBounds, { padding: [30, 30], maxZoom: 13 });
        } else {
          // Fallback statis jika koordinat GeoJSON bermasalah
          mapRef.current.setView([-5.65, 106.60], 11);
        }
      })
      .catch(err => {
        if (isCurrentRequest) {
          console.warn(`[Searibu] Failed to load ${cfg.file}:`, err);
        }
      });

    return () => {
      isCurrentRequest = false;
      if (geoJsonLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
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
    if (onGridClick) onGridClick({ lat, lon });
  }, [onCoordinateSearch, onGridClick]);

  return (
    <>
      <style>{`
        .island-popup .leaflet-popup-content-wrapper { padding:0!important; border-radius:12px!important; overflow:hidden!important; box-shadow:0 8px 32px rgba(0,0,0,0.18)!important; border:1px solid rgba(0,0,0,0.08)!important; }
        .island-popup .leaflet-popup-content { margin:0!important; width:auto!important; line-height:1!important; }
        .island-popup .leaflet-popup-tip-container { margin-top:-1px; }
        .island-label-tooltip { background:rgba(15,23,42,0.88)!important; border:none!important; color:#fff!important; font-family:${SANS}!important; font-size:11px!important; font-weight:600!important; padding:3px 8px!important; border-radius:5px!important; box-shadow:0 2px 6px rgba(0,0,0,0.22)!important; white-space:nowrap!important; }
        .island-label-tooltip::before { display:none!important; }
        .grid-tooltip { background:rgba(255,255,255,0.96)!important; border:1px solid rgba(2,132,199,0.28)!important; padding:4px 9px!important; border-radius:5px!important; box-shadow:0 2px 7px rgba(0,0,0,0.10)!important; }
        .grid-tooltip::before { display:none!important; }
        .leaflet-control-zoom { border:none!important; box-shadow:0 2px 12px rgba(0,0,0,0.12)!important; margin-top:12px!important; margin-right:12px!important; }
        .leaflet-control-zoom a { font-family:${SANS}!important; background:rgba(255,255,255,0.97)!important; color:#374151!important; border:none!important; width:32px!important; height:32px!important; line-height:32px!important; font-size:18px!important; font-weight:300!important; }
        .leaflet-control-zoom a:hover { background:#f1f5f9!important; }
        .leaflet-control-zoom-in  { border-radius:8px 8px 0 0!important; border-bottom:1px solid #e2e8f0!important; }
        .leaflet-control-zoom-out { border-radius:0 0 8px 8px!important; }
        @media (max-width:480px) { .leaflet-control-zoom { display:none!important; } }
        @keyframes spin { to { transform:rotate(360deg); } }
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
          maxWidth: 400,
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