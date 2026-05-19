import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  ArrowRight, Waves, Wind, Navigation, BarChart2, Map, Shield,
  Anchor, Fish, Camera, Sun, Leaf, Flag, Users, Ship, Zap,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — National Geographic editorial + ocean science
   ─────────────────────────────────────────────────────────────────────────
   Palette:
     Ink        #0a1628   near-black headlines
     Sand       #ffeeb3   warm off-white page bg
     Parchment  #fff8d9   slightly deeper — card bg
     Ocean      #0a1628   deep navy — primary action
     Reef       #00b8cc   mid-teal — secondary
     Current    #00e5ff   bright cyan — accent/data
     Amber      #ffff00   NatGeo gold — rule / CTA
     Seafoam    #e0fff5   light tint — data cells
     Rule       #b8f0c0   borders / dividers

   Typography:
     STONEB = ITC Stone Sans Std Semibold + fallbacks
     STONE  = ITC Stone Sans Std + fallbacks
     SERIF  = Georgia — editorial pull-quotes / hero subtext
   ────────────────────────────────────────────────────────────────────── */

const INK       = "#0a1628";
const SAND      = "#ffeeb3";
const PARCHMENT = "#fff8d9";
const OCEAN     = "#0a1628";
const REEF      = "#00b8cc";
const CURRENT   = "#00e5ff";
const AMBER     = "#ffff00";
const SEAFOAM   = "#e0fff5";
const RULE      = "#b8f0c0";
const MINT      = "#5cff7a";

const STONE  = '"ITC Stone Sans Std", "Stone Sans", "Gill Sans MT", "Trebuchet MS", system-ui, sans-serif';
const STONEB = '"ITC Stone Sans Std Semibold", "Stone Sans Semibold", "Gill Sans MT Semibold", "Trebuchet MS", system-ui, sans-serif';
const SERIF  = '"Georgia", "Times New Roman", serif';

interface HomePageProps { onNavigate?: (page: string) => void; }

/* ── Islands ──────────────────────────────────────────────────────────── */
const ISLANDS = [
  { id: "bidadari",    nameId: "Pulau Bidadari",    nameEn: "Bidadari Island",    lat: -6.035347, lon: 106.746234 },
  { id: "tidung",      nameId: "Pulau Tidung",      nameEn: "Tidung Island",      lat: -5.797360, lon: 106.497220 },
  { id: "pari",        nameId: "Pulau Pari",        nameEn: "Pari Island",        lat: -5.857626, lon: 106.617560 },
  { id: "kelapa",      nameId: "Pulau Kelapa",      nameEn: "Kelapa Island",      lat: -5.653659, lon: 106.569023 },
  { id: "pramuka",     nameId: "Pulau Pramuka",     nameEn: "Pramuka Island",     lat: -5.745159, lon: 106.613782 },
  { id: "untung_jawa", nameId: "Pulau Untung Jawa", nameEn: "Untung Jawa Island", lat: -5.977321, lon: 106.705921 },
  { id: "kotok",       nameId: "Pulau Kotok",       nameEn: "Kotok Island",       lat: -5.700621, lon: 106.538661 },
  { id: "putri",       nameId: "Pulau Putri",       nameEn: "Putri Island",       lat: -5.593901, lon: 106.560171 },
  { id: "ayer",        nameId: "Pulau Ayer",        nameEn: "Ayer Island",        lat: -5.763737, lon: 106.583138 },
  { id: "rambut",      nameId: "Pulau Rambut",      nameEn: "Rambut Island",      lat: -5.975101, lon: 106.692101 },
  { id: "lancang",     nameId: "Pulau Lancang",     nameEn: "Lancang Island",     lat: -5.929764, lon: 106.586512 },
  { id: "bokor",       nameId: "Pulau Bokor",       nameEn: "Bokor Island",       lat: -5.978006, lon: 106.706506 },
];

/* ── Image placeholder ────────────────────────────────────────────────── */
const ImgPlaceholder: React.FC<{
  label?: string;
  aspectRatio?: string;
  style?: React.CSSProperties;
}> = ({ label = "IMAGE PLACEHOLDER", aspectRatio, style = {} }) => (
  <div style={{
    width: "100%",
    aspectRatio: aspectRatio ?? undefined,
    height: aspectRatio ? undefined : "100%",
    background: `repeating-linear-gradient(
      -45deg,
      #bdb5a6 0px,
      #bdb5a6 1px,
      #ccc5b5 1px,
      #ccc5b5 14px
    )`,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 10,
    position: "relative", overflow: "hidden",
    ...style,
  }}>
    <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.22)" }} />
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.50)"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: "relative", zIndex: 1 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.5)" stroke="none" />
      <path d="M21 15 16 10 5 21" />
    </svg>
    <span style={{
      position: "relative", zIndex: 1,
      fontFamily: STONEB, fontSize: 9, letterSpacing: "0.16em",
      textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
    }}>{label}</span>
  </div>
);

/* ── Date helpers ─────────────────────────────────────────────────────── */
function todayWIB(): string { return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); }
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
function kmhToMs(v: number) { return v / 3.6; }

async function fetchMeteoData(lat: number, lon: number, dateStr: string) {
  const start = addDaysISO(todayWIB(), -12); const end = addDaysISO(todayWIB(), 5);
  const [wxRes, marRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,weather_code&timezone=auto&start_date=${start}&end_date=${end}`),
    fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,ocean_current_velocity&timezone=auto&start_date=${start}&end_date=${end}`),
  ]);
  const wx  = wxRes.ok  ? await wxRes.json()  : null;
  const mar = marRes.ok ? await marRes.json() : null;
  const mIdxs: number[] = mar?.hourly?.time?.map((t: string, i: number) => t.startsWith(dateStr) ? i : -1).filter((i: number) => i >= 0) ?? [];
  const wIdxs: number[] = wx?.hourly?.time?.map((t: string, i: number)  => t.startsWith(dateStr) ? i : -1).filter((i: number) => i >= 0) ?? [];
  const avg = (arr: number[], idxs: number[]) => idxs.length ? idxs.reduce((s: number, i: number) => s + (arr[i] ?? 0), 0) / idxs.length : null;
  const avgWave      = avg(mar?.hourly?.wave_height ?? [], mIdxs);
  const avgCurrentMs = avg(mar?.hourly?.ocean_current_velocity ?? [], mIdxs);
  const windArr: number[] = (wx?.hourly?.wind_speed_10m ?? []).map((v: number) => kmhToMs(v));
  const avgWindMs    = avg(windArr, wIdxs);
  const wCodes: number[] = wx?.hourly?.weather_code ?? [];
  const wCode = wIdxs.length ? wCodes[wIdxs[Math.floor(wIdxs.length / 2)]] ?? 0 : 0;
  return { avgWave, avgCurrentMs, avgWindMs, wCode };
}

/* ── Activity engine ──────────────────────────────────────────────────── */
type Status = "safe" | "caution" | "danger";
function computeActivities(
  avgWave: number|null, avgCurrentMs: number|null, avgWindMs: number|null,
  wCode: number, lang: "en"|"id",
) {
  const isStormy = wCode >= 95; const isRainy = wCode >= 51;
  const mk = (fn: () => Status, enL: string, idL: string, icon: React.ReactNode) => {
    const status = fn();
    return { id: enL, labelEn: enL, labelId: idL, icon, status };
  };
  return [
    mk(() => ((avgWave??0)>1.0||(avgWindMs??0)>7.9||(avgCurrentMs??0)>0.51)?"danger":((avgWave??0)>0.5||(avgWindMs??0)>3.3||(avgCurrentMs??0)>0.26)?"caution":"safe", "Snorkeling", "Snorkeling", <Waves size={12}/>),
    mk(() => (isStormy||(avgCurrentMs??0)>0.51||(avgWave??0)>1.25)?"danger":((avgCurrentMs??0)>0.26||(avgWave??0)>0.5)?"caution":"safe", "Scuba Diving", "Selam Scuba", <Anchor size={12}/>),
    mk(() => ((avgWave??0)>0.8||(avgCurrentMs??0)>0.51)?"danger":((avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe", "Freediving", "Freediving", <Navigation size={12}/>),
    mk(() => (isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>0.8)?"caution":"safe", "Jet Ski", "Jet Ski", <Zap size={12}/>),
    mk(() => ((avgWindMs??0)>6.2||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)?"danger":((avgWindMs??0)>4.5||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe", "SUP / Kayak", "SUP / Kayak", <Users size={12}/>),
    mk(() => ((avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":((avgWindMs??0)>7.9||(avgWave??0)>1.0)?"caution":"safe", "Island Hopping", "Wisata Pulau", <Ship size={12}/>),
    mk(() => (isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>1.0)?"caution":"safe", "Fishing", "Memancing", <Fish size={12}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"), "Turtle Watch", "Konservasi Penyu", <Leaf size={12}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"), "Beach Camping", "Camping Pantai", <Flag size={12}/>),
    mk(() => (isStormy||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)?"danger":(isRainy||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe", "UW Photography", "Foto Bawah Air", <Camera size={12}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"), "General Tourism", "Wisata Umum", <Sun size={12}/>),
  ];
}

const SC = {
  safe:    { bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#16a34a", pill: "#dcfce7" },
  caution: { bg: "#fefce8", border: "#fde047", text: "#854d0e", dot: "#ca8a04", pill: "#fef9c3" },
  danger:  { bg: "#fff1f2", border: "#fca5a5", text: "#991b1b", dot: "#dc2626", pill: "#fee2e2" },
};

const WMO: Record<number, {en:string;id:string}> = {
  0:{en:"Clear",id:"Cerah"},1:{en:"Mainly clear",id:"Cerah berawan"},2:{en:"Partly cloudy",id:"Sebagian berawan"},
  3:{en:"Overcast",id:"Mendung"},45:{en:"Foggy",id:"Berkabut"},51:{en:"Drizzle",id:"Gerimis"},
  61:{en:"Light rain",id:"Hujan ringan"},63:{en:"Rain",id:"Hujan"},65:{en:"Heavy rain",id:"Hujan lebat"},
  80:{en:"Showers",id:"Hujan rintik"},95:{en:"Storm",id:"Badai"},
};
const wmoLabel = (code: number, lang: "en"|"id") => {
  const n = Object.keys(WMO).map(Number).reduce((a,b) => Math.abs(b-code)<Math.abs(a-code)?b:a);
  return WMO[n]?.[lang] ?? "—";
};

/* ── IntersectionObserver hook ────────────────────────────────────────── */
const useInView = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ── Copy ─────────────────────────────────────────────────────────────── */
const COPY = {
  en: {
    tagline:       "MARINE INFORMATION · KEPULAUAN SERIBU",
    headline:      "Know Before\nYou Sail.",
    subline:       "Science-backed tidal prediction and real-time ocean conditions for safe maritime recreation across Searibu Islands.",
    heroCta:       "Open WebGIS",
    heroGhost:     "Check Safety",
    safetyEyebrow: "Activity Safety Check",
    safetyHead:    "Is today safe to go?",
    safetyBody:    "Select an island and date. We analyse tidal predictions, wave height, wind speed, and ocean current to give safety ratings for 11 marine activities.",
    islandLabel:   "Island",
    dateLabel:     "Date",
    checkBtn:      "Analyse Conditions",
    checking:      "Analysing…",
    noData:        "Choose an island and date to see safety ratings.",
    errorMsg:      "Could not load weather data. Please try again.",
    safe: "Safe", caution: "Caution", danger: "Avoid",
    wind: "Wind", wave: "Wave Ht.", current: "Current", weather: "Weather",
    rangeTip:      "Data: past 10 days · 3 days ahead",
    webgisSplitEyebrow: "Searibu WebGIS",
    webgisSplitHead:    "Interactive map of tides & weather.",
    webgisSplitBody:    "The WebGIS displays TPXO grids, the Luwes tidal station, and 12 island markers. Click any grid cell to access full hourly tidal and weather data for that location.",
    webgisBtn:     "Open Webgis",
    featEyebrow:   "What Searibu Does",
    featHead:      "One platform.\nEvery condition.",
    featSub:       "Built on IHO S-100/S-104 and TPXO-9 Atlas.",
    features: [
      { num: "01", title: "TPXO Tidal Prediction",     body: "Hourly astronomical tides from TPXO9 Atlas. 15 harmonic constituents, MSL datum, IHO S-104", icon: "waves" },
      { num: "02", title: "Real-time Marine Forecast",  body: "Wind, wave height, and current velocity updated hourly at ~15 km resolution via Open-Meteo Marine API.", icon: "wind" },
      { num: "03", title: "Interactive WebGIS Atlas",   body: "Leaflet map with TPXO-9 Atlas spatial grids, island markers, and the Luwes tidal station. Click any cell.", icon: "map" },
      { num: "04", title: "Activity Safety Ratings",    body: "Science-based thresholds for 11 marine activities.", icon: "shield" },
      { num: "05", title: "Observation vs. Prediction", body: "Luwes real-time water levels overlaid on TPXO. Transfer of Level correction −2.156 m for MSL.", icon: "chart" },
      { num: "06", title: "IHO S-104 HDF5 Export",      body: "Download astronomical and observed water level data as IHO S-104 compliant HDF5 files.", icon: "nav" },
    ],
    stdEyebrow: "Technical Standards",
    stdHead:    "Built to IHO\nhydrographic standards.",
    stdBody:    "Searibu implements IHO S-100 Universal Hydrographic Data Model and S-104 Water Level Information for Surface Navigation — ensuring interoperability with ECDIS environments worldwide.",
    stdCta:     "Open WebGIS",
    footerSub:  "Capstone Design Project · FITB · Institut Teknologi Bandung · 2026",
  },
  id: {
    tagline:       "INFORMASI KELAUTAN · KEPULAUAN SERIBU",
    headline:      "Ketahui Sebelum\nBerlayar.",
    subline:       "Prediksi pasut berbasis ilmiah dan kondisi laut real-time untuk wisata bahari yang aman di gugusan pulau terpopuler Indonesia.",
    heroCta:       "Buka WebGIS",
    heroGhost:     "Cek Keamanan",
    safetyEyebrow: "Cek Keamanan Aktivitas",
    safetyHead:    "Amankah hari ini?",
    safetyBody:    "Pilih pulau dan tanggal. Kami menganalisis prediksi pasut, tinggi gelombang, kecepatan angin, dan arus laut untuk memberi rating keamanan 11 aktivitas bahari.",
    islandLabel:   "Pulau",
    dateLabel:     "Tanggal",
    checkBtn:      "Analisis Kondisi",
    checking:      "Menganalisis…",
    noData:        "Pilih pulau dan tanggal untuk melihat rating keamanan.",
    errorMsg:      "Gagal memuat data cuaca. Silakan coba lagi.",
    safe: "Aman", caution: "Waspada", danger: "Hindari",
    wind: "Angin", wave: "Gel.", current: "Arus", weather: "Cuaca",
    rangeTip:      "Data: 10 hari lalu · 3 hari ke depan",
    webgisSplitEyebrow: "WebGIS Searibu",
    webgisSplitHead:    "Peta interaktif pasut & cuaca.",
    webgisSplitBody:    "WebGIS menampilkan grid TPXO, stasiun pasut Luwes, dan 12 penanda pulau. Klik sel grid mana pun untuk mengakses data pasut dan cuaca per jam lengkap.",
    webgisBtn:     "Buka WebGIS",
    featEyebrow:   "Apa Itu Searibu",
    featHead:      "Satu platform.\nSemua kondisi.",
    featSub:       "Dibangun di atas IHO S-100/S-104 dan TPXO-9 Atlas.",
    features: [
      { num: "01", title: "Prediksi Pasut TPXO",         body: "Pasut astronomis per jam dari TPXO-9 Atlas. 15 konstituen harmonik, datum MSL, sesuai IHO S-104 Ed.2.0.0.", icon: "waves" },
      { num: "02", title: "Prakiraan Laut Real-time",     body: "Angin, tinggi gelombang, dan kecepatan arus diperbarui per jam resolusi ~15 km via Open-Meteo Marine API.", icon: "wind" },
      { num: "03", title: "WebGIS Interaktif",      body: "Peta Leaflet dengan grid TPXO, penanda pulau, dan stasiun pasut Luwes. Klik sel grid untuk data lokal.", icon: "map" },
      { num: "04", title: "Penilaian Keamanan Aktivitas", body: "Ambang batas ilmiah (Chuang et al. 2024; de Vos & Rautenbach 2019) untuk 11 aktivitas wisata bahari.", icon: "shield" },
      { num: "05", title: "Observasi vs. Prediksi",       body: "Muka air real-time Luwes dioverlay di atas prediksi TPXO. Koreksi TOL −2,156 m untuk MSL.", icon: "chart" },
      { num: "06", title: "Ekspor HDF5 IHO S-104",        body: "Unduh data muka air prediksi astronomis dan observasi sebagai file HDF5 berstandar IHO S-104.", icon: "nav" },
    ],
    stdEyebrow: "Standar Teknis",
    stdHead:    "Dibangun sesuai\nstandar hidrografi IHO.",
    stdBody:    "Searibu mengimplementasikan IHO S-100 Universal Hydrographic Data Model dan S-104 Water Level Information for Surface Navigation — memastikan interoperabilitas dengan ECDIS di seluruh dunia.",
    stdCta:     "Buka WebGIS",
    footerSub:  "Proyek Capstone Design · FITB · Institut Teknologi Bandung · 2026",
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   SAFETY SECTION
   ────────────────────────────────────────────────────────────────────── */
const SafetySection: React.FC<{ language: "en"|"id"; onNavigate?: (p: string) => void }> = ({ language, onNavigate }) => {
  const c = COPY[language];
  const today = todayWIB();
  const minDate = addDaysISO(today, -10);
  const maxDate = addDaysISO(today, 3);

  const [selIsland,  setSelIsland]  = useState("");
  const [selDate,    setSelDate]    = useState(today);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string|null>(null);
  const [activities, setActivities] = useState<ReturnType<typeof computeActivities>|null>(null);
  const [conditions, setConditions] = useState<{ avgWave: number|null; avgCurrentMs: number|null; avgWindMs: number|null; wCode: number }|null>(null);
  const [dropOpen,   setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!selIsland) return;
    const island = ISLANDS.find(i => i.id === selIsland); if (!island) return;
    setLoading(true); setError(null);
    try {
      const cond = await fetchMeteoData(island.lat, island.lon, selDate);
      setConditions(cond);
      setActivities(computeActivities(cond.avgWave, cond.avgCurrentMs, cond.avgWindMs, cond.wCode, language));
    } catch { setError(c.errorMsg); }
    finally { setLoading(false); }
  }, [selIsland, selDate, language, c.errorMsg]);

  useEffect(() => {
    if (conditions) setActivities(computeActivities(conditions.avgWave, conditions.avgCurrentMs, conditions.avgWindMs, conditions.wCode, language));
  }, [language]);

  const selectedIsland = ISLANDS.find(i => i.id === selIsland);
  const safeCnt    = activities?.filter(a => a.status === "safe").length    ?? 0;
  const cautionCnt = activities?.filter(a => a.status === "caution").length ?? 0;
  const dangerCnt  = activities?.filter(a => a.status === "danger").length  ?? 0;
  const selDateFmt = selDate
    ? new Date(selDate + "T12:00:00Z").toLocaleDateString(language === "en" ? "en-US" : "id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Amber overline rule */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 44 }}>
        <div style={{ width: 40, height: 3, background: AMBER, flexShrink: 0 }} />
        <span style={{ fontFamily: STONEB, fontSize: 10, fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: AMBER }}>
          {c.safetyEyebrow}
        </span>
      </div>

      {/* Two-column */}
      <div className="safety-layout">
        {/* LEFT */}
        <div>
          <h2 style={{ fontFamily: STONEB, fontSize: "clamp(2rem,3.6vw,3rem)", fontWeight: 700, color: INK, margin: "0 0 18px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {c.safetyHead}
          </h2>
          <p style={{ fontFamily: STONE, fontSize: 15, lineHeight: 1.80, color: "#4a4a4a", margin: "0 0 36px", maxWidth: 400 }}>
            {c.safetyBody}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Island dropdown */}
            <div>
              <label style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: 8 }}>
                {c.islandLabel}
              </label>
              <div ref={dropRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 16px", border: `1.5px solid ${dropOpen ? OCEAN : RULE}`,
                    background: dropOpen ? SEAFOAM : "#fff", cursor: "pointer",
                    fontFamily: selIsland ? STONEB : STONE, fontSize: 14,
                    color: selIsland ? INK : "#bbb", textAlign: "left",
                    transition: "all 0.18s",
                    boxShadow: dropOpen ? `0 0 0 3px rgba(10,22,40,0.08)` : "none",
                  }}
                >
                  <span>{selectedIsland ? (language === "id" ? selectedIsland.nameId : selectedIsland.nameEn) : (language === "id" ? "Pilih pulau…" : "Select island…")}</span>
                  <ChevronDown size={14} style={{ color: "#bbb", flexShrink: 0, transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {dropOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200, background: "#fff", border: `1.5px solid ${OCEAN}`, borderTop: "none", maxHeight: 260, overflowY: "auto", boxShadow: "0 14px 36px rgba(0,0,0,0.13)" }}>
                    {ISLANDS.map(isl => (
                      <button
                        key={isl.id}
                        onClick={() => { setSelIsland(isl.id); setDropOpen(false); }}
                        style={{ width: "100%", padding: "12px 16px", background: selIsland === isl.id ? SEAFOAM : "none", border: "none", borderBottom: `1px solid ${PARCHMENT}`, cursor: "pointer", fontFamily: selIsland === isl.id ? STONEB : STONE, fontSize: 13, color: selIsland === isl.id ? OCEAN : INK, textAlign: "left", transition: "background 0.12s" }}
                        onMouseEnter={e => { if (selIsland !== isl.id) e.currentTarget.style.background = SAND; }}
                        onMouseLeave={e => { if (selIsland !== isl.id) e.currentTarget.style.background = "none"; }}
                      >
                        {language === "id" ? isl.nameId : isl.nameEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <label style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: 8 }}>
                {c.dateLabel}
              </label>
              <input
                type="date" value={selDate} min={minDate} max={maxDate}
                onChange={e => setSelDate(e.target.value)}
                style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${RULE}`, background: "#fff", fontFamily: STONE, fontSize: 14, color: INK, cursor: "pointer", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s, box-shadow 0.18s" }}
                onFocus={e => { e.currentTarget.style.borderColor = OCEAN; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,22,40,0.08)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = RULE; e.currentTarget.style.boxShadow = "none"; }}
              />
              <p style={{ fontFamily: STONE, fontSize: 11, color: "#bbb", marginTop: 7 }}>{c.rangeTip}</p>
            </div>

            {/* Analyse button */}
            <button
              onClick={handleCheck}
              disabled={!selIsland || loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "16px 28px", border: "none",
                background: selIsland && !loading ? OCEAN : RULE,
                color: "#fff",
                fontFamily: STONEB, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: selIsland && !loading ? "pointer" : "not-allowed",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => { if (selIsland && !loading) { e.currentTarget.style.background = REEF; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = selIsland && !loading ? OCEAN : RULE; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading
                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "hp-spin 0.7s linear infinite" }} />{c.checking}</>
                : <><Shield size={14} />{c.checkBtn}</>
              }
            </button>
          </div>
        </div>

        {/* RIGHT — results */}
        <div>
          {/* Empty state */}
          {!activities && !loading && !error && (
            <div style={{ border: `1.5px dashed ${RULE}`, padding: "56px 24px", textAlign: "center", background: SAND }}>
              <Shield size={28} style={{ color: RULE, margin: "0 auto 14px", display: "block" }} />
              <p style={{ fontFamily: STONE, fontSize: 14, color: "#bbb", margin: 0 }}>{c.noData}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "14px 18px", background: "#fff1f2", borderLeft: `3px solid #dc2626`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <XCircle size={14} style={{ color: "#dc2626", flexShrink: 0 }} />
                <span style={{ fontFamily: STONE, fontSize: 13, color: "#991b1b" }}>{error}</span>
                <button onClick={handleCheck} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: STONEB, fontSize: 12, color: "#dc2626" }}><RefreshCw size={11} />{language === "id" ? "Coba lagi" : "Retry"}</button>
              </div>
            </div>
          )}

          {/* Results */}
          {activities && !loading && (
            <div>
              {/* Result header bar */}
              <div style={{ borderTop: `3px solid ${AMBER}`, paddingTop: 16, marginBottom: 18 }}>
                <p style={{ fontFamily: STONEB, fontSize: 13, color: INK, margin: "0 0 10px" }}>
                  {selectedIsland ? (language === "id" ? selectedIsland.nameId : selectedIsland.nameEn) : ""} — {selDateFmt}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([
                    { label: c.safe,    count: safeCnt,    color: "#15803d", bg: "#dcfce7" },
                    { label: c.caution, count: cautionCnt, color: "#854d0e", bg: "#fef9c3" },
                    { label: c.danger,  count: dangerCnt,  color: "#991b1b", bg: "#fee2e2" },
                  ]).map(s => (
                    <span key={s.label} style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color, background: s.bg, padding: "4px 12px" }}>
                      {s.count} {s.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Condition metrics */}
              {conditions && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 14, background: RULE }}>
                  {[
                    { label: c.wind,    value: conditions.avgWindMs    != null ? conditions.avgWindMs.toFixed(1)    + " m/s" : "—" },
                    { label: c.wave,    value: conditions.avgWave      != null ? conditions.avgWave.toFixed(2)      + " m"   : "—" },
                    { label: c.current, value: conditions.avgCurrentMs != null ? conditions.avgCurrentMs.toFixed(2) + " m/s" : "—" },
                    { label: c.weather, value: wmoLabel(conditions.wCode, language) },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "10px 12px", background: SAND, textAlign: "center" }}>
                      <p style={{ fontFamily: STONEB, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", margin: "0 0 5px" }}>{item.label}</p>
                      <p style={{ fontFamily: STONEB, fontSize: 13, color: OCEAN, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: RULE }}>
                {activities.map(act => {
                  const cfg = SC[act.status];
                  const Ico = act.status === "safe" ? CheckCircle : act.status === "caution" ? AlertTriangle : XCircle;
                  return (
                    <div key={act.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fff" }}>
                      <span style={{ color: cfg.dot, flexShrink: 0 }}>{act.icon}</span>
                      <span style={{ fontFamily: STONE, fontSize: 12, color: INK, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {language === "id" ? act.labelId : act.labelEn}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, background: cfg.pill, padding: "2px 8px" }}>
                        <Ico size={9} style={{ color: cfg.dot }} />
                        <span style={{ fontFamily: STONEB, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: cfg.text }}>
                          {language === "id" ? (act.status === "safe" ? "Aman" : act.status === "caution" ? "Waspada" : "Hindari") : (act.status === "safe" ? "Safe" : act.status === "caution" ? "Caution" : "Avoid")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail CTA */}
              <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", border: `1.5px solid ${OCEAN}`, background: "transparent", color: OCEAN, fontFamily: STONEB, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = OCEAN; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = OCEAN; }}
                >
                  {language === "id" ? "Detail di WebGIS" : "View in WebGIS"} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   HOMEPAGE
   ────────────────────────────────────────────────────────────────────── */
export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const c = COPY[language as "en"|"id"];
  const lang = language as "en"|"id";

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [0, 80, 200, 360, 520, 680].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  const safetySectionRef = useRef<HTMLElement>(null);
  const scrollToSafety = () => safetySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const safety = useInView();
  const feat   = useInView();
  const std    = useInView();

  const fadeUp = (t: number, delay = 0): React.CSSProperties => ({
    opacity: phase >= t ? 1 : 0,
    transform: phase >= t ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });
  const revealUp = (inV: boolean, delay = 0): React.CSSProperties => ({
    opacity: inV ? 1 : 0,
    transform: inV ? "translateY(0)" : "translateY(26px)",
    transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const featIcons: Record<string, React.ReactNode> = {
    waves: <Waves size={17} color={OCEAN} />, wind: <Wind size={17} color={OCEAN} />,
    map: <Map size={17} color={OCEAN} />, shield: <Shield size={17} color={OCEAN} />,
    chart: <BarChart2 size={17} color={OCEAN} />, nav: <Navigation size={17} color={OCEAN} />,
  };

  return (
    <>
      {/* ── Global typography + layout styles ─── */}
      <style>{`
        @font-face {
          font-family: 'ITC Stone Sans Std';
          src: local('ITC Stone Sans Std'), local('Stone Sans Std'), local('StoneSerifStd');
          font-weight: 400; font-style: normal;
        }
        @font-face {
          font-family: 'ITC Stone Sans Std Semibold';
          src: local('ITC Stone Sans Std Semibold'), local('Stone Sans Std Semibold'), local('StoneSerifStd-Semibold');
          font-weight: 600; font-style: normal;
        }
        .hp-root { font-family: ${STONE}; background: ${SAND}; }
        .hp-root * { box-sizing: border-box; }

        .hp-section { padding: 96px 64px; }
        @media (max-width: 768px) { .hp-section { padding: 64px 24px; } }
        @media (max-width: 480px) { .hp-section { padding: 48px 16px; } }

        /* Hero layout */
        .hero-inner { display: grid; grid-template-columns: 1fr 36%; min-height: 100vh; }
        @media (max-width: 900px) { .hero-inner { grid-template-columns: 1fr; } .hero-side { display: none !important; } }

        /* Safety section */
        .safety-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        @media (max-width: 900px) { .safety-layout { grid-template-columns: 1fr; gap: 40px; } }

        /* WebGIS split */
        .split-grid { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) { .split-grid { grid-template-columns: 1fr; } }

        /* Feature list */
        .feat-list { display: grid; grid-template-columns: repeat(3,1fr); }
        @media (max-width: 900px) { .feat-list { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .feat-list { grid-template-columns: 1fr; } }

        /* Standards */
        .std-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        @media (max-width: 900px) { .std-layout { grid-template-columns: 1fr; gap: 40px; } }

        /* Photo strip */
        .photo-strip { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3px; }
        @media (max-width: 768px) { .photo-strip { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .photo-strip { grid-template-columns: 1fr; } }

        /* Footer responsive */
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 36px 64px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        @media (max-width: 768px) { .footer-inner { padding: 36px 24px 32px; } }

        @keyframes hp-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="hp-root">

        {/* ═══════════════════════════════════════
            HERO — full-bleed editorial cover
            ═══════════════════════════════════════ */}
        <section style={{ position: "relative", width: "100%", overflow: "hidden", background: INK }}>
          {/* Amber top rule */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER, zIndex: 10 }} />

          {/* Background image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <img src="/img/foto-1.jpg" alt="Kepulauan Seribu" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: 0.55 }} />
          </div>

          {/* Left-to-right ink gradient */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(100deg, rgba(10,22,40,0.97) 0%, rgba(10,22,40,0.84) 42%, rgba(10,22,40,0.22) 100%)` }} />

          {/* Bottom fade to SAND */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, zIndex: 3, background: `linear-gradient(to top, ${SAND}, transparent)` }} />

          <div className="hero-inner" style={{ position: "relative", zIndex: 5 }}>
            {/* ── TEXT COLUMN ── */}
            <div style={{ padding: "clamp(100px,12vw,140px) clamp(24px,6vw,80px) 80px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {/* Tagline */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30, ...fadeUp(2) }}>
                <div style={{ width: 36, height: 3, background: AMBER, flexShrink: 0 }} />
                <span style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: AMBER }}>
                  {c.tagline}
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: STONEB,
                fontSize: "clamp(3rem,7.5vw,6.8rem)",
                fontWeight: 700,
                color: "#ffeeb3",
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                margin: "0 0 28px",
                whiteSpace: "pre-line",
                ...fadeUp(3, 60),
              }}>
                {c.headline}
              </h1>

              {/* Editorial subline in serif italic */}
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(14px,1.6vw,18px)", lineHeight: 1.72, color: "rgba(255,238,179,0.58)", maxWidth: 480, margin: "0 0 40px", ...fadeUp(4, 100) }}>
                {c.subline}
              </p>

              {/* Rule */}
              <div style={{ width: 56, height: 1, background: "rgba(255,238,179,0.15)", marginBottom: 32, ...fadeUp(4, 115) }} />

              {/* CTAs */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", ...fadeUp(5, 140) }}>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 30px", background: AMBER, color: INK, border: "none", fontFamily: STONEB, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#5cff7a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = AMBER; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {c.heroCta} <ArrowRight size={14} />
                </button>
                <button
                  onClick={scrollToSafety}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", background: "transparent", color: "rgba(255,238,179,0.72)", border: "1px solid rgba(255,238,179,0.22)", fontFamily: STONEB, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,238,179,0.55)"; e.currentTarget.style.color = "#ffeeb3"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,238,179,0.22)"; e.currentTarget.style.color = "rgba(255,238,179,0.72)"; }}
                >
                  <Shield size={13} /> {c.heroGhost}
                </button>
              </div>
            </div>

            {/* ── SIDE PANEL ── (hidden on mobile) */}
            <div className="hero-side" style={{ borderLeft: "1px solid rgba(255,238,179,0.07)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "80px 48px 80px 44px", gap: 0, ...fadeUp(5, 200) }}>
              {[
                { label: lang === "id" ? "MODEL PASUT"   : "TIDAL MODEL",     value: "TPXO9 Atlas", sub: "Oregon State University" },
                { label: lang === "id" ? "KONSTITUEN"    : "CONSTITUENTS",    value: "15",              sub: lang === "id" ? "Harmonik aktif" : "Active harmonics" },
                { label: lang === "id" ? "STANDAR DATA"  : "DATA STANDARD",   value: "IHO S-104",       sub: "Edition 2.0.0 · Dec 2024" },
              ].map((item, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(255,238,179,0.10)", paddingTop: 22, paddingBottom: 22 }}>
                  <p style={{ fontFamily: STONEB, fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,238,179,0.32)", margin: "0 0 7px" }}>{item.label}</p>
                  <p style={{ fontFamily: STONEB, fontSize: 24, color: "#ffeeb3", margin: "0 0 4px", letterSpacing: "-0.01em" }}>{item.value}</p>
                  <p style={{ fontFamily: STONE, fontSize: 11, color: "rgba(255,238,179,0.36)", margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            PHOTO STRIP — editorial mosaic
            ═══════════════════════════════════════ */}
        <section style={{ background: INK, padding: "3px 0 0" }}>
          <div className="photo-strip">
            <img src="/img/foto-2.jpg" alt="Snorkeling Pulau Pari" style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", display:"block" }} />
            <img src="/img/foto-3.jpg" alt="Aerial Pulau Tidung" style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", display:"block" }} />
            <img src="/img/foto-4.jpg" alt="Sunset Kepulauan Seribu" style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", display:"block" }} />
          </div>

          {/* Stats bar */}
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderTop: `1px solid rgba(184,240,192,0.25)` }}>
            {[
              { n: "110+",  label: lang === "id" ? "Pulau"            : "Islands" },
              { n: "~75km", label: lang === "id" ? "Dari Jakarta"     : "From Jakarta" },
              { n: "7 jt+", label: lang === "id" ? "Pengunjung/tahun" : "Visitors/year" },
            ].map(item => (
              <div key={item.n} style={{ textAlign: "center", padding: "8px 16px" }}>
                <p style={{ fontFamily: STONEB, fontSize: "clamp(18px,2.4vw,26px)", color: AMBER, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{item.n}</p>
                <p style={{ fontFamily: STONE, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,238,179,0.36)", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SAFETY ASSESSMENT
            ═══════════════════════════════════════ */}
        <section ref={safetySectionRef} className="hp-section" style={{ background: SAND }}>
          <div ref={safety.ref} style={revealUp(safety.inView)}>
            <SafetySection language={lang} onNavigate={onNavigate} />
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WEBGIS EDITORIAL SPLIT
            ═══════════════════════════════════════ */}
        <section style={{ background: SAND, overflow: "hidden" }}>
          <div className="split-grid">
            <img src="/img/foto-5.jpg" alt="WebGIS Kepulauan Seribu" style={{ width:"100%", minHeight:340, objectFit:"cover", display:"block", aspectRatio:"4/3" }} />
            <div style={{ padding: "clamp(40px,6vw,80px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 32, height: 3, background: AMBER, flexShrink: 0 }} />
                <span style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: AMBER }}>{c.webgisSplitEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: STONEB, fontSize: "clamp(1.8rem,3.2vw,2.8rem)", fontWeight: 700, color: INK, lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
                {c.webgisSplitHead}
              </h2>
              <p style={{ fontFamily: STONE, fontSize: 15, lineHeight: 1.78, color: "#4a4a4a", maxWidth: 380, marginBottom: 32 }}>{c.webgisSplitBody}</p>
              <button
                onClick={() => onNavigate?.("webgis")}
                style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 26px", background: OCEAN, color: SAND, border: "none", fontFamily: STONEB, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = REEF; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = OCEAN; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {c.webgisBtn} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FEATURES — numbered editorial list
            ═══════════════════════════════════════ */}
        <section className="hp-section" style={{ background: PARCHMENT }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} ref={feat.ref}>
            {/* Header row */}
            <div style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 28, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, ...revealUp(feat.inView) }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 3, background: AMBER, flexShrink: 0 }} />
                  <span style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", color: AMBER }}>{c.featEyebrow}</span>
                </div>
                <h2 style={{ fontFamily: STONEB, fontSize: "clamp(1.9rem,3.4vw,3rem)", fontWeight: 700, color: INK, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, whiteSpace: "pre-line" }}>{c.featHead}</h2>
              </div>
              <p style={{ fontFamily: STONE, fontStyle: "italic", fontSize: 13, color: "#999", maxWidth: 260, textAlign: "right" }}>{c.featSub}</p>
            </div>

            {/* Cards */}
            <div className="feat-list" style={{ ...revealUp(feat.inView, 120) }}>
              {c.features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "38px 32px",
                    borderRight: `1px solid ${RULE}`,
                    borderBottom: `1px solid ${RULE}`,
                    transition: "background 0.22s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = SAND)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                    <span style={{ fontFamily: STONEB, fontSize: 40, color: RULE, lineHeight: 1, letterSpacing: "-0.05em" }}>{f.num}</span>
                    <div style={{ width: 40, height: 40, background: SEAFOAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {featIcons[f.icon]}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: STONEB, fontSize: 13, color: INK, margin: "0 0 10px", lineHeight: 1.3, letterSpacing: "0.04em", textTransform: "uppercase" }}>{f.title}</h3>
                  <p style={{ fontFamily: STONE, fontSize: 13, color: "#6a6a6a", lineHeight: 1.70, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            STANDARDS — dark editorial section
            ═══════════════════════════════════════ */}
        <section className="hp-section" style={{ background: INK, position: "relative", overflow: "hidden" }}>
          {/* Subtle dot texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,0,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }} ref={std.ref}>
            <div className="std-layout" style={revealUp(std.inView)}>
              {/* Left text */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                  <div style={{ width: 36, height: 3, background: AMBER, flexShrink: 0 }} />
                  <span style={{ fontFamily: STONEB, fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", color: AMBER }}>{c.stdEyebrow}</span>
                </div>
                <h2 style={{ fontFamily: STONEB, fontSize: "clamp(1.9rem,3.4vw,3rem)", fontWeight: 700, color: "#ffeeb3", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 22px", whiteSpace: "pre-line" }}>{c.stdHead}</h2>
                <p style={{ fontFamily: STONE, fontSize: 15, lineHeight: 1.78, color: "rgba(255,238,179,0.52)", marginBottom: 36, maxWidth: 420 }}>{c.stdBody}</p>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 30px", background: AMBER, color: INK, border: "none", fontFamily: STONEB, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#cccc00"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = AMBER; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {c.stdCta} <ArrowRight size={13} />
                </button>
              </div>

              {/* Right — standard cards */}
              <div style={{ display: "flex", flexDirection: "column", ...revealUp(std.inView, 160) }}>
                {[
                  { code: "IHO S-100",   sub: "Universal Hydrographic Data Model · Ed.5.2.0", desc: lang === "id" ? "Kerangka induk seluruh produk data maritim digital. Diadopsi penuh Desember 2024." : "The overarching framework for all digital maritime data products. Fully adopted December 2024.", accent: AMBER },
                  { code: "IHO S-104",   sub: "Water Level for Surface Navigation · Ed.2.0.0", desc: lang === "id" ? "Spesifikasi produk untuk data muka air dalam format HDF5, kompatibel ECDIS." : "Product specification for water level data in HDF5 format, ECDIS-compatible.", accent: AMBER },
                  { code: "TPXO-9 Atlas", sub: "Oregon State University · 1/30° resolution",    desc: lang === "id" ? "Model pasut global, 15 konstituen harmonik. Analisis harmonik mengikuti Schureman (1958)." : "Global tidal model, 15 harmonic constituents. Harmonic analysis follows Schureman (1958).", accent: CURRENT },
                ].map((s, i) => (
                  <div key={i} style={{ borderTop: "1px solid rgba(255,238,179,0.08)", padding: "24px 0", display: "flex", gap: 20 }}>
                    <div style={{ width: 3, flexShrink: 0, background: s.accent, alignSelf: "stretch", minHeight: 44 }} />
                    <div>
                      <p style={{ fontFamily: STONEB, fontSize: 17, color: "#ffeeb3", margin: "0 0 4px", letterSpacing: "-0.01em" }}>{s.code}</p>
                      <p style={{ fontFamily: STONE, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,238,179,0.28)", margin: "0 0 9px" }}>{s.sub}</p>
                      <p style={{ fontFamily: STONE, fontSize: 13, color: "rgba(255,238,179,0.48)", lineHeight: 1.62, margin: 0 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
                {/* TPXO grid placeholder */}
                <div style={{ marginTop: 4 }}>
                  <img src="/img/foto-6.jpg" alt="TPXO9 Grid Kepulauan Seribu" style={{ width:"100%", aspectRatio:"16/7", objectFit:"cover", display:"block" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════ */}
        <footer style={{ background: "#060a0e", borderTop: `3px solid ${AMBER}` }}>
          <div className="footer-inner">
            <img src="/logo.svg" alt="Searibu" style={{ height: 28, filter: "brightness(0) invert(1)", opacity: 0.65 }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: STONE, fontSize: 11, color: "rgba(255,238,179,0.24)", margin: 0 }}>{c.footerSub}</p>
              <p style={{ fontFamily: STONE, fontSize: 11, color: "rgba(255,238,179,0.12)", margin: "4px 0 0" }}>© 2026 Searibu</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};