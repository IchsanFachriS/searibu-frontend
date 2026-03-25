/**
 * MapContainer.tsx  —  Peta WebGIS Kepulauan Seribu
 * Updated: fully responsive, proportional popups on all screen sizes
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

export type BasemapType = 'osm' | 'satellite';

interface MapContainerProps {
  basemap: BasemapType;
  onGridClick?: (coordinates: { lat: number; lon: number }) => void;
  onCoordinateSearch?: (coordinates: { lat: number; lon: number }) => void;
}

interface Island {
  id: string; name: string; nameEn: string;
  lat: number; lon: number; adminZone: string;
  descId: string; descEn: string;
  facilities: string[]; accessFrom: string; travelTimeMin: number;
}

const SANS = '"Inter", "DM Sans", system-ui, sans-serif';
const ISLAND_COLOR = '#0284c7';

const ISLANDS: Island[] = [
  { id:'bidadari', name:'Pulau Bidadari', nameEn:'Bidadari Island', lat:-6.035347, lon:106.746234, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau resort terdekat dari Jakarta, dilengkapi cottage, kolam renang, dan situs benteng VOC abad ke-17.', descEn:'Closest resort island to Jakarta with cottages, pools, and a 17th-century VOC fortress ruin.', facilities:['Cottage','Restoran','Snorkeling','Diving','Benteng Martello'], accessFrom:'Marina Ancol', travelTimeMin:30 },
  { id:'tidung', name:'Pulau Tidung', nameEn:'Tidung Island', lat:-5.797360, lon:106.497220, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau terpopuler dengan Jembatan Cinta ikonik, cocok untuk bersepeda dan snorkeling di perairan jernih.', descEn:'Most popular island featuring the iconic Love Bridge, ideal for cycling and snorkeling.', facilities:['Jembatan Cinta','Sewa Sepeda','Snorkeling','Penginapan','Restoran'], accessFrom:'Muara Angke', travelTimeMin:120 },
  { id:'pari', name:'Pulau Pari', nameEn:'Pari Island', lat:-5.857626, lon:106.617560, adminZone:'Kepulauan Seribu Selatan', descId:'Terkenal dengan hamparan bintang laut dan padang lamun. Pusat penelitian kelautan LIPI berada di sini.', descEn:'Famous for starfish and seagrass beds. Home to a LIPI marine research station.', facilities:['Snorkeling','Bintang Laut','Padang Lamun','Penelitian LIPI','Penginapan'], accessFrom:'Muara Angke', travelTimeMin:90 },
  { id:'kelapa', name:'Pulau Kelapa', nameEn:'Kelapa Island', lat:-5.653659, lon:106.569023, adminZone:'Kepulauan Seribu Utara', descId:'Pulau dengan fasilitas lengkap dan akses ke beberapa spot snorkeling dan diving terbaik di kawasan utara.', descEn:'Well-equipped island with access to top snorkeling and diving spots in the northern area.', facilities:['Diving','Snorkeling','Cottage','Restoran','Speedboat Charter'], accessFrom:'Muara Angke', travelTimeMin:150 },
  { id:'pramuka', name:'Pulau Pramuka', nameEn:'Pramuka Island', lat:-5.745159, lon:106.613782, adminZone:'Kepulauan Seribu Utara', descId:'Pulau resort eksklusif dengan fasilitas bintang empat, lapangan tenis, dan dermaga pribadi.', descEn:'Exclusive resort island with four-star facilities, tennis courts, and a private pier.', facilities:['Resort Bintang 4','Kolam Renang','Tennis','Diving','Spa'], accessFrom:'Marina Ancol', travelTimeMin:75 },
  { id:'untung_jawa', name:'Pulau Untung Jawa', nameEn:'Untung Jawa Island', lat:-5.977321, lon:106.705921, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau terdekat dari Muara Angke, populer untuk wisata sehari dengan pantai berpasir putih.', descEn:'Closest island to Muara Angke, popular for day trips with white sand beaches.', facilities:['Pantai Berpasir','Warung Makan','Banana Boat','Snorkeling'], accessFrom:'Muara Angke', travelTimeMin:45 },
  { id:'kotok', name:'Pulau Kotok', nameEn:'Kotok Island', lat:-5.700621, lon:106.538661, adminZone:'Kepulauan Seribu Utara', descId:'Kawasan konservasi penyu dengan spot diving kelas dunia dan terumbu karang yang masih terjaga.', descEn:'Sea turtle conservation area with world-class diving spots and well-preserved coral reefs.', facilities:['Konservasi Penyu','Diving','Snorkeling','Resort Ekologi'], accessFrom:'Marina Ancol', travelTimeMin:90 },
  { id:'putri', name:'Pulau Putri', nameEn:'Putri Island', lat:-5.593901, lon:106.560171, adminZone:'Kepulauan Seribu Utara', descId:'Pulau resort premium dengan underwater observatory, cocok untuk pasangan dan keluarga.', descEn:'Premium resort island with an underwater observatory, ideal for couples and families.', facilities:['Underwater Observatory','Resort Premium','Snorkeling','Glass Bottom Boat'], accessFrom:'Marina Ancol', travelTimeMin:60 },
  { id:'ayer', name:'Pulau Ayer', nameEn:'Ayer Island', lat:-5.763737, lon:106.583138, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau resort bergaya vintage dengan bungalow terapung ikonik di atas air.', descEn:'Vintage-style resort island featuring iconic overwater bungalows.', facilities:['Bungalow Terapung','Restoran Seafood','Snorkeling','Kayak'], accessFrom:'Marina Ancol', travelTimeMin:25 },
  { id:'rambut', name:'Pulau Rambut', nameEn:'Rambut Island', lat:-5.975101, lon:106.692101, adminZone:'Kepulauan Seribu Selatan', descId:'Suaka margasatwa untuk koloni burung laut dan habitat mangrove yang dilindungi.', descEn:'Wildlife sanctuary for seabird colonies and protected mangrove habitat.', facilities:['Birdwatching','Mangrove','Suaka Burung'], accessFrom:'Muara Angke', travelTimeMin:60 },
  { id:'lancang', name:'Pulau Lancang', nameEn:'Lancang Island', lat:-5.929764, lon:106.586512, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau nelayan tradisional dengan potensi memancing yang baik dan pantai yang tenang.', descEn:'Traditional fishing island with good angling potential and calm beaches.', facilities:['Memancing','Snorkeling','Penginapan Sederhana'], accessFrom:'Muara Angke', travelTimeMin:75 },
  { id:'bokor', name:'Pulau Bokor', nameEn:'Bokor Island', lat:-5.978006, lon:106.706506, adminZone:'Kepulauan Seribu Selatan', descId:'Pulau kecil tak berpenghuni dengan pantai pasir putih yang tenang, ideal untuk piknik.', descEn:'Small uninhabited island with calm white sand beach, ideal for a picnic.', facilities:['Pantai Sepi','Snorkeling','Piknik'], accessFrom:'Marina Ancol', travelTimeMin:40 },
];

const PORT_LOCATIONS = [
  { id:'marina_ancol', name:'Marina Ancol', lat:-6.122, lon:106.833, descId:'Pelabuhan utama untuk kapal cepat ke pulau-pulau resort', descEn:'Main port for speedboats to resort islands' },
  { id:'muara_angke',  name:'Muara Angke',  lat:-6.108, lon:106.740, descId:'Pelabuhan kapal tradisional, lebih ekonomis',             descEn:'Traditional ferry port, more economical option' },
];

const LUWES_STATION = {
  id:'luwes_tidal', name:'Sta. Pasut Luwes', nameEn:'Luwes Tidal Station',
  lat:-5.7439, lon:106.6128,
  descId:'Stasiun pengamatan pasut otomatis Luwes milik Pushidrosal. Data observasi digunakan sebagai koreksi terhadap prediksi TPXO dalam sistem Searibu.',
  descEn:'Luwes automatic tide gauge station operated by Pushidrosal. Observation data is used as correction against TPXO prediction in the Searibu system.',
};

function createLuwesIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 24 30"><polygon points="12,2 22,9 22,21 12,28 2,21 2,9" fill="#ef4444" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))"/><text x="12" y="17" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="8" font-weight="700">T</text></svg>`.trim();
  return L.divIcon({ html: svg, className:'', iconSize:[24,30], iconAnchor:[12,30], popupAnchor:[0,-30] });
}

function createIslandIcon(color: string, highlighted = false): L.DivIcon {
  const size = highlighted ? 30 : 24;
  const border = highlighted ? 2.5 : 1.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+7}" viewBox="0 0 ${size} ${size+7}"><filter id="sh"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.28)"/></filter><circle cx="${size/2}" cy="${size/2}" r="${size/2-border}" fill="${color}" stroke="#fff" stroke-width="${border}" filter="url(#sh)"/><circle cx="${size/2}" cy="${size/2}" r="${size/2-border-3}" fill="#fff" fill-opacity="0.22"/><line x1="${size/2}" y1="${size-border}" x2="${size/2}" y2="${size+5}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`.trim();
  return L.divIcon({ html:`<div style="filter:${highlighted?`drop-shadow(0 0 5px ${color}88)`:'none'}">${svg}</div>`, className:'', iconSize:[size,size+7], iconAnchor:[size/2,size+7], popupAnchor:[0,-(size+7)] });
}

function createPortIcon(): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 22 28"><polygon points="11,2 20,8 17,22 5,22 2,8" fill="#374151" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 1.5px 3px rgba(0,0,0,0.35))"/><text x="11" y="16" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="9" font-weight="700">P</text></svg>`.trim();
  return L.divIcon({ html: svg, className:'', iconSize:[22,28], iconAnchor:[11,28], popupAnchor:[0,-28] });
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R=6371, dLat=((lat2-lat1)*Math.PI)/180, dLon=((lon2-lon1)*Math.PI)/180;
  const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ── Search Bar (Island + Coordinates + My Location) ── */
interface SearchBarProps {
  language: string;
  onIslandSelect: (island: Island) => void;
  onCoordinateSearch: (lat: number, lon: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ language, onIslandSelect, onCoordinateSearch }) => {
  const [mode, setMode]         = useState<'island' | 'coords'>('island');
  const [query, setQuery]       = useState('');
  const [focused, setFocused]   = useState(false);
  const [latStr, setLatStr]     = useState('');
  const [lonStr, setLonStr]     = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length >= 1
    ? ISLANDS.filter(isl => { const q=query.toLowerCase(); return isl.name.toLowerCase().includes(q)||isl.nameEn.toLowerCase().includes(q); }).slice(0,5)
    : [];
  const showDropdown = mode === 'island' && focused && results.length > 0;

  const handleIslandSelect = (island: Island) => {
    setQuery(''); setFocused(false); inputRef.current?.blur();
    onIslandSelect(island);
  };

  const handleCoordSearch = () => {
    setLocError('');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      setLocError(language === 'id' ? 'Koordinat tidak valid' : 'Invalid coordinates');
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocError(language === 'id' ? 'Koordinat di luar rentang' : 'Coordinates out of range');
      return;
    }
    onCoordinateSearch(lat, lon);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError(language === 'id' ? 'Geolokasi tidak didukung' : 'Geolocation not supported');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatStr(lat.toFixed(6));
        setLonStr(lon.toFixed(6));
        setLocating(false);
        onCoordinateSearch(lat, lon);
      },
      () => {
        setLocating(false);
        setLocError(language === 'id' ? 'Gagal mendapat lokasi' : 'Location access denied');
      },
      { timeout: 8000, maximumAge: 30000 }
    );
  };

  const tabBtn = (active: boolean) => ({
    flex: 1, padding: '5px 0', border: 'none', cursor: 'pointer',
    fontFamily: SANS, fontSize: 11, fontWeight: 600,
    borderRadius: 6, transition: 'all 0.18s',
    background: active ? '#0284c7' : 'transparent',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? '0 1px 4px rgba(2,132,199,0.25)' : 'none',
  } as React.CSSProperties);

  return (
    <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.09)', backdropFilter: 'blur(14px)', overflow: 'visible' }}>

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', gap: 4, padding: '7px 7px 0' }}>
        <button style={tabBtn(mode === 'island')} onClick={() => { setMode('island'); setLocError(''); }}>
          {language === 'id' ? 'Pulau' : 'Island'}
        </button>
        <button style={tabBtn(mode === 'coords')} onClick={() => { setMode('coords'); setLocError(''); }}>
          {language === 'id' ? 'Koordinat' : 'Coords'}
        </button>
      </div>

      {/* ── Island search ── */}
      {mode === 'island' && (
        <div style={{ position: 'relative', padding: '6px 7px 7px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: focused ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 11px', background: focused ? '#fff' : '#f8fafc', transition: 'border-color 0.18s, background 0.18s', boxShadow: focused ? '0 0 0 3px rgba(2,132,199,0.10)' : 'none' }}>
            <Search size={13} style={{ color: focused ? '#0284c7' : '#94a3b8', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder={language === 'id' ? 'Cari nama pulau...' : 'Search island name...'}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#0f172a', width: '100%', fontFamily: SANS }}
            />
            {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}><X size={12} /></button>}
          </div>
          {showDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% - 1px)', left: 7, right: 7, background: '#fff', borderRadius: 9, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid rgba(0,0,0,0.08)', zIndex: 2000 }}>
              {results.map((isl, idx) => (
                <button key={isl.id} onMouseDown={() => handleIslandSelect(isl)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: idx < results.length - 1 ? '1px solid #f1f5f9' : 'none', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ISLAND_COLOR, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isl.name}</p>
                    <p style={{ fontFamily: SANS, fontSize: 11, color: '#94a3b8' }}>{isl.travelTimeMin} {language === 'id' ? 'mnt' : 'min'} · {isl.accessFrom}</p>
                  </div>
                  <MapPin size={11} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Coordinate search ── */}
      {mode === 'coords' && (
        <div style={{ padding: '6px 7px 7px' }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            {/* Latitude */}
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 3, paddingLeft: 2 }}>
                {language === 'id' ? 'Lintang' : 'Latitude'}
              </label>
              <input
                type="number" value={latStr}
                onChange={e => { setLatStr(e.target.value); setLocError(''); }}
                placeholder={language === 'id' ? 'Contoh: -5.74' : 'e.g. -5.74'}
                step="any"
                style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: SANS, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border-color 0.18s' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.10)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            {/* Longitude */}
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 3, paddingLeft: 2 }}>
                {language === 'id' ? 'Bujur' : 'Longitude'}
              </label>
              <input
                type="number" value={lonStr}
                onChange={e => { setLonStr(e.target.value); setLocError(''); }}
                placeholder={language === 'id' ? 'Contoh: 106.61' : 'e.g. 106.61'}
                step="any"
                style={{ width: '100%', padding: '7px 9px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: SANS, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border-color 0.18s' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.10)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Error */}
          {locError && (
            <p style={{ fontFamily: SANS, fontSize: 10, color: '#dc2626', marginBottom: 5, paddingLeft: 2 }}>{locError}</p>
          )}

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: 5 }}>
            {/* My Location */}
            <button
              onClick={handleMyLocation}
              disabled={locating}
              title={language === 'id' ? 'Gunakan lokasi saya' : 'Use my location'}
              style={{ width: 34, height: 34, borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: locating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}
              onMouseEnter={e => { if (!locating) { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#f0fdf4'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              {locating
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7" strokeDasharray="2 2"/></svg>
              }
            </button>
            {/* Search */}
            <button
              onClick={handleCoordSearch}
              style={{ flex: 1, height: 34, borderRadius: 7, border: 'none', background: '#0284c7', color: '#fff', fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0369a1')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0284c7')}
            >
              <Search size={13} />
              {language === 'id' ? 'Cari' : 'Search'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Legend ── */
const LegendPanel: React.FC<{ language: string }> = ({ language }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderRadius:9, boxShadow:'0 4px 16px rgba(0,0,0,0.11)', border:'1px solid rgba(0,0,0,0.08)', overflow:'hidden', minWidth:130 }}>
      <button onClick={()=>setCollapsed(c=>!c)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'none', border:'none', cursor:'pointer', borderBottom:collapsed?'none':'1px solid #f1f5f9' }}>
        <span style={{ fontFamily:SANS, fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'#64748b' }}>{language==='id'?'Legenda':'Legend'}</span>
        {collapsed?<ChevronDown size={12} style={{color:'#94a3b8'}}/>:<ChevronUp size={12} style={{color:'#94a3b8'}}/>}
      </button>
      {!collapsed && (
        <div style={{ padding:'5px 0' }}>
          {/* Tourism Island */}
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 11px' }}>
            <svg width="11" height="13" viewBox="0 0 24 31" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10.5" fill={ISLAND_COLOR} stroke="#fff" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="6.5" fill="#fff" fillOpacity="0.22"/>
              <line x1="12" y1="22.5" x2="12" y2="29" stroke={ISLAND_COLOR} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily:SANS, fontSize:11, fontWeight:500, color:'#374151' }}>{language==='id'?'Pulau Wisata':'Tourism Island'}</span>
          </div>
          {/* Port — pentagon matching map icon */}
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 11px' }}>
            <svg width="11" height="13" viewBox="0 0 22 28" style={{flexShrink:0}}>
              <polygon points="11,2 20,8 17,22 5,22 2,8" fill="#374151" stroke="#fff" strokeWidth="1.5"/>
              <text x="11" y="16" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="9" fontWeight="700">P</text>
            </svg>
            <span style={{ fontFamily:SANS, fontSize:11, fontWeight:500, color:'#374151' }}>{language==='id'?'Pelabuhan':'Port'}</span>
          </div>
          {/* Tide Station — hexagon matching map icon */}
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 11px' }}>
            <svg width="11" height="13" viewBox="0 0 24 30" style={{flexShrink:0}}>
              <polygon points="12,2 22,9 22,21 12,28 2,21 2,9" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/>
              <text x="12" y="17" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="8" fontWeight="700">T</text>
            </svg>
            <span style={{ fontFamily:SANS, fontSize:11, fontWeight:500, color:'#374151' }}>{language==='id'?'Sta. Pasut':'Tide Station'}</span>
          </div>
          <div style={{ height:1, background:'#f1f5f9', margin:'3px 0' }}/>
          {/* TPXO Grid */}
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 11px' }}>
            <div style={{ width:11, height:11, borderRadius:2, background:'rgba(59,130,246,0.25)', border:'1.5px solid #3b82f6', flexShrink:0 }}/>
            <span style={{ fontFamily:SANS, fontSize:11, fontWeight:500, color:'#374151' }}>{language==='id'?'Grid TPXO':'TPXO Grid'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Grid Tooltip Banner ── */
const GridTooltipBanner: React.FC<{ language: string }> = ({ language }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'rgba(2,132,199,0.08)', border:'1px solid rgba(2,132,199,0.20)', borderRadius:8, padding:'8px 11px', backdropFilter:'blur(12px)', maxWidth:280 }}>
      <Info size={13} style={{ color:'#0284c7', flexShrink:0, marginTop:1 }}/>
      <p style={{ fontFamily:SANS, fontSize:11, color:'#0369a1', lineHeight:1.5, flex:1 }}>
        {language==='id' ? 'Klik kotak grid biru untuk data pasut & cuaca.' : 'Click a blue grid cell to view tide & weather data.'}
      </p>
      <button onClick={()=>setDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', flexShrink:0, padding:0, display:'flex' }}><X size={11}/></button>
    </div>
  );
};

/* ── Main MapContainer ── */
export const MapContainer: React.FC<MapContainerProps> = ({ basemap, onGridClick, onCoordinateSearch }) => {
  const { language } = useLanguage();
  const mapRef = useRef<L.Map|null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer|null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON|null>(null);
  const islandMarkersRef = useRef<L.Marker[]>([]);
  const portMarkersRef = useRef<L.Marker[]>([]);
  const luwesMarkerRef = useRef<L.Marker|null>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);

  const basemaps = {
    osm: { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
    satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution:'Tiles &copy; Esri' },
  };

  const buildIslandPopup = useCallback((island: Island): string => {
    const color = ISLAND_COLOR;
    const title = language==='id' ? island.name : island.nameEn;
    const desc  = language==='id' ? island.descId : island.descEn;
    const facilityPills = island.facilities.map(f=>`<span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${color}16;color:${color};font-size:10px;font-weight:600;margin:2px 2px 2px 0;font-family:${SANS};border:1px solid ${color}28;">${f}</span>`).join('');
    return `<div style="font-family:${SANS};min-width:200px;max-width:240px;padding:0;overflow:hidden;"><div style="background:${color};padding:10px 13px 8px;"><p style="font-size:14px;font-weight:700;color:#fff;line-height:1.2;margin:0;">${title}</p><p style="font-size:10px;color:rgba(255,255,255,0.72);margin:2px 0 0;">${island.adminZone}</p></div><div style="padding:10px 13px"><p style="font-size:12px;color:#475569;line-height:1.55;margin:0 0 9px;">${desc}</p><div style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:7px;background:#f8fafc;margin-bottom:9px;"><div><p style="font-size:9px;color:#94a3b8;margin:0 0 1px;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">${language==='id'?'Dari':'From'}</p><p style="font-size:12px;color:#0f172a;margin:0;font-weight:600;">${island.accessFrom}</p></div><div style="width:1px;height:22px;background:#e2e8f0;"></div><div><p style="font-size:9px;color:#94a3b8;margin:0 0 1px;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">${language==='id'?'Menit':'Min'}</p><p style="font-size:12px;color:#0f172a;margin:0;font-weight:600;">${island.travelTimeMin}</p></div></div><p style="font-size:9px;color:#94a3b8;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 5px;">${language==='id'?'Fasilitas':'Facilities'}</p><div>${facilityPills}</div></div></div>`;
  }, [language]);

  const buildPortPopup = useCallback((port: typeof PORT_LOCATIONS[0]): string => {
    const desc = language==='id' ? port.descId : port.descEn;
    const connecting = ISLANDS.filter(isl=>isl.accessFrom===port.name).map(isl=>`<span style="font-family:${SANS};font-size:11px;color:#374151;font-weight:500;display:block;padding:3px 0;border-bottom:1px solid #f1f5f9;">${isl.name} — ${isl.travelTimeMin} ${language==='id'?'mnt':'min'}</span>`).join('');
    return `<div style="font-family:${SANS};min-width:180px;"><div style="background:#1e293b;padding:9px 12px 7px;"><p style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.04em;font-weight:700;margin:0 0 2px;">${language==='id'?'Pelabuhan':'Port'}</p><p style="font-size:14px;font-weight:700;color:#fff;margin:0;">${port.name}</p></div><div style="padding:9px 12px"><p style="font-size:11px;color:#475569;margin:0 0 8px;line-height:1.5;">${desc}</p><p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 4px;">${language==='id'?'Rute tersedia':'Available routes'}</p>${connecting}</div></div>`;
  }, [language]);

  const buildLuwesPopup = useCallback((): string => {
    const title = language==='id' ? LUWES_STATION.name : LUWES_STATION.nameEn;
    const desc  = language==='id' ? LUWES_STATION.descId : LUWES_STATION.descEn;
    return `<div style="font-family:${SANS};min-width:200px;max-width:240px;padding:0;overflow:hidden;"><div style="background:#ef4444;padding:10px 13px 8px;"><div style="display:inline-block;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.18);font-size:9px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;margin-bottom:4px;">${language==='id'?'Stasiun Pasut':'Tide Station'}</div><p style="font-size:14px;font-weight:700;color:#fff;line-height:1.2;margin:0;">${title}</p><p style="font-size:10px;color:rgba(255,255,255,0.72);margin:2px 0 0;">${LUWES_STATION.lat.toFixed(4)}°S · ${LUWES_STATION.lon.toFixed(4)}°E</p></div><div style="padding:10px 13px"><p style="font-size:11px;color:#475569;line-height:1.55;margin:0;">${desc}</p></div></div>`;
  }, [language]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center:[-5.6167,106.5833], zoom:11, zoomControl:true, attributionControl:true });
    const tile = L.tileLayer(basemaps[basemap].url, { attribution:basemaps[basemap].attribution, maxZoom:19 }).addTo(map);
    mapRef.current = map;
    tileLayerRef.current = tile;
    map.zoomControl.setPosition('topright');
    L.control.scale({ position:'bottomright', imperial:false }).addTo(map);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current=null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(basemaps[basemap].url, { attribution:basemaps[basemap].attribution, maxZoom:19 }).addTo(mapRef.current);
  }, [basemap]);

  useEffect(() => {
    fetch('/GRID_TPXO_SERIBU.geojson').then(r=>r.json()).then(setGeojsonData).catch(err=>console.error('GeoJSON error:',err));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    islandMarkersRef.current.forEach(m=>m.remove());
    islandMarkersRef.current = [];
    ISLANDS.forEach(island => {
      const icon = createIslandIcon(ISLAND_COLOR);
      const marker = L.marker([island.lat,island.lon], { icon, zIndexOffset:500 });
      marker.bindPopup(buildIslandPopup(island), { maxWidth:250, minWidth:210, className:'island-popup' });
      marker.bindTooltip(island.name, { permanent:false, direction:'top', offset:[0,-7], className:'island-label-tooltip', opacity:1 });
      marker.addTo(mapRef.current!);
      islandMarkersRef.current.push(marker);
    });
  }, [buildIslandPopup]);

  useEffect(() => {
    if (!mapRef.current) return;
    portMarkersRef.current.forEach(m=>m.remove());
    portMarkersRef.current = [];
    PORT_LOCATIONS.forEach(port => {
      const icon = createPortIcon();
      const marker = L.marker([port.lat,port.lon], { icon, zIndexOffset:600 });
      marker.bindPopup(buildPortPopup(port), { maxWidth:230, minWidth:190, className:'island-popup' });
      marker.bindTooltip(port.name, { permanent:false, direction:'top', offset:[0,-7], opacity:1, className:'island-label-tooltip' });
      marker.addTo(mapRef.current!);
      portMarkersRef.current.push(marker);
    });
  }, [buildPortPopup]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (luwesMarkerRef.current) luwesMarkerRef.current.remove();
    const icon = createLuwesIcon();
    const marker = L.marker([LUWES_STATION.lat,LUWES_STATION.lon], { icon, zIndexOffset:700 });
    marker.bindPopup(buildLuwesPopup(), { maxWidth:250, minWidth:210, className:'island-popup' });
    marker.bindTooltip(language==='id'?LUWES_STATION.name:LUWES_STATION.nameEn, { permanent:false, direction:'top', offset:[0,-9], opacity:1, className:'island-label-tooltip' });
    marker.addTo(mapRef.current!);
    luwesMarkerRef.current = marker;
  }, [buildLuwesPopup, language]);

  useEffect(() => {
    if (!mapRef.current || !geojsonData) return;
    if (geoJsonLayerRef.current) geoJsonLayerRef.current.remove();
    const geoJsonLayer = L.geoJSON(geojsonData, {
      style: { color:'#3b82f6', weight:1.5, opacity:0.7, fillColor:'#3b82f6', fillOpacity:0.12 },
      onEachFeature: (_feature, layer) => {
        layer.bindTooltip(`<div style="font-family:${SANS};font-size:11px;color:#0369a1;font-weight:500;padding:2px 4px;">${language==='id'?'Klik untuk pasut & cuaca':'Click for tide & weather'}</div>`, { sticky:true, opacity:1, className:'grid-tooltip' });
        layer.on('click', () => {
          const center = (layer as any).getBounds().getCenter();
          if (onGridClick) onGridClick({ lat:center.lat, lon:center.lng });
          geoJsonLayer.eachLayer((l:any)=>{ (l as L.Path).setStyle({ color:'#3b82f6', weight:1.5, fillOpacity:0.12 }); });
          (layer as L.Path).setStyle({ color:'#ef4444', weight:2.5, fillOpacity:0.35 });
        });
        layer.on('mouseover', ()=>{ if ((layer as L.Path).options.fillOpacity!==0.35) (layer as L.Path).setStyle({ fillOpacity:0.28, weight:2 }); });
        layer.on('mouseout',  ()=>{ if ((layer as L.Path).options.fillOpacity!==0.35) (layer as L.Path).setStyle({ fillOpacity:0.12, weight:1.5 }); });
      },
    }).addTo(mapRef.current);
    geoJsonLayerRef.current = geoJsonLayer;
    mapRef.current.fitBounds(geoJsonLayer.getBounds());
  }, [geojsonData, onGridClick, language]);

  const flyToIsland = useCallback((island: Island) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([island.lat,island.lon], 13, { duration:1.1, easeLinearity:0.3 });
    setTimeout(() => {
      const idx = ISLANDS.findIndex(i=>i.id===island.id);
      if (idx>=0 && islandMarkersRef.current[idx]) islandMarkersRef.current[idx].openPopup();
    }, 1200);
  }, []);

  const flyToCoords = useCallback((lat: number, lon: number) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([lat, lon], 13, { duration: 1.1, easeLinearity: 0.3 });
    if (onCoordinateSearch) onCoordinateSearch({ lat, lon });
    if (onGridClick) onGridClick({ lat, lon });
  }, [onCoordinateSearch, onGridClick]);

  return (
    <>
      <style>{`
        /* Popup */
        .island-popup .leaflet-popup-content-wrapper { padding:0; border-radius:11px; overflow:hidden; box-shadow:0 8px 28px rgba(0,0,0,0.16); border:1px solid rgba(0,0,0,0.07); }
        .island-popup .leaflet-popup-content { margin:0; width:auto!important; }
        .island-popup .leaflet-popup-tip-container { margin-top:-1px; }

        /* Island name tooltip */
        .island-label-tooltip {
          background:rgba(15,23,42,0.88)!important; border:none!important; color:#fff!important;
          font-family:${SANS}!important; font-size:11px!important; font-weight:600!important;
          padding:3px 8px!important; border-radius:5px!important;
          box-shadow:0 2px 6px rgba(0,0,0,0.22)!important;
          white-space:nowrap!important;
        }
        .island-label-tooltip::before { display:none!important; }

        /* Grid tooltip */
        .grid-tooltip {
          background:rgba(255,255,255,0.96)!important; border:1px solid rgba(2,132,199,0.28)!important;
          padding:4px 9px!important; border-radius:5px!important; box-shadow:0 2px 7px rgba(0,0,0,0.10)!important;
          font-family:${SANS}!important; font-size:11px!important;
        }
        .grid-tooltip::before { display:none!important; }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .leaflet-control-zoom { display:none!important; }
          .island-label-tooltip { font-size:10px!important; padding:2px 6px!important; }
          .leaflet-popup-content-wrapper { max-width:85vw!important; }
        }
        @media (max-width: 768px) {
          .leaflet-popup-content-wrapper { max-width:88vw!important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div ref={mapContainerRef} style={{ position:'absolute', inset:0 }}/>

      {/* Top-left overlay controls */}
      <div style={{ position:'absolute', top:10, left:10, right:10, zIndex:1000, display:'flex', flexDirection:'column', gap:7, maxWidth:300 }}>
        <SearchBar language={language} onIslandSelect={flyToIsland} onCoordinateSearch={flyToCoords}/>
        <GridTooltipBanner language={language}/>
      </div>

      {/* Legend — bottom-left */}
      <div style={{ position:'absolute', bottom:72, left:10, zIndex:1000 }}>
        <LegendPanel language={language}/>
      </div>
    </>
  );
};