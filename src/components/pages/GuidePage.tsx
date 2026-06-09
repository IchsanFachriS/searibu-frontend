import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { useSEO, PAGE_SEO } from "../../hooks/useSEO";

const FONT     = "'Inter', system-ui, -apple-system, sans-serif";
const DARK1    = "#2b2b2b";
const OFF_WHITE= "#f5f0e8";
const AMBER    = "#f5c518";
const BG       = "#f7f4ef";
const SURFACE  = "#ffffff";
const BORDER   = "#e4ddd4";
const TEXT1    = "#1a1a1a";
const TEXT2    = "#3d3d3d";
const TEXT3    = "#6b6b6b";
const MUTED    = "#9a9a9a";

/* ── Intersection hook ── */
const useInView = (threshold = 0.08) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};

/* ── FAQ collapsible ── */
const FaqItem: React.FC<{ q: string; a: string; defaultOpen?: boolean }> = ({ q, a, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
      >
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: TEXT1, lineHeight: 1.4 }}>{q}</span>
        {open ? <ChevronUp size={16} style={{ color: MUTED, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: MUTED, flexShrink: 0 }} />}
      </button>
      {open && (
        <p style={{ fontFamily: FONT, fontSize: 14, color: TEXT3, lineHeight: 1.8, paddingBottom: 18, margin: 0 }}>{a}</p>
      )}
    </div>
  );
};

/* ── Numbered step ── */
const Step: React.FC<{ num: number; title: string; body: string }> = ({ num, title, body }) => (
  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: DARK1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 13, fontWeight: 700, color: AMBER }}>
      {num}
    </div>
    <div style={{ paddingTop: 4 }}>
      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: TEXT1, margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontFamily: FONT, fontSize: 14, color: TEXT3, lineHeight: 1.75, margin: 0 }}>{body}</p>
    </div>
  </div>
);

/* ── Section header ── */
const SectionHeader: React.FC<{ label: string; title: string; inView: boolean; delay?: number }> = ({ label, title, inView, delay = 0 }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: TEXT3 }}>{label}</span>
    </div>
    <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: TEXT1, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(14px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {title}
    </h2>
  </div>
);

/* ── Copy ── */
interface GuideSection { title: string; body: string }
interface GuideStep    { title: string; body: string }
interface GuideFaq     { q: string; a: string }

interface GuideCopy {
  heroBadge: string; heroTitle: string; heroDesc: string; downloadBtn: string;
  videoLabel: string; videoTitle: string; videoDesc: string; videoPlaceholder: string;
  quickLabel: string; quickTitle: string; steps: GuideStep[];
  mapLabel: string; mapTitle: string; mapItems: GuideSection[];
  chartLabel: string; chartTitle: string; chartItems: GuideSection[];
  safetyLabel: string; safetyTitle: string; safetyItems: GuideSection[];
  dateLabel: string; dateTitle: string; dateItems: GuideStep[];
  s104Label: string; s104Title: string; s104Items: GuideSection[];
  faqLabel: string; faqTitle: string; faqs: GuideFaq[];
  manualLabel: string; manualTitle: string; manualDesc: string; manualBtn: string;
}

const COPY: Record<"en" | "id", GuideCopy> = {
  en: {
    heroBadge: "Quick Guide",
    heroTitle: "How to Use Searibu",
    heroDesc: "A concise guide to get you started with the Searibu marine information system.",
    downloadBtn: "Download Full Manual",

    videoLabel: "Tutorial Video",
    videoTitle: "Watch: Getting Started",
    videoDesc: "A step-by-step walkthrough of Searibu core features.",
    videoPlaceholder: "Tutorial video will be available here",

    quickLabel: "Quick Start",
    quickTitle: "Up and running in 4 steps",
    steps: [
      {
        title: "Open the WebGIS map",
        body: "Click WebGIS in the navigation bar. The map loads showing Kepulauan Seribu. You can click anywhere on the map or on an island/station marker to open the Marine Information panel.",
      },
      {
        title: "Click anywhere on the map or a marker",
        body: "Tap or click any point within the Kepulauan Seribu service area to open the Marine Information panel on the right (or as a bottom sheet on mobile). You can also click a blue island marker or the red tidal station marker directly.",
      },
      {
        title: "Read tidal and weather data",
        body: "The panel shows today's tidal prediction chart, current wind, wave height, and ocean current. Use the date picker to browse past or future dates.",
      },
      {
        title: "Check activity safety",
        body: "Go to the Home page and use the Activity Safety Check tool. Select an island and a date to see safety ratings for 11 activities.",
      },
    ],

    mapLabel: "The Map",
    mapTitle: "Reading the WebGIS map",
    mapItems: [
      {
        title: "Click anywhere on the map",
        body: "Clicking any point within the Kepulauan Seribu area opens the Marine Information panel for that exact coordinate.",
      },
      {
        title: "Grid overlay (optional)",
        body: "A grid overlay is off by default. Use the Grid Overlay toggle (top-left toolbar) to enable TPXO10, ECMWF IFS, or SMOC/MFWAM grid cells. Clicking a cell still opens the same Marine Information panel.",
      },
      {
        title: "Island markers",
        body: "Circular blue markers show tourism islands. Clicking one opens a popup with facilities and a short description, plus a 'Click for marine data' button that opens the panel for that island's coordinates.",
      },
      {
        title: "Search and My Location",
        body: "Use the search bar at the bottom of the map to find an island by name. The location button fetches your GPS coordinates, if you are within the service area, the panel opens automatically.",
      },
    ],

    chartLabel: "The Chart",
    chartTitle: "Understanding the tidal chart",
    chartItems: [
      {
        title: "Blue line (Tidal prediction)",
        body: "The smooth blue line is an hourly astronomical tidal prediction computed from the TPXO10-atlas-v2 model using 15 harmonic constituents. Heights are relative to Mean Sea Level (MSL).",
      },
      {
        title: "Pink dots (Water-level observations)",
        body: "When available, pink dots show actual measured water levels from the Luwes telemetry station, corrected to MSL using a Transfer of Level.",
      },
      {
        title: "Red dashed line (Now)",
        body: "On today's date, a vertical red dashed line marks the current time in WIB",
      },
      {
        title: "Hover or tap the chart",
        body: "Move your cursor over the chart (or tap on mobile) to see exact water level values at any hour for both the prediction and observation.",
      },
    ],

    safetyLabel: "Safety Check",
    safetyTitle: "Activity safety ratings explained",
    safetyItems: [
      {
        title: "What it checks",
        body: "The tool fetches average wind speed, wave height, and ocean current for your chosen island and date from the Open-Meteo Marine API, then applies science-based thresholds for each activity.",
      },
      {
        title: "Safe (green)",
        body: "All relevant environmental parameters are within limits considered safe for that activity based on published scientific literature.",
      },
      {
        title: "Caution (yellow)",
        body: "One or more parameters are moderate. The activity is possible but caution is advised.",
      },
      {
        title: "Avoid (red)",
        body: "One or more parameters exceed the safe operational limit for that activity. It is strongly advised not to attempt it under these conditions.",
      },
      {
        title: "Date range",
        body: "Free accounts can analyse the past 10 days and up to 3 days ahead. Dates outside this range show a Pro upgrade prompt. Pro accounts allow unlimited historical dates and up to 10 days ahead.",
      },
    ],

    dateLabel: "Date Navigation",
    dateTitle: "Changing the date",
    dateItems: [
      {
        title: "Home page — Activity Safety Check",
        body: "The date picker has no minimum (unlimited past) and a maximum of 10 days ahead. Free users can analyse dates within the past 10 days and up to 3 days ahead. Selecting a date outside this range shows a Pro upgrade prompt instead of results.",
      },
      {
        title: "WebGIS — Marine Information panel",
        body: "Tap the date field at the top of the panel and choose any available date. Free users: past 10 days and 3 days ahead. Pro users: unlimited historical dates and 10 days ahead. Data reloads automatically.",
      },
      {
        title: "Free vs Pro range",
        body: "Free plan: past 10 days and 3 days ahead for both the Home safety check and the WebGIS panel. Pro plan: any historical date and up to 10 days ahead.",
      },
      {
        title: "Weather data caching",
        body: "Weather data is cached per session to reduce API calls. Use the refresh button at the top of the panel to force a fresh fetch.",
      },
    ],

    s104Label: "S-104 Export",
    s104Title: "Downloading S-104 HDF5 files",
    s104Items: [
      {
        title: "Who can export",
        body: "S-104 HDF5 export is available to all users with an active Pro subscription, regardless of account type (General or Researcher).",
      },
      {
        title: "TPXO export — astronomical prediction",
        body: "Downloads hourly tidal predictions for the selected grid point and date as an IHO S-104 Edition 2.0.0 compliant HDF5 file. dataDynamicity = 2 (astronomicalPrediction), timeRecordInterval = 3600 s.",
      },
      {
        title: "Luwes export — observed data",
        body: "Downloads real-time observed water level data from the Luwes station as an S-104 HDF5 file. dataDynamicity = 1 (observation), timeRecordInterval = 60 s. A TOL correction of −1.944 m is applied to shift the datum to MSL. Requires Luwes data to be available for that date.",
      },
      {
        title: "Opening the file",
        body: "HDF5 files can be opened with HDFView, ECDIS software, or processed programmatically using the open-source s100py Python library.",
      },
    ],

    faqLabel: "FAQ",
    faqTitle: "Common questions",
    faqs: [
      {
        q: "Why is the chart empty for some dates?",
        a: "Weather and marine forecast data from Open-Meteo is available for roughly 10–14 days from today in both directions. Tidal prediction is always available. If the chart appears empty, try refreshing or check that your date is within the allowed range.",
      },
      {
        q: "The tidal prediction and observation lines do not match. Is that normal?",
        a: "Yes. The TPXO10 model computes the astronomical (gravitational) tide only. Observations from the Luwes station reflect total water level including storm surge, swell, and local effects — so some difference is expected, especially during strong weather.",
      },
      {
        q: "I clicked the map but nothing happened. Why?",
        a: "The Marine Information panel only opens for coordinates within the Kepulauan Seribu service area (106°–107°E, 5°–6.3°S). If you click outside this bounding box, a red tooltip appears explaining you are outside the service area. Try clicking within the archipelago.",
      },
      {
        q: "Can I use the data offline?",
        a: "Once the Marine Information panel has loaded, tidal chart data stays available for your session. Weather data is also cached per session. For offline use, export an S-104 HDF5 file (requires Pro subscription).",
      },
      {
        q: "Why does the safety check show a Pro upgrade prompt?",
        a: "The Activity Safety Check on the Home page restricts analysis to the past 10 days and 3 days ahead for Free users. If you select a date outside this range, the upgrade prompt appears instead of results. Upgrade to Pro to analyse any historical date up to 10 days ahead.",
      },
      {
        q: "What is the TOL correction and why does it matter?",
        a: "Transfer of Level (TOL = −1.944 m) is applied to shift the Luwes station reference datum to Mean Sea Level (MSL), the same datum used by TPXO. This makes the two datasets directly comparable on the chart.",
      },
      {
        q: "How do I enable the grid overlay on the WebGIS map?",
        a: "By default the map has no grid overlay. Use the Grid Overlay toggle in the top-left toolbar to enable TPXO10 Atlas, ECMWF IFS, or SMOC/MFWAM grids. You can click grid cells or any point on the map to open the Marine Information panel.",
      },
      {
        q: "How do I change my account type from General to Researcher?",
        a: "Click your name in the navigation bar, then select Profile and Account Type. Choose Researcher or Professional and save. Note that account type does not affect feature access — all features are available based on your subscription plan.",
      },
    ],

    manualLabel: "Full Documentation",
    manualTitle: "Need more detail?",
    manualDesc: "The Searibu User Manual covers methodology, data sources, IHO S-104 compliance details, tidal constituents, and API reference in full technical depth.",
    manualBtn: "Download Manual (PDF)",
  },

  id: {
    heroBadge: "Panduan Cepat",
    heroTitle: "Cara Menggunakan Searibu",
    heroDesc: "Panduan singkat untuk mulai menggunakan sistem informasi kelautan Searibu.",
    downloadBtn: "Unduh Manual Lengkap",

    videoLabel: "Video Tutorial",
    videoTitle: "Tonton: Mulai Menggunakan Searibu",
    videoDesc: "Panduan langkah demi langkah fitur-fitur utama Searibu.",
    videoPlaceholder: "Video tutorial akan tersedia di sini",

    quickLabel: "Mulai Cepat",
    quickTitle: "Siap digunakan dalam 4 langkah",
    steps: [
      {
        title: "Buka peta WebGIS",
        body: "Klik WebGIS di menu navigasi. Peta memuat Kepulauan Seribu. Kamu bisa langsung klik di mana saja pada peta atau klik marker pulau/stasiun untuk membuka panel Informasi Kelautan.",
      },
      {
        title: "Klik di mana saja pada peta atau marker",
        body: "Ketuk atau klik titik mana saja dalam area layanan Kepulauan Seribu untuk membuka panel Informasi Kelautan di sebelah kanan (atau sebagai panel bawah di ponsel). Kamu juga bisa langsung klik marker pulau berwarna biru atau marker stasiun pasut merah.",
      },
      {
        title: "Baca data pasut dan cuaca",
        body: "Panel menampilkan grafik prediksi pasut hari ini, angin saat ini, tinggi gelombang, dan arus laut. Gunakan pemilih tanggal untuk melihat data masa lalu atau mendatang.",
      },
      {
        title: "Cek keamanan aktivitas",
        body: "Pergi ke halaman Beranda dan gunakan alat Cek Keamanan Aktivitas. Pilih pulau dan tanggal untuk melihat rating keamanan 11 aktivitas.",
      },
    ],

    mapLabel: "Peta",
    mapTitle: "Membaca peta WebGIS",
    mapItems: [
      {
        title: "Klik di mana saja pada peta",
        body: "Mengklik titik mana saja dalam area batas Kepulauan Seribu membuka panel Informasi Kelautan untuk koordinat tersebut. ",
      },
      {
        title: "Overlay grid (opsional)",
        body: "Overlay grid tidak aktif secara default. Gunakan toggle Grid Overlay di toolbar kiri atas untuk mengaktifkan grid TPXO10, ECMWF IFS, atau SMOC/MFWAM. Mengklik sel grid tetap membuka panel yang sama.",
      },
      {
        title: "Marker pulau",
        body: "Marker bulat biru menunjukkan pulau wisata. Mengkliknya membuka popup dengan fasilitas dan deskripsi singkat, plus tombol 'Klik untuk data kelautan' yang membuka panel di koordinat pulau tersebut.",
      },
      {
        title: "Pencarian dan Lokasi Saya",
        body: "Gunakan bilah pencarian di bagian bawah peta untuk mencari pulau berdasarkan nama. Tombol lokasi mengambil koordinat GPS, jika berada dalam area layanan, panel terbuka secara otomatis.",
      },
    ],

    chartLabel: "Grafik",
    chartTitle: "Memahami grafik pasut",
    chartItems: [
      {
        title: "Garis biru — prediksi TPXO",
        body: "Garis biru halus adalah prediksi pasut astronomis per jam yang dihitung dari model TPXO10-atlas-v2 menggunakan 15 konstituen harmonik. Ketinggian relatif terhadap Mean Sea Level (MSL).",
      },
      {
        title: "Titik merah muda — observasi Luwes",
        body: "Jika tersedia, titik merah muda menunjukkan muka air aktual dari stasiun telemetri Luwes, dikoreksi ke MSL menggunakan Transfer of Level (TOL = −1,944 m).",
      },
      {
        title: "Garis merah putus — SEKARANG",
        body: "Pada tanggal hari ini, garis merah vertikal menandai waktu saat ini dalam WIB. Garis ini hilang saat melihat tanggal lain.",
      },
      {
        title: "Arahkan atau ketuk grafik",
        body: "Gerakkan kursor ke grafik (atau ketuk di ponsel) untuk melihat nilai muka air tepat di setiap jam, untuk prediksi maupun observasi.",
      },
    ],

    safetyLabel: "Cek Keamanan",
    safetyTitle: "Penjelasan rating keamanan aktivitas",
    safetyItems: [
      {
        title: "Apa yang dicek",
        body: "Alat ini mengambil rata-rata kecepatan angin, tinggi gelombang, dan arus laut untuk pulau dan tanggal yang dipilih dari Open-Meteo Marine API, lalu menerapkan ambang batas berbasis ilmiah untuk setiap aktivitas.",
      },
      {
        title: "Aman (hijau)",
        body: "Semua parameter lingkungan yang relevan berada dalam batas yang dianggap aman untuk aktivitas tersebut berdasarkan literatur ilmiah.",
      },
      {
        title: "Waspada (kuning)",
        body: "Satu atau lebih parameter berada dalam kondisi sedang. Aktivitas masih memungkinkan namun harus berhati-hati — hanya untuk praktisi berpengalaman.",
      },
      {
        title: "Hindari (merah)",
        body: "Satu atau lebih parameter melampaui batas operasional aman untuk aktivitas tersebut. Sangat disarankan untuk tidak mencobanya dalam kondisi ini.",
      },
      {
        title: "Rentang tanggal",
        body: "Akun Gratis dapat menganalisis 10 hari ke belakang dan hingga 3 hari ke depan. Tanggal di luar rentang ini menampilkan ajakan upgrade ke Pro. Akun Pro mendapat akses historis tak terbatas hingga 10 hari ke depan.",
      },
    ],

    dateLabel: "Navigasi Tanggal",
    dateTitle: "Mengubah tanggal",
    dateItems: [
      {
        title: "Beranda — Cek Keamanan Aktivitas",
        body: "Pemilih tanggal tidak memiliki batas minimum (historis tak terbatas) dan batas maksimum 10 hari ke depan. Pengguna Gratis dapat menganalisis 10 hari lalu hingga 3 hari ke depan. Memilih tanggal di luar rentang ini menampilkan ajakan upgrade Pro.",
      },
      {
        title: "WebGIS — panel Informasi Kelautan",
        body: "Ketuk kolom tanggal di bagian atas panel dan pilih tanggal yang tersedia. Pengguna Gratis: 10 hari lalu dan 3 hari ke depan. Pengguna Pro: historis tak terbatas dan 10 hari ke depan. Data dimuat ulang secara otomatis.",
      },
      {
        title: "Rentang Gratis vs Pro",
        body: "Paket Gratis: 10 hari lalu dan 3 hari ke depan, berlaku untuk Cek Keamanan di Beranda maupun panel WebGIS. Paket Pro: tanggal historis tak terbatas dan hingga 10 hari ke depan.",
      },
      {
        title: "Cache data cuaca",
        body: "Data cuaca di-cache per sesi untuk mengurangi panggilan API. Gunakan tombol segarkan di atas panel untuk memaksa pengambilan ulang.",
      },
    ],

    s104Label: "Ekspor S-104",
    s104Title: "Mengunduh file S-104 HDF5",
    s104Items: [
      {
        title: "Siapa yang bisa ekspor",
        body: "Ekspor S-104 HDF5 tersedia untuk semua pengguna dengan langganan Pro aktif, terlepas dari jenis akun (Umum atau Peneliti).",
      },
      {
        title: "Ekspor TPXO — prediksi astronomis",
        body: "Mengunduh prediksi pasut per jam untuk titik grid dan tanggal yang dipilih sebagai file HDF5 berstandar IHO S-104 Edition 2.0.0. dataDynamicity = 2 (astronomicalPrediction), timeRecordInterval = 3600 detik.",
      },
      {
        title: "Ekspor Luwes — data observasi",
        body: "Mengunduh data muka air observasi real-time dari stasiun Luwes sebagai file S-104 HDF5. dataDynamicity = 1 (observation), timeRecordInterval = 60 detik. Koreksi TOL −1,944 m diterapkan untuk menggeser datum ke MSL. Membutuhkan data Luwes yang tersedia untuk tanggal tersebut.",
      },
      {
        title: "Membuka file",
        body: "File HDF5 dapat dibuka dengan HDFView, perangkat lunak ECDIS, atau diproses secara terprogram menggunakan pustaka Python open-source s100py.",
      },
    ],

    faqLabel: "FAQ",
    faqTitle: "Pertanyaan umum",
    faqs: [
      {
        q: "Mengapa grafik kosong untuk beberapa tanggal?",
        a: "Data prakiraan cuaca dan kelautan dari Open-Meteo tersedia sekitar 10–14 hari dari hari ini ke kedua arah. Prediksi pasut selalu tersedia. Jika grafik tampak kosong, coba segarkan atau periksa bahwa tanggal Anda berada dalam rentang yang diizinkan.",
      },
      {
        q: "Garis prediksi pasut dan observasi tidak sesuai. Apakah normal?",
        a: "Ya. Model TPXO10 hanya menghitung pasut astronomis (gravitasi). Observasi dari stasiun Luwes mencerminkan total muka air termasuk storm surge, ombak, dan efek lokal — sehingga perbedaan memang diharapkan, terutama saat cuaca buruk.",
      },
      {
        q: "Saya mengklik peta tapi tidak ada yang terjadi. Kenapa?",
        a: "Panel Informasi Kelautan hanya terbuka untuk koordinat dalam area layanan Kepulauan Seribu (106°–107°BT, 5°–6,3°LS). Jika mengklik di luar area ini, tooltip merah akan muncul menjelaskan bahwa lokasi berada di luar area. Coba klik di dalam area kepulauan.",
      },
      {
        q: "Bisakah saya menggunakan data secara offline?",
        a: "Setelah panel Informasi Kelautan dimuat, data grafik pasut tetap tersedia untuk sesi Anda. Data cuaca juga di-cache per sesi. Untuk penggunaan offline, ekspor file S-104 HDF5 (membutuhkan langganan Pro).",
      },
      {
        q: "Kenapa muncul ajakan upgrade Pro di cek keamanan aktivitas?",
        a: "Cek Keamanan Aktivitas di halaman Beranda membatasi analisis pada 10 hari lalu dan 3 hari ke depan untuk pengguna Gratis. Jika memilih tanggal di luar rentang ini, ajakan upgrade muncul menggantikan hasil analisis. Upgrade ke Pro untuk menganalisis tanggal historis manapun hingga 10 hari ke depan.",
      },
      {
        q: "Apa itu koreksi TOL dan mengapa penting?",
        a: "Transfer of Level (TOL = −1,944 m) diterapkan untuk menggeser datum referensi stasiun Luwes agar sesuai dengan Mean Sea Level (MSL), datum yang sama yang digunakan TPXO. Ini membuat kedua dataset dapat dibandingkan langsung di grafik.",
      },
      {
        q: "Bagaimana cara mengaktifkan overlay grid di peta WebGIS?",
        a: "Secara default peta tidak memiliki overlay grid. Gunakan toggle Grid Overlay di toolbar kiri atas untuk mengaktifkan grid TPXO10 Atlas, ECMWF IFS, atau SMOC/MFWAM. Kamu dapat mengklik sel grid atau titik mana saja di peta untuk membuka panel Informasi Kelautan.",
      },
      {
        q: "Bagaimana cara mengubah jenis akun dari Umum ke Peneliti?",
        a: "Klik nama Anda di bilah navigasi, lalu pilih Profil dan Jenis Akun. Pilih Peneliti atau Profesional dan simpan. Perlu diketahui bahwa jenis akun tidak mempengaruhi akses fitur — semua fitur tersedia berdasarkan paket langganan.",
      },
    ],

    manualLabel: "Dokumentasi Lengkap",
    manualTitle: "Perlu detail lebih lanjut?",
    manualDesc: "Manual Pengguna Searibu mencakup metodologi, sumber data, detail kepatuhan IHO S-104, konstituen pasut, dan referensi API secara teknis mendalam.",
    manualBtn: "Unduh Manual (PDF)",
  },
};

/* ── GuidePage ── */
export const GuidePage: React.FC = () => {
  const { language } = useLanguage();
  const c = COPY[language as "en" | "id"];

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);
  const lang = language as "en" | "id";
  useSEO(PAGE_SEO.webgis[lang]);

  const sec1 = useInView();
  const sec2 = useInView();
  const sec3 = useInView();
  const sec4 = useInView();
  const sec5 = useInView();
  const sec6 = useInView();
  const sec7 = useInView();
  const sec8 = useInView();

  const fadeIn = (inV: boolean, delay = 0): React.CSSProperties => ({
    opacity: inV ? 1 : 0,
    transform: inV ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingTop: 70 }}>
      <style>{`
        .gd-fadein { opacity:0; transform:translateY(18px); transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1); }
        .gd-fadein.vis { opacity:1; transform:translateY(0); }
        .gd-wrap { max-width: 780px; margin: 0 auto; padding: 0 24px; }
        @media (max-width:600px){ .gd-wrap { padding: 0 16px; } }
        .gd-sec { padding: 64px 0; border-bottom: 1px solid ${BORDER}; }
        @media (max-width:600px){ .gd-sec { padding: 48px 0; } }
        .gd-2col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media (max-width:600px){ .gd-2col { grid-template-columns:1fr; } }
        .gd-card { padding:20px 22px; background:${SURFACE}; border:1px solid ${BORDER}; border-radius:12px; transition:box-shadow 0.18s; }
        .gd-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.07); }
        .gd-row-list > div { padding:18px 0; }
        .gd-row-list > div + div { border-top:1px solid ${BORDER}; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background: DARK1, position: "relative", overflow: "hidden", padding: "clamp(64px,10vw,100px) clamp(24px,6vw,80px) 0" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(245,193,24,0.04) 1px, transparent 1px)`, backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className={`gd-fadein${heroVisible ? " vis" : ""}`} style={{ transitionDelay: "0ms", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, background: AMBER, borderRadius: 2 }} />
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: AMBER }}>{c.heroBadge} · Searibu</span>
            </div>
          </div>
          <div className={`gd-fadein${heroVisible ? " vis" : ""}`} style={{ transitionDelay: "100ms" }}>
            <h1 style={{ fontFamily: FONT, fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 800, color: OFF_WHITE, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>{c.heroTitle}</h1>
          </div>
          <div className={`gd-fadein${heroVisible ? " vis" : ""}`} style={{ transitionDelay: "200ms", marginBottom: 40 }}>
            <p style={{ fontFamily: FONT, fontSize: "clamp(14px,1.6vw,16px)", lineHeight: 1.8, color: "rgba(245,240,232,0.60)", maxWidth: 560, margin: 0 }}>{c.heroDesc}</p>
          </div>
          <div className={`gd-fadein${heroVisible ? " vis" : ""}`} style={{ transitionDelay: "280ms", paddingBottom: 52 }}>
            <a href="/docs/Manual_Searibu.pdf" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 9, background: AMBER, color: DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "opacity 0.18s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Download size={13} /> {c.downloadBtn}
            </a>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to top, ${BG}, transparent)`, pointerEvents: "none" }} />
      </section>

      <div className="gd-wrap">

        {/* ── VIDEO ── */}
        <div className="gd-sec" ref={sec1.ref}>
          <div style={fadeIn(sec1.inView)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 16, background: AMBER, borderRadius: 2 }} />
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: TEXT3 }}>{c.videoLabel}</span>
            </div>
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 800, color: TEXT1, margin: "0 0 10px", letterSpacing: "-0.02em" }}>{c.videoTitle}</h2>
            <p style={{ fontFamily: FONT, fontSize: 14, color: TEXT3, lineHeight: 1.7, margin: "0 0 24px" }}>{c.videoDesc}</p>
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/l6PgpfRsVz4?si=ik3vAUshN2y9WPU5"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ display: "block" }}
              />
            </div>
          </div>
        </div>

        {/* ── QUICK START ── */}
        <div className="gd-sec" ref={sec2.ref}>
          <SectionHeader label={c.quickLabel} title={c.quickTitle} inView={sec2.inView} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28, ...fadeIn(sec2.inView, 100) }}>
            {c.steps.map((s: GuideStep, i: number) => <Step key={i} num={i + 1} title={s.title} body={s.body} />)}
          </div>
        </div>

        {/* ── MAP ── */}
        <div className="gd-sec" ref={sec3.ref}>
          <SectionHeader label={c.mapLabel} title={c.mapTitle} inView={sec3.inView} />
          <div className="gd-2col" style={fadeIn(sec3.inView, 100)}>
            {c.mapItems.map((item: GuideSection, i: number) => (
              <div key={i} className="gd-card">
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 8px" }}>{item.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: TEXT3, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHART ── */}
        <div className="gd-sec" ref={sec4.ref}>
          <SectionHeader label={c.chartLabel} title={c.chartTitle} inView={sec4.inView} />
          <div className="gd-2col" style={fadeIn(sec4.inView, 100)}>
            {c.chartItems.map((item: GuideSection, i: number) => (
              <div key={i} className="gd-card">
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 8px" }}>{item.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: TEXT3, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SAFETY ── */}
        <div className="gd-sec" ref={sec5.ref}>
          <SectionHeader label={c.safetyLabel} title={c.safetyTitle} inView={sec5.inView} />
          <div className="gd-row-list" style={fadeIn(sec5.inView, 100)}>
            {c.safetyItems.map((item: GuideSection, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "clamp(120px,28%,180px) 1fr", gap: 24 }}>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: 0, paddingTop: 1 }}>{item.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: TEXT3, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── DATE ── */}
        <div className="gd-sec" ref={sec6.ref}>
          <SectionHeader label={c.dateLabel} title={c.dateTitle} inView={sec6.inView} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28, ...fadeIn(sec6.inView, 100) }}>
            {c.dateItems.map((item: GuideStep, i: number) => <Step key={i} num={i + 1} title={item.title} body={item.body} />)}
          </div>
        </div>

        {/* ── S-104 ── */}
        <div className="gd-sec" ref={sec7.ref}>
          <SectionHeader label={c.s104Label} title={c.s104Title} inView={sec7.inView} />
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", ...fadeIn(sec7.inView, 100) }}>
            {c.s104Items.map((item: GuideSection, i: number) => (
              <div key={i} style={{ padding: "18px 22px", borderBottom: i < c.s104Items.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT1, margin: "0 0 7px" }}>{item.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: TEXT3, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ──
        <div className="gd-sec" ref={sec8.ref}>
          <SectionHeader label={c.faqLabel} title={c.faqTitle} inView={sec8.inView} />
          <div style={fadeIn(sec8.inView, 100)}>
            {c.faqs.map((f: GuideFaq, i: number) => <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
          </div>
        </div> */}

        {/* ── MANUAL CTA ── */}
        <div style={{ padding: "64px 0 80px" }}>
          <div style={{ background: DARK1, borderRadius: 16, padding: "clamp(32px,5vw,52px)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(245,193,24,0.04) 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, height: 16, background: AMBER, borderRadius: 2 }} />
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(245,193,24,0.75)" }}>{c.manualLabel}</span>
              </div>
              <h2 style={{ fontFamily: FONT, fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: OFF_WHITE, margin: "0 0 14px", letterSpacing: "-0.03em" }}>{c.manualTitle}</h2>
              <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.8, color: "rgba(245,240,232,0.55)", maxWidth: 520, margin: "0 0 28px" }}>{c.manualDesc}</p>
              <a href="/docs/Manual_Searibu.pdf" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 9, background: AMBER, color: DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "opacity 0.18s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <Download size={13} /> {c.manualBtn}
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};