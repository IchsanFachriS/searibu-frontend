# Searibu — Frontend

**Sistem Informasi Kelautan Kepulauan Seribu**

WebGIS untuk wisata bahari di Kepulauan Seribu, Jakarta: prediksi pasang surut berbasis TPXO10-atlas-v2, prakiraan cuaca laut real-time, penilaian keamanan 11 aktivitas bahari, dan ekspor data berstandar IHO S-104.

Proyek Capstone Design — Teknik Geodesi dan Geomatika, FITB, Institut Teknologi Bandung, 2026.

---

## Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router 7 |
| Peta | Leaflet 1.9 + React-Leaflet 4 |
| Grafik | Chart.js 4 |
| Autentikasi | Google OAuth (`@react-oauth/google`) |
| Cuaca | Open-Meteo (`openmeteo`) |
| Styling | Tailwind CSS 3 + inline styles |
| Ikon | lucide-react |
| Deploy | Vercel |

---

## Fitur Utama

- **WebGIS interaktif** — peta Leaflet dengan basemap OSM/satelit, marker pulau wisata, stasiun pasut Luwes, dan pelabuhan. Klik titik mana saja dalam area layanan untuk membuka panel Informasi Kelautan.
- **Overlay grid opsional** — TPXO10 Atlas, ECMWF IFS, dan SMOC/MFWAM (GeoJSON).
- **Prediksi pasut** — grafik per jam dari model TPXO10-atlas-v2 (15 konstituen harmonik), relatif terhadap MSL.
- **Observasi real-time** — overlay data muka air dari stasiun telemetri Luwes, dikoreksi ke MSL via Transfer of Level (TOL = −1,944 m).
- **Cek keamanan aktivitas** — analisis angin, gelombang, dan arus untuk 11 aktivitas bahari dengan ambang batas berbasis literatur ilmiah.
- **Ekspor IHO S-104** — unduh file HDF5 prediksi (TPXO) dan observasi (Luwes), tersedia untuk pengguna Pro.
- **Bilingual** — antarmuka penuh EN/ID melalui `LanguageContext`.
- **Sistem langganan** — Free / Pro Monthly (Rp 39.000) / Pro Annual (Rp 139.000), dengan panel admin untuk statistik dan riwayat pembayaran.

---

## Struktur Proyek

```
src/
├── App.tsx                      # Root: router + provider (Google OAuth, Language, Subscription)
├── main.tsx                     # Entry point
├── components/
│   ├── layout/Navbar.tsx        # Navbar, AuthModal, dropdown user, badge langganan
│   ├── pages/
│   │   ├── HomePage.tsx         # Hero, photo strip, cek keamanan aktivitas, fitur, standar
│   │   ├── WebGISPage.tsx       # Layout peta + panel, toggle basemap & grid
│   │   ├── AboutPage.tsx        # Tim, dosen pembimbing, misi
│   │   └── GuidePage.tsx        # Panduan penggunaan + FAQ
│   ├── webgis/
│   │   ├── MapContainer.tsx     # Peta Leaflet, marker, popup, search, geolokasi
│   │   ├── InfoPanel.tsx        # Panel data: grafik pasut, tabel per jam, ekspor S-104
│   │   └── BasemapToggle.tsx
│   ├── subscription/
│   │   ├── PricingModal.tsx     # Modal harga + status langganan
│   │   ├── S104ExportSection.tsx
│   │   ├── LockedOverlay.tsx
│   │   └── SubscriptionStatusBadge.tsx
│   ├── profile/ProfileModal.tsx
│   └── admin/AdminPanel.tsx     # Statistik & riwayat pembayaran (admin)
├── context/
│   ├── LanguageContext.tsx      # State bahasa EN/ID
│   └── SubscriptionContext.tsx  # State langganan, role, admin, akses fitur
├── hooks/
│   ├── useSEO.ts                # Title & meta dinamis per route
│   ├── useSubscription.ts
│   └── useMidtrans.ts           # (legacy — Snap.js)
├── types/index.ts
└── styles/index.css             # Design tokens + override Leaflet
```

---

## Design System

Palet warna (cream/light) konsisten di seluruh aplikasi:

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| Background | `#f7f4ef` | Latar utama |
| Dark | `#2b2b2b` | Navbar, hero, footer |
| Amber | `#f5c518` | Aksen brand |
| Blue deep | `#1a3bbf` | Aksi primer |
| Surface | `#ffffff` | Kartu |
| Border | `#e4ddd4` | Garis tepi |

Tipografi: **Inter** (semua weight, dengan `display=swap`).

WebGIS menggunakan tema dark nautical (`#0f1824`) untuk modal/panel, sementara halaman lain memakai light mode.

---

## Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Jalankan dev server (default: http://localhost:5173)
npm run dev
```

### Environment Variables

Buat file `.env` di root:

```env
VITE_API_URL=http://localhost:5000
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx   # opsional (legacy)
VITE_MIDTRANS_ENV=sandbox                       # opsional (legacy)
```

Untuk produksi (`.env.production`):

```env
VITE_API_URL=https://tpxo-luwes-api-production.up.railway.app
```

> **Catatan:** Google Client ID di-hardcode di `App.tsx`. Sesuaikan jika menggunakan project OAuth berbeda.

---

## Skrip

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server dengan HMR |
| `npm run build` | Type-check (`tsc`) + build produksi (`vite build`) → `dist/` |
| `npm run preview` | Preview hasil build |
| `npm run lint` | ESLint (TS/TSX) |

---

## Deployment (Vercel)

Konfigurasi via `vercel.json`:

- **Build:** `npm run build` → output `dist/`
- **SPA rewrite:** semua route → `/index.html`
- **Security headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (geolokasi: self)
- **Cache:** aset di-hash dengan `max-age=31536000, immutable`

Set `VITE_API_URL` di environment variables Vercel agar mengarah ke backend Railway.

---

## Integrasi Backend

Frontend memanggil API berikut (lihat repo backend untuk detail):

| Endpoint | Digunakan oleh |
|----------|----------------|
| `GET /api/tide/prediction` | `InfoPanel` (grafik pasut) |
| `GET /api/luwes/overlay` | `InfoPanel` (observasi Luwes) |
| `POST /api/auth/{register,login,google}` | `Navbar` (AuthModal) |
| `GET /api/subscription` · `GET /api/profile` | `SubscriptionContext` |
| `PUT /api/profile/role` | `ProfileModal` |
| `POST /api/create-payment` | `PricingModal` |
| `GET /api/s104/export` · `GET /api/s104/export/luwes` | `S104ExportSection` |
| `GET /api/admin/stats` · `GET /api/admin/payments` | `AdminPanel` |

Data cuaca & kelautan diambil langsung dari Open-Meteo (`api.open-meteo.com`, `marine-api.open-meteo.com`).

Area layanan dibatasi pada **lon 106°–107° BT, lat 5°–6,3° LS**.

---

## Tim

| Nama | NIM | Peran |
|------|-----|-------|
| Ichsan Fachri Siroj | 15122092 | Full-stack & Lead |
| Revalia Aura Cahaya Prasetyo | 15122003 | Frontend Developer |
| Muhammad Syahrul Tasyrifan | 15122009 | Backend Developer |
| Evin Petra Pebrina Debataraja | 15122035 | GIS & Data |

**Dosen Pembimbing:** Prof. Dr.rer.nat. Poerbandono, S.T., M.M. · Dr. Akhmad Riqqi, M.Si. · Dr. Madam Taqiyya, S.Si., M.Sc.

---

## Lisensi

Capstone Design Project — FITB, Institut Teknologi Bandung, 2026.
CC BY-NC 4.0.
