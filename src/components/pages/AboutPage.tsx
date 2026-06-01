import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { Info } from "lucide-react";

const FONT     = "'Inter', system-ui, -apple-system, sans-serif";
const DARK1    = "#2b2b2b";
const DARK2    = "#3a3a3a";
const OFF_WHITE= "#f5f0e8";
const AMBER    = "#f5c518";
const BLUE_D   = "#1a3bbf";
const BLUE_L   = "#ddf0fb";
const BG       = "#f7f4ef";
const SURFACE  = "#ffffff";
const BORDER   = "#e4ddd4";
const TEXT1    = "#1a1a1a";
const TEXT2    = "#3d3d3d";
const TEXT3    = "#6b6b6b";
const MUTED    = "#9a9a9a";

/* ── Photo Placeholder ───────────────────────────────────────────────── */
const PhotoPlaceholder: React.FC<{
  src?: string; alt: string; size?: number; shape?: "circle" | "square"; initials?: string;
}> = ({ src, alt, size = 120, shape = "circle", initials }) => {
  const [error, setError] = useState(false);
  const radius = shape === "circle" ? "50%" : "12px";
  if (src && !error) {
    return <img src={src} alt={alt} onError={() => setError(true)} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block", border: `2px solid ${BORDER}` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${DARK1} 0%, #3d3d3d 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, border: `2px solid ${BORDER}` }}>
      {initials
        ? <span style={{ fontFamily: FONT, fontSize: size * 0.22, fontWeight: 700, color: AMBER, letterSpacing: "-0.02em" }}>{initials}</span>
        : <svg width={size * 0.30} height={size * 0.30} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(245,193,24,0.5)" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(245,193,24,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>}
      <span style={{ fontFamily: FONT, fontSize: Math.max(8, size * 0.09), fontWeight: 600, color: "rgba(245,240,232,0.30)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>foto</span>
    </div>
  );
};

/* ── Hero Image ──────────────────────────────────────────────────────── */
const HeroImage: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
    <img
      src="/img/foto-1.jpg"
      alt="Kepulauan Seribu"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
      }}
    />
    {/* Subtle dark gradient on left edge — blends into text column */}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to right, rgba(43,43,43,0.55) 0%, transparent 40%)",
      pointerEvents: "none",
    }} />
    {/* Bottom fade */}
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
      background: "linear-gradient(to top, rgba(43,43,43,0.50), transparent)",
      pointerEvents: "none",
    }} />
  </div>
);

/* ── IntersectionObserver hook ───────────────────────────────────────── */
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

const C = {
  en: {
    hero: "About Searibu",
    heroSub: "Ocean Weather-Informed Marine Tourism System in Kepulauan Seribu",
    heroDesc: "A capstone design project by ITB Geodesy and Geomatics Engineering students, building a unified marine information platform integrating tidal prediction, real-time observations, and weather forecasting for safer and smarter island tourism.",
    guideBtn: "How to Use",
    missionTitle: "Our Mission",
    missionBody: "To provide accurate, science-backed marine information that empowers tourists, researchers, and maritime professionals operating in the Kepulauan Seribu archipelago, making every voyage safer and every decision better-informed.",
    team: [
      { name: "Revalia Aura Cahaya Prasetyo",  nim: "15122003", role: "Frontend Developer", photo: "img/team/reva.jpeg" },
      { name: "Muhammad Syahrul Tasyrifan",    nim: "15122009", role: "Backend Developer",  photo: "img/team/syahrul.jpeg" },
      { name: "Evin Petra Pebrina Debataraja", nim: "15122035", role: "GIS & Data",          photo: "img/team/evin.jpeg" },
      { name: "Ichsan Fachri Siroj",           nim: "15122092", role: "Full-stack & Lead",   photo: "img/team/ichsan.jpeg" },
    ],
    supTitle: "Supervisors",
    supervisors: [
      { name: "Prof. Dr.rer.nat. Poerbandono, S.T., M.M.",   title: "Supervisor 1", photo: "img/supervisors/pak-poer.jpg" },
      { name: "Dr. Akhmad Riqqi, M.Si.",        title: "Supervisor 2", photo: "img/supervisors/pak-riqqi.png" },
      { name: "Dr. Madam Taqiyya, S.Si., M.Sc.", title: "Supervisor 3", photo: "img/supervisors/bu-madam.jpg" },
    ],
    stats: [
      { value: "110+", label: "Islands" },
      { value: "TPXO9", label: "Tidal Model" },
      { value: "S-104", label: "IHO Standard" },
      { value: "2026", label: "ITB Capstone" },
    ],
  },
  id: {
    hero: "Tentang Searibu",
    heroSub: "Sistem Informasi Kelautan untuk Wisata Bahari di Kepulauan Seribu",
    heroDesc: "Proyek capstone mahasiswa Teknik Geodesi dan Geomatika ITB yang membangun platform informasi kelautan terpadu dengan mengintegrasikan prediksi pasang surut, observasi real-time, dan prakiraan cuaca untuk wisata bahari yang lebih aman.",
    guideBtn: "Cara Penggunaan",
    missionTitle: "Misi Kami",
    missionBody: "Menyediakan informasi kelautan yang akurat dan berbasis ilmiah untuk memberdayakan wisatawan, peneliti, dan profesional maritim yang beroperasi di Kepulauan Seribu, membuat setiap perjalanan lebih aman dan setiap keputusan lebih terinformasi.",
    team: [
      { name: "Revalia Aura Cahaya Prasetyo",  nim: "15122003", role: "Frontend Developer", photo: "img/team/reva.jpeg" },
      { name: "Muhammad Syahrul Tasyrifan",    nim: "15122009", role: "Backend Developer",  photo: "img/team/syahrul.jpeg" },
      { name: "Evin Petra Pebrina Debataraja", nim: "15122035", role: "GIS & Data",          photo: "img/team/evin.jpeg" },
      { name: "Ichsan Fachri Siroj",           nim: "15122092", role: "Full-stack & Lead",   photo: "img/team/ichsan.jpeg" },
    ],
    supTitle: "Dosen Pembimbing",
    supervisors: [
      { name: "Prof. Dr.rer.nat. Poerbandono, S.T., M.M.",   title: "Pembimbing 1", photo: "img/supervisors/pak-poer.jpg" },
      { name: "Dr. Akhmad Riqqi, M.Si.",        title: "Pembimbing 2", photo: "img/supervisors/pak-riqqi.png" },
      { name: "Dr. Madam Taqiyya, S.Si., M.Sc.", title: "Pembimbing 3", photo: "img/supervisors/bu-madam.jpg" },
    ],
  },
};

/* ── TeamCard — rectangular portrait photo ───────────────────────────── */
const TeamCard: React.FC<{ name: string; nim: string; role: string; photo: string; delay: number; inView: boolean }> = ({ name, nim, role, photo, delay, inView }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, box-shadow 0.18s`,
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")}
    >
      {/* Rectangular photo — 3:4 portrait */}
      <div style={{ width: "100%", aspectRatio: "3/4", position: "relative", overflow: "hidden", background: `linear-gradient(135deg,${DARK1} 0%,${DARK2} 100%)`, flexShrink: 0 }}>
        {photo && !imgError
          ? <img src={photo} alt={name} onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 35% 30%, rgba(245,193,24,0.08) 0%, transparent 60%)` }} />
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ zIndex: 1 }}>
                <circle cx="12" cy="8" r="5" fill="rgba(245,193,24,0.35)" />
                <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="rgba(245,193,24,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <span style={{ fontFamily: FONT, fontSize: 26, fontWeight: 800, color: AMBER, letterSpacing: "-0.02em", zIndex: 1 }}>{initials}</span>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "rgba(245,240,232,0.25)", letterSpacing: "0.10em", textTransform: "uppercase" as const, zIndex: 1 }}>foto</span>
            </div>
        }
      </div>
      {/* Info below photo */}
      <div style={{ padding: "16px 14px 18px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 4px", lineHeight: 1.3 }}>{name}</p>
        <p style={{ fontFamily: FONT, fontSize: 11, color: BLUE_D, margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.04em" }}>{nim}</p>
      </div>
    </div>
  );
};

/* ── SupervisorCard — rectangular portrait photo, larger ─────────────── */
const SupervisorCard: React.FC<{ name: string; title: string; photo: string; delay: number; inView: boolean }> = ({ name, title, photo, delay, inView }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").filter(w => w.length > 2 && !w.endsWith(".")).slice(0, 2).map(w => w[0]).join("").toUpperCase() || name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)", position: "relative",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms, box-shadow 0.18s`,
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 44px rgba(0,0,0,0.13)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)")}
    >
      {/* Amber top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER, zIndex: 2 }} />
      {/* Rectangular photo — 2:3 portrait */}
      <div style={{ width: "100%", aspectRatio: "2/3", position: "relative", overflow: "hidden", background: `linear-gradient(135deg,${DARK1} 0%,${DARK2} 100%)`, flexShrink: 0 }}>
        {photo && !imgError
          ? <img src={photo} alt={name} onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 35% 28%, rgba(245,193,24,0.10) 0%, transparent 55%)` }} />
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ zIndex: 1 }}>
                <circle cx="12" cy="8" r="5" fill="rgba(245,193,24,0.40)" />
                <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="rgba(245,193,24,0.40)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <span style={{ fontFamily: FONT, fontSize: 32, fontWeight: 800, color: AMBER, letterSpacing: "-0.02em", zIndex: 1 }}>{initials}</span>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "rgba(245,240,232,0.25)", letterSpacing: "0.10em", textTransform: "uppercase" as const, zIndex: 1 }}>foto</span>
            </div>
        }
      </div>
      {/* Info below photo */}
      <div style={{ padding: "20px 18px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: TEXT1, margin: "0 0 10px", lineHeight: 1.35 }}>{name}</p>
        <span style={{ display: "inline-block", padding: "5px 16px", borderRadius: 99, background: DARK1, fontFamily: FONT, fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: "0.05em" }}>{title}</span>
      </div>
    </div>
  );
};

/* ── AboutPage ───────────────────────────────────────────────────────── */
export const AboutPage: React.FC = () => {
  const { language } = useLanguage();
  const c = C[language as "en" | "id"];
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const missionSection = useInView(0.15);
  const teamSection    = useInView(0.1);
  const supSection     = useInView(0.1);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingTop: 70 }}>
      <style>{`
        /* ── Hero full-viewport two-column ── */
        .ab-hero-section {
          height: calc(100vh - 70px);
          min-height: 560px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: ${DARK1};
          position: relative;
          overflow: hidden;
        }
        /* On small screens: stack vertically, text top, image bottom */
        @media (max-width: 860px) {
          .ab-hero-section {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            height: auto;
            min-height: calc(100vh - 70px);
          }
          .ab-hero-image-col {
            min-height: 280px;
            order: 2; /* image goes below text on mobile */
          }
          .ab-hero-text-col {
            order: 1;
          }
        }
        @media (max-width: 480px) {
          .ab-hero-image-col {
            min-height: 220px;
          }
        }

        /* ── Text column padding ── */
        .ab-hero-text-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(36px, 6vw, 80px) clamp(24px, 5vw, 72px);
          position: relative;
          z-index: 2;
        }

        /* ── Image column ── */
        .ab-hero-image-col {
          position: relative;
          overflow: hidden;
        }

        /* Vertical divider on desktop */
        .ab-hero-divider {
          position: absolute;
          left: 50%;
          top: 10%;
          bottom: 10%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(245,193,24,0.20) 30%, rgba(245,193,24,0.20) 70%, transparent);
          z-index: 3;
          pointer-events: none;
        }
        @media (max-width: 860px) {
          .ab-hero-divider { display: none; }
        }

        /* ── Stat pills in hero ── */
        .ab-stat-pill {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          transition: background 0.18s;
        }
        .ab-stat-pill:hover { background: rgba(255,255,255,0.09); }

        /* ── Section pads ── */
        .ab-pad { padding: 72px 48px; }
        @media (max-width: 768px) { .ab-pad { padding: 52px 20px; } }
        @media (max-width: 480px) { .ab-pad { padding: 40px 16px; } }

        /* ── Team / Supervisor grids ── */
        .ab-team { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
        @media (max-width: 960px) { .ab-team { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .ab-team { grid-template-columns: 1fr; } }

        .ab-sup { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
        @media (max-width: 860px) { .ab-sup { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 520px) { .ab-sup { grid-template-columns: 1fr; } }


        /* ── Fade-up hero text ── */
        .ab-fadein {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1);
        }
        .ab-fadein.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* ═══ HERO — full viewport ══════════════════════════════════════ */}
      <section className="ab-hero-section">
        {/* Amber top rule */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER, zIndex: 10 }} />

        {/* Dot texture across whole section */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          backgroundImage: `radial-gradient(rgba(245,193,24,0.04) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          pointerEvents: "none",
        }} />

        {/* Vertical divider */}
        <div className="ab-hero-divider" />

        {/* ── LEFT: text ── */}
        <div className="ab-hero-text-col">
          {/* Logo */}
          <div className={`ab-fadein${heroVisible ? " visible" : ""}`} style={{ transitionDelay: "0ms", marginBottom: 28 }}>
            <img src="/logo.svg" alt="Searibu" style={{ height: 30, filter: "brightness(0) invert(1)", opacity: 0.85 }} />
          </div>

          {/* Sub-label */}
          <div className={`ab-fadein${heroVisible ? " visible" : ""}`} style={{ transitionDelay: "80ms", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: AMBER }}>
                {c.heroSub.split(" in ")[0]}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className={`ab-fadein${heroVisible ? " visible" : ""}`} style={{ transitionDelay: "160ms" }}>
            <h1 style={{
              fontFamily: FONT,
              fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
              fontWeight: 800,
              color: OFF_WHITE,
              margin: "0 0 20px",
              letterSpacing: "-0.04em",
              lineHeight: 1.06,
            }}>
              {c.hero}
            </h1>
          </div>

          {/* Description */}
          <div className={`ab-fadein${heroVisible ? " visible" : ""}`} style={{ transitionDelay: "240ms" }}>
            <p style={{
              fontFamily: FONT,
              fontSize: "clamp(13px, 1.4vw, 15px)",
              lineHeight: 1.80,
              color: "rgba(245,240,232,0.58)",
              margin: "0 0 32px",
              maxWidth: 480,
              fontWeight: 400,
            }}>
              {c.heroDesc}
            </p>
          </div>

          {/* How to Use button */}
          <div className={`ab-fadein${heroVisible ? " visible" : ""}`} style={{ transitionDelay: "320ms", marginBottom: 44 }}>
            <button
              onClick={() => navigate("/guide")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 9,
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(255,255,255,0.16)",
                color: OFF_WHITE, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.13)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.32)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
            >
              <Info size={13} /> {c.guideBtn}
            </button>
          </div>
        </div>

        {/* ── RIGHT: image placeholder ── */}
        <div className="ab-hero-image-col">
          <HeroImage />
        </div>
      </section>

      {/* ═══ MISSION ═══════════════════════════════════════════════════ */}
      <section className="ab-pad" ref={missionSection.ref} style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 3, height: 22, background: AMBER, borderRadius: 2 }} />
            <h2 style={{
              fontFamily: FONT, fontSize: "clamp(1.4rem,3vw,2.2rem)", fontWeight: 800, color: TEXT1, margin: 0, letterSpacing: "-0.03em",
              opacity: missionSection.inView ? 1 : 0,
              transform: missionSection.inView ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}>
              {c.missionTitle}
            </h2>
          </div>
          <p style={{
            fontFamily: FONT, fontStyle: "italic", fontSize: "clamp(14px,1.8vw,16px)", lineHeight: 1.80, color: TEXT3, maxWidth: 580, margin: "0 auto",
            opacity: missionSection.inView ? 1 : 0,
            transform: missionSection.inView ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.7s ease 100ms, transform 0.7s ease 100ms",
          }}>
            "{c.missionBody}"
          </p>
        </div>
      </section>

      {/* ═══ TEAM ══════════════════════════════════════════════════════ */}
      <section className="ab-pad" ref={teamSection.ref} style={{ background: BG }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 4, height: 36, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, color: TEXT1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {language === "id" ? "Tim Pengembang" : "Our Development Team"}
            </h2>
          </div>
          <div className="ab-team">
            {c.team.map((m, i) => (
              <TeamCard key={i} {...m} delay={i * 80} inView={teamSection.inView} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SUPERVISORS ═══════════════════════════════════════════════ */}
      <section className="ab-pad" ref={supSection.ref} style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 4, height: 36, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, color: TEXT1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {c.supTitle}
            </h2>
          </div>
          <div className="ab-sup">
            {c.supervisors.map((s, i) => (
              <SupervisorCard key={i} {...s} delay={i * 100} inView={supSection.inView} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};