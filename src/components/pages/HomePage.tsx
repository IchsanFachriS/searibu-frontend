import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowRight, Waves, Wind, Navigation, BarChart2, Map, Shield, ChevronDown, CheckCircle, AlertTriangle, XCircle, Anchor, Fish, Camera, Leaf, Flag, Users, Ship, Zap, Search } from "lucide-react";

const DISPLAY      = '"Cormorant Garamond", "Georgia", serif';
const SANS         = '"Inter", "Helvetica Neue", Arial, sans-serif';
const NAVY         = "#024e78";
const PRIMARY      = "#0369a1";
const PRIMARY_SOFT = "#0ea5e9";
const TEAL         = "#14b8a6";

interface HomePageProps { onNavigate?: (page: string) => void; }

/* ── Islands list (same as MapContainer) ─────────────────────────── */
const ISLANDS = [
  { id: "bidadari",    name: "Pulau Bidadari",    nameEn: "Bidadari Island",    lat: -6.035347, lon: 106.746234 },
  { id: "tidung",      name: "Pulau Tidung",      nameEn: "Tidung Island",      lat: -5.797360, lon: 106.497220 },
  { id: "pari",        name: "Pulau Pari",        nameEn: "Pari Island",        lat: -5.857626, lon: 106.617560 },
  { id: "kelapa",      name: "Pulau Kelapa",      nameEn: "Kelapa Island",      lat: -5.653659, lon: 106.569023 },
  { id: "pramuka",     name: "Pulau Pramuka",     nameEn: "Pramuka Island",     lat: -5.745159, lon: 106.613782 },
  { id: "untung_jawa", name: "Pulau Untung Jawa", nameEn: "Untung Jawa Island", lat: -5.977321, lon: 106.705921 },
  { id: "kotok",       name: "Pulau Kotok",       nameEn: "Kotok Island",       lat: -5.700621, lon: 106.538661 },
  { id: "putri",       name: "Pulau Putri",       nameEn: "Putri Island",       lat: -5.593901, lon: 106.560171 },
  { id: "ayer",        name: "Pulau Ayer",        nameEn: "Ayer Island",        lat: -5.763737, lon: 106.583138 },
  { id: "rambut",      name: "Pulau Rambut",      nameEn: "Rambut Island",      lat: -5.975101, lon: 106.692101 },
  { id: "lancang",     name: "Pulau Lancang",     nameEn: "Lancang Island",     lat: -5.929764, lon: 106.586512 },
  { id: "bokor",       name: "Pulau Bokor",       nameEn: "Bokor Island",       lat: -5.978006, lon: 106.706506 },
];

/* ── Activity engine (mirrors InfoPanel logic, simplified) ───────── */
const kmhToMs = (v: number) => v / 3.6;

interface ActivityRec {
  id: string;
  labelEn: string;
  labelId: string;
  icon: React.ReactNode;
  status: "safe" | "caution" | "danger";
  reasonEn: string;
  reasonId: string;
}

function buildActivities(
  waveH: number | null,
  windMs: number | null,
  currentMs: number | null,
  wCode: number,
  lang: "en" | "id",
): ActivityRec[] {
  const isStormy = wCode >= 95;
  const isRainy  = wCode >= 51;
  type S = "safe" | "caution" | "danger";

  const snorkel  = (): S => ((waveH??0)>1.0||(windMs??0)>7.9||(currentMs??0)>0.51)? "danger"  :((waveH??0)>0.5||(windMs??0)>3.3||(currentMs??0)>0.26)?"caution":"safe";
  const scuba    = (): S => (isStormy||(currentMs??0)>0.51||(waveH??0)>1.25)?        "danger"  :((currentMs??0)>0.26||(waveH??0)>0.5)?                   "caution":"safe";
  const freedive = (): S => ((waveH??0)>0.8||(currentMs??0)>0.51)?                   "danger"  :((waveH??0)>0.5||(currentMs??0)>0.26)?                    "caution":"safe";
  const jetski   = (): S => (isStormy||(windMs??0)>10.3||(waveH??0)>1.5)?            "danger"  :(isRainy||(windMs??0)>7.9||(waveH??0)>0.8)?               "caution":"safe";
  const sup      = (): S => ((windMs??0)>6.2||(waveH??0)>1.0||(currentMs??0)>0.51)?  "danger"  :((windMs??0)>4.5||(waveH??0)>0.5||(currentMs??0)>0.26)?   "caution":"safe";
  const boat     = (): S => ((windMs??0)>10.3||(waveH??0)>1.5)?                       "danger"  :((windMs??0)>7.9||(waveH??0)>1.0)?                         "caution":"safe";
  const fishing  = (): S => (isStormy||(windMs??0)>10.3||(waveH??0)>1.5)?            "danger"  :(isRainy||(windMs??0)>7.9||(waveH??0)>1.0)?                "caution":"safe";
  const general  = (): S => isStormy?"danger":isRainy?"caution":"safe";

  const reasons: Record<string, { safe:[string,string]; caution:[string,string]; danger:[string,string] }> = {
    snorkeling: { safe:["Calm sea, good visibility","Laut tenang, visibilitas baik"], caution:["Moderate — experienced snorkelers only","Kondisi sedang — snorkeler berpengalaman"], danger:["Rough sea or strong current","Laut kasar atau arus kuat"] },
    scuba:      { safe:["Good visibility, safe current","Visibilitas baik, arus aman"], caution:["Moderate current — plan with slack tide","Arus sedang — rencanakan saat slack tide"], danger:["Current too strong or rough sea","Arus melebihi batas aman"] },
    freedive:   { safe:["Calm water, safe breath-hold","Air tenang, aman freediving"], caution:["Moderate swell — buddy required","Ombak sedang — wajib buddy"], danger:["High wave or strong current","Ombak tinggi atau arus kuat"] },
    jetski:     { safe:["Calm sea, good for water sports","Laut tenang, baik olahraga air"], caution:["Choppy — reduce speed","Air bergelombang — kurangi kecepatan"], danger:["Strong wind or high waves","Angin kencang atau ombak tinggi"] },
    sup:        { safe:["Flat water, ideal paddling","Air tenang, ideal paddling"], caution:["Light chop — experienced only","Sedikit bergelombang — paddler berpengalaman"], danger:["Wind/wave exceeds safe SUP limit","Angin/ombak melampaui batas aman SUP"] },
    boat:       { safe:["Calm sea, good inter-island travel","Laut tenang, baik antar pulau"], caution:["Moderate sea — check vessel","Laut sedang — periksa kelayakan kapal"], danger:["Exceeds small-craft limits","Melampaui batas kapal kecil"] },
    fishing:    { safe:["Good conditions for fishing","Kondisi laut baik memancing"], caution:["Moderate wind/wave — stay near shore","Angin/ombak sedang — tetap dekat pantai"], danger:["Dangerous sea state","Kondisi laut berbahaya"] },
    camping:    { safe:["Clear weather, comfortable beach","Cuaca cerah, pantai nyaman"], caution:["Rain expected — limited access","Kemungkinan hujan — akses terbatas"], danger:["Storm — outdoor activities unsafe","Badai — aktivitas pantai tidak aman"] },
    uwphoto:    { safe:["Excellent UW visibility","Visibilitas sangat baik foto bawah air"], caution:["Reduced visibility — challenging","Visibilitas berkurang — menantang"], danger:["Poor visibility or strong current","Visibilitas buruk atau arus kuat"] },
    turtle:     { safe:["Good for conservation activities","Kondisi baik untuk konservasi"], caution:["Rain or tides may affect access","Hujan/pasut ganggu akses"], danger:["Storm — field activity unsafe","Badai — kegiatan lapangan tidak aman"] },
    general:    { safe:["Clear weather — enjoy exploration","Cuaca cerah — nikmati eksplorasi"], caution:["Light rain — bring rain gear","Kemungkinan hujan — bawa jas hujan"], danger:["Storm — limit outdoor activities","Prakiraan badai — batasi aktivitas luar"] },
  };

  const rec = (id: string, labelEn: string, labelId: string, icon: React.ReactNode, status: S): ActivityRec => ({
    id, labelEn, labelId, icon, status,
    reasonEn: reasons[id][status][0],
    reasonId: reasons[id][status][1],
  });

  return [
    rec("snorkeling", "Snorkeling",        "Snorkeling",         <Waves     size={14} />, snorkel()),
    rec("scuba",      "Scuba Diving",      "Selam Scuba",        <Anchor    size={14} />, scuba()),
    rec("freedive",   "Freediving",        "Freediving",         <Navigation size={14}/>, freedive()),
    rec("jetski",     "Jet Ski / Sports",  "Jet Ski / Olahraga", <Zap       size={14} />, jetski()),
    rec("sup",        "SUP / Kayaking",    "SUP / Kayak",        <Users     size={14} />, sup()),
    rec("boat",       "Island Hopping",    "Wisata Pulau",       <Ship      size={14} />, boat()),
    rec("fishing",    "Fishing",           "Memancing",          <Fish      size={14} />, fishing()),
    rec("turtle",     "Turtle Conservation","Konservasi Penyu",  <Leaf      size={14} />, general()),
    rec("camping",    "Beach Camping",     "Camping Pantai",     <Flag      size={14} />, general()),
    rec("uwphoto",    "UW Photography",    "Foto Bawah Air",     <Camera    size={14} />, freedive()),
    rec("general",    "General Tourism",   "Wisata Umum",        <Map       size={14} />, general()),
  ];
}

const STATUS_CFG = {
  safe:    { dot: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: <CheckCircle   size={13} />, labelEn: "Safe",    labelId: "Aman"    },
  caution: { dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#b45309", icon: <AlertTriangle size={13} />, labelEn: "Caution", labelId: "Waspada" },
  danger:  { dot: "#f87171", bg: "#fff1f2", border: "#fecdd3", text: "#be123c", icon: <XCircle       size={13} />, labelEn: "Avoid",   labelId: "Hindari" },
};

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";

/* ── Copy ──────────────────────────────────────────────────────────── */
const COPY = {
  en: {
    eyebrow:  "Blue Economy · Seribu Islands · Jakarta Bay",
    headline: ["Ocean-Informed", "Marine Tourism"],
    subline:  "IHO S-104 tidal intelligence and real-time metocean data for safe, well-planned maritime recreation.",
    cta:      "Open WebGIS Atlas",
    islandDropdownPlaceholder: "Choose an island →",
    islandDropdownHint: "Check activity safety",
    context:  "Research · Institut Teknologi Bandung · Geodesy & Geomatics Engineering · 2025",
    problemEyebrow: "The Problem",
    problemHead:    "Sea conditions determine whether a trip is safe — yet reliable data has been absent.",
    problemBody:    "Maritime accidents account for 51–62% of all reported incidents in Indonesian waters (IMIC Bakamla, 2021–2023). In the Seribu Islands, tidal variation, wave height, and wind speed directly govern the viability of every activity — snorkeling, diving, island-hopping, fishing. Until now, no localized metocean decision-support tool existed for visitors or operators.",
    stat1n: "51–62%", stat1l: "of maritime incidents caused by ocean conditions",
    stat2n: "0",      stat2l: "of 10 major Indonesian dive destinations had metocean tools",
    stat3n: "0.51",   stat3l: "hazard weight — oceanographic factors (Chuang et al. 2024)",
    dataEyebrow: "Metocean Parameters",
    dataHead:    "Every activity. Every parameter. One platform.",
    dataBody:    "Searibu consolidates tidal prediction from TPXO9, real-time observations from the Luwes telemetry station, and hourly marine forecasts from Open-Meteo into a single IHO S-104 compliant interface.",
    activities: [
      { name: "Snorkeling",       params: ["Tides", "Wind", "Waves", "Current"] },
      { name: "Scuba Diving",     params: ["Tides", "Current", "Weather"] },
      { name: "Freediving",       params: ["Tides", "Waves", "Current"] },
      { name: "Jet Ski / Sports", params: ["Wind", "Waves", "Weather"] },
      { name: "SUP / Kayaking",   params: ["Tides", "Wind", "Waves", "Current"] },
      { name: "Island Hopping",   params: ["Tides", "Wind", "Waves"] },
      { name: "Fishing Tourism",  params: ["Wind", "Waves", "Weather"] },
      { name: "Beach Camping",    params: ["Tides", "Weather", "Sun"] },
    ],
    featEyebrow: "Platform Capabilities",
    featHead:    "Precision data. Human-readable output.",
    features: [
      { icon: "waves",  title: "TPXO Tidal Prediction",    body: "Hourly astronomical tide forecasts from the TPXO9-atlas-v5 global model. 15 harmonic constituents. MSL datum. IHO S-104 Ed.2.0.0 compliant." },
      { icon: "wind",   title: "Real-time Marine Forecast", body: "Wind speed and direction, significant wave height, ocean current velocity — updated hourly via Open-Meteo Marine API at ~15 km resolution." },
      { icon: "map",    title: "Interactive WebGIS Atlas",  body: "Leaflet-based map with TPXO spatial grids, island markers, and Luwes tidal station. Click any grid cell for location-specific data." },
      { icon: "shield", title: "Activity Safety Ratings",   body: "Science-based thresholds (Chuang et al. 2024; de Vos & Rautenbach 2019) automatically classify conditions for 11 marine tourism activities." },
      { icon: "chart",  title: "Observation vs. Prediction", body: "Real-time water level from Luwes station overlaid on TPXO predictions. Transfer of Level correction (TOL = −2.156 m) applied for MSL alignment." },
      { icon: "nav",    title: "S-104 HDF5 Export",         body: "Download water level data as IHO S-104 compliant HDF5 files — both astronomical prediction and observed datasets — for ECDIS integration." },
    ],
    activityGuideEyebrow: "Activity Guide",
    activityGuideHead:    "Real-time safety ratings for your island.",
    activityGuideSub:     "Live weather & marine conditions fetched for",
    activityGuideLoading: "Fetching conditions…",
    activityGuideError:   "Could not load conditions. Try again.",
    activityGuideRetry:   "Retry",
    activityGuideOpenFull: "Open Full WebGIS →",
    stdEyebrow: "Technical Foundation",
    stdHead:    "Built to international hydrographic standards.",
    stdBody:    "The system architecture follows IHO S-100 Universal Hydrographic Data Model (Ed. 5.2.0) and IHO S-104 Water Level Information for Surface Navigation (Ed. 2.0.0, adopted December 2024), ensuring long-term interoperability with electronic navigational chart environments.",
    footerSub:  "Capstone Design Project — FITB, Institut Teknologi Bandung",
  },
  id: {
    eyebrow:  "Blue Economy · Kepulauan Seribu · Teluk Jakarta",
    headline: ["Informasi Kelautan", "Untuk Wisata Bahari"],
    subline:  "Prediksi pasut berstandar IHO S-104 dan data cuaca laut real-time untuk wisata bahari yang aman dan terencana.",
    cta:      "Buka Atlas WebGIS",
    islandDropdownPlaceholder: "Pilih pulau →",
    islandDropdownHint: "Cek keamanan aktivitas",
    context:  "Riset · Institut Teknologi Bandung · Teknik Geodesi dan Geomatika · 2025",
    problemEyebrow: "Permasalahan",
    problemHead:    "Kondisi laut menentukan keselamatan perjalanan — namun data yang andal selama ini tidak tersedia.",
    problemBody:    "Kecelakaan maritim menyumbang 51–62% dari seluruh insiden yang dilaporkan di perairan Indonesia (IMIC Bakamla, 2021–2023). Di Kepulauan Seribu, variasi pasut, tinggi gelombang, dan kecepatan angin secara langsung menentukan keamanan setiap aktivitas — snorkeling, selam, island-hopping, memancing. Hingga kini, belum ada sistem informasi metosean yang terlokalisasi tersedia bagi wisatawan maupun operator.",
    stat1n: "51–62%", stat1l: "insiden maritim disebabkan kondisi laut",
    stat2n: "0",      stat2l: "dari 10 destinasi selam utama memiliki alat metosean",
    stat3n: "0,51",   stat3l: "bobot bahaya — faktor oseanografi (Chuang et al. 2024)",
    dataEyebrow: "Parameter Metosean",
    dataHead:    "Setiap aktivitas. Setiap parameter. Satu platform.",
    dataBody:    "Searibu mengintegrasikan prediksi pasut TPXO9, observasi real-time dari stasiun telemetri Luwes, dan prakiraan laut per jam dari Open-Meteo ke dalam antarmuka tunggal berstandar IHO S-104.",
    activities: [
      { name: "Snorkeling",      params: ["Pasut", "Angin", "Gelombang", "Arus"] },
      { name: "Selam Scuba",     params: ["Pasut", "Arus", "Cuaca"] },
      { name: "Freediving",      params: ["Pasut", "Gelombang", "Arus"] },
      { name: "Jet Ski / Sport", params: ["Angin", "Gelombang", "Cuaca"] },
      { name: "SUP / Kayak",     params: ["Pasut", "Angin", "Gelombang", "Arus"] },
      { name: "Wisata Pulau",    params: ["Pasut", "Angin", "Gelombang"] },
      { name: "Memancing",       params: ["Angin", "Gelombang", "Cuaca"] },
      { name: "Camping Pantai",  params: ["Pasut", "Cuaca", "Matahari"] },
    ],
    featEyebrow: "Fitur Platform",
    featHead:    "Data presisi. Keluaran yang mudah dipahami.",
    features: [
      { icon: "waves",  title: "Prediksi Pasut TPXO",         body: "Prakiraan pasut astronomis per jam dari model global TPXO9-atlas-v5. 15 konstituen harmonik. Datum MSL. Sesuai IHO S-104 Ed.2.0.0." },
      { icon: "wind",   title: "Prakiraan Laut Real-time",     body: "Kecepatan dan arah angin, tinggi gelombang signifikan, kecepatan arus — diperbarui per jam melalui Open-Meteo Marine API resolusi ~15 km." },
      { icon: "map",    title: "Atlas WebGIS Interaktif",      body: "Peta berbasis Leaflet dengan grid TPXO, penanda pulau, dan stasiun pasut Luwes. Klik sel grid untuk data spesifik lokasi." },
      { icon: "shield", title: "Penilaian Keamanan Aktivitas", body: "Ambang batas berbasis ilmiah (Chuang et al. 2024; de Vos & Rautenbach 2019) mengklasifikasikan kondisi otomatis untuk 11 aktivitas wisata bahari." },
      { icon: "chart",  title: "Observasi vs. Prediksi",       body: "Muka air real-time dari stasiun Luwes dioverlay di atas prediksi TPXO. Koreksi Transfer of Level (TOL = −2.156 m) diterapkan untuk penyelarasan MSL." },
      { icon: "nav",    title: "Ekspor HDF5 S-104",            body: "Unduh data muka air sebagai file HDF5 berstandar IHO S-104 — data prediksi astronomis maupun observasi — untuk integrasi ECDIS." },
    ],
    activityGuideEyebrow: "Panduan Aktivitas",
    activityGuideHead:    "Rating keamanan real-time untuk pulaumu.",
    activityGuideSub:     "Kondisi cuaca & laut diambil untuk",
    activityGuideLoading: "Mengambil kondisi terkini…",
    activityGuideError:   "Gagal memuat kondisi. Coba lagi.",
    activityGuideRetry:   "Coba lagi",
    activityGuideOpenFull: "Buka WebGIS Lengkap →",
    stdEyebrow: "Landasan Teknis",
    stdHead:    "Dibangun sesuai standar hidrografi internasional.",
    stdBody:    "Arsitektur sistem mengikuti IHO S-100 Universal Hydrographic Data Model (Ed. 5.2.0) dan IHO S-104 Water Level Information for Surface Navigation (Ed. 2.0.0, diadopsi Desember 2024), memastikan interoperabilitas jangka panjang dengan lingkungan peta navigasi elektronik.",
    footerSub:  "Proyek Capstone Design — FITB, Institut Teknologi Bandung",
  },
};

/* ── Utility hooks ─────────────────────────────────────────────────── */
const useCounter = (target: string, active: boolean) => {
  const [val, setVal] = useState("0");
  useEffect(() => {
    if (!active) return;
    const num = parseFloat(target.replace(",", ".").replace(/[^0-9.]/g, ""));
    if (isNaN(num)) { setVal(target); return; }
    const suffix = target.replace(/[0-9.,]/g, "");
    let start = 0;
    const step = num / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setVal(target); clearInterval(timer); return; }
      setVal((Number.isInteger(num) ? Math.floor(start).toString() : start.toFixed(2)) + suffix);
    }, 20);
    return () => clearInterval(timer);
  }, [active, target]);
  return val;
};

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ── Feature icon ──────────────────────────────────────────────────── */
const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const s = { width: 18, height: 18, color: PRIMARY };
  if (type === "waves")  return <Waves      {...s} />;
  if (type === "wind")   return <Wind       {...s} />;
  if (type === "map")    return <Map        {...s} />;
  if (type === "shield") return <Shield     {...s} />;
  if (type === "chart")  return <BarChart2  {...s} />;
  if (type === "nav")    return <Navigation {...s} />;
  return null;
};

const ParamBadge: React.FC<{ label: string }> = ({ label }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, background: "rgba(3,105,161,0.10)", border: "1px solid rgba(3,105,161,0.22)", fontFamily: SANS, fontSize: 10, fontWeight: 600, color: PRIMARY, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
    {label}
  </span>
);

const StatBlock: React.FC<{ n: string; label: string; active: boolean; accent?: boolean }> = ({ n, label, active, accent }) => {
  const val = useCounter(n, active);
  return (
    <div style={{ padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.10)" }}>
      <p style={{ fontFamily: DISPLAY, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, color: accent ? PRIMARY_SOFT : "#fff", lineHeight: 1, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{val}</p>
      <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" as const, maxWidth: 180 }}>{label}</p>
    </div>
  );
};

/* ── Island Dropdown ───────────────────────────────────────────────── */
const IslandDropdown: React.FC<{
  placeholder: string;
  hint: string;
  language: string;
  onSelect: (island: typeof ISLANDS[0]) => void;
}> = ({ placeholder, hint, language, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? ISLANDS.filter(i => (language === "id" ? i.name : i.nameEn).toLowerCase().includes(query.toLowerCase()))
    : ISLANDS;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="hp-island-btn"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)",
          fontFamily: SANS, fontSize: 13, fontWeight: 500,
          letterSpacing: "0.02em", padding: "12px 20px",
          border: "1px solid rgba(255,255,255,0.22)", borderRadius: 4, cursor: "pointer",
          transition: "all 0.2s ease", whiteSpace: "nowrap" as const,
        }}
      >
        <Map size={14} style={{ opacity: 0.75 }} />
        <span>{hint}</span>
        <ChevronDown size={13} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 260, background: "#fff", borderRadius: 10,
          boxShadow: "0 16px 48px rgba(2,78,120,0.22)", border: "1px solid #e2e8f0",
          zIndex: 200, overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc" }}>
            <Search size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={language === "id" ? "Cari pulau…" : "Search island…"}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, fontFamily: SANS, color: "#0f172a", width: "100%" }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.map((island, idx) => (
              <button
                key={island.id}
                onClick={() => { onSelect(island); setOpen(false); setQuery(""); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                  textAlign: "left" as const, transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY, flexShrink: 0, opacity: 0.6 }} />
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                  {language === "id" ? island.name : island.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Activity Guide Section ────────────────────────────────────────── */
interface WeatherFetch { waveH: number | null; windMs: number | null; currentMs: number | null; wCode: number; temp: number | null }

const ActivityGuideSection: React.FC<{
  island: typeof ISLANDS[0] | null;
  language: "en" | "id";
  c: typeof COPY["en"];
  onNavigate: ((p: string) => void) | undefined;
  sectionRef: React.RefObject<HTMLDivElement>;
}> = ({ island, language, c, onNavigate, sectionRef }) => {
  const [weather, setWeather] = useState<WeatherFetch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { inView, ref: inViewRef } = useInView(0.1);

  const fetchWeather = useCallback(async (isl: typeof ISLANDS[0]) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [wxRes, marRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${isl.lat}&longitude=${isl.lon}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`),
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${isl.lat}&longitude=${isl.lon}&current=wave_height,ocean_current_velocity&timezone=auto`),
      ]);
      const wxData = wxRes.ok ? await wxRes.json() : null;
      const marData = marRes.ok ? await marRes.json() : null;
      setWeather({
        waveH: marData?.current?.wave_height ?? null,
        windMs: wxData?.current?.wind_speed_10m != null ? kmhToMs(wxData.current.wind_speed_10m) : null,
        currentMs: marData?.current?.ocean_current_velocity ?? null,
        wCode: wxData?.current?.weather_code ?? 0,
        temp: wxData?.current?.temperature_2m ?? null,
      });
    } catch {
      setError(c.activityGuideError);
    } finally {
      setLoading(false);
    }
  }, [c]);

  useEffect(() => {
    if (island) fetchWeather(island);
  }, [island, fetchWeather]);

  if (!island) return null;

  const activities = weather
    ? buildActivities(weather.waveH, weather.windMs, weather.currentMs, weather.wCode, language)
    : [];

  const safeCount   = activities.filter(a => a.status === "safe").length;
  const cautionCount= activities.filter(a => a.status === "caution").length;
  const dangerCount = activities.filter(a => a.status === "danger").length;

  const islandName = language === "id" ? island.name : island.nameEn;

  return (
    <section
      ref={sectionRef}
      style={{ background: "#fff", padding: "96px 64px", scrollMarginTop: 62 }}
      className="sec-pad"
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }} ref={inViewRef}>
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 1, background: PRIMARY }} />
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: PRIMARY }}>{c.activityGuideEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", lineHeight: 1.12, color: NAVY, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{c.activityGuideHead}</h2>
              <p style={{ fontFamily: SANS, fontSize: 14, color: "#64748b", margin: 0 }}>
                {c.activityGuideSub} <strong style={{ color: PRIMARY }}>{islandName}</strong>
              </p>
            </div>

            {/* Summary badges */}
            {!loading && !error && weather && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {[
                  { count: safeCount,    ...STATUS_CFG.safe },
                  { count: cautionCount, ...STATUS_CFG.caution },
                  { count: dangerCount,  ...STATUS_CFG.danger },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 99 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: s.text }}>
                      {s.count} {language === "id" ? (i === 0 ? "aman" : i === 1 ? "waspada" : "hindari") : (i === 0 ? "safe" : i === 1 ? "caution" : "avoid")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weather strip */}
          {!loading && !error && weather && (
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" as const }}>
              {[
                { label: language === "id" ? "Suhu" : "Temp",     value: weather.temp != null ? `${Math.round(weather.temp)}°C` : "—" },
                { label: language === "id" ? "Angin" : "Wind",    value: weather.windMs != null ? `${weather.windMs.toFixed(1)} m/s` : "—" },
                { label: language === "id" ? "Gelombang" : "Wave", value: weather.waveH != null ? `${weather.waveH.toFixed(2)} m` : "—" },
                { label: language === "id" ? "Arus" : "Current",  value: weather.currentMs != null ? `${weather.currentMs.toFixed(2)} m/s` : "—" },
              ].map((item, i) => (
                <div key={i} style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{item.label}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: NAVY }}>{item.value}</span>
                </div>
              ))}
              <div style={{ padding: "8px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, color: "#0369a1", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Source</span>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: "#0369a1" }}>Open-Meteo · Live</span>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontFamily: SANS, fontSize: 14 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${PRIMARY}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              {c.activityGuideLoading}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontFamily: SANS, fontSize: 14, color: "#dc2626", marginBottom: 12 }}>{error}</p>
              <button onClick={() => island && fetchWeather(island)} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: PRIMARY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>{c.activityGuideRetry}</button>
            </div>
          )}

          {/* Activity grid */}
          {!loading && !error && weather && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 28 }}>
                {activities.map((act) => {
                  const cfg = STATUS_CFG[act.status];
                  return (
                    <div
                      key={act.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                        background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 10,
                        transition: "transform 0.18s, box-shadow 0.18s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${cfg.border}`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: cfg.text, flexShrink: 0, boxShadow: `0 2px 8px ${cfg.border}` }}>
                        {act.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 2px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {language === "id" ? act.labelId : act.labelEn}
                        </p>
                        <p style={{ fontFamily: SANS, fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                          {language === "id" ? act.reasonId : act.reasonEn}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, background: "#fff", border: `1px solid ${cfg.border}`, borderRadius: 99, padding: "3px 8px" }}>
                        <span style={{ color: cfg.text }}>{cfg.icon}</span>
                        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: cfg.text }}>
                          {language === "id" ? cfg.labelId : cfg.labelEn}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => onNavigate?.("webgis")}
                  className="hp-cta"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  {c.activityGuideOpenFull} <ArrowRight size={14} />
                </button>
                <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
                  {language === "id" ? "Data di atas hanya kondisi saat ini. WebGIS menyediakan prakiraan 14 hari, grafik pasut, dan ekspor S-104." : "Above shows current conditions only. WebGIS provides 14-day forecasts, tidal charts, and S-104 export."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HomePage
═══════════════════════════════════════════════════════════════════ */
export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const c = COPY[language as "en" | "id"];
  const lang = language as "en" | "id";

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [0, 100, 280, 460, 640, 820].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  const [selectedIsland, setSelectedIsland] = useState<typeof ISLANDS[0] | null>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  const handleIslandSelect = (island: typeof ISLANDS[0]) => {
    setSelectedIsland(island);
    setTimeout(() => {
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const prob = useInView();
  const data = useInView();
  const feat = useInView();
  const std  = useInView();

  const anim = (t: number, delay = 0): React.CSSProperties => ({
    opacity:    phase >= t ? 1 : 0,
    transform:  phase >= t ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const secAnim = (inV: boolean, delay = 0): React.CSSProperties => ({
    opacity:    inV ? 1 : 0,
    transform:  inV ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <>
      <style>{`
        .hp-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${PRIMARY}; color: #fff;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          letter-spacing: 0.02em; padding: 12px 26px;
          border: none; border-radius: 4px; cursor: pointer;
          transition: background 0.22s, transform 0.22s, box-shadow 0.28s;
        }
        .hp-cta:hover { background: ${PRIMARY_SOFT}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(14,165,233,0.30); }
        .hp-island-btn:hover {
          border-color: rgba(255,255,255,0.5) !important;
          background: rgba(255,255,255,0.16) !important;
          color: #fff !important;
        }
        .feat-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px 24px;
          transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
        }
        .feat-card:hover { box-shadow: 0 8px 28px rgba(3,105,161,0.10); transform: translateY(-3px); border-color: #bae6fd; }
        @media (max-width: 768px) {
          .hero-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-pad   { padding: 100px 20px 64px !important; min-height: auto !important; }
          .hero-right { display: none !important; }
          .prob-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .sec-pad    { padding: 56px 20px !important; }
          .data-header-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .data-body-grid   { grid-template-columns: 1fr !important; gap: 24px !important; }
          .data-side-image  { display: none !important; }
          .feat-grid  { grid-template-columns: 1fr 1fr !important; }
          .std-grid   { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .feat-grid { grid-template-columns: 1fr !important; }
          .hero-pad  { padding: 90px 16px 56px !important; }
          .sec-pad   { padding: 48px 16px !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: NAVY }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1800&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: phase >= 1 ? 1 : 0, filter: "brightness(0.30) saturate(0.8)", transition: "opacity 2.2s ease" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg,rgba(2,78,120,0.96) 0%,rgba(2,78,120,0.75) 50%,rgba(2,78,120,0.20) 100%)` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(2,78,120,1) 0%,transparent 45%)" }} />

        <div className="hero-pad hero-grid" style={{ position: "relative", zIndex: 5, maxWidth: 1280, margin: "0 auto", padding: "140px 64px 100px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, minHeight: "100vh", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, ...anim(2) }}>
              <div style={{ width: 32, height: 1, background: TEAL }} />
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(20,184,166,0.9)" }}>{c.eyebrow}</span>
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(3.2rem,5.8vw,5.4rem)", lineHeight: 1.04, letterSpacing: "-0.02em", color: "#e0f2fe", margin: "0 0 24px", ...anim(3) }}>
              {c.headline[0]}<br />
              <span style={{ color: PRIMARY_SOFT }}>{c.headline[1]}</span>
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.75, color: "rgba(224,242,254,0.60)", maxWidth: 540, margin: "0 0 14px", ...anim(4, 30) }}>{c.subline}</p>
            <div style={{ width: 64, height: 1, background: "rgba(224,242,254,0.15)", margin: "20px 0", ...anim(4, 50) }} />
            <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "rgba(224,242,254,0.28)", margin: "0 0 36px", ...anim(4, 70) }}>{c.context}</p>

            {/* CTA row: primary button + island dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", ...anim(5) }}>
              <button className="hp-cta" onClick={() => onNavigate?.("webgis")}>
                {c.cta} <ArrowRight size={14} />
              </button>
              <IslandDropdown
                placeholder={c.islandDropdownPlaceholder}
                hint={c.islandDropdownHint}
                language={language}
                onSelect={handleIslandSelect}
              />
            </div>
          </div>

          <div className="hero-right" style={{ ...anim(5, 100) }}>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(14,165,233,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a88" }} />
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)" }}>
                  {language === "id" ? "Parameter Aktif" : "Active Parameters"}
                </span>
              </div>
              {[
                { label: language === "id" ? "Tinggi Pasut"     : "Tidal Height",     sub: "TPXO9 · 15 constituents · MSL", color: PRIMARY_SOFT },
                { label: language === "id" ? "Tinggi Gelombang" : "Wave Height",       sub: "Open-Meteo Marine · ~15 km",    color: PRIMARY },
                { label: language === "id" ? "Kecepatan Angin"  : "Wind Speed",        sub: "Open-Meteo · 10 m altitude",    color: PRIMARY_SOFT },
                { label: language === "id" ? "Arus Permukaan"   : "Surface Current",   sub: "Open-Meteo Marine · ~8 km",     color: PRIMARY },
                { label: language === "id" ? "Observasi Luwes"  : "Luwes Observation", sub: "Pushidrosal · TOL −2.156 m",    color: TEAL },
              ].map((p, i) => (
                <div key={i} style={{ padding: "12px 20px", borderBottom: i < 4 ? "1px solid rgba(14,165,233,0.08)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 3, height: 28, background: p.color, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", margin: 0 }}>{p.label}</p>
                    <p style={{ fontFamily: SANS, fontSize: 10, color: "rgba(255,255,255,0.30)", margin: "2px 0 0", letterSpacing: "0.02em" }}>{p.sub}</p>
                  </div>
                  <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: p.color, opacity: 0.6 }} />
                </div>
              ))}
              <div style={{ padding: "10px 20px", background: "rgba(3,105,161,0.12)", borderTop: "1px solid rgba(3,105,161,0.20)" }}>
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: PRIMARY_SOFT, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>IHO S-104 Ed.2.0.0 Compliant</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom,transparent,#f8fafc)", zIndex: 4 }} />
      </section>

      {/* ── Problem ───────────────────────────────────────────────── */}
      <section className="sec-pad" style={{ background: "#f8fafc", padding: "96px 64px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }} ref={prob.ref}>
          <div className="prob-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div style={secAnim(prob.inView)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 24, height: 1, background: PRIMARY }} />
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: PRIMARY }}>{c.problemEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.8rem,3.2vw,2.8rem)", lineHeight: 1.12, color: NAVY, margin: "0 0 20px", letterSpacing: "-0.02em" }}>{c.problemHead}</h2>
              <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.80, color: "#475569", margin: 0 }}>{c.problemBody}</p>
              <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", marginTop: 20, fontStyle: "italic" }}>Sources: IMIC Bakamla 2021–2023; Chuang et al. 2024; Rahantoknam 2022</p>
            </div>
            <div style={{ ...secAnim(prob.inView, 150), background: NAVY, borderRadius: 8, padding: "0 36px 12px", overflow: "hidden", position: "relative" }}>
              <div style={{ height: 3, background: `linear-gradient(90deg,${PRIMARY_SOFT},${TEAL})`, marginLeft: -36, marginRight: -36 }} />
              <StatBlock n={c.stat1n} label={c.stat1l} active={prob.inView} accent />
              <StatBlock n={c.stat2n} label={c.stat2l} active={prob.inView} />
              <StatBlock n={c.stat3n} label={c.stat3l} active={prob.inView} accent />
              <div style={{ marginTop: 20, borderRadius: 4, overflow: "hidden", height: 160, position: "relative" }}>
                <img src="https://images.unsplash.com/photo-1628413188069-383190077d18?q=80&w=1170&auto=format&fit=crop" alt="Seribu Islands aerial" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6) saturate(0.9)" }} />
                <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                  <span style={{ fontFamily: SANS, fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Kepulauan Seribu · Jakarta Bay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Activity Matrix ───────────────────────────────────────── */}
      <section className="sec-pad" style={{ background: "#fff", padding: "96px 64px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }} ref={data.ref}>
          <div className="data-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "end", marginBottom: 56 }}>
            <div style={secAnim(data.inView)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 1, background: PRIMARY }} />
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: PRIMARY }}>{c.dataEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", lineHeight: 1.12, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>{c.dataHead}</h2>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.75, color: "#475569", ...secAnim(data.inView, 100) }}>{c.dataBody}</p>
          </div>
          <div className="data-body-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 48, alignItems: "start", ...secAnim(data.inView, 180) }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "10px 20px", background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)" }}>{language === "id" ? "Aktivitas Wisata" : "Tourism Activity"}</span>
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)" }}>{language === "id" ? "Data yang Diperlukan" : "Required Parameters"}</span>
              </div>
              {c.activities.map((act, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px", borderBottom: i < c.activities.length - 1 ? "1px solid #f1f5f8" : "none", background: i % 2 === 0 ? "#fff" : "#f8fafc", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: NAVY, minWidth: 120, flexShrink: 0 }}>{act.name}</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {act.params.map((p) => <ParamBadge key={p} label={p} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="data-side-image">
              <div style={{ borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
                <img src="https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=700&q=80" alt="Scuba diving Seribu Islands" style={{ width: "100%", height: 280, objectFit: "cover", display: "block", filter: "saturate(0.9)" }} />
              </div>
              <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>
                {language === "id"
                  ? "Kegiatan selam skuba di Kepulauan Seribu sangat dipengaruhi variasi pasut dan kecepatan arus."
                  : "Scuba diving in the Seribu Islands is highly sensitive to tidal variation and current velocity."}
              </p>
              <div style={{ marginTop: 20, padding: "14px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, borderLeft: "3px solid #16a34a" }}>
                <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "#15803d", margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{language === "id" ? "Akurasi Data" : "Data Accuracy"}</p>
                <p style={{ fontFamily: SANS, fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.5 }}>
                  {language === "id"
                    ? "Validasi silang TPXO vs. observasi Luwes diterapkan untuk setiap prediksi."
                    : "TPXO predictions are cross-validated against Luwes station observations."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Activity Guide (dynamic, island-specific) ─────────────── */}
      <ActivityGuideSection
        island={selectedIsland}
        language={lang}
        c={c}
        onNavigate={onNavigate}
        sectionRef={activityRef}
      />

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="sec-pad" style={{ background: "#f8fafc", padding: "96px 64px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }} ref={feat.ref}>
          <div style={{ maxWidth: 640, marginBottom: 56, ...secAnim(feat.inView) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 24, height: 1, background: PRIMARY }} />
              <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: PRIMARY }}>{c.featEyebrow}</span>
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", lineHeight: 1.12, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>{c.featHead}</h2>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, ...secAnim(feat.inView, 100) }}>
            {c.features.map((f, i) => (
              <div key={i} className="feat-card">
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <FeatureIcon type={f.icon} />
                </div>
                <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: "#bae6fd", letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>{String(i + 1).padStart(2, "0")}</p>
                <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 10px", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ fontFamily: SANS, fontSize: 13, color: "#475569", lineHeight: 1.70, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Standards ─────────────────────────────────────────────── */}
      <section className="sec-pad" style={{ background: NAVY, padding: "96px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.04) 1px,transparent 1px)`, backgroundSize: "80px 80px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }} ref={std.ref}>
          <div className="std-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div style={secAnim(std.inView)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 24, height: 1, background: TEAL }} />
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(20,184,166,0.8)" }}>{c.stdEyebrow}</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", lineHeight: 1.12, color: "#e0f2fe", margin: "0 0 20px", letterSpacing: "-0.02em" }}>{c.stdHead}</h2>
              <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.78, color: "rgba(224,242,254,0.55)", margin: "0 0 32px" }}>{c.stdBody}</p>
              <button className="hp-cta" onClick={() => onNavigate?.("webgis")}>{c.cta} <ArrowRight size={14} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, ...secAnim(std.inView, 150) }}>
              {[
                { code: "IHO S-100", edition: "Ed. 5.2.0 · 2024", color: PRIMARY_SOFT, desc: language === "id" ? "Universal Hydrographic Data Model — kerangka induk seluruh produk data maritim digital." : "Universal Hydrographic Data Model — the overarching framework for all digital maritime data products." },
                { code: "IHO S-104", edition: "Ed. 2.0.0 · Dec 2024", color: PRIMARY_SOFT, desc: language === "id" ? "Water Level Information for Surface Navigation — spesifikasi produk untuk data muka air, diadopsi Desember 2024." : "Water Level Information for Surface Navigation — product specification for water level data, adopted December 2024." },
                { code: "TPXO9", edition: "Oregon State University", color: TEAL, desc: language === "id" ? "Model pasut global: 15 konstituen harmonik, resolusi 1/30°. Analisis harmonik mengikuti Schureman (1958) & Foreman (1977)." : "Global tidal model: 15 harmonic constituents, 1/30° resolution. Harmonic analysis per Schureman (1958) & Foreman (1977)." },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(14,165,233,0.10)", borderRadius: 6, padding: "18px 22px", display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, paddingTop: 2 }}><div style={{ width: 3, height: 40, background: s.color, borderRadius: 2 }} /></div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: "#e0f2fe", letterSpacing: "0.02em" }}>{s.code}</span>
                      <span style={{ fontFamily: SANS, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{s.edition}</span>
                    </div>
                    <p style={{ fontFamily: SANS, fontSize: 12, color: "rgba(224,242,254,0.50)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ background: "#012d46", padding: "32px 64px 28px", borderTop: "1px solid rgba(14,165,233,0.10)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <img src="/logo.svg" alt="Searibu" style={{ height: 30, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.75 }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: SANS, fontSize: 11, color: "rgba(224,242,254,0.30)", margin: 0 }}>{c.footerSub}</p>
            <p style={{ fontFamily: SANS, fontSize: 11, color: "rgba(224,242,254,0.18)", margin: "3px 0 0" }}>&copy; 2025 Searibu</p>
          </div>
        </div>
      </footer>
    </>
  );
};