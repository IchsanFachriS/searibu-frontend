import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Anchor, ExternalLink, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const SANS = '"Inter", "DM Sans", system-ui, sans-serif';
const NAVY    = '#024e78';
const PRIMARY = '#0369a1';
const PRIMARY_SOFT = '#0ea5e9';

const C = {
  en: {
    hero:    'About Searibu',
    heroSub: 'Ocean Weather-Informed Marine Tourism System — Kepulauan Seribu',
    heroDesc:'A capstone design project by ITB Geodesy and Geomatics Engineering students, building a unified marine information platform that integrates tidal prediction, real-time telemetry, and weather forecasting for safer and smarter island tourism.',
    stdTitle:  'Standards & Compliance',
    stdSub:    'This system implements IHO S-100 and S-104 international standards for hydrographic data interoperability.',
    s100Title: 'IHO S-100 — Universal Hydrographic Data Model',
    s100Body:  'S-100 is the overarching framework issued by the International Hydrographic Organization (IHO) that defines how all maritime digital data products should be structured, encoded, and shared. It replaces the older S-57 standard and is designed to be compatible with modern geospatial standards (ISO/TC 211). S-100 was officially adopted by IHO member states in December 2024.',
    s104Title: 'IHO S-104 — Water Level Information for Surface Navigation',
    s104Body:  'S-104 is one of the product specifications within the S-100 framework, specifically designed for encapsulating tidal and water level data for use in ECDIS or any dynamic tide application. The Searibu system implements S-104 Edition 2.0.0 for both astronomical prediction data (from TPXO9) and observed data (from Luwes telemetry stations).',
    tableTitle:  'S-104 Implementation Details',
    tableHeaders:['Attribute', 'Value', 'Description'],
    tableRows: [
      ['productSpecification', 'INT.IHO.S-104.2.0', 'S-104 Edition 2.0.0'],
      ['horizontalCRS',        '4326',              'WGS 84 (EPSG:4326)'],
      ['verticalCoordinateBase','2',                'verticalDatum (S-104 Ed.2 mandatory)'],
      ['verticalDatum',        '12',                'Mean Sea Level (MSL)'],
      ['dataDynamicity (TPXO)','1',                 'astronomicalPrediction'],
      ['dataDynamicity (Luwes)','3',                'observed'],
      ['dataCodingFormat',     '1',                 'Time series at fixed stations'],
      ['timeRecordInterval',   '3600 s',            '1-hour interval (TPXO)'],
      ['TOL Correction',       '−2.156 m',          'Transfer of Level: Luwes → MSL TPXO9'],
      ['encoding',             'HDF5',              'Hierarchical Data Format version 5'],
    ],
    methodTitle: 'Methodology',
    methodBody:  'Tidal predictions are computed using harmonic analysis based on the TPXO9-atlas-v5 model (Oregon State University), implementing 15 tidal constituents with astronomical arguments following Schureman (1958) and nodal factors following Foreman (1977). Real-time water level observations are collected every 60 seconds from the Luwes telemetry station operated by Pushidrosal, with a Transfer of Level correction (TOL = −2.156 m) applied to align the station datum to MSL.',
    teamTitle:  'Project Team',
    teamSub:    'Geodesy & Geomatics Engineering — Institut Teknologi Bandung — 2026',
    teamMembers: [
      { name: 'Revalia Aura Cahaya Prasetyo', nim: '15122003' },
      { name: 'Muhammad Syahrul Tasyrifan',   nim: '15122009' },
      { name: 'Evin Petra Pebrina Debataraja', nim: '15122035' },
      { name: 'Ichsan Fachri Siroj',          nim: '15122092' },
    ],
    supervisor: 'Supervisor: Prof. Dr.rer.nat. Poerbandono, S.T., M.M.',
    refTitle: 'References',
    refs: [
      { id: '[1]', text: 'IHO. (2024). S-100 Universal Hydrographic Data Model, Edition 5.2.0.', url: 'https://iho.int/uploads/user/pubs/standards/s-100/S-100_5.2.0_Final_Clean.pdf' },
      { id: '[2]', text: 'IHO. (2024). S-104 Water Level Information for Surface Navigation, Edition 2.0.0.', url: 'https://iho.int/en/s-100-based-product-specifications' },
      { id: '[3]', text: 'IMO. (2024). Resolution MSC.530(106): Performance Standards for ECDIS.', url: 'https://iho.int' },
      { id: '[4]', text: 'Amanda, A. et al. (2023). Process Design of Bathymetric, Water Level, and Surface Current Data Conversion According to IHO S-100 Standard. ITB Capstone Design Project.', url: '' },
      { id: '[5]', text: 'NOAA OCS. (2024). s100py: Python utilities for IHO S-100 HDF5 format.', url: 'https://s100py.readthedocs.io' },
      { id: '[6]', text: 'Egbert, G.D. & Erofeeva, S.Y. (2002). Efficient Inverse Modeling of Barotropic Ocean Tides. TPXO9-atlas-v5.', url: 'https://www.tpxo.net' },
      { id: '[7]', text: 'Schureman, P. (1958). Manual of Harmonic Analysis and Prediction of Tides. NOAA Special Pub. No. 98.', url: '' },
      { id: '[8]', text: 'Foreman, M.G.G. (1977). Manual for Tidal Heights Analysis and Prediction. IOS Report 77-10.', url: '' },
    ],
  },
  id: {
    hero:    'Tentang Searibu',
    heroSub: 'Sistem Informasi Kelautan untuk Wisata Bahari — Kepulauan Seribu',
    heroDesc:'Proyek capstone mahasiswa Teknik Geodesi dan Geomatika ITB yang membangun platform informasi kelautan terpadu — mengintegrasikan prediksi pasang surut, telemetri real-time, dan prakiraan cuaca untuk wisata bahari yang lebih aman.',
    stdTitle:  'Standar & Kepatuhan',
    stdSub:    'Sistem ini mengimplementasikan standar internasional IHO S-100 dan S-104 untuk interoperabilitas data hidrografi.',
    s100Title: 'IHO S-100 — Universal Hydrographic Data Model',
    s100Body:  'S-100 adalah kerangka induk yang dikeluarkan IHO untuk mendefinisikan cara semua produk data digital maritim disusun, dikodekan, dan dibagikan. Standar ini menggantikan S-57 dan dirancang kompatibel dengan standar geospasial modern (ISO/TC 211). S-100 diadopsi resmi oleh anggota IHO pada Desember 2024.',
    s104Title: 'IHO S-104 — Water Level Information for Surface Navigation',
    s104Body:  'S-104 adalah product specification dalam kerangka S-100 yang dirancang khusus untuk enkapsulasi dan transfer data pasut serta muka air untuk digunakan di ECDIS. Sistem Searibu mengimplementasikan S-104 Edition 2.0.0 untuk data prediksi astronomis (TPXO9) maupun data observasi (stasiun telemetri Luwes).',
    tableTitle:  'Detail Implementasi S-104',
    tableHeaders:['Atribut', 'Nilai', 'Keterangan'],
    tableRows: [
      ['productSpecification', 'INT.IHO.S-104.2.0', 'S-104 Edition 2.0.0'],
      ['horizontalCRS',        '4326',              'WGS 84 (EPSG:4326)'],
      ['verticalCoordinateBase','2',                'verticalDatum (wajib S-104 Ed.2)'],
      ['verticalDatum',        '12',                'Mean Sea Level (MSL)'],
      ['dataDynamicity (TPXO)','1',                 'astronomicalPrediction'],
      ['dataDynamicity (Luwes)','3',                'observed'],
      ['dataCodingFormat',     '1',                 'Time series di stasiun tetap'],
      ['timeRecordInterval',   '3600 s',            'Interval 1 jam (TPXO)'],
      ['Koreksi TOL',          '−2.156 m',          'Transfer of Level: Luwes → MSL TPXO9'],
      ['encoding',             'HDF5',              'Hierarchical Data Format version 5'],
    ],
    methodTitle: 'Metodologi',
    methodBody:  'Prediksi pasut dihitung menggunakan analisis harmonik model TPXO9-atlas-v5 (Oregon State University) dengan 15 konstituen pasut. Argumen astronomis mengikuti Schureman (1958) dan faktor nodal mengikuti Foreman (1977). Observasi muka air real-time dikumpulkan setiap 60 detik dari stasiun telemetri Luwes (Pushidrosal), dengan koreksi Transfer of Level (TOL = −2.156 m) untuk menyelaraskan datum stasiun ke MSL.',
    teamTitle:  'Tim Proyek',
    teamSub:    'Teknik Geodesi dan Geomatika — Institut Teknologi Bandung — 2026',
    teamMembers: [
      { name: 'Revalia Aura Cahaya Prasetyo', nim: '15122003' },
      { name: 'Muhammad Syahrul Tasyrifan',   nim: '15122009' },
      { name: 'Evin Petra Pebrina Debataraja', nim: '15122035' },
      { name: 'Ichsan Fachri Siroj',          nim: '15122092' },
    ],
    supervisor: 'Pembimbing: Prof. Dr.rer.nat. Poerbandono, S.T., M.M.',
    refTitle: 'Referensi',
    refs: [
      { id: '[1]', text: 'IHO. (2024). S-100 Universal Hydrographic Data Model, Edition 5.2.0.', url: 'https://iho.int/uploads/user/pubs/standards/s-100/S-100_5.2.0_Final_Clean.pdf' },
      { id: '[2]', text: 'IHO. (2024). S-104 Water Level Information for Surface Navigation, Edition 2.0.0.', url: 'https://iho.int/en/s-100-based-product-specifications' },
      { id: '[3]', text: 'IMO. (2024). Resolution MSC.530(106): Performance Standards for ECDIS.', url: 'https://iho.int' },
      { id: '[4]', text: 'Amanda, A. et al. (2023). Process Design of Bathymetric, Water Level, and Surface Current Data Conversion According to IHO S-100 Standard. ITB Capstone Design Project.', url: '' },
      { id: '[5]', text: 'NOAA OCS. (2024). s100py: Python utilities for IHO S-100 HDF5 format.', url: 'https://s100py.readthedocs.io' },
      { id: '[6]', text: 'Egbert, G.D. & Erofeeva, S.Y. (2002). Efficient Inverse Modeling of Barotropic Ocean Tides. TPXO9-atlas-v5.', url: 'https://www.tpxo.net' },
      { id: '[7]', text: 'Schureman, P. (1958). Manual of Harmonic Analysis and Prediction of Tides. NOAA Special Pub. No. 98.', url: '' },
      { id: '[8]', text: 'Foreman, M.G.G. (1977). Manual for Tidal Heights Analysis and Prediction. IOS Report 77-10.', url: '' },
    ],
  },
};

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', background: '#f8fafc', border: 'none', cursor: 'pointer',
          fontFamily: SANS, fontSize: 14, fontWeight: 600, color: NAVY,
          textAlign: 'left' as const, gap: 8,
        }}
      >
        <span style={{ flex: 1 }}>{title}</span>
        {open ? <ChevronUp size={16} style={{ color: '#94a3b8', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
      </button>
      {open && <div style={{ padding: '16px 20px', background: '#fff' }}>{children}</div>}
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { language } = useLanguage();
  const c = C[language as 'en' | 'id'];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 62 }}>
      {/* Responsive styles */}
      <style>{`
        .about-team-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 480px) {
          .about-team-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
        .about-hero-pad {
          padding: 56px 48px 48px;
        }
        @media (max-width: 600px) {
          .about-hero-pad {
            padding: 40px 20px 36px;
          }
        }
        .about-content-pad {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        @media (max-width: 480px) {
          .about-content-pad {
            padding: 24px 16px 56px;
          }
        }
      `}</style>

      {/* Hero */}
      <div className="about-hero-pad" style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${PRIMARY} 100%)`,
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Anchor size={26} color="#fff" />
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {c.hero}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
          {c.heroSub}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          {c.heroDesc}
        </p>
      </div>

      <div className="about-content-pad">
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <CheckCircle size={18} style={{ color: PRIMARY, flexShrink: 0 }} />
            <h2 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>
              {c.stdTitle}
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 1.7 }}>
            {c.stdSub}
          </p>
        </div>

        <Section title={c.s100Title}>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0 }}>{c.s100Body}</p>
        </Section>

        <Section title={c.s104Title}>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 16 }}>{c.s104Body}</p>
          <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
            {c.tableTitle}
          </p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: SANS, fontSize: 12, minWidth: 320 }}>
              <thead>
                <tr style={{ background: PRIMARY }}>
                  {c.tableHeaders.map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.tableRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '7px 12px', color: NAVY, fontFamily: '"Courier New", monospace', fontSize: 11, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{row[0]}</td>
                    <td style={{ padding: '7px 12px', color: PRIMARY, fontFamily: '"Courier New", monospace', fontSize: 11, borderBottom: '1px solid #f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>{row[1]}</td>
                    <td style={{ padding: '7px 12px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={c.methodTitle}>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#475569', lineHeight: 1.8, margin: 0 }}>{c.methodBody}</p>
        </Section>

        <Section title={c.teamTitle}>
          <p style={{ fontFamily: SANS, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>{c.teamSub}</p>

          {/* Fixed: responsive grid, no text truncation */}
          <div className="about-team-grid">
            {c.teamMembers.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                minWidth: 0,  // allow shrinking
              }}>
                {/* Avatar circle — never shrinks */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: PRIMARY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {m.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </div>
                {/* Text — wraps naturally, no overflow clipping */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 700,
                    color: NAVY,
                    margin: '0 0 2px',
                    lineHeight: 1.35,
                    // Allow text to wrap instead of being clipped
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    {m.name}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 11, color: '#94a3b8', margin: 0 }}>{m.nim}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Supervisor row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: `rgba(3,105,161,0.05)`,
            borderRadius: 8,
            border: `1px solid rgba(3,105,161,0.15)`,
            marginTop: 4,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `rgba(3,105,161,0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: PRIMARY, fontFamily: SANS, fontSize: 11, fontWeight: 700,
              flexShrink: 0,
            }}>
              SV
            </div>
            <p style={{ fontFamily: SANS, fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4 }}>{c.supervisor}</p>
          </div>
        </Section>

        <Section title={c.refTitle} defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {c.refs.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: PRIMARY, flexShrink: 0, marginTop: 1 }}>{r.id}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: '#475569', lineHeight: 1.6, flex: 1 }}>
                  {r.text}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6, color: PRIMARY, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};