import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { BookOpen, Map, BarChart2, Download, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const SANS    = '"Inter", "DM Sans", system-ui, sans-serif';
const NAVY    = "#024e78";
const PRIMARY = "#0369a1";

const C = {
  en: {
    title: "User Guide",
    sub:   "How to use the Searibu marine information system",
    sections: [
      {
        icon: "map",
        title: "Navigating the WebGIS Map",
        steps: [
          "Open the WebGIS page from the navigation bar.",
          "The map shows Kepulauan Seribu with blue TPXO grid cells and island markers.",
          "Click any blue grid cell to open the Marine Information panel on the right.",
          "Use the satellite / map toggle (bottom-left) to switch basemap.",
          "Use the island search bar (top-left) to fly to a specific island.",
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
    sub:   "Cara menggunakan sistem informasi kelautan Searibu",
    sections: [
      {
        icon: "map",
        title: "Navigasi Peta WebGIS",
        steps: [
          "Buka halaman WebGIS dari menu navigasi.",
          "Peta menampilkan Kepulauan Seribu dengan grid TPXO biru dan penanda pulau.",
          "Klik sel grid biru mana saja untuk membuka panel Informasi Kelautan di kanan.",
          "Gunakan toggle satelit/peta (kiri bawah) untuk mengganti basemap.",
          "Gunakan kotak pencarian pulau (kiri atas) untuk terbang ke pulau tertentu.",
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
          "Setiap aktivitas (snorkeling, selam, perahu, dll.) mendapat status keamanan berdasarkan tinggi gelombang, kecepatan angin, dan arus.",
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
          "File TPXO menggunakan dataDynamicity=1 (astronomicalPrediction). File Luwes menggunakan dataDynamicity=3 (observed).",
        ],
      },
      {
        icon: "chart",
        title: "Mengubah Tanggal",
        steps: [
          "Gunakan pemilih tanggal di Panel Info untuk melihat data hari mana saja.",
          "Data cuaca di-cache untuk ±14 hari dari hari ini — tanggal lampau dan mendatang didukung.",
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
  map:      <Map      size={18} />,
  chart:    <BarChart2 size={18} />,
  download: <Download size={18} />,
};

export const GuidePage: React.FC = () => {
  const { language } = useLanguage();
  const c = C[language as "en" | "id"];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingTop: 62 }}>
      <div style={{ background: `linear-gradient(135deg,${NAVY} 0%,${PRIMARY} 60%,#0ea5e9 100%)`, padding: "56px 48px 48px", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <BookOpen size={26} color="#fff" />
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>{c.title}</h1>
        <p style={{ fontFamily: SANS, fontSize: 15, color: "rgba(255,255,255,0.7)", maxWidth: 500, margin: "0 auto" }}>{c.sub}</p>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 64px" }}>
        {c.sections.map((sec, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px", background: "#f8fafc", border: "none", cursor: "pointer",
                fontFamily: SANS, fontSize: 14, fontWeight: 600, color: NAVY, textAlign: "left" as const,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(3,105,161,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: PRIMARY, flexShrink: 0 }}>
                {ICONS[sec.icon]}
              </div>
              <span style={{ flex: 1 }}>{sec.title}</span>
              {openIdx === i
                ? <ChevronUp   size={16} style={{ color: "#94a3b8" }} />
                : <ChevronDown size={16} style={{ color: "#94a3b8" }} />}
            </button>
            {openIdx === i && (
              <div style={{ padding: "16px 20px 20px", background: "#fff" }}>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  {sec.steps.map((step, j) => (
                    <li key={j} style={{ fontFamily: SANS, fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 6 }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginTop: 24 }}>
          <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: NAVY, margin: 0 }}>{c.statusGuide}</p>
          </div>
          <div style={{ padding: "16px 20px", background: "#fff", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: <CheckCircle   size={16} />, color: "#16a34a", bg: "#f0fdf4", border: "#86efac", text: c.safe    },
              { icon: <AlertTriangle size={16} />, color: "#d97706", bg: "#fffbeb", border: "#fde68a", text: c.caution },
              { icon: <XCircle       size={16} />, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: c.avoid   },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8 }}>
                <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <p style={{ fontFamily: SANS, fontSize: 13, color: s.color, margin: 0, lineHeight: 1.6 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};