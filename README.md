# Searibu — Frontend

**Kepulauan Seribu Marine Information System**

A WebGIS for marine tourism in Kepulauan Seribu, Jakarta: TPXO10-atlas-v2 tidal prediction, real-time marine weather forecasts, safety assessment for 11 marine activities, and IHO S-104 compliant data export.

Capstone Design Project — Geodesy and Geomatics Engineering, FITB, Institut Teknologi Bandung, 2026.

---

## Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router 7 |
| Map | Leaflet 1.9 + React-Leaflet 4 |
| Charts | Chart.js 4 |
| Authentication | Google OAuth (`@react-oauth/google`) |
| Weather | Open-Meteo (`openmeteo`) |
| Styling | Tailwind CSS 3 + inline styles |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Key Features

- **Interactive WebGIS** — Leaflet map with OSM/satellite basemaps, tourism island markers, the Luwes tidal station, and ports. Click anywhere within the service area to open the Marine Information panel.
- **Optional grid overlays** — TPXO10 Atlas, ECMWF IFS, and SMOC/MFWAM (GeoJSON).
- **Tidal prediction** — hourly chart from the TPXO10-atlas-v2 model (15 harmonic constituents), relative to MSL.
- **Real-time observations** — overlay of water-level data from the Luwes telemetry station, corrected to MSL via Transfer of Level (TOL = −1.944 m).
- **Activity safety check** — analyses wind, wave, and current for 11 marine activities using thresholds based on scientific literature.
- **IHO S-104 export** — download HDF5 files for prediction (TPXO) and observation (Luwes), available to Pro users.
- **Bilingual** — full EN/ID interface via `LanguageContext`.
- **Subscription system** — Free / Pro Monthly (Rp 39,000) / Pro Annual (Rp 139,000), with an admin panel for statistics and payment history.

---

## Project Structure

```
src/
├── App.tsx                      # Root: router + providers (Google OAuth, Language, Subscription)
├── main.tsx                     # Entry point
├── components/
│   ├── layout/Navbar.tsx        # Navbar, AuthModal, user dropdown, subscription badge
│   ├── pages/
│   │   ├── HomePage.tsx         # Hero, photo strip, activity safety check, features, standards
│   │   ├── WebGISPage.tsx       # Map + panel layout, basemap & grid toggles
│   │   ├── AboutPage.tsx        # Team, supervisors, mission
│   │   └── GuidePage.tsx        # Usage guide + FAQ
│   ├── webgis/
│   │   ├── MapContainer.tsx     # Leaflet map, markers, popups, search, geolocation
│   │   ├── InfoPanel.tsx        # Data panel: tidal chart, hourly table, S-104 export
│   │   └── BasemapToggle.tsx
│   ├── subscription/
│   │   ├── PricingModal.tsx     # Pricing + subscription status modal
│   │   ├── S104ExportSection.tsx
│   │   ├── LockedOverlay.tsx
│   │   └── SubscriptionStatusBadge.tsx
│   ├── profile/ProfileModal.tsx
│   └── admin/AdminPanel.tsx     # Stats & payment history (admin)
├── context/
│   ├── LanguageContext.tsx      # EN/ID language state
│   └── SubscriptionContext.tsx  # Subscription, role, admin, feature access state
├── hooks/
│   ├── useSEO.ts                # Dynamic title & meta per route
│   ├── useSubscription.ts
│   └── useMidtrans.ts           # (legacy — Snap.js)
├── types/index.ts
└── styles/index.css             # Design tokens + Leaflet overrides
```

---

## Design System

A consistent cream/light palette is used across the app:

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#f7f4ef` | Main background |
| Dark | `#2b2b2b` | Navbar, hero, footer |
| Amber | `#f5c518` | Brand accent |
| Blue deep | `#1a3bbf` | Primary action |
| Surface | `#ffffff` | Cards |
| Border | `#e4ddd4` | Edges |

Typography: **Inter** (all weights, with `display=swap`).

The WebGIS uses a dark nautical theme (`#0f1824`) for modals/panels, while other pages use light mode.

---

## Running Locally

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Run the dev server (default: http://localhost:5173)
npm run dev
```

### Environment Variables

Create a `.env` file at the root:

```env
VITE_API_URL=http://localhost:5000
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx   # optional (legacy)
VITE_MIDTRANS_ENV=sandbox                       # optional (legacy)
```

For production (`.env.production`):

```env
VITE_API_URL=https://tpxo-luwes-api-production.up.railway.app
```

> **Note:** The Google Client ID is hard-coded in `App.tsx`. Adjust it if you use a different OAuth project.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check (`tsc`) + production build (`vite build`) → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (TS/TSX) |

---

## Deployment (Vercel)

Configured via `vercel.json`:

- **Build:** `npm run build` → output `dist/`
- **SPA rewrite:** all routes → `/index.html`
- **Security headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (geolocation: self)
- **Cache:** hashed assets served with `max-age=31536000, immutable`

Set `VITE_API_URL` in the Vercel environment variables so it points to the Railway backend.

---

## Backend Integration

The frontend calls the following API endpoints (see the backend repo for details):

| Endpoint | Used by |
|----------|---------|
| `GET /api/tide/prediction` | `InfoPanel` (tidal chart) |
| `GET /api/luwes/overlay` | `InfoPanel` (Luwes observations) |
| `POST /api/auth/{register,login,google}` | `Navbar` (AuthModal) |
| `GET /api/subscription` · `GET /api/profile` | `SubscriptionContext` |
| `PUT /api/profile/role` | `ProfileModal` |
| `POST /api/create-payment` | `PricingModal` |
| `GET /api/s104/export` · `GET /api/s104/export/luwes` | `S104ExportSection` |
| `GET /api/admin/stats` · `GET /api/admin/payments` | `AdminPanel` |

Weather and marine data are fetched directly from Open-Meteo (`api.open-meteo.com`, `marine-api.open-meteo.com`).

The service area is bounded to **lon 106°–107° E, lat 5°–6.3° S**.

---

## Team

| Name | NIM |
|------|-----|
| Ichsan Fachri Siroj | 15122092 | 
| Revalia Aura Cahaya Prasetyo | 15122003 | 
| Muhammad Syahrul Tasyrifan | 15122009 | 
| Evin Petra Pebrina Debataraja | 15122035 | 

**Supervisors:** Prof. Dr.rer.nat. Poerbandono, S.T., M.M. · Dr. Akhmad Riqqi, M.Si. · Dr. Madam Taqiyya, S.Si., M.Sc.

---

## License

Capstone Design Project — FITB, Institut Teknologi Bandung, 2026.
CC BY-NC 4.0.
