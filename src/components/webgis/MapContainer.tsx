/**
 * MapContainer.tsx  —  Peta WebGIS Kepulauan Seribu
 *
 * Font changes: all monospace removed, all text uses Inter/DM Sans sans-serif.
 * Small popup and tooltip font sizes bumped for readability.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, X, MapPin, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type BasemapType = 'osm' | 'satellite';

interface MapContainerProps {
  basemap: BasemapType;
  onGridClick?: (coordinates: { lat: number; lon: number }) => void;
}

interface Island {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  adminZone: string;
  descId: string;
  descEn: string;
  facilities: string[];
  accessFrom: string;
  travelTimeMin: number;
}

// ─── Font constant ─────────────────────────────────────────────────────────
const SANS = '"Inter", "DM Sans", system-ui, sans-serif';

// ─── Island Data ─────────────────────────────────────────────────────────────

const ISLANDS: Island[] = [
  {
    id: 'bidadari', name: 'Pulau Bidadari', nameEn: 'Bidadari Island',
    lat: -6.035347, lon: 106.746234,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau resort terdekat dari Jakarta, dilengkapi cottage, kolam renang, dan situs benteng VOC abad ke-17.',
    descEn: 'Closest resort island to Jakarta with cottages, pools, and a 17th-century VOC fortress ruin.',
    facilities: ['Cottage', 'Restoran', 'Snorkeling', 'Diving', 'Benteng Martello'],
    accessFrom: 'Marina Ancol', travelTimeMin: 30,
  },
  {
    id: 'tidung', name: 'Pulau Tidung', nameEn: 'Tidung Island',
    lat: -5.797360, lon: 106.497220,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau terpopuler dengan Jembatan Cinta ikonik, cocok untuk bersepeda dan snorkeling di perairan jernih.',
    descEn: 'Most popular island featuring the iconic Love Bridge, ideal for cycling and snorkeling.',
    facilities: ['Jembatan Cinta', 'Sewa Sepeda', 'Snorkeling', 'Penginapan', 'Restoran'],
    accessFrom: 'Muara Angke', travelTimeMin: 120,
  },
  {
    id: 'pari', name: 'Pulau Pari', nameEn: 'Pari Island',
    lat: -5.857626, lon: 106.617560,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Terkenal dengan hamparan bintang laut dan padang lamun. Pusat penelitian kelautan LIPI berada di sini.',
    descEn: 'Famous for starfish and seagrass beds. Home to a LIPI marine research station.',
    facilities: ['Snorkeling', 'Bintang Laut', 'Padang Lamun', 'Penelitian LIPI', 'Penginapan'],
    accessFrom: 'Muara Angke', travelTimeMin: 90,
  },
  {
    id: 'kelapa', name: 'Pulau Kelapa', nameEn: 'Kelapa Island',
    lat: -5.653659, lon: 106.569023,
    adminZone: 'Kepulauan Seribu Utara',
    descId: 'Pulau dengan fasilitas lengkap dan akses ke beberapa spot snorkeling dan diving terbaik di kawasan utara.',
    descEn: 'Well-equipped island with access to top snorkeling and diving spots in the northern area.',
    facilities: ['Diving', 'Snorkeling', 'Cottage', 'Restoran', 'Speedboat Charter'],
    accessFrom: 'Muara Angke', travelTimeMin: 150,
  },
  {
    id: 'pramuka', name: 'Pulau Pramuka', nameEn: 'Pramuka Island',
    lat: -5.745159, lon: 106.613782,
    adminZone: 'Kepulauan Seribu Utara',
    descId: 'Pulau resort eksklusif dengan fasilitas bintang empat, lapangan tenis, dan dermaga pribadi.',
    descEn: 'Exclusive resort island with four-star facilities, tennis courts, and a private pier.',
    facilities: ['Resort Bintang 4', 'Kolam Renang', 'Tennis', 'Diving', 'Spa'],
    accessFrom: 'Marina Ancol', travelTimeMin: 75,
  },
  {
    id: 'untung_jawa', name: 'Pulau Untung Jawa', nameEn: 'Untung Jawa Island',
    lat: -5.977321, lon: 106.705921,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau terdekat dari Muara Angke, populer untuk wisata sehari dengan pantai berpasir putih.',
    descEn: 'Closest island to Muara Angke, popular for day trips with white sand beaches.',
    facilities: ['Pantai Berpasir', 'Warung Makan', 'Banana Boat', 'Snorkeling'],
    accessFrom: 'Muara Angke', travelTimeMin: 45,
  },
  {
    id: 'kotok', name: 'Pulau Kotok', nameEn: 'Kotok Island',
    lat: -5.700621, lon: 106.538661,
    adminZone: 'Kepulauan Seribu Utara',
    descId: 'Kawasan konservasi penyu dengan spot diving kelas dunia dan terumbu karang yang masih terjaga.',
    descEn: 'Sea turtle conservation area with world-class diving spots and well-preserved coral reefs.',
    facilities: ['Konservasi Penyu', 'Diving', 'Snorkeling', 'Resort Ekologi'],
    accessFrom: 'Marina Ancol', travelTimeMin: 90,
  },
  {
    id: 'putri', name: 'Pulau Putri', nameEn: 'Putri Island',
    lat: -5.593901, lon: 106.560171,
    adminZone: 'Kepulauan Seribu Utara',
    descId: 'Pulau resort premium dengan underwater observatory, cocok untuk pasangan dan keluarga.',
    descEn: 'Premium resort island with an underwater observatory, ideal for couples and families.',
    facilities: ['Underwater Observatory', 'Resort Premium', 'Snorkeling', 'Glass Bottom Boat'],
    accessFrom: 'Marina Ancol', travelTimeMin: 60,
  },
  {
    id: 'ayer', name: 'Pulau Ayer', nameEn: 'Ayer Island',
    lat: -5.763737, lon: 106.583138,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau resort bergaya vintage dengan bungalow terapung ikonik di atas air.',
    descEn: 'Vintage-style resort island featuring iconic overwater bungalows.',
    facilities: ['Bungalow Terapung', 'Restoran Seafood', 'Snorkeling', 'Kayak'],
    accessFrom: 'Marina Ancol', travelTimeMin: 25,
  },
  {
    id: 'rambut', name: 'Pulau Rambut', nameEn: 'Rambut Island',
    lat: -5.975101, lon: 106.692101,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Suaka margasatwa untuk koloni burung laut dan habitat mangrove yang dilindungi.',
    descEn: 'Wildlife sanctuary for seabird colonies and protected mangrove habitat.',
    facilities: ['Birdwatching', 'Mangrove', 'Suaka Burung'],
    accessFrom: 'Muara Angke', travelTimeMin: 60,
  },
  {
    id: 'lancang', name: 'Pulau Lancang', nameEn: 'Lancang Island',
    lat: -5.929764, lon: 106.586512,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau nelayan tradisional dengan potensi memancing yang baik dan pantai yang tenang.',
    descEn: 'Traditional fishing island with good angling potential and calm beaches.',
    facilities: ['Memancing', 'Snorkeling', 'Penginapan Sederhana'],
    accessFrom: 'Muara Angke', travelTimeMin: 75,
  },
  {
    id: 'bokor', name: 'Pulau Bokor', nameEn: 'Bokor Island',
    lat: -5.978006, lon: 106.706506,
    adminZone: 'Kepulauan Seribu Selatan',
    descId: 'Pulau kecil tak berpenghuni dengan pantai pasir putih yang tenang, ideal untuk piknik.',
    descEn: 'Small uninhabited island with calm white sand beach, ideal for a picnic.',
    facilities: ['Pantai Sepi', 'Snorkeling', 'Piknik'],
    accessFrom: 'Marina Ancol', travelTimeMin: 40,
  },
];

const PORT_LOCATIONS = [
  {
    id: 'marina_ancol', name: 'Marina Ancol',
    lat: -6.122, lon: 106.833,
    descId: 'Pelabuhan utama untuk kapal cepat ke pulau-pulau resort',
    descEn: 'Main port for speedboats to resort islands',
  },
  {
    id: 'muara_angke', name: 'Muara Angke',
    lat: -6.108, lon: 106.740,
    descId: 'Pelabuhan kapal tradisional, lebih ekonomis',
    descEn: 'Traditional ferry port, more economical option',
  },
];

// ─── Luwes Tidal Station ─────────────────────────────────────────────────────
const LUWES_STATION = {
  id: 'luwes_tidal',
  name: 'Sta. Pasut Luwes',
  nameEn: 'Luwes Tidal Station',
  lat: -5.7439,
  lon: 106.6128,
  descId: 'Stasiun pengamatan pasut otomatis Luwes milik Pushidrosal. Data observasi digunakan sebagai koreksi terhadap prediksi TPXO dalam sistem Searibu.',
  descEn: 'Luwes automatic tide gauge station operated by Pushidrosal. Observation data is used as correction against TPXO prediction in the Searibu system.',
};

function createLuwesIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 28 34">
      <polygon points="14,2 26,10 26,24 14,32 2,24 2,10"
        fill="#ef4444" stroke="#fff" stroke-width="2"
        style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
      <text x="14" y="19" text-anchor="middle" fill="#fff"
        font-family="sans-serif" font-size="9" font-weight="700">T</text>
    </svg>
  `.trim();
  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [28, 34],
    iconAnchor: [14, 34],
    popupAnchor:[0, -34],
  });
}

// ─── Island color ────────────────────────────────────────────────────────────
const ISLAND_COLOR = '#0284c7';

// ─── SVG Marker Factories ────────────────────────────────────────────────────

function createIslandIcon(color: string, highlighted = false): L.DivIcon {
  const size   = highlighted ? 34 : 28;
  const border = highlighted ? 3 : 2;
  const shadow = highlighted
    ? `drop-shadow(0 0 6px ${color}99)`
    : `drop-shadow(0 2px 4px rgba(0,0,0,0.35))`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <filter id="sh">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - border}"
        fill="${color}" stroke="#fff" stroke-width="${border}" filter="url(#sh)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - border - 4}"
        fill="#fff" fill-opacity="0.25"/>
      <line x1="${size / 2}" y1="${size - border}" x2="${size / 2}" y2="${size + 6}"
        stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `.trim();

  return L.divIcon({
    html: `<div style="filter:${shadow}">${svg}</div>`,
    className: '',
    iconSize:   [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor:[0, -(size + 8)],
  });
}

function createPortIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32">
      <polygon points="13,2 24,10 20,26 6,26 2,10"
        fill="#374151" stroke="#fff" stroke-width="2"
        style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
      <text x="13" y="18" text-anchor="middle" fill="#fff"
        font-family="sans-serif" font-size="10" font-weight="700">P</text>
    </svg>
  `.trim();

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [26, 32],
    iconAnchor: [13, 32],
    popupAnchor:[0, -32],
  });
}

// ─── Haversine ───────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a   =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Island Search Dropdown ───────────────────────────────────────────────────

interface IslandSearchProps {
  language: string;
  onSelect: (island: Island) => void;
}

const IslandSearch: React.FC<IslandSearchProps> = ({ language, onSelect }) => {
  const [query,   setQuery]   = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length >= 1
    ? ISLANDS.filter(isl => {
        const q = query.toLowerCase();
        return isl.name.toLowerCase().includes(q) || isl.nameEn.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  const showDropdown = focused && results.length > 0;

  const handleSelect = (island: Island) => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    onSelect(island);
  };

  const placeholder = language === 'id'
    ? 'Cari pulau atau kategori...'
    : 'Search island or category...';

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.97)',
        border: focused ? '1.5px solid #0284c7' : '1.5px solid rgba(0,0,0,0.12)',
        borderRadius: 10, padding: '9px 14px',
        boxShadow: focused
          ? '0 0 0 3px rgba(2,132,199,0.12), 0 4px 20px rgba(0,0,0,0.12)'
          : '0 4px 20px rgba(0,0,0,0.10)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(12px)',
        minWidth: 260,
      }}>
        <Search size={14} style={{ color: focused ? '#0284c7' : '#94a3b8', flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, fontWeight: 500, color: '#0f172a', width: '100%',
            fontFamily: SANS,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '1px solid rgba(0,0,0,0.08)',
          zIndex: 2000,
        }}>
          {results.map((isl, idx) => {
            return (
              <button
                key={isl.id}
                onMouseDown={() => handleSelect(isl)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: idx < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: ISLAND_COLOR, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isl.name}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 12, color: '#94a3b8' }}>
                    {isl.travelTimeMin} {language === 'id' ? 'menit' : 'min'} &middot; {isl.accessFrom}
                  </p>
                </div>
                <MapPin size={12} style={{ color: '#cbd5e1', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Map Legend (simplified) ──────────────────────────────────────────────────

const LegendPanel: React.FC<{ language: string }> = ({ language }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
      borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', minWidth: 148,
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid #f1f5f9',
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>
          {language === 'id' ? 'Legenda' : 'Legend'}
        </span>
        {collapsed ? <ChevronDown size={13} style={{ color: '#94a3b8' }} /> : <ChevronUp size={13} style={{ color: '#94a3b8' }} />}
      </button>
      {!collapsed && (
        <div style={{ padding: '6px 0' }}>
          {[
            { color: ISLAND_COLOR, shape: 'circle', label: language === 'id' ? 'Pulau Wisata' : 'Tourism Island' },
            { color: '#374151',    shape: 'square', label: language === 'id' ? 'Pelabuhan' : 'Port' },
            { color: '#ef4444',    shape: 'diamond', label: language === 'id' ? 'Sta. Pasut Luwes' : 'Luwes Tide Station' },
          ].map(({ color, shape, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
              {shape === 'circle'  && <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />}
              {shape === 'square'  && <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />}
              {shape === 'diamond' && (
                <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                  <polygon points="6,1 11,6 6,11 1,6" fill={color} />
                </svg>
              )}
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
            </div>
          ))}
          <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(59,130,246,0.25)', border: '1.5px solid #3b82f6', flexShrink: 0 }} />
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: '#374151' }}>
              {language === 'id' ? 'Grid Pasut TPXO' : 'TPXO Tide Grid'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Nearest Islands Card ─────────────────────────────────────────────────────

interface NearestCardProps {
  clickedLat: number;
  clickedLon: number;
  language: string;
  onIslandClick: (island: Island) => void;
  onDismiss: () => void;
}

const NearestIslandsCard: React.FC<NearestCardProps> = ({
  clickedLat, clickedLon, language, onIslandClick, onDismiss,
}) => {
  const nearest = [...ISLANDS]
    .map(isl => ({ ...isl, distKm: haversineKm(clickedLat, clickedLon, isl.lat, isl.lon) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 3);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
      border: '1px solid rgba(0,0,0,0.08)',
      overflow: 'hidden',
      minWidth: 230,
      maxWidth: 260,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', borderBottom: '1px solid #f1f5f9',
      }}>
        <span style={{
          fontFamily: SANS,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: '#64748b',
        }}>
          {language === 'id' ? 'Pulau Terdekat' : 'Nearest Islands'}
        </span>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ padding: '4px 0' }}>
        {nearest.map((isl, idx) => {
          return (
            <button
              key={isl.id}
              onClick={() => onIslandClick(isl)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: idx < nearest.length - 1 ? '1px solid #f8fafc' : 'none',
                textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ISLAND_COLOR, flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                  {isl.name}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 12, color: '#94a3b8' }}>
                  {isl.distKm.toFixed(1)} km &middot; {isl.travelTimeMin} {language === 'id' ? 'mnt' : 'min'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
        <p style={{ fontFamily: SANS, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
          {language === 'id'
            ? 'Klik nama pulau untuk melihat detail, atau klik grid untuk data pasut.'
            : 'Click an island name for details, or the grid for tide data.'}
        </p>
      </div>
    </div>
  );
};

// ─── Grid Tooltip Banner ─────────────────────────────────────────────────────

interface GridTooltipProps { language: string; }

const GridTooltipBanner: React.FC<GridTooltipProps> = ({ language }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: 'rgba(2,132,199,0.08)',
      border: '1px solid rgba(2,132,199,0.22)',
      borderRadius: 9, padding: '9px 12px',
      backdropFilter: 'blur(12px)',
      maxWidth: 300,
    }}>
      <Info size={14} style={{ color: '#0284c7', flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontFamily: SANS, fontSize: 12, color: '#0369a1', lineHeight: 1.5, flex: 1 }}>
        {language === 'id'
          ? 'Klik kotak grid biru untuk melihat prediksi pasang surut dan cuaca di lokasi tersebut.'
          : 'Click a blue grid cell to view tide predictions and weather at that location.'}
      </p>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 0, display: 'flex' }}>
        <X size={12} />
      </button>
    </div>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

export const MapContainer: React.FC<MapContainerProps> = ({ basemap, onGridClick }) => {
  const { language }         = useLanguage();
  const mapRef               = useRef<L.Map | null>(null);
  const mapContainerRef      = useRef<HTMLDivElement>(null);
  const tileLayerRef         = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef      = useRef<L.GeoJSON | null>(null);
  const islandMarkersRef     = useRef<L.Marker[]>([]);
  const portMarkersRef       = useRef<L.Marker[]>([]);
  const luwesMarkerRef       = useRef<L.Marker | null>(null);

  const [geojsonData,     setGeojsonData]     = useState<any>(null);

  const [nearestCardPos,  setNearestCardPos]  = useState<{ lat: number; lon: number } | null>(null);
  const [showNearestCard, setShowNearestCard] = useState(false);

  const basemaps = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
    },
  };

  // ── Build island popup HTML ─────────────────────────────────────────────
  const buildIslandPopup = useCallback((island: Island): string => {
    const color    = ISLAND_COLOR;
    const title    = language === 'id' ? island.name : island.nameEn;
    const desc     = language === 'id' ? island.descId : island.descEn;
    const fromLabel = language === 'id' ? 'Dari' : 'From';
    const timeLabel = language === 'id' ? 'menit' : 'min';
    const facLabel  = language === 'id' ? 'Fasilitas' : 'Facilities';

    const facilityPills = island.facilities
      .map(f => `<span style="
        display:inline-block; padding:3px 9px; border-radius:99px;
        background:${color}18; color:${color};
        font-size:11px; font-weight:600; margin:2px 3px 2px 0;
        font-family:${SANS};
        border:1px solid ${color}33;
      ">${f}</span>`)
      .join('');

    return `
      <div style="font-family:${SANS}; min-width:220px; max-width:260px; padding:0; overflow:hidden;">
        <div style="background:${color}; padding:11px 14px 9px;">
          <p style="font-size:16px; font-weight:700; color:#fff; line-height:1.2; margin:0;">${title}</p>
          <p style="font-size:11px; color:rgba(255,255,255,0.75); margin:3px 0 0;">${island.adminZone}</p>
        </div>

        <div style="padding:11px 14px">
          <p style="font-size:13px; color:#475569; line-height:1.6; margin:0 0 10px;">${desc}</p>

          <div style="
            display:flex; align-items:center; gap:12px;
            padding:8px 10px; border-radius:8px;
            background:#f8fafc; margin-bottom:11px;
          ">
            <div>
              <p style="font-size:10px; color:#94a3b8; margin:0 0 1px; text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">${fromLabel}</p>
              <p style="font-size:13px; color:#0f172a; margin:0; font-weight:600;">${island.accessFrom}</p>
            </div>
            <div style="width:1px; height:28px; background:#e2e8f0;"></div>
            <div>
              <p style="font-size:10px; color:#94a3b8; margin:0 0 1px; text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">${timeLabel}</p>
              <p style="font-size:13px; color:#0f172a; margin:0; font-weight:600;">${island.travelTimeMin}</p>
            </div>
          </div>

          <p style="font-size:10px; color:#94a3b8; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; margin:0 0 6px;">${facLabel}</p>
          <div>${facilityPills}</div>
        </div>
      </div>
    `;
  }, [language]);

  // ── Build port popup HTML ────────────────────────────────────────────────
  const buildPortPopup = useCallback((port: typeof PORT_LOCATIONS[0]): string => {
    const desc = language === 'id' ? port.descId : port.descEn;
    const connecting = ISLANDS
      .filter(isl => isl.accessFrom === port.name)
      .map(isl => `<span style="
        font-family:${SANS}; font-size:12px; color:#374151; font-weight:500;
        display:block; padding:4px 0;
        border-bottom:1px solid #f1f5f9;
      ">${isl.name} &mdash; ${isl.travelTimeMin} ${language === 'id' ? 'mnt' : 'min'}</span>`)
      .join('');

    return `
      <div style="font-family:${SANS}; min-width:200px;">
        <div style="background:#1e293b; padding:10px 13px 8px;">
          <p style="font-size:10px; color:rgba(255,255,255,0.55); text-transform:uppercase; letter-spacing:0.04em; font-weight:700; margin:0 0 3px;">
            ${language === 'id' ? 'Pelabuhan' : 'Port'}
          </p>
          <p style="font-size:15px; font-weight:700; color:#fff; margin:0;">${port.name}</p>
        </div>
        <div style="padding:10px 13px">
          <p style="font-size:12px; color:#475569; margin:0 0 9px; line-height:1.5;">${desc}</p>
          <p style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin:0 0 5px;">
            ${language === 'id' ? 'Rute tersedia' : 'Available routes'}
          </p>
          ${connecting}
        </div>
      </div>
    `;
  }, [language]);

  // ── Build Luwes popup HTML ────────────────────────────────────────────────
  const buildLuwesPopup = useCallback((): string => {
    const title = language === 'id' ? LUWES_STATION.name : LUWES_STATION.nameEn;
    const desc  = language === 'id' ? LUWES_STATION.descId : LUWES_STATION.descEn;
    return `
      <div style="font-family:${SANS}; min-width:220px; max-width:260px; padding:0; overflow:hidden;">
        <div style="background:#ef4444; padding:11px 14px 9px;">
          <div style="
            display:inline-block; padding:3px 9px; border-radius:99px;
            background:rgba(255,255,255,0.2);
            font-size:10px; font-weight:700; letter-spacing:0.04em;
            text-transform:uppercase; color:#fff; margin-bottom:5px;
          ">${language === 'id' ? 'Stasiun Pasut' : 'Tide Station'}</div>
          <p style="font-size:15px; font-weight:700; color:#fff; line-height:1.2; margin:0;">${title}</p>
          <p style="font-size:11px; color:rgba(255,255,255,0.75); margin:3px 0 0;">
            ${LUWES_STATION.lat.toFixed(4)}°S &ensp; ${LUWES_STATION.lon.toFixed(4)}°E
          </p>
        </div>
        <div style="padding:11px 14px">
          <p style="font-size:12px; color:#475569; line-height:1.6; margin:0;">${desc}</p>
        </div>
      </div>
    `;
  }, [language]);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-5.6167, 106.5833],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    const tile = L.tileLayer(basemaps[basemap].url, {
      attribution: basemaps[basemap].attribution,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current    = map;
    tileLayerRef.current = tile;
    map.zoomControl.setPosition('topright');
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Basemap swap ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(basemaps[basemap].url, {
      attribution: basemaps[basemap].attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [basemap]);

  // ── Load GeoJSON ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/GRID_TPXO_SERIBU.geojson')
      .then(r => r.json())
      .then(setGeojsonData)
      .catch(err => console.error('Error loading GeoJSON:', err));
  }, []);

  // ── Add island markers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    islandMarkersRef.current.forEach(m => m.remove());
    islandMarkersRef.current = [];

    ISLANDS.forEach(island => {
      const icon   = createIslandIcon(ISLAND_COLOR);
      const marker = L.marker([island.lat, island.lon], { icon, zIndexOffset: 500 });

      marker.bindPopup(buildIslandPopup(island), {
        maxWidth: 280, minWidth: 240, className: 'island-popup',
      });

      marker.bindTooltip(island.name, {
        permanent: false, direction: 'top', offset: [0, -8],
        className: 'island-label-tooltip',
        opacity: 1,
      });

      marker.addTo(mapRef.current!);
      islandMarkersRef.current.push(marker);
    });
  }, [buildIslandPopup]);

  // ── Add port markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    portMarkersRef.current.forEach(m => m.remove());
    portMarkersRef.current = [];

    PORT_LOCATIONS.forEach(port => {
      const icon   = createPortIcon();
      const marker = L.marker([port.lat, port.lon], { icon, zIndexOffset: 600 });
      marker.bindPopup(buildPortPopup(port), { maxWidth: 260, minWidth: 220, className: 'island-popup' });
      marker.bindTooltip(port.name, { permanent: false, direction: 'top', offset: [0, -8], opacity: 1, className: 'island-label-tooltip' });
      marker.addTo(mapRef.current!);
      portMarkersRef.current.push(marker);
    });
  }, [buildPortPopup]);

  // ── Add Luwes tidal station marker ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (luwesMarkerRef.current) luwesMarkerRef.current.remove();

    const icon   = createLuwesIcon();
    const marker = L.marker([LUWES_STATION.lat, LUWES_STATION.lon], { icon, zIndexOffset: 700 });
    marker.bindPopup(buildLuwesPopup(), { maxWidth: 270, minWidth: 230, className: 'island-popup' });
    marker.bindTooltip(language === 'id' ? LUWES_STATION.name : LUWES_STATION.nameEn, {
      permanent: false, direction: 'top', offset: [0, -10], opacity: 1, className: 'island-label-tooltip',
    });
    marker.addTo(mapRef.current!);
    luwesMarkerRef.current = marker;
  }, [buildLuwesPopup, language]);

  // ── GeoJSON TPXO grid ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !geojsonData) return;
    if (geoJsonLayerRef.current) geoJsonLayerRef.current.remove();

    const geoJsonLayer = L.geoJSON(geojsonData, {
      style: {
        color: '#3b82f6', weight: 1.5, opacity: 0.7,
        fillColor: '#3b82f6', fillOpacity: 0.12,
      },
      onEachFeature: (_feature, layer) => {
        layer.bindTooltip(
          `<div style="
            font-family:${SANS};
            font-size:12px; color:#0369a1; font-weight:500;
            padding:2px 4px;
          ">
            ${language === 'id'
              ? 'Klik untuk data pasut &amp; cuaca'
              : 'Click for tide &amp; weather data'}
          </div>`,
          { sticky: true, opacity: 1, className: 'grid-tooltip' }
        );

        layer.on('click', () => {
          const center = (layer as any).getBounds().getCenter();
          if (onGridClick) onGridClick({ lat: center.lat, lon: center.lng });
          setNearestCardPos({ lat: center.lat, lon: center.lng });
          setShowNearestCard(true);
          geoJsonLayer.eachLayer((l: any) => {
            (l as L.Path).setStyle({ color: '#3b82f6', weight: 1.5, fillOpacity: 0.12 });
          });
          (layer as L.Path).setStyle({ color: '#ef4444', weight: 2.5, fillOpacity: 0.35 });
        });

        layer.on('mouseover', () => {
          if ((layer as L.Path).options.fillOpacity !== 0.35)
            (layer as L.Path).setStyle({ fillOpacity: 0.28, weight: 2 });
        });
        layer.on('mouseout', () => {
          if ((layer as L.Path).options.fillOpacity !== 0.35)
            (layer as L.Path).setStyle({ fillOpacity: 0.12, weight: 1.5 });
        });
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;
    mapRef.current.fitBounds(geoJsonLayer.getBounds());
  }, [geojsonData, onGridClick, language]);

  // ── Fly to island ─────────────────────────────────────────────────────────
  const flyToIsland = useCallback((island: Island) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([island.lat, island.lon], 13, { duration: 1.1, easeLinearity: 0.3 });
    setTimeout(() => {
      const idx = ISLANDS.findIndex(i => i.id === island.id);
      if (idx >= 0 && islandMarkersRef.current[idx])
        islandMarkersRef.current[idx].openPopup();
    }, 1200);
  }, []);

  return (
    <>
      <style>{`
        /* ── Responsive base ── */
        @media (max-width: 480px) {
          .island-label-tooltip { font-size: 11px !important; }
          .leaflet-control-zoom { display: none !important; }
        }
        /* ── Popup wrapper ── */
        .island-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .island-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .island-popup .leaflet-popup-tip-container { margin-top: -1px; }

        /* ── Island name tooltip — sans-serif, clear ── */
        .island-label-tooltip {
          background: rgba(15,23,42,0.90) !important;
          border: none !important;
          color: #fff !important;
          font-family: ${SANS} !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
          white-space: nowrap !important;
          letter-spacing: 0.01em !important;
        }
        .island-label-tooltip::before { display: none !important; }

        /* ── Grid hover tooltip — sans-serif ── */
        .grid-tooltip {
          background: rgba(255,255,255,0.97) !important;
          border: 1px solid rgba(2,132,199,0.3) !important;
          padding: 5px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
          font-family: ${SANS} !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }
        .grid-tooltip::before { display: none !important; }
      `}</style>

      {/* Map canvas */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Top-left overlay controls */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 320,
      }}>
        <IslandSearch language={language} onSelect={flyToIsland} />
        <GridTooltipBanner language={language} />
      </div>

      {/* Legend — bottom-left, above basemap toggle */}
      <div style={{ position: 'absolute', bottom: 76, left: 12, zIndex: 1000 }}>
        <LegendPanel language={language} />
      </div>
    </>
  );
};