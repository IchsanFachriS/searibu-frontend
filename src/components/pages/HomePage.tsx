import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  ArrowRight, Waves, Wind, Navigation, BarChart2, Map, Shield,
  Anchor, Fish, Camera, Sun, Leaf, Flag, Users, Ship, Zap,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown,
  ChevronRight,
} from "lucide-react";

/* ── Design tokens — extracted palette ────────────────────────────────── */
const FONT     = "'Inter', system-ui, -apple-system, sans-serif";

const DARK1    = "#2b2b2b";
const DARK2    = "#3a3a3a";
const OFF_WHITE= "#f5f0e8";
const AMBER    = "#f5c518";
const AMBER2   = "#f0b429";
const GREEN    = "#9de05a";
const ORANGE   = "#e8401c";
const PEACH    = "#f4bfad";
const BLUE_D   = "#1a3bbf";
const BLUE_M   = "#4fd4e8";
const BLUE_L   = "#ddf0fb";

const BG       = "#f7f4ef";
const SURFACE  = "#ffffff";
const BORDER   = "#e4ddd4";
const TEXT1    = "#1a1a1a";
const TEXT2    = "#3d3d3d";
const TEXT3    = "#6b6b6b";
const MUTED    = "#9a9a9a";

interface HomePageProps { onNavigate?: (page: string) => void; }

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
  const wIdxs: number[] = wx?.hourly?.time?.map((t: string, i: number) => t.startsWith(dateStr) ? i : -1).filter((i: number) => i >= 0) ?? [];
  const avg = (arr: number[], idxs: number[]) => idxs.length ? idxs.reduce((s: number, i: number) => s + (arr[i] ?? 0), 0) / idxs.length : null;
  const avgWave      = avg(mar?.hourly?.wave_height ?? [], mIdxs);
  const avgCurrentMs = avg(mar?.hourly?.ocean_current_velocity ?? [], mIdxs);
  const windArr: number[] = (wx?.hourly?.wind_speed_10m ?? []).map((v: number) => kmhToMs(v));
  const avgWindMs    = avg(windArr, wIdxs);
  const wCodes: number[] = wx?.hourly?.weather_code ?? [];
  const wCode = wIdxs.length ? wCodes[wIdxs[Math.floor(wIdxs.length / 2)]] ?? 0 : 0;
  return { avgWave, avgCurrentMs, avgWindMs, wCode };
}

type Status = "safe" | "caution" | "danger";
function computeActivities(avgWave: number|null, avgCurrentMs: number|null, avgWindMs: number|null, wCode: number, _lang: "en"|"id") {
  const isStormy = wCode >= 95; const isRainy = wCode >= 51;
  const mk = (fn: () => Status, enL: string, idL: string, icon: React.ReactNode) => ({ id: enL, labelEn: enL, labelId: idL, icon, status: fn() });
  return [
    mk(() => ((avgWave??0)>1.0||(avgWindMs??0)>7.9||(avgCurrentMs??0)>0.51)?"danger":((avgWave??0)>0.5||(avgWindMs??0)>3.3||(avgCurrentMs??0)>0.26)?"caution":"safe", "Snorkeling",      "Snorkeling",       <Waves size={11}/>),
    mk(() => (isStormy||(avgCurrentMs??0)>0.51||(avgWave??0)>1.25)?"danger":((avgCurrentMs??0)>0.26||(avgWave??0)>0.5)?"caution":"safe",  "Scuba Diving",    "Selam Scuba",      <Anchor size={11}/>),
    mk(() => ((avgWave??0)>0.8||(avgCurrentMs??0)>0.51)?"danger":((avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe",            "Freediving",      "Freediving",       <Navigation size={11}/>),
    mk(() => (isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>0.8)?"caution":"safe","Jet Ski",         "Jet Ski",          <Zap size={11}/>),
    mk(() => ((avgWindMs??0)>6.2||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)?"danger":((avgWindMs??0)>4.5||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe","SUP / Kayak","SUP / Kayak",<Users size={11}/>),
    mk(() => ((avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":((avgWindMs??0)>7.9||(avgWave??0)>1.0)?"caution":"safe",                   "Island Hopping",  "Wisata Pulau",     <Ship size={11}/>),
    mk(() => (isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)?"danger":(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>1.0)?"caution":"safe","Fishing",         "Memancing",        <Fish size={11}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"),                                                                                 "Turtle Watch",    "Konservasi Penyu", <Leaf size={11}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"),                                                                                 "Beach Camping",   "Camping Pantai",   <Flag size={11}/>),
    mk(() => (isStormy||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)?"danger":(isRainy||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)?"caution":"safe","UW Photography","Foto Bawah Air",<Camera size={11}/>),
    mk(() => isStormy?"danger":(isRainy?"caution":"safe"),                                                                                 "General Tourism", "Wisata Umum",      <Sun size={11}/>),
  ];
}

const SC = {
  safe:    { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#16a34a", pill: "#dcfce7" },
  caution: { bg: "#fefce8", border: "#fde047", text: "#854d0e", dot: "#ca8a04", pill: "#fef9c3" },
  danger:  { bg: "#fff1f2", border: "#fecdd3", text: "#991b1b", dot: "#dc2626", pill: "#fee2e2" },
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

const COPY = {
  en: {
    tagline: "MARINE INFORMATION · KEPULAUAN SERIBU",
    headline: "Know Before\nYou Sail.",
    subline: "Science-backed tidal prediction and real-time ocean conditions for safe maritime recreation across Searibu Islands.",
    heroCta: "Open WebGIS",
    heroGhost: "Check Safety",
    safetyEyebrow: "Activity Safety Check",
    safetyHead: "Is today safe to go?",
    safetyBody: "Select an island and date. We analyse tidal predictions, wave height, wind speed, and ocean current to give safety ratings for 11 marine activities.",
    islandLabel: "Island",
    dateLabel: "Date",
    checkBtn: "Analyse Conditions",
    checking: "Analysing…",
    noData: "Choose an island and date to see safety ratings.",
    errorMsg: "Could not load weather data. Please try again.",
    safe: "Safe", caution: "Caution", danger: "Avoid",
    wind: "Wind", wave: "Wave Ht.", current: "Current", weather: "Weather",
    rangeTip: "Data: past 10 days · 3 days ahead",
    webgisSplitEyebrow: "Searibu WebGIS",
    webgisSplitHead: "Interactive map of tides & weather.",
    webgisSplitBody: "The WebGIS displays TPXO grids, the Luwes tidal station, and 12 island markers. Click any grid cell to access full hourly tidal and weather data.",
    webgisBtn: "Open WebGIS",
    featEyebrow: "What Searibu Does",
    featHead: "One platform. Every condition.",
    features: [
      { num: "01", title: "TPXO Tidal Prediction",    body: "Hourly astronomical tides from TPXO9 Atlas. 15 harmonic constituents, MSL datum, IHO S-104.", icon: "waves" },
      { num: "02", title: "Real-time Marine Forecast", body: "Wind, wave height, and current velocity updated hourly at ~15 km resolution via Open-Meteo Marine API.", icon: "wind" },
      { num: "03", title: "Interactive WebGIS Atlas",  body: "Leaflet map with TPXO-9 Atlas spatial grids, island markers, and the Luwes tidal station.", icon: "map" },
      { num: "04", title: "Activity Safety Ratings",   body: "Science-based thresholds for 11 marine activities.", icon: "shield" },
      { num: "05", title: "Observation vs. Prediction",body: "Luwes real-time water levels overlaid on TPXO. Transfer of Level correction −2.156 m for MSL.", icon: "chart" },
      { num: "06", title: "IHO S-104 HDF5 Export",     body: "Download astronomical and observed water level data as IHO S-104 compliant HDF5 files.", icon: "nav" },
    ],
    stdEyebrow: "Technical Standards",
    stdBody: "Searibu implements IHO S-100 Universal Hydrographic Data Model and S-104 Water Level Information for Surface Navigation — ensuring interoperability with ECDIS environments worldwide.",
    stdCta: "Open WebGIS",
    footerSub: "Capstone Design Project · FITB · Institut Teknologi Bandung · 2026",
  },
  id: {
    tagline: "INFORMASI KELAUTAN · KEPULAUAN SERIBU",
    headline: "Ketahui Sebelum\nBerlayar.",
    subline: "Prediksi pasut berbasis ilmiah dan kondisi laut real-time untuk wisata bahari yang aman di gugusan pulau terpopuler Indonesia.",
    heroCta: "Buka WebGIS",
    heroGhost: "Cek Keamanan",
    safetyEyebrow: "Cek Keamanan Aktivitas",
    safetyHead: "Amankah hari ini?",
    safetyBody: "Pilih pulau dan tanggal. Kami menganalisis prediksi pasut, tinggi gelombang, kecepatan angin, dan arus laut untuk memberi rating keamanan 11 aktivitas bahari.",
    islandLabel: "Pulau",
    dateLabel: "Tanggal",
    checkBtn: "Analisis Kondisi",
    checking: "Menganalisis…",
    noData: "Pilih pulau dan tanggal untuk melihat rating keamanan.",
    errorMsg: "Gagal memuat data cuaca. Silakan coba lagi.",
    safe: "Aman", caution: "Waspada", danger: "Hindari",
    wind: "Angin", wave: "Gel.", current: "Arus", weather: "Cuaca",
    rangeTip: "Data: 10 hari lalu · 3 hari ke depan",
    webgisSplitEyebrow: "WebGIS Searibu",
    webgisSplitHead: "Peta interaktif pasut & cuaca.",
    webgisSplitBody: "WebGIS menampilkan grid TPXO, stasiun pasut Luwes, dan 12 penanda pulau. Klik sel grid mana pun untuk mengakses data pasut dan cuaca per jam lengkap.",
    webgisBtn: "Buka WebGIS",
    featEyebrow: "Apa Itu Searibu",
    featHead: "Satu platform. Semua kondisi.",
    features: [
      { num: "01", title: "Prediksi Pasut TPXO",          body: "Pasut astronomis per jam dari TPXO-9 Atlas. 15 konstituen harmonik, datum MSL, sesuai IHO S-104.", icon: "waves" },
      { num: "02", title: "Prakiraan Laut Real-time",      body: "Angin, tinggi gelombang, dan kecepatan arus diperbarui per jam resolusi ~15 km via Open-Meteo Marine API.", icon: "wind" },
      { num: "03", title: "WebGIS Interaktif",             body: "Peta Leaflet dengan grid TPXO, penanda pulau, dan stasiun pasut Luwes. Klik sel grid untuk data lokal.", icon: "map" },
      { num: "04", title: "Penilaian Keamanan Aktivitas",  body: "Ambang batas ilmiah untuk 11 aktivitas wisata bahari.", icon: "shield" },
      { num: "05", title: "Observasi vs. Prediksi",        body: "Muka air real-time Luwes dioverlay di atas prediksi TPXO. Koreksi TOL −2,156 m untuk MSL.", icon: "chart" },
      { num: "06", title: "Ekspor HDF5 IHO S-104",         body: "Unduh data muka air prediksi astronomis dan observasi sebagai file HDF5 berstandar IHO S-104.", icon: "nav" },
    ],
    stdEyebrow: "Standar Teknis",
    stdBody: "Searibu mengimplementasikan IHO S-100 Universal Hydrographic Data Model dan S-104 Water Level Information for Surface Navigation — memastikan interoperabilitas dengan ECDIS di seluruh dunia.",
    stdCta: "Buka WebGIS",
    footerSub: "Proyek Capstone Design · FITB · Institut Teknologi Bandung · 2026",
  },
};

/* ── Safety Section ───────────────────────────────────────────────────── */
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
  const [conditions, setConditions] = useState<{avgWave:number|null;avgCurrentMs:number|null;avgWindMs:number|null;wCode:number}|null>(null);
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
  const selDateFmt = selDate ? new Date(selDate + "T12:00:00Z").toLocaleDateString(language === "en" ? "en-US" : "id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
        <div style={{ width: 3, height: 28, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: TEXT3 }}>
          {c.safetyEyebrow}
        </span>
      </div>

      <div className="safety-layout">
        {/* LEFT */}
        <div>
          <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.9rem,3.2vw,2.8rem)", fontWeight: 800, color: TEXT1, margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {c.safetyHead}
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.75, color: TEXT3, margin: "0 0 36px", maxWidth: 420 }}>
            {c.safetyBody}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Island dropdown */}
            <div>
              <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: TEXT3, display: "block", marginBottom: 8 }}>
                {c.islandLabel}
              </label>
              <div ref={dropRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${dropOpen ? BLUE_D : BORDER}`,
                    background: "#fff", cursor: "pointer",
                    fontFamily: FONT, fontSize: 14, color: selIsland ? TEXT1 : MUTED,
                    fontWeight: selIsland ? 500 : 400,
                    boxShadow: dropOpen ? `0 0 0 3px rgba(26,59,191,0.08)` : "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "all 0.18s",
                  }}
                >
                  <span>{selectedIsland ? (language === "id" ? selectedIsland.nameId : selectedIsland.nameEn) : (language === "id" ? "Pilih pulau…" : "Select island…")}</span>
                  <ChevronDown size={14} style={{ color: MUTED, flexShrink: 0, transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {dropOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200, background: "#fff", borderRadius: 9, border: `1.5px solid ${BLUE_D}`, maxHeight: 260, overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)" }}>
                    {ISLANDS.map(isl => (
                      <button
                        key={isl.id}
                        onClick={() => { setSelIsland(isl.id); setDropOpen(false); }}
                        style={{ width: "100%", padding: "11px 14px", background: selIsland === isl.id ? "#eef1fb" : "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: selIsland === isl.id ? 600 : 400, color: selIsland === isl.id ? BLUE_D : TEXT2, textAlign: "left", transition: "background 0.10s" }}
                        onMouseEnter={(e) => { if (selIsland !== isl.id) e.currentTarget.style.background = "#faf8f5"; }}
                        onMouseLeave={(e) => { if (selIsland !== isl.id) e.currentTarget.style.background = "none"; }}
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
              <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: TEXT3, display: "block", marginBottom: 8 }}>
                {c.dateLabel}
              </label>
              <input
                type="date" value={selDate} min={minDate} max={maxDate}
                onChange={e => setSelDate(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${BORDER}`, background: "#fff", fontFamily: FONT, fontSize: 14, color: TEXT1, cursor: "pointer", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.18s, box-shadow 0.18s", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = BLUE_D; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,59,191,0.08)`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; }}
              />
              <p style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 6 }}>{c.rangeTip}</p>
            </div>

            {/* Analyse button */}
            <button
              onClick={handleCheck}
              disabled={!selIsland || loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 24px", borderRadius: 9, border: "none",
                background: selIsland && !loading ? BLUE_D : "#e4ddd4",
                color: selIsland && !loading ? "#fff" : MUTED,
                fontFamily: FONT, fontSize: 13, fontWeight: 600, letterSpacing: "0.02em",
                cursor: selIsland && !loading ? "pointer" : "not-allowed",
                transition: "all 0.18s", boxShadow: selIsland && !loading ? "0 4px 14px rgba(26,59,191,0.28)" : "none",
              }}
              onMouseEnter={(e) => { if (selIsland && !loading) { e.currentTarget.style.background = "#142d99"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(26,59,191,0.36)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = selIsland && !loading ? BLUE_D : "#e4ddd4"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = selIsland && !loading ? "0 4px 14px rgba(26,59,191,0.28)" : "none"; }}
            >
              {loading
                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "hp-spin 0.7s linear infinite" }} />{c.checking}</>
                : <><Shield size={14} />{c.checkBtn}</>
              }
            </button>
          </div>
        </div>

        {/* RIGHT — results */}
        <div>
          {!activities && !loading && !error && (
            <div style={{ border: `1.5px dashed ${BORDER}`, borderRadius: 12, padding: "56px 24px", textAlign: "center", background: "#faf8f5" }}>
              <Shield size={28} style={{ color: "#d6cfc5", margin: "0 auto 14px", display: "block" }} />
              <p style={{ fontFamily: FONT, fontSize: 14, color: MUTED, margin: 0 }}>{c.noData}</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "#fff1f2", borderRadius: 9, border: "1px solid #fecdd3", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <XCircle size={14} style={{ color: "#dc2626", flexShrink: 0 }} />
                <span style={{ fontFamily: FONT, fontSize: 13, color: "#991b1b" }}>{error}</span>
                <button onClick={handleCheck} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 12, color: "#dc2626", fontWeight: 600 }}><RefreshCw size={11} />{language === "id" ? "Coba lagi" : "Retry"}</button>
              </div>
            </div>
          )}

          {activities && !loading && (
            <div>
              {/* Header */}
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: `2px solid ${AMBER}` }}>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: TEXT1, margin: "0 0 10px" }}>
                  {selectedIsland ? (language === "id" ? selectedIsland.nameId : selectedIsland.nameEn) : ""} — {selDateFmt}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {[
                    { label: c.safe,    count: safeCnt,    bg: "#dcfce7", color: "#15803d" },
                    { label: c.caution, count: cautionCnt, bg: "#fef9c3", color: "#854d0e" },
                    { label: c.danger,  count: dangerCnt,  bg: "#fee2e2", color: "#991b1b" },
                  ].map(s => (
                    <span key={s.label} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: s.color, background: s.bg, padding: "4px 11px", borderRadius: 99 }}>
                      {s.count} {s.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Condition metrics */}
              {conditions && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: c.wind,    value: conditions.avgWindMs    != null ? conditions.avgWindMs.toFixed(1)    + " m/s" : "—" },
                    { label: c.wave,    value: conditions.avgWave      != null ? conditions.avgWave.toFixed(2)      + " m"   : "—" },
                    { label: c.current, value: conditions.avgCurrentMs != null ? conditions.avgCurrentMs.toFixed(2) + " m/s" : "—" },
                    { label: c.weather, value: wmoLabel(conditions.wCode, language) },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "10px 10px", background: "#faf8f5", borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: "center" as const }}>
                      <p style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: MUTED, margin: "0 0 4px" }}>{item.label}</p>
                      <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: TEXT1, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {activities.map(act => {
                  const cfg = SC[act.status];
                  const Ico = act.status === "safe" ? CheckCircle : act.status === "caution" ? AlertTriangle : XCircle;
                  return (
                    <div key={act.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}` }}>
                      <span style={{ color: cfg.dot, flexShrink: 0 }}>{act.icon}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: TEXT2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {language === "id" ? act.labelId : act.labelEn}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, background: cfg.pill, padding: "2px 7px", borderRadius: 99 }}>
                        <Ico size={9} style={{ color: cfg.dot }} />
                        <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: cfg.text }}>
                          {language === "id" ? (act.status === "safe" ? "Aman" : act.status === "caution" ? "Waspada" : "Hindari") : (act.status === "safe" ? "Safe" : act.status === "caution" ? "Caution" : "Avoid")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 8, border: `1.5px solid ${BLUE_D}`, background: "transparent", color: BLUE_D, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_D; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = BLUE_D; }}
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

/* ── HomePage ─────────────────────────────────────────────────────────── */
export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const c    = COPY[language as "en"|"id"];
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
    transform: phase >= t ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });
  const revealUp = (inV: boolean, delay = 0): React.CSSProperties => ({
    opacity: inV ? 1 : 0,
    transform: inV ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const featIcons: Record<string, React.ReactNode> = {
    waves: <Waves size={17} color={BLUE_D} />, wind: <Wind size={17} color={BLUE_D} />,
    map:   <Map   size={17} color={BLUE_D} />, shield: <Shield size={17} color={BLUE_D} />,
    chart: <BarChart2 size={17} color={BLUE_D} />, nav: <Navigation size={17} color={BLUE_D} />,
  };

  return (
    <>
      <style>{`
        .hp-root { font-family: ${FONT}; background: ${BG}; color: ${TEXT1}; }
        .hp-root * { box-sizing: border-box; }
        .hp-section { padding: 80px 48px; }
        @media (max-width:1024px){ .hp-section { padding: 64px 32px; } }
        @media (max-width:768px) { .hp-section { padding: 52px 20px; } }
        @media (max-width:480px) { .hp-section { padding: 40px 16px; } }

        /* Hero */
        .hero-inner { display: grid; grid-template-columns: 1fr 36%; min-height: 100vh; }
        @media (max-width:900px) { .hero-inner { grid-template-columns: 1fr; } .hero-side { display: none !important; } }

        /* Safety */
        .safety-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
        @media (max-width:1024px){ .safety-layout { gap: 40px; } }
        @media (max-width:860px) { .safety-layout { grid-template-columns: 1fr; gap: 32px; } }

        /* WebGIS split */
        .split-grid { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width:768px) { .split-grid { grid-template-columns: 1fr; } }

        /* Features */
        .feat-list { display: grid; grid-template-columns: repeat(3,1fr); }
        @media (max-width:960px){ .feat-list { grid-template-columns: 1fr 1fr; } }
        @media (max-width:560px){ .feat-list { grid-template-columns: 1fr; } }

        /* Standards */
        .std-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        @media (max-width:900px){ .std-layout { grid-template-columns: 1fr; gap: 40px; } }

        /* Photo strip — left big spans full height (row 1+2), right 2x2 grid */
        .photo-strip {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 210px 210px;
          gap: 3px;
        }
        .photo-strip-main {
          grid-column: 1;
          grid-row: 1 / 3;
          min-height: 0;
        }
        .photo-strip img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        @media (max-width: 1100px) {
          .photo-strip { grid-template-rows: 180px 180px; }
        }
        @media (max-width: 768px) {
          .photo-strip {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 200px 160px 160px;
          }
          .photo-strip-main { grid-column: 1 / 3; grid-row: 1; }
        }
        @media (max-width: 480px) {
          .photo-strip {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(5, 180px);
          }
          .photo-strip-main { grid-column: 1; grid-row: auto; }
        }

        /* Stats bar */
        .stats-bar { max-width:1200px; margin:0 auto; padding:20px 48px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
        @media (max-width:768px){ .stats-bar { padding:14px 20px; justify-content:center; } }

        /* Footer */
        .footer-inner { max-width:1360px; margin:0 auto; padding:28px 48px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; }
        @media (max-width:768px){ .footer-inner { padding:22px 20px; flex-direction:column; align-items:flex-start; gap:8px; } }

        /* Hero CTAs */
        .hero-ctas { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        @media (max-width:360px){ .hero-ctas { flex-direction:column; align-items:stretch; gap:10px; } .hero-ctas button { width:100%; justify-content:center; } }

        @keyframes hp-spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="hp-root">

        {/* ═══ HERO ═════════════════════════════════════════════════════ */}
        <section style={{ position: "relative", width: "100%", overflow: "hidden", background: DARK1 }}>
          {/* Amber top rule */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER, zIndex: 10 }} />

          {/* Background image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <img src="/img/background.jpg" alt="Kepulauan Seribu" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: 0.45 }} />
          </div>

          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(110deg, rgba(26,26,26,0.96) 0%, rgba(26,26,26,0.82) 42%, rgba(26,26,26,0.18) 100%)` }} />

          {/* Bottom fade */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, zIndex: 3, background: `linear-gradient(to top, ${BG}, transparent)` }} />

          <div className="hero-inner" style={{ position: "relative", zIndex: 5 }}>
            <div style={{ padding: "clamp(100px,12vw,140px) clamp(24px,6vw,80px) 80px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>

              {/* Tagline */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, ...fadeUp(2) }}>
                <div style={{ width: 32, height: 2, background: AMBER, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase" as const, color: AMBER }}>
                  {c.tagline}
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: FONT,
                fontSize: "clamp(2.8rem,7vw,6.2rem)",
                fontWeight: 800,
                color: OFF_WHITE,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                margin: "0 0 24px",
                whiteSpace: "pre-line",
                ...fadeUp(3, 60),
              }}>
                {c.headline}
              </h1>

              {/* Subline */}
              <p style={{ fontFamily: FONT, fontSize: "clamp(14px,1.5vw,17px)", lineHeight: 1.72, color: "rgba(245,240,232,0.60)", maxWidth: 480, margin: "0 0 40px", fontWeight: 400, ...fadeUp(4, 100) }}>
                {c.subline}
              </p>

              {/* Divider */}
              <div style={{ width: 48, height: 1, background: "rgba(245,240,232,0.15)", marginBottom: 32, ...fadeUp(4, 115) }} />

              {/* CTAs */}
              <div className="hero-ctas" style={{ ...fadeUp(5, 140) }}>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", background: AMBER, color: DARK1, border: "none", fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", borderRadius: 9, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(245,193,24,0.40)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = AMBER2; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,193,24,0.50)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = AMBER; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,193,24,0.40)"; }}
                >
                  {c.heroCta} <ArrowRight size={14} />
                </button>
                <button
                  onClick={scrollToSafety}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", background: "transparent", color: "rgba(245,240,232,0.75)", border: "1.5px solid rgba(245,240,232,0.22)", fontFamily: FONT, fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", borderRadius: 9, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,240,232,0.55)"; e.currentTarget.style.color = OFF_WHITE; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,240,232,0.22)"; e.currentTarget.style.color = "rgba(245,240,232,0.75)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Shield size={13} /> {c.heroGhost}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PHOTO STRIP ══════════════════════════════════════════════ */}
        <section style={{ background: DARK1, padding: "3px 0 0" }}>
          <div className="photo-strip">
            {/* Main left — spans both rows */}
            <img src="/img/foto-1.jpg" alt="Searibu" className="photo-strip-main" />
            {/* Row 1 right */}
            <img src="/img/foto-2.jpg" alt="" />
            <img src="/img/foto-3.jpg" alt="" />
            {/* Row 2 right — fills the previously empty space */}
            <img src="/img/foto-4.jpg" alt="" />
            <img src="/img/foto-5.jpg" alt="" style={{ objectPosition: "center 40%" }} />
          </div>

          {/* Stats */}
          <div className="stats-bar">
            {[
              { n: "110",  label: lang === "id" ? "Pulau"            : "Islands" },
              { n: "~45km", label: lang === "id" ? "Dari Jakarta"     : "From Jakarta" },
              { n: "400k", label: lang === "id" ? "Pengunjung/tahun" : "Visitors/year" },
            ].map(item => (
              <div key={item.n} style={{ textAlign: "center", padding: "8px 20px" }}>
                <p style={{ fontFamily: FONT, fontSize: "clamp(18px,2.2vw,26px)", fontWeight: 800, color: AMBER, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{item.n}</p>
                <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(245,240,232,0.35)", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SAFETY ═══════════════════════════════════════════════════ */}
        <section ref={safetySectionRef} className="hp-section" style={{ background: BG }}>
          <div ref={safety.ref} style={revealUp(safety.inView)}>
            <SafetySection language={lang} onNavigate={onNavigate} />
          </div>
        </section>

        {/* ═══ WEBGIS SPLIT ═════════════════════════════════════════════ */}
        <section style={{ background: SURFACE, overflow: "hidden", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div className="split-grid">
            <img src="/img/foto-5.jpg" alt="WebGIS" style={{ width:"100%", minHeight:340, objectFit:"cover", display:"block", aspectRatio:"4/3" }} />
            <div style={{ padding: "clamp(40px,6vw,80px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 3, height: 20, background: AMBER, borderRadius: 2 }} />
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: TEXT3 }}>{c.webgisSplitEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.6rem,3vw,2.5rem)", fontWeight: 800, color: TEXT1, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
                {c.webgisSplitHead}
              </h2>
              <p style={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.75, color: TEXT3, maxWidth: 380, marginBottom: 28 }}>{c.webgisSplitBody}</p>
              <button
                onClick={() => onNavigate?.("webgis")}
                style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 24px", background: BLUE_D, color: "#fff", border: "none", fontFamily: FONT, fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: "pointer", transition: "all 0.18s", boxShadow: "0 4px 14px rgba(26,59,191,0.28)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#142d99"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,59,191,0.36)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = BLUE_D; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,59,191,0.28)"; }}
              >
                {c.webgisBtn} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═════════════════════════════════════════════════ */}
        <section className="hp-section" style={{ background: BG }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} ref={feat.ref}>
            {/* Header */}
            <div style={{ borderBottom: `2px solid ${DARK1}`, paddingBottom: 28, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, ...revealUp(feat.inView) }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 22, background: AMBER, borderRadius: 2 }} />
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: TEXT3 }}>{c.featEyebrow}</span>
                </div>
                <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.8rem,3.2vw,2.8rem)", fontWeight: 800, color: TEXT1, lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0 }}>
                  {c.featHead}
                </h2>
              </div>
            </div>

            {/* Cards */}
            <div className="feat-list" style={{ ...revealUp(feat.inView, 120) }}>
              {c.features.map((f, i) => (
                <div
                  key={i}
                  style={{ padding: "32px 28px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, transition: "background 0.18s", cursor: "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 800, color: BORDER, lineHeight: 1, letterSpacing: "-0.06em" }}>{f.num}</span>
                    <div style={{ width: 40, height: 40, background: BLUE_L, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {featIcons[f.icon]}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 8px", lineHeight: 1.3, letterSpacing: "0.01em", textTransform: "uppercase" as const }}>{f.title}</h3>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: TEXT3, lineHeight: 1.70, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STANDARDS ════════════════════════════════════════════════ */}
        <section className="hp-section" style={{ background: DARK1, position: "relative", overflow: "hidden" }}>
          {/* Subtle dot texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(245,193,24,0.06) 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }} ref={std.ref}>
            <div className="std-layout" style={revealUp(std.inView)}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                  <div style={{ width: 3, height: 22, background: AMBER, borderRadius: 2 }} />
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(245,193,24,0.80)" }}>{c.stdEyebrow}</span>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.80, color: "rgba(245,240,232,0.55)", marginBottom: 36, maxWidth: 440 }}>{c.stdBody}</p>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", background: AMBER, color: DARK1, border: "none", fontFamily: FONT, fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: "pointer", transition: "all 0.18s", boxShadow: "0 4px 16px rgba(245,193,24,0.35)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = AMBER2; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = AMBER; e.currentTarget.style.transform = "none"; }}
                >
                  {c.stdCta} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══════════════════════════════════════════════════ */}
        <footer style={{ background: "#181818", borderTop: `3px solid ${AMBER}` }}>
          <div className="footer-inner">
            <img src="/logo.svg" alt="Searibu" style={{ height: 28, filter: "brightness(0) invert(1)", opacity: 0.60 }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(245,240,232,0.25)", margin: 0 }}>{c.footerSub}</p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(245,240,232,0.12)", margin: "4px 0 0" }}>© 2026 Searibu</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};