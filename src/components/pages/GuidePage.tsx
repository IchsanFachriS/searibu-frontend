import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { BookOpen, Map, BarChart2, Download, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const FONT  = "'Inter', system-ui, -apple-system, sans-serif";
const DARK1 = "#2b2b2b";
const AMBER = "#f5c518";
const BLUE_D= "#1a3bbf";
const BLUE_L= "#ddf0fb";
const BG    = "#f7f4ef";
const SURF  = "#ffffff";
const BORDER= "#e4ddd4";
const TEXT1 = "#1a1a1a";
const TEXT2 = "#3d3d3d";
const TEXT3 = "#6b6b6b";
const MUTED = "#9a9a9a";

const C = {
  en: {
    title: "User Guide",
    sub: "How to use the Searibu marine information system",
    sections: [
      {
        icon: "map",
        title: "Navigating the WebGIS Map",
        steps: [
          "Open the WebGIS page from the navigation bar.",
          "The map shows Kepulauan Seribu with blue TPXO grid cells and island markers.",
          "Click any blue grid cell to open the Marine Information panel on the right.",
          "Use the satellite / map toggle (bottom-left) to switch basemap.",
          "Use the island search bar (bottom-centre) to fly to a specific island.",
        ],
      },
      {
        icon: "chart",
        title: "Reading the Tidal Chart",
        steps: [
          "The blue line shows TPXO9 astronomical tidal prediction (hourly, MSL datum).",
          "Orange dots (if present) show real-time observations from the Luwes telemetry station.",
          "The red dashed 'NOW' line marks the current time (today's data only).",
          "Hover over the chart to see exact height values at any time.",
          "Heights above 0 m = above MSL (high tide). Below 0 m = below MSL (low tide).",
        ],
      },
      {
        icon: "chart",
        title: "Activity Safety Indicators",
        steps: [
          "Each activity (snorkeling, diving, boating, etc.) gets a safety status based on wave height, wind speed, and current.",
          "Green = Safe conditions for that activity.",
          "Yellow = Caution — proceed with care, conditions are moderate.",
          "Red = Avoid — conditions exceed safe operational limits.",
          "Thresholds are based on scientific literature (Chuang et al. 2024, de Vos & Rautenbach 2019).",
        ],
      },
      {
        icon: "download",
        title: "Exporting S-104 Data",
        steps: [
          "Click a grid cell on the WebGIS map to open the Info Panel.",
          "Scroll to the bottom of the panel to find the IHO S-100/S-104 section.",
          "Click 'Export S-104 (TPXO)' to download tidal prediction as an HDF5 file.",
          "Click 'Export S-104 (Luwes)' to download real observations as an HDF5 file.",
          "Files are compliant with IHO S-104 Edition 2.0.0 and can be opened in ECDIS, HDFView, or s100py.",
          "The TPXO file uses dataDynamicity=1 (astronomicalPrediction). The Luwes file uses dataDynamicity=3 (observed).",
        ],
      },
      {
        icon: "chart",
        title: "Changing Date",
        steps: [
          "Use the date picker in the Info Panel to view data for any date.",
          "Weather data is cached for ±14 days from today — past and future dates are supported.",
          "Tidal prediction and Luwes data are fetched fresh for each date change.",
          "A 'Cached weather' badge appears when weather data is served from session cache.",
          "Click the refresh icon (↻) next to the badge to force a fresh weather fetch.",
        ],
      },
    ],
    statusGuide: "Activity Status Guide",
    safe:    "Safe — conditions are within safe operational limits for this activity.",
    caution: "Caution — moderate conditions, experienced practitioners only.",
    avoid:   "Avoid — conditions exceed safe limits, do not attempt.",
  },
  id: {
    title: "Panduan Penggunaan",
    sub: "Cara menggunakan sistem informasi kelautan Searibu",
    sections: [
      {
        icon: "map",
        title: "Navigasi Peta WebGIS",
        steps: [
          "Buka halaman WebGIS dari menu navigasi.",
          "Peta menampilkan Kepulauan Seribu dengan grid TPXO biru dan penanda pulau.",
          "Klik sel grid biru mana saja untuk membuka panel Informasi Kelautan di kanan.",
          "Gunakan toggle satelit/peta (kiri bawah) untuk mengganti basemap.",
          "Gunakan kotak pencarian pulau (tengah bawah) untuk terbang ke pulau tertentu.",
        ],
      },
      {
        icon: "chart",
        title: "Membaca Grafik Pasut",
        steps: [
          "Garis biru menunjukkan prediksi pasut astronomis TPXO9 (per jam, datum MSL).",
          "Titik oranye (jika ada) menunjukkan observasi nyata dari stasiun telemetri Luwes.",
          "Garis merah putus-putus 'NOW' menandai waktu saat ini (hanya data hari ini).",
          "Arahkan kursor ke grafik untuk melihat nilai ketinggian tepat di waktu tertentu.",
          "Tinggi di atas 0 m = di atas MSL (pasang). Di bawah 0 m = di bawah MSL (surut).",
        ],
      },
      {
        icon: "chart",
        title: "Indikator Keamanan Aktivitas",
        steps: [
          "Setiap aktivitas mendapat status keamanan berdasarkan tinggi gelombang, kecepatan angin, dan arus.",
          "Hijau = Aman untuk aktivitas tersebut.",
          "Kuning = Waspada — lanjutkan dengan hati-hati, kondisi sedang.",
          "Merah = Hindari — kondisi melampaui batas aman operasional.",
          "Ambang batas berbasis literatur ilmiah (Chuang et al. 2024, de Vos & Rautenbach 2019).",
        ],
      },
      {
        icon: "download",
        title: "Ekspor Data S-104",
        steps: [
          "Klik sel grid di peta WebGIS untuk membuka Panel Info.",
          "Gulir ke bagian bawah panel untuk menemukan bagian IHO S-100/S-104.",
          "Klik 'Ekspor S-104 (TPXO)' untuk mengunduh prediksi pasut sebagai file HDF5.",
          "Klik 'Ekspor S-104 (Luwes)' untuk mengunduh observasi nyata sebagai file HDF5.",
          "File sesuai IHO S-104 Edition 2.0.0 dan dapat dibuka di ECDIS, HDFView, atau s100py.",
          "File TPXO: dataDynamicity=1. File Luwes: dataDynamicity=3.",
        ],
      },
      {
        icon: "chart",
        title: "Mengubah Tanggal",
        steps: [
          "Gunakan pemilih tanggal di Panel Info untuk melihat data hari mana saja.",
          "Data cuaca di-cache untuk ±14 hari dari hari ini.",
          "Prediksi pasut dan data Luwes diambil ulang setiap kali tanggal berubah.",
          "Badge 'Cuaca tersimpan' muncul saat data cuaca disajikan dari cache sesi.",
          "Klik ikon segarkan (↻) di sebelah badge untuk memaksa pengambilan cuaca baru.",
        ],
      },
    ],
    statusGuide: "Panduan Status Aktivitas",
    safe:    "Aman — kondisi dalam batas aman operasional untuk aktivitas ini.",
    caution: "Waspada — kondisi sedang, hanya untuk praktisi berpengalaman.",
    avoid:   "Hindari — kondisi melampaui batas aman, jangan dicoba.",
  },
};

const ICONS: Record<string, React.ReactNode> = {
  map:      <Map       size={16} />,
  chart:    <BarChart2 size={16} />,
  download: <Download  size={16} />,
};

export const GuidePage: React.FC = () => {
  const { language } = useLanguage();
  const c = C[language as "en" | "id"];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingTop: 70 }}>
      {/* Header */}
      <div style={{ background: DARK1, padding: "52px 48px 44px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(245,193,24,0.04) 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(245,193,24,0.12)", border: "1px solid rgba(245,193,24,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={24} color={AMBER} />
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, color: "#f5f0e8", marginBottom: 8, letterSpacing: "-0.03em" }}>{c.title}</h1>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "rgba(245,240,232,0.55)", maxWidth: 480, margin: "0 auto" }}>{c.sub}</p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 64px" }}>
        {c.sections.map((sec, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 18px", background: openIdx === i ? SURF : BG,
                border: "none", cursor: "pointer",
                fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TEXT1, textAlign: "left" as const,
                transition: "background 0.15s",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: openIdx === i ? BLUE_D : "#eee8e0", display: "flex", alignItems: "center", justifyContent: "center", color: openIdx === i ? "#fff" : TEXT3, flexShrink: 0, transition: "all 0.18s" }}>
                {ICONS[sec.icon]}
              </div>
              <span style={{ flex: 1 }}>{sec.title}</span>
              {openIdx === i
                ? <ChevronUp   size={15} style={{ color: MUTED }} />
                : <ChevronDown size={15} style={{ color: MUTED }} />}
            </button>
            {openIdx === i && (
              <div style={{ padding: "14px 18px 18px 66px", background: SURF, borderTop: `1px solid ${BORDER}` }}>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {sec.steps.map((step, j) => (
                    <li key={j} style={{ fontFamily: FONT, fontSize: 13, color: TEXT2, lineHeight: 1.72, marginBottom: 7 }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}

        {/* Status guide */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
          <div style={{ padding: "13px 18px", background: BG, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, background: AMBER, borderRadius: 2 }} />
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: 0 }}>{c.statusGuide}</p>
          </div>
          <div style={{ padding: "14px 18px", background: SURF, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: <CheckCircle   size={15} />, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", text: c.safe    },
              { icon: <AlertTriangle size={15} />, color: "#92400e", bg: "#fffbeb", border: "#fde68a", text: c.caution },
              { icon: <XCircle       size={15} />, color: "#991b1b", bg: "#fff1f2", border: "#fecdd3", text: c.avoid   },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9 }}>
                <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <p style={{ fontFamily: FONT, fontSize: 13, color: s.color, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};