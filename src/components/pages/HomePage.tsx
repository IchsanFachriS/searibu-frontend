import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, Waves, Wind, Anchor } from 'lucide-react';

/* ── Font roles (defined once, used everywhere) ──
   SANS    → Inter — all UI text, labels, body copy, buttons, captions
   DISPLAY → Cormorant Garamond italic — ONLY large hero/section headlines
   MONO    → not used here; reserved for data panels (InfoPanel, charts)
─────────────────────────────────────────────── */
const SANS    = '"Inter", "Helvetica Neue", Arial, sans-serif';
const DISPLAY = '"Cormorant Garamond", Georgia, serif';

interface HomePageProps { onNavigate?: (page: string) => void; }

const CONTENT = {
  en: {
    kicker: 'Ocean Intelligence Platform',
    headline: 'Where Science\nMeets the Sea',
    subhead: 'Real-time tidal predictions and marine weather intelligence for the Seribu Archipelago',
    body: 'Navigate the Kepulauan Seribu with confidence. Access precision TPXO tidal models, live atmospheric forecasting, and data-driven activity recommendations — all in one place.',
    cta: 'Explore the Atlas', ctaSub: 'Open WebGIS',
    s1n: '128+', s1l: 'Grid Points',
    s2n: '15',   s2l: 'Day Forecast',
    s3n: 'TPXO 9', s3l: 'Tidal Model',
    features: [
      { icon: 'waves',  title: 'Tidal Prediction',   desc: 'Hourly TPXO-based predictions with observed station overlay.' },
      { icon: 'wind',   title: 'Marine Weather',     desc: 'Wind, wave height, ocean current from Open-Meteo API.' },
      { icon: 'anchor', title: 'Activity Safety',    desc: 'Recommendations for snorkeling, fishing & sailing.' },
    ],
    pullTitle: 'Field Observation',
    pullBody: 'Real water-level readings from Luwes telemetry stations, plotted alongside TPXO predictions for scientific cross-validation.',
    why: 'Why Searibu',
    whyHead: 'The only platform built for Seribu Islands navigation',
    whyBody: 'Combining satellite-derived tidal models, real-time meteorological data, and on-ground telemetry observations into a unified marine intelligence system — trusted by researchers and island visitors alike.',
    credit: 'Kepulauan Seribu · Jakarta Bay · 5°S',
  },
  id: {
    kicker: 'Platform Intelijen Kelautan',
    headline: 'Saat Sains\nBertemu Laut',
    subhead: 'Prediksi pasang surut real-time dan intelijen cuaca laut untuk Kepulauan Seribu',
    body: 'Jelajahi Kepulauan Seribu dengan percaya diri. Akses model pasut TPXO yang presisi, prakiraan atmosfer langsung, dan rekomendasi aktivitas berbasis data.',
    cta: 'Buka Atlas', ctaSub: 'Lihat WebGIS',
    s1n: '128+', s1l: 'Titik Grid',
    s2n: '15',   s2l: 'Hari Prakiraan',
    s3n: 'TPXO 9', s3l: 'Model Pasut',
    features: [
      { icon: 'waves',  title: 'Prediksi Pasang Surut', desc: 'Prediksi per jam berbasis TPXO dengan overlay stasiun observasi.' },
      { icon: 'wind',   title: 'Cuaca Laut',           desc: 'Angin, tinggi gelombang, arus laut dari Open-Meteo API.' },
      { icon: 'anchor', title: 'Keselamatan Aktivitas', desc: 'Rekomendasi untuk snorkeling, memancing & berlayar.' },
    ],
    pullTitle: 'Observasi Lapangan',
    pullBody: 'Pembacaan muka air nyata dari stasiun telemetri Luwes, diplotkan bersama prediksi TPXO untuk validasi silang ilmiah.',
    why: 'Mengapa Searibu',
    whyHead: 'Satu-satunya platform untuk navigasi Kepulauan Seribu',
    whyBody: 'Menggabungkan model pasut berbasis satelit, data meteorologi real-time, dan observasi telemetri lapangan menjadi sistem intelijen kelautan terpadu.',
    credit: 'Kepulauan Seribu · Teluk Jakarta · 5°S',
  },
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const c = CONTENT[language];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const delays = [0, 80, 260, 440, 620, 820];
    const timers = delays.map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  const fu = (t: number, d = 0): React.CSSProperties => ({
    opacity: phase >= t ? 1 : 0,
    transform: phase >= t ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.95s cubic-bezier(0.22,1,0.36,1) ${d}ms, transform 0.95s cubic-bezier(0.22,1,0.36,1) ${d}ms`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@1,600;1,700&display=swap');

        /* ── CTA Buttons ── */
        .hp-btn-primary {
          display: inline-flex; align-items: center; gap: 9px;
          background: #e8600a; color: #fff;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.01em;
          padding: 13px 28px; border: none; border-radius: 7px; cursor: pointer;
          transition: background 0.25s, transform 0.2s, box-shadow 0.28s;
        }
        .hp-btn-primary:hover {
          background: #c24e06; transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(232,96,10,0.32);
        }
        .hp-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: rgba(255,255,255,0.62);
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 500; letter-spacing: 0.01em;
          padding: 13px 22px; border: 1.5px solid rgba(255,255,255,0.25);
          border-radius: 7px; cursor: pointer;
          transition: border-color 0.22s, color 0.22s, background 0.22s;
        }
        .hp-btn-secondary:hover {
          border-color: rgba(255,255,255,0.52); color: #fff;
          background: rgba(255,255,255,0.07);
        }

        /* ── Feature cards (dark) ── */
        .feat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; padding: 22px 20px;
          transition: background 0.28s, border-color 0.28s, transform 0.28s;
        }
        .feat-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(232,96,10,0.28);
          transform: translateY(-3px);
        }

        /* ── Info cards (light section) ── */
        .info-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 10px; padding: 26px 24px;
          transition: box-shadow 0.28s, transform 0.28s;
        }
        .info-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transform: translateY(-3px);
        }

        .stat-cell {
          text-align: center; padding: 26px 20px;
          border-right: 1px solid rgba(0,0,0,0.08);
        }
        .stat-cell:last-child { border-right: none; }

        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feat-col { display: none !important; }
          .hero-pad { padding: 110px 32px 80px !important; }
          .info-grid { grid-template-columns: 1fr 1fr !important; }
          .why-grid  { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 640px) {
          .hero-pad  { padding: 100px 22px 72px !important; }
          .cta-row   { flex-direction: column !important; align-items: flex-start !important; }
          .info-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .stat-cell { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.07) !important; }
          .section-pad { padding-left: 22px !important; padding-right: 22px !important; }
        }
      `}</style>

      {/* ════════════ HERO ════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: 'url("/background.jpeg")',
          backgroundSize: 'cover', backgroundPosition: 'center 38%',
          opacity: phase >= 1 ? 1 : 0, filter: 'brightness(0.3) saturate(0.65)',
          transition: 'opacity 2s ease' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(110deg, rgba(7,18,28,0.97) 0%, rgba(7,18,28,0.78) 52%, rgba(7,18,28,0.16) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to top, rgba(7,18,28,0.95) 0%, transparent 52%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2,
          background: 'radial-gradient(ellipse 55% 65% at 76% 36%, rgba(232,96,10,0.08) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="hero-grid hero-pad" style={{
          position: 'relative', zIndex: 5, maxWidth: 1320, margin: '0 auto',
          padding: '132px 48px 96px', display: 'grid',
          gridTemplateColumns: '1fr 340px', gap: 48,
          minHeight: '100vh', alignItems: 'center',
        }}>

          {/* Left */}
          <div>
            {/* Kicker — sans */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 24, ...fu(2) }}>
              <div style={{ width: 22, height: 1.5, background: '#e8600a', borderRadius: 1 }} />
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f07c30' }}>
                {c.kicker}
              </span>
            </div>

            {/* Headline — DISPLAY (Cormorant) — intentional editorial moment */}
            <h1 style={{ fontFamily: DISPLAY,
              fontSize: 'clamp(3rem, 5.5vw, 5rem)', fontWeight: 700, fontStyle: 'italic',
              color: '#f0ece6', lineHeight: 1.05, letterSpacing: '-0.02em',
              marginBottom: 22, whiteSpace: 'pre-line', ...fu(3) }}>
              {c.headline.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {i === 0 ? line : <><br /><span style={{ color: '#e8810a' }}>{line}</span></>}
                </React.Fragment>
              ))}
            </h1>

            {/* Subhead — SANS italic (not serif) */}
            <p style={{ fontFamily: SANS, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
              fontWeight: 400, fontStyle: 'italic',
              color: 'rgba(240,236,230,0.7)', lineHeight: 1.65, maxWidth: 520,
              marginBottom: 20, ...fu(4, 30) }}>
              {c.subhead}
            </p>

            <div style={{ height: 1, background: 'rgba(240,232,220,0.12)',
              maxWidth: 520, marginBottom: 20, ...fu(4, 55) }} />

            {/* Body — SANS */}
            <p style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400,
              color: 'rgba(240,236,230,0.52)', lineHeight: 1.85,
              maxWidth: 500, marginBottom: 34, ...fu(4, 80) }}>
              {c.body}
            </p>

            {/* CTA row */}
            <div className="cta-row" style={{ display: 'flex', alignItems: 'center',
              gap: 12, marginBottom: 56, ...fu(5) }}>
              <button className="hp-btn-primary" onClick={() => onNavigate?.('webgis')}>
                {c.cta} <ArrowRight size={14} />
              </button>
              <button className="hp-btn-secondary" onClick={() => onNavigate?.('webgis')}>
                {c.ctaSub}
              </button>
            </div>

            {/* Stats — value uses DISPLAY for visual weight, label SANS */}
            <div style={{ display: 'flex', gap: 28, ...fu(5, 130) }}>
              {[{n:c.s1n,l:c.s1l},{n:c.s2n,l:c.s2l},{n:c.s3n,l:c.s3l}].map((s, i) => (
                <div key={i} style={{ paddingLeft: i > 0 ? 28 : 0,
                  borderLeft: i > 0 ? '1px solid rgba(240,232,220,0.12)' : 'none' }}>
                  {/* Stat number — DISPLAY only here for its numeral weight */}
                  <p style={{ fontFamily: DISPLAY, fontSize: '2.3rem', fontWeight: 600,
                    color: '#f07c30', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {s.n}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: 'rgba(240,232,220,0.28)' }}>
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — feature cards */}
          <div className="feat-col" style={{ display: 'flex', flexDirection: 'column',
            gap: 12, alignSelf: 'center', ...fu(5, 70) }}>
            {c.features.map((f, i) => (
              <div key={i} className="feat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(232,96,10,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {f.icon === 'waves'  && <Waves  size={16} style={{ color: '#f07c30' }} />}
                    {f.icon === 'wind'   && <Wind   size={16} style={{ color: '#f07c30' }} />}
                    {f.icon === 'anchor' && <Anchor size={16} style={{ color: '#f07c30' }} />}
                  </div>
                  {/* Card title — SANS, medium weight */}
                  <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600,
                    color: '#f0ece6', letterSpacing: '0.01em' }}>
                    {f.title}
                  </p>
                </div>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400,
                  color: 'rgba(240,236,230,0.48)', lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}

            {/* Pull quote card */}
            <div style={{ background: 'rgba(232,96,10,0.09)',
              border: '1px solid rgba(232,96,10,0.24)', borderLeft: '3px solid #e8600a',
              borderRadius: 10, padding: '18px 20px' }}>
              <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#f07c30', marginBottom: 8 }}>
                {c.pullTitle}
              </p>
              <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400,
                color: 'rgba(240,236,230,0.58)', lineHeight: 1.72 }}>
                {c.pullBody}
              </p>
            </div>
          </div>
        </div>

        {/* Photo credit */}
        <div style={{ position: 'absolute', bottom: 14, right: 24, zIndex: 6 }}>
          <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 400,
            letterSpacing: '0.06em', color: 'rgba(240,232,220,0.22)' }}>
            {c.credit}
          </p>
        </div>

        {/* Bleed to next section */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 3,
          background: 'linear-gradient(to bottom, transparent, #f5f0e8)' }} />
      </section>

      {/* ════════════ WHY SECTION ════════════ */}
      <section style={{ background: '#f5f0e8', padding: '88px 0 96px' }}>
        <div className="section-pad" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 48px' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 3, height: 20, background: '#e8600a', borderRadius: 2 }} />
            <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c2410c' }}>
              {c.why}
            </p>
          </div>

          {/* Section header — DISPLAY for the large editorial headline */}
          <div className="why-grid" style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', marginBottom: 56 }}>
            <h2 style={{ fontFamily: DISPLAY,
              fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)', fontWeight: 700, fontStyle: 'italic',
              color: '#111827', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
              {c.whyHead}
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400,
              color: '#4b5563', lineHeight: 1.82, margin: 0, paddingTop: 4 }}>
              {c.whyBody}
            </p>
          </div>

          {/* Stats bar */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)',
            overflow: 'hidden', marginBottom: 48,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            {[
              {n: c.s1n, l: c.s1l},
              {n: c.s2n + (language === 'en' ? ' days' : ' hari'), l: c.s2l},
              {n: c.s3n, l: c.s3l},
            ].map((s, i) => (
              <div key={i} className="stat-cell">
                {/* Display number — DISPLAY font for visual drama */}
                <p style={{ fontFamily: DISPLAY, fontSize: '2.6rem', fontWeight: 700,
                  color: '#92400e', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {s.n}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="info-grid" style={{ display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {c.features.map((f, i) => (
              <div key={i} className="info-card">
                <div style={{ width: 42, height: 42, borderRadius: 9,
                  background: i===0?'#e0f2fe': i===1?'#fef3c7':'#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14 }}>
                  {f.icon==='waves'  && <Waves  size={20} style={{ color: '#0284c7' }} />}
                  {f.icon==='wind'   && <Wind   size={20} style={{ color: '#d97706' }} />}
                  {f.icon==='anchor' && <Anchor size={20} style={{ color: '#16a34a' }} />}
                </div>
                {/* Card title — SANS semi-bold */}
                <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600,
                  color: '#111827', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400,
                  color: '#6b7280', lineHeight: 1.72, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ background: '#09131d', padding: '36px 48px 28px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <img
            src="/logo.svg"
            alt="Searibu"
            style={{
              height: 32,
              width: 'auto',
              display: 'block',
              /* Invert to white on dark navy footer */
              filter: 'brightness(0) invert(1)',
              opacity: 0.85,
            }}
          />
          <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400,
            color: 'rgba(240,232,220,0.28)', letterSpacing: '0.04em' }}>
            &copy; 2025 Searibu — ITB Geodesy Team
          </p>
        </div>
      </footer>
    </>
  );
};