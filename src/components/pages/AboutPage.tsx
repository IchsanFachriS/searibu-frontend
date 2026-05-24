import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Anchor, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Download } from "lucide-react";

const NAVY    = "#024e78";
const PRIMARY = "#0369a1";
const SKY     = "#0ea5e9";
const DARK    = "#0a1628";
const WHITE   = "#ffffff";
const OFFWHITE= "#f0f6fb";
const TEXT1   = "#0f172a";
const TEXT2   = "#1e3a5f";
const TEXT3   = "#334155";
const MUTED   = "#64748b";
const SERIF   = '"Georgia", "Times New Roman", serif';
const SANS    = '"Montserrat", system-ui, sans-serif';
const MONO    = '"Courier New", monospace';

/* ── Photo Placeholder ───────────────────────────────────────────────────── */
const PhotoPlaceholder: React.FC<{
  src?: string; alt: string; size?: number;
  shape?: "circle" | "square"; initials?: string;
}> = ({ src, alt, size = 160, shape = "circle", initials }) => {
  const [error, setError] = useState(false);
  const radius = shape === "circle" ? "50%" : "12px";
  if (src && !error) {
    return (
      <img src={src} alt={alt} onError={() => setError(true)}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover",
          display: "block", border: "3px solid rgba(3,105,161,0.18)",
          boxShadow: "0 8px 32px rgba(2,78,120,0.18)" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `linear-gradient(135deg,${NAVY} 0%,${PRIMARY} 60%,${SKY} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 5,
      border: "3px solid rgba(3,105,161,0.25)",
      boxShadow: "0 8px 32px rgba(2,78,120,0.18)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)",
        pointerEvents: "none" }} />
      {initials
        ? <span style={{ fontFamily: SANS, fontSize: size * 0.22, fontWeight: 700,
            color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", zIndex: 1 }}>{initials}</span>
        : <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 24 24" fill="none" style={{ zIndex: 1 }}>
            <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.5)" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>}
      <span style={{ fontFamily: SANS, fontSize: Math.max(9, size * 0.09), fontWeight: 600,
        color: "rgba(255,255,255,0.50)", letterSpacing: "0.06em",
        textTransform: "uppercase", zIndex: 1 }}>foto</span>
    </div>
  );
};

/* ── IntersectionObserver hook ───────────────────────────────────────────── */
const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};

/* ── Collapsible section ─────────────────────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #dbeafe", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <button onClick={() => setOpen(p => !p)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", background: OFFWHITE, border: "none", cursor: "pointer",
        fontFamily: SANS, fontSize: 14, fontWeight: 700, color: NAVY, textAlign: "left", gap: 8,
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        {open ? <ChevronUp size={16} style={{ color: MUTED, flexShrink: 0 }} />
               : <ChevronDown size={16} style={{ color: MUTED, flexShrink: 0 }} />}
      </button>
      {open && <div style={{ padding: "18px 20px", background: WHITE }}>{children}</div>}
    </div>
  );
};

/* ── Content copy ────────────────────────────────────────────────────────── */
const C = {
  en: {
    hero: "About Searibu", heroSub: "Ocean Weather-Informed Marine Tourism System in Kepulauan Seribu",
    heroDesc: "A capstone design project by ITB Geodesy and Geomatics Engineering students, building a unified marine information platform integrating tidal prediction, real-time observations, and weather forecasting for safer and smarter island tourism.",
    downloadBtn: "Download Manual",
    missionTitle: "Our Mission",
    missionBody: "To provide accurate, science-backed marine information that empowers tourists, researchers, and maritime professionals operating in the Kepulauan Seribu archipelago — making every voyage safer and every decision better-informed.",
    team: [
      { name: "Revalia Aura Cahaya Prasetyo",  nim: "15122003", role: "Frontend Developer", photo: "" },
      { name: "Muhammad Syahrul Tasyrifan",    nim: "15122009", role: "Backend Developer",  photo: "" },
      { name: "Evin Petra Pebrina Debataraja", nim: "15122035", role: "GIS & Data",          photo: "" },
      { name: "Ichsan Fachri Siroj",           nim: "15122092", role: "Full-stack & Lead",   photo: "" },
    ],
    supTitle: "Supervisors",
    supervisors: [
      { name: "Prof. Dr.rer.nat. Poerbandono, S.T., M.M.",    title: "Supervisor 1", photo: "" },
      { name: "Gabriella Alodia, S.T., M.Sc., Ph.D.",         title: "Supervisor 2", photo: "" },
      { name: "Dr.techn. Dudy Darmawan Wijaya, S.T., M.Sc.",  title: "Supervisor 3", photo: "" },
    ],
    refTitle: "References",
    refs: [
      { id: "[1]", text: "IHO. (2024). S-100 Universal Hydrographic Data Model, Edition 5.2.0.", url: "https://iho.int/uploads/user/pubs/standards/s-100/S-100_5.2.0_Final_Clean.pdf" },
      { id: "[2]", text: "IHO. (2024). S-104 Water Level Information for Surface Navigation, Edition 2.0.0.", url: "https://iho.int/en/s-100-based-product-specifications" },
      { id: "[3]", text: "Egbert, G.D. & Erofeeva, S.Y. (2002). Efficient Inverse Modeling of Barotropic Ocean Tides.", url: "https://www.tpxo.net" },
      { id: "[4]", text: "Schureman, P. (1958). Manual of Harmonic Analysis and Prediction of Tides. NOAA Special Pub. No. 98.", url: "" },
      { id: "[5]", text: "Foreman, M.G.G. (1977). Manual for Tidal Heights Analysis and Prediction. IOS Report 77-10.", url: "" },
      { id: "[6]", text: "NOAA OCS. (2024). s100py: Python utilities for IHO S-100 HDF5 format.", url: "https://s100py.readthedocs.io" },
    ],
  },
  id: {
    hero: "Tentang Searibu", heroSub: "Sistem Informasi Kelautan untuk Wisata Bahari di Kepulauan Seribu",
    heroDesc: "Proyek capstone mahasiswa Teknik Geodesi dan Geomatika ITB yang membangun platform informasi kelautan terpadu — mengintegrasikan prediksi pasang surut, telemetri real-time, dan prakiraan cuaca untuk wisata bahari yang lebih aman.",
    downloadBtn: "Unduh Manual",
    missionTitle: "Misi Kami",
    missionBody: "Menyediakan informasi kelautan yang akurat dan berbasis ilmiah untuk memberdayakan wisatawan, peneliti, dan profesional maritim yang beroperasi di Kepulauan Seribu — menjadikan setiap perjalanan lebih aman dan setiap keputusan lebih terinformasi.",
    teamTitle: "Tim Pengembang", teamSub: "Teknik Geodesi dan Geomatika · Institut Teknologi Bandung · 2026",
    team: [
      { name: "Revalia Aura Cahaya Prasetyo",  nim: "15122003", role: "Frontend Developer", photo: "" },
      { name: "Muhammad Syahrul Tasyrifan",    nim: "15122009", role: "Backend Developer",  photo: "" },
      { name: "Evin Petra Pebrina Debataraja", nim: "15122035", role: "GIS & Data",          photo: "" },
      { name: "Ichsan Fachri Siroj",           nim: "15122092", role: "Full-stack & Lead",   photo: "" },
    ],
    supTitle: "Dosen Pembimbing", supSub: "Fakultas Ilmu dan Teknologi Kebumian · Institut Teknologi Bandung",
    supervisors: [
      { name: "Prof. Dr.rer.nat. Poerbandono, S.T., M.M.",    title: "Pembimbing 1", photo: "" },
      { name: "Gabriella Alodia, S.T., M.Sc., Ph.D.",         title: "Pembimbing 2", photo: "" },
      { name: "Dr.techn. Dudy Darmawan Wijaya, S.T., M.Sc.",  title: "Pembimbing 3", photo: "" },
    ],
  },
};

/* ── Stat card ───────────────────────────────────────────────────────────── */
const StatCard: React.FC<{ value: string; label: string; delay: number; inView: boolean }> = ({ value, label, delay, inView }) => (
  <div style={{ textAlign: "center", padding: "24px 16px",
    opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
    <p style={{ fontFamily: SANS, fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, color: WHITE, margin: 0, letterSpacing: "-0.03em" }}>{value}</p>
    <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", margin: "4px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
  </div>
);

/* ── Team card ───────────────────────────────────────────────────────────── */
const TeamCard: React.FC<{ name: string; nim: string; role: string; photo: string; delay: number; inView: boolean }> = ({ name, nim, role, photo, delay, inView }) => {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      padding: "28px 18px 24px", background: WHITE, border: "1px solid #dbeafe",
      borderRadius: 16, boxShadow: "0 4px 20px rgba(2,78,120,0.08)",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, box-shadow 0.2s`,
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 36px rgba(2,78,120,0.16)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(2,78,120,0.08)")}>
      <PhotoPlaceholder src={photo} alt={name} size={120} shape="circle" initials={initials} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 4px", lineHeight: 1.35 }}>{name}</p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: PRIMARY, margin: "0 0 8px", fontWeight: 600 }}>{nim}</p>
        <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "#eff8ff", border: "1px solid #bfdbfe", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: PRIMARY }}>{role}</span>
      </div>
    </div>
  );
};

/* ── Supervisor card ─────────────────────────────────────────────────────── */
const SupervisorCard: React.FC<{ name: string; title: string; photo: string; delay: number; inView: boolean }> = ({ name, title, photo, delay, inView }) => {
  const initials = name.split(" ").filter(w => w.length > 2 && !w.endsWith(".")).slice(0, 2).map(w => w[0]).join("").toUpperCase() || name.slice(0, 2).toUpperCase();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      padding: "36px 24px 28px", background: WHITE, border: "1px solid #dbeafe",
      borderRadius: 18, boxShadow: "0 4px 24px rgba(2,78,120,0.09)", position: "relative", overflow: "hidden",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms, box-shadow 0.2s`,
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(2,78,120,0.16)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(2,78,120,0.09)")}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${NAVY},${SKY})` }} />
      <PhotoPlaceholder src={photo} alt={name} size={140} shape="circle" initials={initials} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TEXT1, margin: "0 0 8px", lineHeight: 1.35 }}>{name}</p>
        <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 99, background: `linear-gradient(135deg,${NAVY},${PRIMARY})`, fontFamily: SANS, fontSize: 11, fontWeight: 700, color: WHITE, letterSpacing: "0.04em" }}>{title}</span>
      </div>
    </div>
  );
};

/* ── AboutPage ───────────────────────────────────────────────────────────── */
export const AboutPage: React.FC = () => {
  const { language } = useLanguage();
  const c = C[language as "en" | "id"];
  const statsSection   = useInView(0.15);
  const missionSection = useInView(0.15);
  const teamSection    = useInView(0.1);
  const supSection     = useInView(0.1);

  return (
    <div style={{ background: OFFWHITE, minHeight: "100vh", paddingTop: 62 }}>
      <style>{`
        .ab-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
        @media(max-width:900px){ .ab-hero-grid { grid-template-columns:1fr; gap:28px; } }
        .ab-stats { display:grid; grid-template-columns:repeat(4,1fr); }
        @media(max-width:680px){ .ab-stats { grid-template-columns:repeat(2,1fr); } }
        .ab-team  { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        @media(max-width:960px){ .ab-team  { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:480px){ .ab-team  { grid-template-columns:1fr; } }
        .ab-sup   { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        @media(max-width:860px){ .ab-sup   { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:520px){ .ab-sup   { grid-template-columns:1fr; } }
        .ab-pad   { padding:72px 48px; }
        @media(max-width:768px){ .ab-pad   { padding:52px 20px; } }
        @media(max-width:480px){ .ab-pad   { padding:40px 16px; } }
        .ab-content { max-width:960px; margin:0 auto; padding:48px 24px 80px; }
        @media(max-width:600px){ .ab-content { padding:32px 16px 64px; } }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background:`linear-gradient(135deg,${DARK} 0%,${NAVY} 50%,${PRIMARY} 100%)`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(14,165,233,0.07) 1px, transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:`linear-gradient(to top,${OFFWHITE},transparent)`, pointerEvents:"none" }} />
        <div className="ab-pad" style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
          <div className="ab-hero-grid">
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <img src="public/logo.svg" alt="Logo Searibu" />
              </div>
              <h1 style={{ fontFamily:SANS, fontSize:"clamp(26px,5vw,46px)", fontWeight:800, color:WHITE, margin:"0 0 14px", letterSpacing:"-0.03em", lineHeight:1.05 }}>{c.hero}</h1>
              <p style={{ fontFamily:SANS, fontSize:12, fontWeight:700, color:"rgba(14,165,233,0.85)", margin:"0 0 14px", letterSpacing:"0.05em" }}>{c.heroSub}</p>
              <p style={{ fontFamily:SERIF, fontStyle:"italic", fontSize:"clamp(14px,1.6vw,16px)", lineHeight:1.78, color:"rgba(255,255,255,0.70)", margin:"0 0 28px", maxWidth:480 }}>{c.heroDesc}</p>
              <a href="/searibu_manual.pdf" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:9, background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.28)", color:WHITE, fontFamily:SANS, fontSize:13, fontWeight:600, textDecoration:"none", transition:"all 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.22)")}
                onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.12)")}>
                <Download size={14} /> {c.downloadBtn}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="ab-pad" ref={missionSection.ref} style={{ background:WHITE, borderBottom:"1px solid #dbeafe" }}>
        <div style={{ maxWidth:780, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontFamily:SANS, fontSize:"clamp(20px,3.5vw,30px)", fontWeight:800, color:TEXT1, margin:"0 0 18px", letterSpacing:"-0.02em",
            opacity:missionSection.inView?1:0, transform:missionSection.inView?"translateY(0)":"translateY(16px)",
            transition:"opacity 0.7s ease, transform 0.7s ease" }}>{c.missionTitle}</h2>
          <p style={{ fontFamily:SERIF, fontStyle:"italic", fontSize:"clamp(15px,2vw,17px)", lineHeight:1.8, color:TEXT2, maxWidth:660, margin:"0 auto",
            opacity:missionSection.inView?1:0, transform:missionSection.inView?"translateY(0)":"translateY(16px)",
            transition:"opacity 0.7s ease 120ms, transform 0.7s ease 120ms" }}>
            "{c.missionBody}"
          </p>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="ab-pad" ref={teamSection.ref}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px", borderRadius:99, background:"#eff8ff", border:"1px solid #bfdbfe", marginBottom:14 }}>
              <span style={{ fontFamily:SANS, fontSize:11, fontWeight:700, color:PRIMARY, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                {language==="id"?"Tim Kami":"Our Team"}
              </span>
            </div>
          </div>
          <div className="ab-team">
            {c.team.map((m,i) => <TeamCard key={i} {...m} delay={i*80} inView={teamSection.inView} />)}
          </div>
        </div>
      </section>

      {/* ── SUPERVISORS ── */}
      <section className="ab-pad" ref={supSection.ref} style={{ background:WHITE }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
          </div>
          <div className="ab-sup">
            {c.supervisors.map((s,i) => <SupervisorCard key={i} {...s} delay={i*100} inView={supSection.inView} />)}
          </div>
        </div>
      </section>
    </div>
  );
};