import React, { useEffect, useState, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowRight, Waves, Wind, Navigation, BarChart2, Map, Shield } from "lucide-react";

const DISPLAY      = '"Cormorant Garamond", "Georgia", serif';
const SANS         = '"Inter", "Helvetica Neue", Arial, sans-serif';
const NAVY         = "#024e78";
const PRIMARY      = "#0369a1";
const PRIMARY_SOFT = "#0ea5e9";
const TEAL         = "#14b8a6";

interface HomePageProps { onNavigate?: (page: string) => void; }

const COPY = {
  en: {
    eyebrow:  "Blue Economy · Seribu Islands · Jakarta Bay",
    headline: ["Ocean-Informed", "Marine Tourism"],
    subline:  "IHO S-104 tidal intelligence and real-time metocean data for safe, well-planned maritime recreation.",
    cta:      "Open WebGIS Atlas",
    ctaSecondary: "Read the Guide",
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
    ctaSecondary: "Panduan Penggunaan",
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
    stdEyebrow: "Landasan Teknis",
    stdHead:    "Dibangun sesuai standar hidrografi internasional.",
    stdBody:    "Arsitektur sistem mengikuti IHO S-100 Universal Hydrographic Data Model (Ed. 5.2.0) dan IHO S-104 Water Level Information for Surface Navigation (Ed. 2.0.0, diadopsi Desember 2024), memastikan interoperabilitas jangka panjang dengan lingkungan peta navigasi elektronik.",
    footerSub:  "Proyek Capstone Design — FITB, Institut Teknologi Bandung",
  },
};

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

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const s = { width: 18, height: 18, color: PRIMARY };
  if (type === "waves")  return <Waves    {...s} />;
  if (type === "wind")   return <Wind     {...s} />;
  if (type === "map")    return <Map      {...s} />;
  if (type === "shield") return <Shield   {...s} />;
  if (type === "chart")  return <BarChart2 {...s} />;
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const c = COPY[language as "en" | "id"];

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [0, 100, 280, 460, 640, 820].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

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
        .hp-cta-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: rgba(255,255,255,0.65);
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: 0.02em; padding: 12px 24px;
          border: 1px solid rgba(255,255,255,0.22); border-radius: 4px; cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .hp-cta-ghost:hover { border-color: rgba(255,255,255,0.5); color: #fff; background: rgba(255,255,255,0.06); }
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
      `}</style>

      {/* Hero */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", ...anim(5) }}>
              <button className="hp-cta" onClick={() => onNavigate?.("webgis")}>{c.cta} <ArrowRight size={14} /></button>
              <button className="hp-cta-ghost" onClick={() => onNavigate?.("guide")}>{c.ctaSecondary}</button>
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

      {/* Problem */}
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

      {/* Activity Data Matrix */}
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

      {/* Features */}
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

      {/* Standards */}
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

      {/* Footer */}
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