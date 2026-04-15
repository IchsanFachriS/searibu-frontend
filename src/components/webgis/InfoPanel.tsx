/**
 * InfoPanel.tsx  —  Marine Info Panel
 * Sistem Searibu — ITB Geodesy & Geomatics Engineering 2026
 *
 * Perbaikan:
 *  - Grafik dan tabel dari 00:00 hingga 24:00 WIB (x=0 s/d x=24)
 *  - Titik x=24 (00:00 hari berikutnya) disertakan untuk kontinuitas sinusoidal
 *  - TPXO diinterpolasi per menit (1440 titik) menggunakan cubic spline
 *  - Tooltip interaktif: posisi mengikuti titik pada kurva TPXO (bukan posisi raw mouse)
 *  - Jika hanya TPXO → tampilkan TPXO saja; jika hanya Luwes → tampilkan Luwes saja
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X, RefreshCw, AlertCircle,
  Anchor, Wind, Fish, Camera, Waves,
  Sun, Moon, Navigation, Leaf, Flag,
  Users, Ship, Zap, Download,
  CheckCircle, ExternalLink, Info,
  Loader2, FileDown, ChevronDown, ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
interface TideData {
  grid: { id: number; lon: number; lat: number; distance_km: number };
  predictions: Array<{ time: string; height: number }>;
  statistics: { max: number; min: number; mean: number; range: number };
  metadata: { model: string; datum: string; timezone: string; constituents: string[] };
}

interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  daily: { time: string[]; sunrise: string[]; sunset: string[] };
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    weather_code: number[];
  };
}

interface MarineData {
  current?: { wave_height?: number; ocean_current_velocity?: number };
  hourly: {
    time: string[];
    wave_height: number[];
    ocean_current_velocity: number[];
  };
}

interface LuwesObs { recorded_at: string; level_m: number }

interface OverlayData {
  date: string; imei: string; lon: number; lat: number;
  luwes_obs: LuwesObs[];
  tpxo: Array<{ time: string; height: number }>;
  luwes_stats: { max_m: number | null; min_m: number | null; count: number };
  tpxo_stats:  { max: number; min: number; mean: number; range: number };
}

interface HourRow {
  hour: string;
  tideH: number | null; temp: number | null;
  windSpd: number | null; windDir: number | null;
  waveH: number | null; currentSpd: number | null;
  wCode: number | null;
}

interface ActivityRec {
  id: string; labelEn: string; labelId: string;
  icon: React.ReactNode;
  status: "safe" | "caution" | "danger";
  reasonEn: string; reasonId: string;
}

interface InfoPanelProps {
  coordinates: { lat: number; lon: number };
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
const SANS = '"Inter", "DM Sans", system-ui, sans-serif';
const MONO = '"Inter", "DM Sans", system-ui, sans-serif';
const TOL_CORRECTION = -2.156;
const kmhToMs = (v: number) => v / 3.6;

const todayISO = () => {
  const wib = new Date(Date.now() + 7 * 3600_000);
  return wib.toISOString().slice(0, 10);
};

const WMO: Record<number, { en: string; id: string }> = {
  0:  { en: "Clear sky",      id: "Langit cerah"     },
  1:  { en: "Mainly clear",   id: "Cerah berawan"    },
  2:  { en: "Partly cloudy",  id: "Sebagian berawan" },
  3:  { en: "Overcast",       id: "Mendung"          },
  45: { en: "Foggy",          id: "Berkabut"         },
  51: { en: "Light drizzle",  id: "Gerimis ringan"   },
  61: { en: "Light rain",     id: "Hujan ringan"     },
  63: { en: "Moderate rain",  id: "Hujan sedang"     },
  65: { en: "Heavy rain",     id: "Hujan lebat"      },
  80: { en: "Light showers",  id: "Hujan rintik"     },
  81: { en: "Showers",        id: "Hujan deras"      },
  82: { en: "Heavy showers",  id: "Hujan sangat deras"},
  95: { en: "Thunderstorm",   id: "Badai petir"      },
  99: { en: "Thunderstorm",   id: "Badai petir"      },
};

const wmoLabel = (code: number | null, lang: "en" | "id") => {
  if (code === null) return "—";
  const entry = WMO[code];
  if (entry) return entry[lang];
  const nearest = Object.keys(WMO).map(Number)
    .reduce((a, b) => Math.abs(b - code) < Math.abs(a - code) ? b : a);
  return WMO[nearest]?.[lang] ?? "—";
};

const windDirLabel = (deg: number) => {
  const d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return d[Math.round(deg / 22.5) % 16];
};

const fmtHHmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
};

const statusStyles: Record<ActivityRec["status"], {
  dot: string; bg: string; border: string; text: string; label: [string, string]
}> = {
  safe:    { dot: "#16a34a", bg: "#f0fdf4", border: "#86efac", text: "#15803d", label: ["Safe",    "Aman"]    },
  caution: { dot: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#b45309", label: ["Caution", "Waspada"] },
  danger:  { dot: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", label: ["Avoid",   "Hindari"] },
};

/* ═══════════════════════════════════════════════════
   CACHE HELPERS
═══════════════════════════════════════════════════ */
const cacheKey = (lat: number, lon: number, t: "wx" | "marine") =>
  `searibu_${t}_${lat.toFixed(4)}_${lon.toFixed(4)}`;

function readCache<T>(lat: number, lon: number, t: "wx" | "marine"): T | null {
  try { const r = sessionStorage.getItem(cacheKey(lat, lon, t)); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function writeCache<T>(lat: number, lon: number, t: "wx" | "marine", data: T) {
  try { sessionStorage.setItem(cacheKey(lat, lon, t), JSON.stringify(data)); } catch {}
}
function clearCache(lat: number, lon: number) {
  try {
    sessionStorage.removeItem(cacheKey(lat, lon, "wx"));
    sessionStorage.removeItem(cacheKey(lat, lon, "marine"));
  } catch {}
}

/* ═══════════════════════════════════════════════════
   TIMESTAMP PARSER
═══════════════════════════════════════════════════ */
function parseToWIB(ts: string): { wibDate: string; wibHour: number; wibMinute: number } | null {
  try {
    let ms = NaN;
    if (ts.endsWith("Z") || ts.includes("+")) ms = Date.parse(ts);
    else if (ts.includes("T"))                 ms = Date.parse(ts + "Z");
    if (isNaN(ms)) return null;
    const wib = new Date(ms + 7 * 3600_000);
    return { wibDate: wib.toISOString().slice(0,10), wibHour: wib.getUTCHours(), wibMinute: wib.getUTCMinutes() };
  } catch { return null; }
}

/** Add days to a YYYY-MM-DD string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ═══════════════════════════════════════════════════
   CUBIC SPLINE INTERPOLATION
═══════════════════════════════════════════════════ */
function buildCubicSpline(knots: {x:number;y:number}[]): (x: number) => number {
  const n = knots.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => knots[0].y;
  if (n === 2) {
    const [a, b] = knots;
    return (x) => a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
  }

  const xs = knots.map(k => k.x);
  const ys = knots.map(k => k.y);
  const h  = Array.from({length: n - 1}, (_, i) => xs[i + 1] - xs[i]);

  const diag = new Array(n).fill(2.0);
  const upper = new Array(n).fill(0.0);
  const rhs  = new Array(n).fill(0.0);

  for (let i = 1; i < n - 1; i++) {
    const hi  = h[i - 1];
    const hi1 = h[i];
    const tot = hi + hi1;
    upper[i] = hi1 / tot;
    rhs[i]   = 6.0 * ((ys[i + 1] - ys[i]) / hi1 - (ys[i] - ys[i - 1]) / hi) / tot;
  }

  const mu  = new Array(n).fill(0.0);
  const rhs2 = [...rhs];
  for (let i = 1; i < n - 1; i++) {
    mu[i] = h[i - 1] / (h[i - 1] + h[i]);
  }
  const diagMod = [...diag];
  for (let i = 1; i < n - 1; i++) {
    const w = mu[i] / diagMod[i - 1];
    diagMod[i] -= w * upper[i - 1];
    rhs2[i]    -= w * rhs2[i - 1];
  }
  const M = new Array(n).fill(0.0);
  M[n - 2] = rhs2[n - 2] / diagMod[n - 2];
  for (let i = n - 3; i >= 1; i--) {
    M[i] = (rhs2[i] - upper[i] * M[i + 1]) / diagMod[i];
  }

  return (x: number) => {
    if (x <= xs[0])     return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    let lo = 0, hi2 = n - 2;
    while (lo < hi2) {
      const mid = (lo + hi2) >> 1;
      if (xs[mid + 1] < x) lo = mid + 1;
      else hi2 = mid;
    }
    const i   = lo;
    const dx  = x - xs[i];
    const hi_ = h[i];

    const a = ys[i];
    const b = (ys[i + 1] - ys[i]) / hi_ - hi_ * (2 * M[i] + M[i + 1]) / 6;
    const c = M[i] / 2;
    const d = (M[i + 1] - M[i]) / (6 * hi_);

    return a + dx * (b + dx * (c + dx * d));
  };
}

function interpolateTPXOPerMinute(
  knots: {x: number; y: number}[]
): {x: number; y: number}[] {
  if (knots.length < 2) return knots;

  const spline = buildCubicSpline(knots);
  const xMin   = knots[0].x;
  const xMax   = knots[knots.length - 1].x;
  const result: {x: number; y: number}[] = [];

  const STEP = 1 / 60;

  for (let min = 0; min <= (xMax - xMin) * 60 + 0.5; min++) {
    const x = xMin + min * STEP;
    if (x > xMax + 1e-9) break;
    result.push({ x: Math.min(x, xMax), y: spline(Math.min(x, xMax)) });
  }

  return result;
}

/* ═══════════════════════════════════════════════════
   ACTIVITY RECOMMENDATIONS ENGINE
═══════════════════════════════════════════════════ */
function buildRecommendations(
  tideData: TideData | null,
  weatherData: WeatherData | null,
  marineData: MarineData | null,
  dateStr: string,
  lang: "en" | "id",
): ActivityRec[] {
  const hourlyIdxs = weatherData?.hourly.time
    .map((t, i) => (t.startsWith(dateStr) ? i : -1)).filter(i => i >= 0) ?? [];
  const marineIdxs = marineData?.hourly.time
    .map((t, i) => (t.startsWith(dateStr) ? i : -1)).filter(i => i >= 0) ?? [];

  const avgWave: number | null = marineIdxs.length
    ? marineIdxs.reduce((s,i) => s + (marineData!.hourly.wave_height[i] ?? 0), 0) / marineIdxs.length
    : null;
  const avgCurrentMs: number | null = marineIdxs.length
    ? marineIdxs.reduce((s,i) => s + (marineData!.hourly.ocean_current_velocity[i] ?? 0), 0) / marineIdxs.length
    : null;
  const avgWindMs: number | null = hourlyIdxs.length
    ? hourlyIdxs.reduce((s,i) => s + kmhToMs(weatherData!.hourly.wind_speed_10m[i] ?? 0), 0) / hourlyIdxs.length
    : null;

  const dayPred = tideData?.predictions.filter(p => parseToWIB(p.time)?.wibDate === dateStr) ?? [];
  const tideRange: number | null = dayPred.length
    ? Math.max(...dayPred.map(p=>p.height)) - Math.min(...dayPred.map(p=>p.height)) : null;

  const wCode = weatherData?.current.weather_code ?? 0;
  const isStormy = wCode >= 95;
  const isRainy  = wCode >= 51;

  type S = ActivityRec["status"];

  const snorkel = (): S => {
    if ((avgWave??0)>1.0||(avgWindMs??0)>7.9||(avgCurrentMs??0)>0.51) return "danger";
    if ((avgWave??0)>0.5||(avgWindMs??0)>3.3||(avgCurrentMs??0)>0.26) return "caution";
    return "safe";
  };
  const snorkelR = (): [string,string] => {
    const s=snorkel();
    if(s==="safe")    return ["Calm sea, good visibility for snorkeling","Laut tenang, visibilitas baik untuk snorkeling"];
    if(s==="caution") return ["Moderate conditions — experienced snorkelers only","Kondisi sedang — hanya untuk snorkeler berpengalaman"];
    return ["Rough sea or strong current — avoid water","Laut kasar atau arus kuat — hindari masuk air"];
  };

  const scuba = (): S => {
    if(isStormy||(avgCurrentMs??0)>0.51||(avgWave??0)>1.25) return "danger";
    if((avgCurrentMs??0)>0.26||(avgWave??0)>0.5)            return "caution";
    return "safe";
  };
  const scubaR = (): [string,string] => {
    const s=scuba();
    if(s==="safe")    return ["Good visibility, current within safe limits","Visibilitas baik, arus dalam batas aman"];
    if(s==="caution") return ["Moderate current — plan with slack tide","Arus sedang — rencanakan saat slack tide"];
    return ["Current >1 kt or rough sea — diving not safe","Arus melebihi batas aman selam atau laut kasar"];
  };

  const freedive = (): S => {
    if((avgWave??0)>0.8||(avgCurrentMs??0)>0.51) return "danger";
    if((avgWave??0)>0.5||(avgCurrentMs??0)>0.26) return "caution";
    return "safe";
  };
  const freediveR = (): [string,string] => {
    const s=freedive();
    if(s==="safe")    return ["Calm water, safe for breath-hold diving","Air tenang, aman untuk freediving"];
    if(s==="caution") return ["Moderate swell — buddy required","Ombak sedang — wajib buddy system"];
    return ["High wave or strong current — hazardous","Ombak tinggi atau arus kuat — berbahaya"];
  };

  const jetski = (): S => {
    if(isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5) return "danger";
    if(isRainy ||(avgWindMs??0)>7.9 ||(avgWave??0)>0.8) return "caution";
    return "safe";
  };
  const jetskiR = (): [string,string] => {
    const s=jetski();
    if(s==="safe")    return ["Calm sea, good for water sports","Laut tenang, kondisi baik untuk olahraga air"];
    if(s==="caution") return ["Choppy water — reduce speed","Air bergelombang — kurangi kecepatan"];
    return ["Strong wind or high waves — unsafe","Angin kencang atau ombak tinggi — tidak aman"];
  };

  const sup = (): S => {
    if((avgWindMs??0)>6.2||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51) return "danger";
    if((avgWindMs??0)>4.5||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26) return "caution";
    return "safe";
  };
  const supR = (): [string,string] => {
    const s=sup();
    if(s==="safe")    return ["Flat water, ideal for paddling","Air tenang, ideal untuk paddling"];
    if(s==="caution") return ["Light chop — experienced paddlers only","Sedikit bergelombang — paddler berpengalaman"];
    return ["Wind/wave exceeds safe SUP limit","Angin/ombak melampaui batas aman SUP"];
  };

  const boat = (): S => {
    if((avgWindMs??0)>10.3||(avgWave??0)>1.5) return "danger";
    if((avgWindMs??0)>7.9 ||(avgWave??0)>1.0) return "caution";
    return "safe";
  };
  const boatR = (): [string,string] => {
    const s=boat();
    if(s==="safe")    return ["Calm sea, good for inter-island travel","Laut tenang, baik untuk perjalanan antar pulau"];
    if(s==="caution") return ["Moderate sea — check vessel seaworthiness","Laut sedang — periksa kelayakan kapal"];
    return ["Exceeds small-craft limits — delay trip","Melampaui batas kapal kecil — tunda perjalanan"];
  };

  const fishing = (): S => {
    if(isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5) return "danger";
    if(isRainy ||(avgWindMs??0)>7.9 ||(avgWave??0)>1.0) return "caution";
    return "safe";
  };
  const fishingR = (): [string,string] => {
    const s=fishing();
    if(s==="safe")    return ["Good sea conditions for fishing","Kondisi laut baik untuk memancing"];
    if(s==="caution") return ["Moderate wind/wave — stay close to shore","Angin/ombak sedang — tetap dekat pantai"];
    return ["Dangerous sea state — not recommended","Kondisi laut berbahaya — tidak disarankan"];
  };

  const turtle = (): S => {
    if(isStormy) return "danger";
    if(isRainy||(tideRange!==null&&tideRange>1.5)) return "caution";
    return "safe";
  };
  const turtleR = (): [string,string] => {
    const s=turtle();
    if(s==="safe")    return ["Good conditions for conservation","Kondisi baik untuk konservasi"];
    if(s==="caution") return ["Rain or strong tides may affect access","Hujan/pasut kuat dapat ganggu akses"];
    return ["Storm — field activity unsafe","Badai — kegiatan lapangan tidak aman"];
  };

  const camp = (): S => {
    if(isStormy) return "danger";
    if(isRainy||(tideRange!==null&&tideRange>1.5)) return "caution";
    return "safe";
  };
  const campR = (): [string,string] => {
    const s=camp();
    if(s==="safe")    return ["Clear weather, comfortable beach","Cuaca cerah, pantai nyaman"];
    if(s==="caution") return ["Rain or high tide — limited beach access","Hujan/pasut tinggi — akses pantai terbatas"];
    return ["Storm — outdoor activities unsafe","Badai — aktivitas pantai tidak aman"];
  };

  const photo = (): S => {
    if(isStormy||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51) return "danger";
    if(isRainy ||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26) return "caution";
    return "safe";
  };
  const photoR = (): [string,string] => {
    const s=photo();
    if(s==="safe")    return ["Excellent visibility for UW photography","Visibilitas sangat baik untuk foto bawah air"];
    if(s==="caution") return ["Reduced visibility — challenging","Visibilitas berkurang — menantang"];
    return ["Poor visibility or strong current","Visibilitas buruk atau arus kuat"];
  };

  const general = (): S => {
    if(isStormy) return "danger";
    if(isRainy)  return "caution";
    return "safe";
  };
  const generalR = (): [string,string] => {
    const s=general();
    if(s==="safe")    return ["Clear weather — enjoy island exploration","Cuaca cerah — nikmati eksplorasi pulau"];
    if(s==="caution") return ["Light rain expected — bring rain gear","Kemungkinan hujan — bawa jas hujan"];
    return ["Storm forecast — limit outdoor activities","Prakiraan badai — batasi aktivitas luar"];
  };

  return [
    { id:"snorkeling", labelEn:"Snorkeling",       labelId:"Snorkeling",        icon:<Waves size={14}/>,    status:snorkel(),  reasonEn:snorkelR()[0],  reasonId:snorkelR()[1]  },
    { id:"scuba",      labelEn:"Scuba Diving",      labelId:"Selam Scuba",       icon:<Anchor size={14}/>,   status:scuba(),    reasonEn:scubaR()[0],    reasonId:scubaR()[1]    },
    { id:"freedive",   labelEn:"Freediving",        labelId:"Freediving",        icon:<Navigation size={14}/>,status:freedive(),reasonEn:freediveR()[0], reasonId:freediveR()[1] },
    { id:"jetski",     labelEn:"Jet Ski / Sports",  labelId:"Jet Ski / Olahraga",icon:<Zap size={14}/>,      status:jetski(),   reasonEn:jetskiR()[0],   reasonId:jetskiR()[1]   },
    { id:"sup",        labelEn:"SUP / Kayaking",    labelId:"SUP / Kayak",       icon:<Users size={14}/>,    status:sup(),      reasonEn:supR()[0],      reasonId:supR()[1]      },
    { id:"boat",       labelEn:"Island Hopping",    labelId:"Wisata Pulau",      icon:<Ship size={14}/>,     status:boat(),     reasonEn:boatR()[0],     reasonId:boatR()[1]     },
    { id:"fishing",    labelEn:"Fishing",           labelId:"Memancing",         icon:<Fish size={14}/>,     status:fishing(),  reasonEn:fishingR()[0],  reasonId:fishingR()[1]  },
    { id:"turtle",     labelEn:"Turtle Conservation",labelId:"Konservasi Penyu", icon:<Leaf size={14}/>,     status:turtle(),   reasonEn:turtleR()[0],   reasonId:turtleR()[1]   },
    { id:"camping",    labelEn:"Camping & Beach",   labelId:"Camping & Pantai",  icon:<Flag size={14}/>,     status:camp(),     reasonEn:campR()[0],     reasonId:campR()[1]     },
    { id:"uwphoto",    labelEn:"UW Photography",    labelId:"Foto Bawah Air",    icon:<Camera size={14}/>,   status:photo(),    reasonEn:photoR()[0],    reasonId:photoR()[1]    },
    { id:"general",    labelEn:"General Tourism",   labelId:"Wisata Umum",       icon:<Sun size={14}/>,      status:general(),  reasonEn:generalR()[0],  reasonId:generalR()[1]  },
  ];
}

/* ═══════════════════════════════════════════════════
   SKELETON LOADERS
═══════════════════════════════════════════════════ */
const Shimmer: React.FC<{ w?: string; h?: string; r?: string }> = ({
  w="100%", h="12px", r="4px",
}) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s linear infinite",
  }}/>
);

const SkeletonHero = () => (
  <div style={{ margin:"16px 16px 0", borderRadius:16, padding:20, background:"#e2e8f0" }}>
    <Shimmer w="55%" h="10px"/>
    <div style={{ display:"flex", gap:16, marginTop:12 }}>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{ flex:1 }}>
          <Shimmer w="40%" h="8px"/>
          <div style={{marginTop:6}}><Shimmer w="60%" h={i===2?"32px":"24px"}/></div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonActivities = () => (
  <div style={{ margin:"16px 16px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
    {[0,1,2,3].map(i=>(
      <div key={i} style={{ borderRadius:10, padding:12, background:"#f1f5f9", border:"1px solid #e2e8f0" }}>
        <div style={{ display:"flex", gap:8, marginBottom:6 }}>
          <Shimmer w="24px" h="24px" r="6px"/>
          <Shimmer w="60%" h="10px"/>
        </div>
        <Shimmer w="85%" h="8px"/>
      </div>
    ))}
  </div>
);

const SkeletonChart = () => (
  <div style={{ margin:"16px 16px 0", borderRadius:16, overflow:"hidden", border:"1px solid #e2e8f0" }}>
    <div style={{ padding:"12px 16px 4px" }}><Shimmer w="55%" h="11px"/></div>
    <div style={{ padding:12, display:"flex", alignItems:"flex-end", gap:2, height:170 }}>
      {Array.from({length:24},(_,i)=>(
        <div key={i} style={{
          flex:1, borderRadius:2,
          height:`${30+Math.sin(i*0.5)*25+Math.random()*20}%`,
          background:"linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
          backgroundSize:"200% 100%",
          animation:`shimmer 1.6s linear ${i*0.04}s infinite`,
        }}/>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   WEATHER SYMBOL
═══════════════════════════════════════════════════ */
const WeatherSymbol: React.FC<{ code: number; size?: number }> = ({ code, size=18 }) => {
  const s = { width: size, height: size };
  const p = { fill:"none", strokeWidth:1.8, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  if (code<=1)  return <svg {...s} viewBox="0 0 24 24" stroke="#f59e0b" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
  if (code<=3)  return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>;
  if (code>=51&&code<=82) return <svg {...s} viewBox="0 0 24 24" stroke="#60a5fa" {...p}><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 19v2M12 19v2M16 19v2"/></svg>;
  if (code>=95) return <svg {...s} viewBox="0 0 24 24" stroke="#a78bfa" {...p}><path d="M19 16.9A5 5 0 0015 9h-1V8a7 7 0 10-13 3M13 16l-4 6h6l-4 6"/></svg>;
  return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M3 8h18M3 12h18M3 16h18"/></svg>;
};

/* ═══════════════════════════════════════════════════
   OVERLAY CHART
   ── PERBAIKAN TOOLTIP ──
   Tooltip kini diposisikan mengikuti koordinat pixel
   titik TPXO pada canvas, bukan posisi raw mouse.
   Ini memastikan tooltip selalu muncul di atas/dekat
   garis grafik dan tidak keluar dari area chart.
═══════════════════════════════════════════════════ */
const OverlayChart: React.FC<{
  tpxoPredictions: Array<{ time: string; height: number }>;
  luwesObs: Array<{ recorded_at: string; level_m: number }>;
  dateStr: string;
}> = ({ tpxoPredictions, luwesObs, dateStr }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);
  const tooltipIdRef = useRef(`searibu-tip-${Math.random().toString(36).slice(2,7)}`);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    // ── Build TPXO hourly knots (x = WIB hours, 0–24 inclusive) ──
    const nextDateStr = addDays(dateStr, 1);
    const tpxoKnots: {x:number;y:number}[] = [];

    tpxoPredictions.forEach(p => {
      const w = parseToWIB(p.time);
      if (!w) return;
      if (w.wibDate === dateStr) {
        tpxoKnots.push({ x: w.wibHour + w.wibMinute / 60, y: p.height });
      } else if (w.wibDate === nextDateStr && w.wibHour === 0 && w.wibMinute === 0) {
        tpxoKnots.push({ x: 24, y: p.height });
      }
    });
    tpxoKnots.sort((a, b) => a.x - b.x);

    // ── Interpolate TPXO to per-minute resolution ──
    const tpxoPts = interpolateTPXOPerMinute(tpxoKnots);

    // ── Build Luwes scatter points ──
    const luwesPts: {x:number;y:number}[] = [];
    luwesObs.forEach(o => {
      const w = parseToWIB(o.recorded_at);
      if (w && w.wibDate === dateStr) {
        luwesPts.push({ x: w.wibHour + w.wibMinute / 60, y: o.level_m });
      }
    });

    // ── Nearest-neighbour lookup for tooltip ──
    const nearestY = (pts: {x:number;y:number}[], x: number, maxDist = 0.15): number | null => {
      if (!pts.length) return null;
      let best = pts[0], bestD = Math.abs(x - pts[0].x);
      for (const pt of pts) {
        const d = Math.abs(x - pt.x);
        if (d < bestD) { bestD = d; best = pt; }
      }
      return bestD <= maxDist ? best.y : null;
    };

    const nearestTPXO = (x: number): number | null => {
      return nearestY(tpxoPts, x, 3 / 60);
    };

    const wibNow = new Date(Date.now() + 7 * 3600_000);
    const isToday = dateStr === wibNow.toISOString().slice(0, 10);
    const nowX = isToday ? wibNow.getUTCHours() + wibNow.getUTCMinutes() / 60 : -1;

    const tooltipId = tooltipIdRef.current;

    const ensureTooltip = (): HTMLDivElement => {
      let el = document.getElementById(tooltipId) as HTMLDivElement | null;
      if (!el) {
        el = document.createElement("div");
        el.id = tooltipId;
        el.style.cssText = [
          "position:fixed","pointer-events:none","z-index:99999",
          `background:#0f172a`,"color:#f1f5f9","border-radius:8px",
          "padding:9px 13px",`font-family:${MONO}`,"font-size:12px",
          "box-shadow:0 4px 20px rgba(0,0,0,0.40)","min-width:110px",
          "line-height:1.65","display:none","border:1px solid rgba(255,255,255,0.08)",
          "transition:opacity 0.08s",
        ].join(";");
        document.body.appendChild(el);
      }
      return el;
    };

    const hideTooltip = () => {
      const el = document.getElementById(tooltipId);
      if (el) el.style.display = "none";
    };

    let cancelled = false;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "TPXO",
              type: "line" as any,
              data: tpxoPts,
              borderColor: "#0284c7",
              backgroundColor: (c: any) => {
                const { chart: { ctx: cx, chartArea: ca } } = c;
                if (!ca) return "rgba(2,132,199,0.08)";
                const g = cx.createLinearGradient(0, ca.top, 0, ca.bottom);
                g.addColorStop(0, "rgba(2,132,199,0.22)");
                g.addColorStop(1, "rgba(2,132,199,0)");
                return g;
              },
              borderWidth: 2,
              fill: true,
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 0,
              spanGaps: false,
              order: 2,
              parsing: false,
            },
            {
              label: "Luwes RAW",
              type: "scatter" as any,
              data: luwesPts,
              borderColor: "rgba(249,115,22,0.7)",
              backgroundColor: "rgba(249,115,22,0.55)",
              pointRadius: 1.5,
              pointHoverRadius: 0,
              order: 1,
              parsing: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: "index", intersect: false, axis: "x" },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          scales: {
            x: {
              type: "linear",
              min: 0,
              max: 24,
              grid: {
                color: (c: any) => c.tick.value % 3 === 0
                  ? "rgba(0,0,0,0.07)"
                  : "rgba(0,0,0,0.025)",
              },
              border: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { family: MONO, size: 10 },
                maxRotation: 0,
                stepSize: 1,
                autoSkip: false,
                includeBounds: true,
                callback: (v: any) => {
                  const n = Number(v);
                  if (n === 0)  return "00:00";
                  if (n === 24) return "24:00";
                  return n % 3 === 0 ? `${n.toString().padStart(2,"0")}:00` : "";
                },
              },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.04)" },
              border: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { family: MONO, size: 10 },
                callback: (v: any) => `${Number(v).toFixed(2)} m`,
              },
              title: {
                display: true,
                text: "Water Level (m)",
                color: "#94a3b8",
                font: { size: 9, family: MONO },
              },
            },
          },
          onHover: (event: any, _elements: any[], chart: any) => {
            if (!event?.native) { hideTooltip(); return; }

            const xVal = chart.scales.x?.getValueForPixel(event.x);
            if (xVal == null || xVal < 0 || xVal > 24) { hideTooltip(); return; }

            const tpxoVal  = nearestTPXO(xVal);
            const luwesVal = nearestY(luwesPts, xVal, 0.12);
            if (tpxoVal === null && luwesVal === null) { hideTooltip(); return; }

            const hh = Math.floor(xVal);
            const mm = Math.round((xVal - hh) * 60);
            const timeLabel = `${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")} WIB`;

            let html = `<div style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:0.04em;margin-bottom:6px;text-transform:uppercase;">${timeLabel}</div>`;
            if (tpxoVal !== null) {
              html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:${luwesVal!==null?3:0}px;">` +
                `<span style="width:8px;height:8px;border-radius:50%;background:#0284c7;flex-shrink:0;"></span>` +
                `<span style="color:#94a3b8;font-size:10px;">TPXO</span>` +
                `<span style="margin-left:auto;font-weight:700;color:#e2f0fb;">${tpxoVal.toFixed(3)} m</span></div>`;
            }
            if (luwesVal !== null) {
              html += `<div style="display:flex;align-items:center;gap:6px;">` +
                `<span style="width:8px;height:8px;border-radius:50%;background:#f97316;flex-shrink:0;"></span>` +
                `<span style="color:#94a3b8;font-size:10px;">Luwes</span>` +
                `<span style="margin-left:auto;font-weight:700;color:#fed7aa;">${luwesVal.toFixed(3)} m</span></div>`;
            }

            const tip = ensureTooltip();
            tip.innerHTML = html;
            tip.style.display = "block";

            // ── Anchor tooltip to the TPXO curve point on the canvas ──
            // Use canvas pixel coords instead of raw mouse position so the
            // tooltip always tracks the line and never drifts outside the chart.
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect    = canvas.getBoundingClientRect();

            // Get canvas-relative pixel coords for the current x value
            const xPx     = chart.scales.x.getPixelForValue(xVal);
            // Anchor Y to TPXO curve (preferred) or Luwes observation
            const yAnchor = tpxoVal !== null
              ? chart.scales.y.getPixelForValue(tpxoVal)
              : chart.scales.y.getPixelForValue(luwesVal!);

            // Normalise: canvas element size may differ from its CSS layout size
            const scaleX  = rect.width  / (canvas.offsetWidth  || 1);
            const scaleY  = rect.height / (canvas.offsetHeight || 1);
            const screenX = rect.left   + xPx     * scaleX;
            const screenY = rect.top    + yAnchor * scaleY;

            const tipW = 170;
            const tipH = tpxoVal !== null && luwesVal !== null ? 82 : 58;
            const gap  = 12;

            // Centre tooltip horizontally above the curve point
            let left = screenX - tipW / 2;
            let top  = screenY - tipH - gap;

            // Clamp within viewport horizontally
            if (left < 8)                           left = 8;
            if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;

            // Flip below the point if it would go off the top of the screen
            if (top < 8) top = screenY + gap;

            tip.style.left = `${left}px`;
            tip.style.top  = `${top}px`;
          },
        },
        plugins: [{
          id: "nowLine",
          afterDraw(chart: any) {
            if (nowX < 0 || nowX > 24) return;
            const { ctx: c, chartArea: ca, scales } = chart;
            const x = scales.x.getPixelForValue(nowX);
            if (x < ca.left || x > ca.right) return;
            c.save();
            c.beginPath(); c.moveTo(x, ca.top); c.lineTo(x, ca.bottom);
            c.strokeStyle = "rgba(239,68,68,0.70)"; c.lineWidth = 1.5;
            c.setLineDash([4, 4]); c.stroke();
            c.fillStyle = "rgba(239,68,68,0.9)"; c.font = `bold 9px ${MONO}`;
            c.textAlign = "center"; c.fillText("NOW", x, ca.top + 10);
            c.restore();
          },
        }],
      });

      canvasRef.current?.addEventListener("mouseleave", hideTooltip);
    });

    return () => {
      cancelled = true;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const tip = document.getElementById(tooltipIdRef.current);
      if (tip) tip.remove();
    };
  }, [tpxoPredictions, luwesObs, dateStr]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

/* ═══════════════════════════════════════════════════
   S-104 COMPLIANCE BADGE + EXPORT BUTTONS
═══════════════════════════════════════════════════ */
const S104Badge: React.FC<{
  coordinates: {lat:number;lon:number};
  selectedDate: string;
  language: "en"|"id";
}> = ({ coordinates, selectedDate, language: lang }) => {
  const [open,         setOpen]         = useState(false);
  const [loadingTpxo,  setLoadingTpxo]  = useState(false);
  const [loadingLuwes, setLoadingLuwes] = useState(false);
  const [error,        setError]        = useState<string|null>(null);

  const download = async (url: string, filename: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const d = await res.json().catch(()=>({error:`HTTP ${res.status}`}));
      throw new Error((d as any).error ?? `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleTpxo = async () => {
    setLoadingTpxo(true); setError(null);
    try {
      await download(
        `${API_BASE}/api/s104/export?lon=${coordinates.lon}&lat=${coordinates.lat}&date=${selectedDate}`,
        `searibu_s104_tpxo_${selectedDate}.h5`,
      );
    } catch(e: any) { setError(e.message); } finally { setLoadingTpxo(false); }
  };

  const handleLuwes = async () => {
    setLoadingLuwes(true); setError(null);
    try {
      await download(
        `${API_BASE}/api/s104/export/luwes?date=${selectedDate}`,
        `searibu_s104_luwes_${selectedDate}.h5`,
      );
    } catch(e: any) { setError(e.message); } finally { setLoadingLuwes(false); }
  };

  const infoRows = [
    { label: "Standard",      value: "IHO S-104 Ed.2.0.0" },
    { label: "Horizontal CRS",value: "EPSG:4326 (WGS 84)" },
    { label: "Vertical Datum",value: "MSL (IHO code 12)"  },
    { label: "TPXO data",     value: "dataDynamicity = 1 (astronomicalPrediction)" },
    { label: "Luwes data",    value: "dataDynamicity = 3 (observed)" },
    { label: "TOL correction",value: "−2.156 m (Luwes → MSL)" },
    { label: "Encoding",      value: "HDF5" },
    { label: "Adopted",       value: "December 2024" },
  ];

  return (
    <div>
      <div
        onClick={() => setOpen(p=>!p)}
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 14px", cursor:"pointer",
          background:"linear-gradient(135deg,#e0f2fe,#f0fdf4)",
          border:"1px solid #bae6fd", borderRadius:10,
        }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:28, height:28, borderRadius:6, background:"#0284c7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <CheckCircle size={14} color="#fff"/>
          </div>
          <div>
            <p style={{ fontFamily:SANS, fontSize:12, fontWeight:700, color:"#0284c7", margin:0 }}>IHO S-100 / S-104 Ed. 2.0</p>
            <p style={{ fontFamily:SANS, fontSize:10, color:"#0369a1", margin:0, opacity:0.8 }}>
              {lang==="en" ? "Water Level Standard" : "Standar Muka Air"}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={14} style={{color:"#0284c7",opacity:0.6}}/> : <ChevronDown size={14} style={{color:"#0284c7",opacity:0.6}}/>}
      </div>

      {open && (
        <div style={{ marginTop:6, padding:"12px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10 }}>
          <p style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:"#0f172a", marginBottom:8 }}>
            {lang==="en" ? "S-104 Compliance Details" : "Detail Kepatuhan S-104"}
          </p>
          <p style={{ fontFamily:SANS, fontSize:11, color:"#64748b", lineHeight:1.6, marginBottom:10 }}>
            {lang==="en"
              ? "This data complies with IHO S-104 Edition 2.0.0 (adopted December 2024). Export as HDF5 files compatible with ECDIS, HDFView, and s100py."
              : "Data ini memenuhi IHO S-104 Edition 2.0.0 (diadopsi Desember 2024). Ekspor ke file HDF5 yang kompatibel dengan ECDIS, HDFView, dan s100py."
            }
          </p>
          <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:8, marginBottom:10 }}>
            {infoRows.map(({label,value}) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", gap:8, padding:"3px 0" }}>
                <span style={{ fontFamily:SANS, fontSize:10, color:"#94a3b8" }}>{label}</span>
                <span style={{ fontFamily:'"Courier New",monospace', fontSize:10, color:"#475569", textAlign:"right" }}>{value}</span>
              </div>
            ))}
          </div>
          <a href="https://iho.int/en/s-100-based-product-specifications" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:SANS, fontSize:11, color:"#0284c7", textDecoration:"none", marginBottom:12 }}>
            {lang==="en" ? "IHO S-100 Resources" : "Sumber IHO S-100"} <ExternalLink size={10}/>
          </a>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
        <button onClick={handleTpxo} disabled={loadingTpxo}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", padding:"9px 14px", borderRadius:8, border:"1.5px solid #0284c722", background:loadingTpxo?"#f1f5f9":"#0284c710", color:loadingTpxo?"#94a3b8":"#0284c7", fontFamily:SANS, fontSize:12, fontWeight:600, cursor:loadingTpxo?"not-allowed":"pointer", transition:"all 0.18s" }}
          onMouseEnter={e => { if(!loadingTpxo){ e.currentTarget.style.background="#0284c720"; e.currentTarget.style.borderColor="#0284c755"; } }}
          onMouseLeave={e => { if(!loadingTpxo){ e.currentTarget.style.background="#0284c710"; e.currentTarget.style.borderColor="#0284c722"; } }}>
          {loadingTpxo ? <Loader2 size={13} style={{animation:"spin 0.7s linear infinite"}}/> : <FileDown size={13}/>}
          {loadingTpxo ? (lang==="en"?"Preparing...":"Menyiapkan...") : (lang==="en"?"Export S-104 (TPXO)":"Ekspor S-104 (TPXO)")}
        </button>
        <button onClick={handleLuwes} disabled={loadingLuwes}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", padding:"9px 14px", borderRadius:8, border:"1.5px solid #f9731622", background:loadingLuwes?"#f1f5f9":"#f9731610", color:loadingLuwes?"#94a3b8":"#f97316", fontFamily:SANS, fontSize:12, fontWeight:600, cursor:loadingLuwes?"not-allowed":"pointer", transition:"all 0.18s" }}
          onMouseEnter={e => { if(!loadingLuwes){ e.currentTarget.style.background="#f9731620"; e.currentTarget.style.borderColor="#f9731655"; } }}
          onMouseLeave={e => { if(!loadingLuwes){ e.currentTarget.style.background="#f9731610"; e.currentTarget.style.borderColor="#f9731622"; } }}>
          {loadingLuwes ? <Loader2 size={13} style={{animation:"spin 0.7s linear infinite"}}/> : <FileDown size={13}/>}
          {loadingLuwes ? (lang==="en"?"Preparing...":"Menyiapkan...") : (lang==="en"?"Export S-104 (Luwes)":"Ekspor S-104 (Luwes)")}
        </button>
      </div>

      {error && (
        <div style={{ marginTop:8, padding:"8px 12px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, display:"flex", alignItems:"flex-start", gap:8 }}>
          <span style={{ color:"#dc2626", fontSize:11, fontFamily:SANS, flex:1 }}>
            <strong>{lang==="en"?"Export failed":"Ekspor gagal"}:</strong> {error}
          </span>
          <button onClick={()=>setError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", padding:0, fontSize:14, lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN EXPORT — InfoPanel
═══════════════════════════════════════════════════ */
export const InfoPanel: React.FC<InfoPanelProps> = ({ coordinates, onClose }) => {
  const { language } = useLanguage();
  const lang = language as "en" | "id";

  const [tideData,         setTideData]         = useState<TideData|null>(null);
  const [weatherData,      setWeatherData]       = useState<WeatherData|null>(null);
  const [marineData,       setMarineData]        = useState<MarineData|null>(null);
  const [overlayData,      setOverlayData]       = useState<OverlayData|null>(null);
  const [loading,          setLoading]           = useState(false);
  const [error,            setError]             = useState<string|null>(null);
  const [weatherFromCache, setWeatherFromCache]  = useState(false);
  const [selDate,          setSelDate]           = useState<string>(todayISO());

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async (dateStr: string, forceRefresh = false) => {
    setLoading(true); setError(null);
    try {
      const today  = new Date();
      const fmtD   = (d: Date) => d.toISOString().split("T")[0];

      let wd: WeatherData|null = null;
      let md: MarineData|null  = null;
      let usedCache = false;

      if (!forceRefresh) {
        wd = readCache<WeatherData>(coordinates.lat, coordinates.lon, "wx");
        md = readCache<MarineData>(coordinates.lat, coordinates.lon, "marine");
        if (wd && md) usedCache = true;
      }

      if (!wd || !md) {
        const wxStart = new Date(today); wxStart.setDate(wxStart.getDate()-14);
        const wxEnd   = new Date(today); wxEnd.setDate(wxEnd.getDate()+15);

        const [wxRes, marRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${coordinates.lat}&longitude=${coordinates.lon}` +
            `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
            `&daily=sunrise,sunset` +
            `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
            `&timezone=auto` +
            `&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`
          ),
          fetch(
            `https://marine-api.open-meteo.com/v1/marine` +
            `?latitude=${coordinates.lat}&longitude=${coordinates.lon}` +
            `&hourly=wave_height,ocean_current_velocity` +
            `&current=wave_height,ocean_current_velocity` +
            `&timezone=auto` +
            `&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`
          ),
        ]);

        if (!wxRes.ok) throw new Error(lang==="en" ? "Weather service unavailable" : "Layanan cuaca tidak tersedia");
        wd = await wxRes.json() as WeatherData;
        writeCache(coordinates.lat, coordinates.lon, "wx", wd);
        if (marRes.ok) { md = await marRes.json() as MarineData; writeCache(coordinates.lat, coordinates.lon, "marine", md); }
        usedCache = false;
      }

      setWeatherData(wd); setMarineData(md); setWeatherFromCache(usedCache);

      const prevDay = addDays(dateStr, -1);
      const nextDay = addDays(dateStr, +1);

      const [tr, or_] = await Promise.all([
        fetch(`${API_BASE}/api/tide/prediction?lon=${coordinates.lon}&lat=${coordinates.lat}&start_date=${prevDay}&end_date=${nextDay}&interval_hours=1`),
        fetch(`${API_BASE}/api/luwes/overlay?date=${dateStr}&lon=${coordinates.lon}&lat=${coordinates.lat}`),
      ]);

      if (!tr.ok) {
        const e = await tr.json().catch(()=>({}));
        throw new Error((e as any).error ?? (lang==="en" ? "Tide service unavailable" : "Layanan pasut tidak tersedia"));
      }
      setTideData(await tr.json() as TideData);
      if (or_.ok) setOverlayData(await or_.json() as OverlayData);
      else setOverlayData(null);

    } catch(e) {
      setError(e instanceof Error ? e.message : (lang==="en" ? "Unknown error" : "Kesalahan tidak dikenal"));
    } finally {
      setLoading(false);
    }
  }, [coordinates, lang]);

  useEffect(() => {
    const d = todayISO(); setSelDate(d); fetchAll(d);
  }, [coordinates.lat, coordinates.lon]);

  /* ── Derived values ── */
  const getSunTimes = () => {
    if (!weatherData?.daily) return { sunrise:"--:--", sunset:"--:--" };
    const idx = weatherData.daily.time.findIndex(t => t===selDate);
    if (idx===-1) return { sunrise:"--:--", sunset:"--:--" };
    return { sunrise: fmtHHmm(weatherData.daily.sunrise[idx]), sunset: fmtHHmm(weatherData.daily.sunset[idx]) };
  };

  const buildRows = (): HourRow[] => {
    const tideMap = new Map<number,number>();
    tideData?.predictions.forEach(p => {
      const w = parseToWIB(p.time);
      if (!w) return;
      if (w.wibDate === selDate) {
        tideMap.set(w.wibHour, p.height);
      } else if (w.wibDate === addDays(selDate, 1) && w.wibHour === 0 && w.wibMinute === 0) {
        tideMap.set(24, p.height);
      }
    });

    const wxMap = new Map<string, Partial<HourRow>>();
    weatherData?.hourly.time.forEach((t,i) => {
      if (!t.startsWith(selDate)) return;
      const hh = new Date(t).getHours().toString().padStart(2,"0");
      const windKmh = weatherData.hourly.wind_speed_10m[i];
      wxMap.set(hh, {
        temp:    weatherData.hourly.temperature_2m[i],
        windSpd: windKmh!=null ? kmhToMs(windKmh) : null,
        windDir: weatherData.hourly.wind_direction_10m[i],
        wCode:   weatherData.hourly.weather_code[i],
      });
    });

    const marineMap = new Map<string,{waveH:number|null;currentSpd:number|null}>();
    marineData?.hourly.time.forEach((t,i) => {
      if (!t.startsWith(selDate)) return;
      const hh = new Date(t).getHours().toString().padStart(2,"0");
      marineMap.set(hh, { waveH:marineData.hourly.wave_height[i]??null, currentSpd:marineData.hourly.ocean_current_velocity[i]??null });
    });

    return Array.from({length:25},(_,i) => {
      const hh = i === 24 ? "24" : i.toString().padStart(2,"0");
      const label = i === 24 ? "24:00" : `${hh}:00`;
      const marine = marineMap.get(i === 24 ? "00" : hh) ?? { waveH:null, currentSpd:null };
      return {
        hour: label,
        tideH: tideMap.get(i) ?? null,
        temp: null, windSpd: null, windDir: null, wCode: null,
        ...(wxMap.get(i === 24 ? "00" : hh) ?? {}),
        ...marine,
      } as HourRow;
    });
  };

  const dailyStats = (() => {
    const hs = tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate).map(p=>p.height)??[];
    return hs.length ? { max:Math.max(...hs), min:Math.min(...hs) } : null;
  })();

  const luwesForChart = (overlayData?.luwes_obs??[])
    .filter(o => parseToWIB(o.recorded_at)?.wibDate===selDate)
    .map(o => ({...o, level_m: o.level_m+TOL_CORRECTION}));

  const hasLuwesObs = luwesForChart.length > 0;

  const luwesStatsCorrected = hasLuwesObs ? {
    max_m: Math.max(...luwesForChart.map(o=>o.level_m)),
    min_m: Math.min(...luwesForChart.map(o=>o.level_m)),
    count: luwesForChart.length,
  } : overlayData?.luwes_stats ?? null;

  const { sunrise, sunset } = getSunTimes();
  const rows    = buildRows();
  const current = weatherData?.current;
  const currentWindMs = current ? kmhToMs(current.wind_speed_10m) : null;
  const currentWaveH: number|null = marineData?.current?.wave_height != null ? marineData.current.wave_height : (marineData?.hourly.wave_height[0]??null);
  const currentCurrentSpd: number|null = marineData?.current?.ocean_current_velocity != null ? marineData.current.ocean_current_velocity : (marineData?.hourly.ocean_current_velocity[0]??null);

  const nowHour  = (() => { const wib=new Date(Date.now()+7*3600_000); return wib.getUTCHours().toString().padStart(2,"0"); })();
  const isToday  = selDate===todayISO();
  const activities = buildRecommendations(tideData, weatherData, marineData, selDate, lang);

  const selDateFmt = new Date(selDate+"T12:00:00Z").toLocaleDateString(
    lang==="en" ? "en-US" : "id-ID",
    { weekday:"long", day:"numeric", month:"long", year:"numeric" },
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value; setSelDate(d); fetchAll(d);
  };

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return (
    <div style={{
      width:"min(560px,100vw)", minWidth:"560px",
      height:"100%", display:"flex", flexDirection:"column",
      borderLeft:"1px solid #e2e8f0", fontFamily:SANS, background:"#f8fafc",
    }}>

      {/* ── Top Bar ── */}
      <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:"#0284c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Anchor size={13} color="#fff"/>
          </div>
          <h2 style={{ fontSize:14, fontWeight:700, color:"#0f172a", letterSpacing:"-0.01em", fontFamily:SANS, margin:0 }}>
            {lang==="en" ? "Marine Information" : "Informasi Kelautan"}
          </h2>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {weatherFromCache && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, color:"#d97706", background:"#fef9c3", border:"1px solid #fde68a", padding:"2px 8px", borderRadius:99, fontFamily:SANS }}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#d97706",flexShrink:0}}/>
              {lang==="en" ? "Cached weather" : "Cuaca tersimpan"}
            </span>
          )}
          <button onClick={() => { clearCache(coordinates.lat, coordinates.lon); fetchAll(selDate, true); }}
            title={lang==="en" ? "Refresh weather data" : "Perbarui data cuaca"}
            style={{ padding:6, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", color:"#94a3b8", display:"flex" }}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <RefreshCw size={13}/>
          </button>
          <button onClick={onClose}
            style={{ padding:6, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", color:"#94a3b8", display:"flex" }}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <X size={15}/>
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"#cbd5e1 transparent" }}>

        {loading && (
          <>
            <SkeletonHero/>
            <div style={{ margin:"16px 16px 0" }}>
              <Shimmer w="30%" h="9px"/>
              <div style={{marginTop:8}}><Shimmer w="100%" h="38px" r="12px"/></div>
            </div>
            <SkeletonActivities/>
            <SkeletonChart/>
          </>
        )}

        {error && !loading && (
          <div style={{ margin:16, padding:16, borderRadius:12, background:"#fef2f2", border:"1px solid #fca5a5" }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <AlertCircle size={15} style={{ color:"#f87171", flexShrink:0, marginTop:1 }}/>
              <div>
                <p style={{ color:"#dc2626", fontSize:13, fontWeight:600, marginBottom:4, fontFamily:SANS }}>
                  {lang==="en" ? "Unable to load data" : "Gagal memuat data"}
                </p>
                <p style={{ color:"#ef4444", fontSize:11, marginBottom:10, fontFamily:SANS }}>{error}</p>
                <button onClick={()=>fetchAll(selDate)} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#dc2626", background:"none", border:"none", cursor:"pointer", fontFamily:SANS, fontWeight:600 }}>
                  <RefreshCw size={11}/>{lang==="en" ? "Try again" : "Coba lagi"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Hero Card ── */}
            <div style={{ margin:"16px 16px 0", borderRadius:16, overflow:"hidden", background:"linear-gradient(135deg,#0c4a6e 0%,#075985 55%,#0369a1 100%)", boxShadow:"0 4px 20px rgba(3,105,161,0.20)" }}>
              <div style={{ padding:"12px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.10)" }}>
                <p style={{ fontFamily:MONO, color:"rgba(255,255,255,0.5)", fontSize:11, letterSpacing:"0.02em", margin:0 }}>
                  {Math.abs(coordinates.lat).toFixed(4)}°{coordinates.lat>=0?"N":"S"}&ensp;
                  {Math.abs(coordinates.lon).toFixed(4)}°{coordinates.lon>=0?"E":"W"}
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"14px 20px 10px" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                    <Sun size={11} color="#fde68a"/>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:SANS }}>
                      {lang==="en" ? "Sunrise" : "Terbit"}
                    </span>
                  </div>
                  <p style={{ fontFamily:MONO, color:"#fff", fontSize:20, fontWeight:700, lineHeight:1 }}>{sunrise}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2, fontFamily:SANS }}>WIB</p>
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                    <Moon size={11} color="#fca5a5"/>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:SANS }}>
                      {lang==="en" ? "Sunset" : "Terbenam"}
                    </span>
                  </div>
                  <p style={{ fontFamily:MONO, color:"#fff", fontSize:20, fontWeight:700, lineHeight:1 }}>{sunset}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2, fontFamily:SANS }}>WIB</p>
                </div>
                {current ? (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
                      <WeatherSymbol code={current.weather_code} size={20}/>
                    </div>
                    <p style={{ color:"#fff", fontSize:32, fontWeight:700, lineHeight:1, letterSpacing:"-0.03em", fontFamily:SANS }}>
                      {Math.round(current.temperature_2m)}°
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.6)", fontSize:10, marginTop:2, fontFamily:SANS }}>
                      {wmoLabel(current.weather_code, lang)}
                    </p>
                  </div>
                ) : <div/>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0, padding:"10px 20px 14px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ paddingRight:12, borderRight:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                    <Wind size={10} color="rgba(255,255,255,0.45)"/>
                    <span style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:SANS }}>
                      {lang==="en" ? "Wind" : "Angin"}
                    </span>
                  </div>
                  {currentWindMs!=null ? (
                    <>
                      <p style={{ fontFamily:MONO, color:"#fff", fontSize:18, fontWeight:700, lineHeight:1 }}>
                        {currentWindMs.toFixed(1)}<span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500, marginLeft:2 }}>m/s</span>
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2, fontFamily:SANS }}>
                        {windDirLabel(current!.wind_direction_10m)} ({current!.wind_direction_10m.toFixed(0)}°)
                      </p>
                    </>
                  ) : <p style={{ fontFamily:MONO, color:"rgba(255,255,255,0.3)", fontSize:14 }}>—</p>}
                </div>
                <div style={{ paddingLeft:12, paddingRight:12, borderRight:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                    <Waves size={10} color="rgba(255,255,255,0.45)"/>
                    <span style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:SANS }}>
                      {lang==="en" ? "Wave" : "Gelombang"}
                    </span>
                  </div>
                  {currentWaveH!=null ? (
                    <>
                      <p style={{ fontFamily:MONO, color:"#fff", fontSize:18, fontWeight:700, lineHeight:1 }}>
                        {currentWaveH.toFixed(2)}<span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500, marginLeft:2 }}>m</span>
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2, fontFamily:SANS }}>
                        {currentWaveH<0.5 ? (lang==="en"?"Calm":"Tenang") : currentWaveH<1.25 ? (lang==="en"?"Slight":"Kecil") : currentWaveH<2.5 ? (lang==="en"?"Moderate":"Sedang") : (lang==="en"?"Rough":"Kasar")}
                      </p>
                    </>
                  ) : <p style={{ fontFamily:MONO, color:"rgba(255,255,255,0.3)", fontSize:14 }}>—</p>}
                </div>
                <div style={{ paddingLeft:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                    <Navigation size={10} color="rgba(255,255,255,0.45)"/>
                    <span style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:SANS }}>
                      {lang==="en" ? "Current" : "Arus"}
                    </span>
                  </div>
                  {currentCurrentSpd!=null ? (
                    <>
                      <p style={{ fontFamily:MONO, color:"#fff", fontSize:18, fontWeight:700, lineHeight:1 }}>
                        {currentCurrentSpd.toFixed(2)}<span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500, marginLeft:2 }}>m/s</span>
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2, fontFamily:SANS }}>
                        {currentCurrentSpd<0.25 ? (lang==="en"?"Weak":"Lemah") : currentCurrentSpd<0.75 ? (lang==="en"?"Moderate":"Sedang") : (lang==="en"?"Strong":"Kuat")}
                      </p>
                    </>
                  ) : <p style={{ fontFamily:MONO, color:"rgba(255,255,255,0.3)", fontSize:14 }}>—</p>}
                </div>
              </div>
            </div>

            {/* ── Date Picker ── */}
            <div style={{ padding:"16px 16px 0" }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color:"#94a3b8", marginBottom:6, fontFamily:SANS }}>
                {lang==="en" ? "Select Date" : "Pilih Tanggal"}
              </p>
              <input type="date" value={selDate} onChange={handleDateChange}
                style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:13, fontWeight:600, fontFamily:SANS, color:"#0f172a", background:"#fff", cursor:"pointer", outline:"none", boxSizing:"border-box" }}
                onFocus={e=>{e.currentTarget.style.borderColor="#0284c7";e.currentTarget.style.boxShadow="0 0 0 3px rgba(2,132,199,0.12)";}}
                onBlur={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="none";}}
              />
            </div>

            {/* ── Activity Recommendations ── */}
            <div style={{ padding:"16px 16px 0" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8, fontFamily:SANS }}>
                {lang==="en" ? "Activity Guide" : "Panduan Aktivitas"}
              </p>
              <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                {(["safe","caution","danger"] as const).map(s => {
                  const count = activities.filter(a=>a.status===s).length;
                  const cfg   = statusStyles[s];
                  return (
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:5, background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:99, padding:"4px 10px" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:cfg.dot, flexShrink:0 }}/>
                      <span style={{ fontFamily:SANS, fontSize:11, fontWeight:700, color:cfg.text }}>{count}</span>
                      <span style={{ fontFamily:SANS, fontSize:11, color:cfg.text, opacity:0.8 }}>{cfg.label[lang==="en"?0:1]}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
                {activities.map((act, idx) => {
                  const st     = statusStyles[act.status];
                  const isLast = idx===activities.length-1;
                  return (
                    <div key={act.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom: isLast?"none":"1px solid #f1f5f9", background: idx%2===0?"#fff":"#fafafa" }}>
                      <div style={{ width:5, flexShrink:0, alignSelf:"stretch", background:st.dot, borderRadius:99, minHeight:32 }}/>
                      <div style={{ display:"flex", alignItems:"center", gap:7, flex:"0 0 140px", minWidth:0 }}>
                        <span style={{ color:st.dot, flexShrink:0 }}>{act.icon}</span>
                        <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {lang==="en" ? act.labelEn : act.labelId}
                        </span>
                      </div>
                      <p style={{ fontFamily:SANS, fontSize:11, color:"#64748b", lineHeight:1.4, flex:1, margin:0 }}>
                        {lang==="en" ? act.reasonEn : act.reasonId}
                      </p>
                      <div style={{ flexShrink:0, background:st.bg, border:`1px solid ${st.border}`, borderRadius:99, padding:"3px 10px", fontFamily:SANS, fontSize:10, fontWeight:700, color:st.text, whiteSpace:"nowrap" }}>
                        {st.label[lang==="en"?0:1]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Overlay Chart ── */}
            <div style={{ padding:"16px 16px 0" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8, fontFamily:SANS }}>
                {hasLuwesObs
                  ? (lang==="en" ? "Observation vs TPXO Prediction" : "Observasi vs Prediksi TPXO")
                  : (lang==="en" ? "Tide Levels — 00:00–24:00 WIB (TPXO)" : "Tinggi Pasut Harian — 00:00–24:00 WIB (TPXO)")
                }
              </p>
              <div style={{ borderRadius:16, overflow:"hidden", background:"#fff", border:"1px solid #e2e8f0" }}>
                <div style={{ padding:"12px 16px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"#475569", fontFamily:SANS }}>{selDateFmt}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:"#0284c7", fontWeight:700, background:"#e0f2fe", padding:"2px 8px", borderRadius:99, fontFamily:SANS }}>
                      <span style={{ display:"inline-block", width:16, height:2, background:"#0284c7", borderRadius:1 }}/>TPXO
                    </span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:hasLuwesObs?"#f97316":"#94a3b8", fontWeight:700, background:hasLuwesObs?"#ffedd5":"#f1f5f9", padding:"2px 8px", borderRadius:99, fontFamily:SANS }}>
                      <span style={{ display:"inline-block", width:6, height:6, background:hasLuwesObs?"#f97316":"#94a3b8", borderRadius:"50%" }}/>
                      Luwes{!hasLuwesObs && <span style={{opacity:0.6}}>&nbsp;—</span>}
                    </span>
                    {isToday && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:"#ef4444", fontWeight:700, background:"#fef2f2", padding:"2px 8px", borderRadius:99, fontFamily:SANS }}>
                        <span style={{ display:"inline-block", width:12, height:1.5, background:"#ef4444", borderRadius:1 }}/>Now
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ height:340, padding:"4px 8px 14px" }}>
                  <OverlayChart
                    tpxoPredictions={tideData?.predictions??[]}
                    luwesObs={luwesForChart}
                    dateStr={selDate}
                  />
                </div>
                {overlayData && (
                  <div style={{ padding:"8px 16px", borderTop:"1px solid #f1f5f9", background:"#fafafa", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:"#94a3b8", fontFamily:MONO }}>
                      {lang==="en" ? "Luwes station records" : "Data stasiun Luwes"}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, fontFamily:MONO, color:hasLuwesObs?"#f97316":"#94a3b8", background:hasLuwesObs?"#ffedd5":"#f1f5f9", padding:"1px 8px", borderRadius:99 }}>
                      {overlayData.luwes_stats.count} obs
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tide Stats ── */}
            {(dailyStats || hasLuwesObs) && (
              <div style={{ padding:"12px 16px 0" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {dailyStats && (
                    <>
                      <div style={{ borderRadius:12, padding:"12px 16px", background:"#e0f2fe", border:"1.5px solid #bae6fd" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"#0284c7", opacity:0.8, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.03em", fontFamily:SANS }}>TPXO · {lang==="en"?"High":"Tertinggi"}</p>
                        <p style={{ fontFamily:MONO, color:"#0284c7", fontSize:21, fontWeight:700, lineHeight:1 }}>
                          {dailyStats.max>0?"+":""}{dailyStats.max.toFixed(3)} m
                        </p>
                      </div>
                      <div style={{ borderRadius:12, padding:"12px 16px", background:"#fef3c7", border:"1.5px solid #fde68a" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"#d97706", opacity:0.8, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.03em", fontFamily:SANS }}>TPXO · {lang==="en"?"Low":"Terendah"}</p>
                        <p style={{ fontFamily:MONO, color:"#d97706", fontSize:21, fontWeight:700, lineHeight:1 }}>
                          {dailyStats.min>0?"+":""}{dailyStats.min.toFixed(3)} m
                        </p>
                      </div>
                    </>
                  )}
                  {hasLuwesObs && luwesStatsCorrected && luwesStatsCorrected.max_m!=null && (
                    <>
                      <div style={{ borderRadius:12, padding:"12px 16px", background:"#ffedd5", border:"1.5px solid #fed7aa" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"#f97316", opacity:0.8, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.03em", fontFamily:SANS }}>Luwes · {lang==="en"?"Max (TOL)":"Maks (TOL)"}</p>
                        <p style={{ fontFamily:MONO, color:"#ea580c", fontSize:21, fontWeight:700, lineHeight:1 }}>{luwesStatsCorrected.max_m!.toFixed(3)} m</p>
                      </div>
                      <div style={{ borderRadius:12, padding:"12px 16px", background:"#fef9c3", border:"1.5px solid #fef08a" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"#ca8a04", opacity:0.8, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.03em", fontFamily:SANS }}>Luwes · {lang==="en"?"Min (TOL)":"Min (TOL)"}</p>
                        <p style={{ fontFamily:MONO, color:"#b45309", fontSize:21, fontWeight:700, lineHeight:1 }}>{luwesStatsCorrected.min_m!.toFixed(3)} m</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Hourly Table (00:00 – 24:00) ── */}
            <div style={{ padding:"16px 16px 0" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8, fontFamily:SANS }}>
                {lang==="en" ? "Hourly Data (00:00–24:00 WIB)" : "Data Per Jam (00:00–24:00 WIB)"}
              </p>
              <div style={{ borderRadius:16, overflow:"hidden", background:"#fff", border:"1px solid #e2e8f0" }}>
                <div style={{ display:"grid", gridTemplateColumns:"48px 24px 56px 42px 64px 46px 46px", padding:"6px 16px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9", fontSize:10, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color:"#94a3b8", fontFamily:SANS }}>
                  <span>{lang==="en"?"Time":"Waktu"}</span>
                  <span style={{textAlign:"center"}}>Wx</span>
                  <span style={{textAlign:"right"}}>{lang==="en"?"Tide (m)":"Pasut (m)"}</span>
                  <span style={{textAlign:"right"}}>{lang==="en"?"Temp":"Suhu"}</span>
                  <span style={{textAlign:"right"}}>{lang==="en"?"Wind m/s":"Angin m/s"}</span>
                  <span style={{textAlign:"right"}}>{lang==="en"?"Wave":"Gel."}</span>
                  <span style={{textAlign:"right"}}>{lang==="en"?"Curr.":"Arus"}</span>
                </div>
                <div style={{ maxHeight:440, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"#e2e8f0 transparent" }}>
                  {rows.map((row, idx) => {
                    const hl     = isToday && row.hour.startsWith(nowHour+":00");
                    const is24   = row.hour === "24:00";
                    const isMax  = !is24 && dailyStats && row.tideH!==null && Math.abs(row.tideH-dailyStats.max)<0.015;
                    const isMin  = !is24 && dailyStats && row.tideH!==null && Math.abs(row.tideH-dailyStats.min)<0.015;
                    const waveC  = row.waveH==null?"#64748b": row.waveH<0.5?"#16a34a": row.waveH<1.25?"#d97706":"#dc2626";
                    const currC  = row.currentSpd==null?"#64748b": row.currentSpd<0.25?"#16a34a": row.currentSpd<0.75?"#d97706":"#dc2626";
                    return (
                      <div key={idx} style={{
                        display:"grid", gridTemplateColumns:"48px 24px 56px 42px 64px 46px 46px",
                        padding:"6px 16px", alignItems:"center",
                        borderBottom: is24 ? "none" : "1px solid #f8fafc",
                        background: is24
                          ? "linear-gradient(90deg,#f0f9ff,#f8fafc)"
                          : hl
                          ? "linear-gradient(90deg,#e0f2fe,#f0f9ff)"
                          : idx%2===0?"#fff":"#fafafa",
                        borderTop: is24 ? "1px dashed #bae6fd" : "none",
                      }}>
                        <span style={{ fontFamily:MONO, fontSize:11, fontWeight:hl||is24?700:500, color:is24?"#0284c7":hl?"#0284c7":"#64748b" }}>
                          {row.hour}
                        </span>
                        <div style={{display:"flex",justifyContent:"center"}}>{row.wCode!==null && !is24 && <WeatherSymbol code={row.wCode} size={12}/>}</div>
                        <span style={{ fontFamily:MONO, fontSize:11, textAlign:"right", fontWeight:isMax||isMin||is24?700:500, color:is24?"#0284c7":isMax?"#0284c7":isMin?"#d97706":"#334155" }}>
                          {row.tideH!==null ? (row.tideH>=0?"+":"")+row.tideH.toFixed(3) : "—"}
                        </span>
                        <span style={{ fontFamily:MONO, fontSize:11, textAlign:"right", color:"#475569" }}>{row.temp!==null&&!is24?`${Math.round(row.temp)}°`:"—"}</span>
                        <span style={{ fontFamily:MONO, fontSize:11, textAlign:"right", color:"#475569" }}>
                          {row.windSpd!==null && !is24 ? (
                            <span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
                              <span style={{color:"#94a3b8",fontSize:10,fontFamily:SANS}}>{row.windDir!==null?windDirLabel(row.windDir):""}</span>
                              {row.windSpd.toFixed(1)}
                            </span>
                          ) : "—"}
                        </span>
                        <span style={{ fontFamily:MONO, fontSize:11, textAlign:"right", color:waveC, fontWeight:row.waveH!=null&&row.waveH>=1.25?600:400 }}>
                          {row.waveH!==null&&!is24?row.waveH.toFixed(2):"—"}
                        </span>
                        <span style={{ fontFamily:MONO, fontSize:11, textAlign:"right", color:currC, fontWeight:row.currentSpd!=null&&row.currentSpd>=0.75?600:400 }}>
                          {row.currentSpd!==null&&!is24?row.currentSpd.toFixed(2):"—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:"6px 16px", borderTop:"1px solid #f1f5f9", background:"#fafafa", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  {[
                    { color:"#16a34a", label:lang==="en"?"Low wave/current":"Gelombang/arus rendah" },
                    { color:"#d97706", label:lang==="en"?"Moderate":"Sedang" },
                    { color:"#dc2626", label:lang==="en"?"High":"Tinggi" },
                  ].map(({color,label})=>(
                    <div key={color} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:"#94a3b8", fontFamily:SANS }}>{label}</span>
                    </div>
                  ))}
                  <span style={{ fontSize:10, color:"#cbd5e1", fontFamily:SANS, marginLeft:"auto" }}>
                    {lang==="en" ? "Wind & current in m/s · 24:00 = tide continuity" : "Angin & arus dalam m/s · 24:00 = kontinuitas pasut"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── IHO S-104 Compliance Badge + Export ── */}
            <div style={{ padding:"16px 16px 0" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8, fontFamily:SANS }}>
                {lang==="en" ? "IHO S-100 / S-104 Compliance" : "Kepatuhan IHO S-100 / S-104"}
              </p>
              <S104Badge coordinates={coordinates} selectedDate={selDate} language={lang}/>
            </div>

            {/* ── Metadata Footer ── */}
            <div style={{ margin:"16px 16px 24px", borderRadius:12, padding:"12px 16px", background:"#f1f5f9", border:"1px solid #e2e8f0" }}>
              {([
                [lang==="en"?"Tide model":"Model pasut",     tideData?.metadata.model],
                ["Datum",                                     tideData?.metadata.datum],
                ...(tideData ? [[lang==="en"?"Nearest grid":"Grid terdekat",
                  `${tideData.grid.lat.toFixed(3)}°, ${tideData.grid.lon.toFixed(3)}° · ${tideData.grid.distance_km.toFixed(1)} km`]] : []),
                [lang==="en"?"Weather":"Cuaca",              "Open-Meteo API"],
                [lang==="en"?"Weather coverage":"Cakupan cuaca",
                  lang==="en"?"Today ±14 days (cached)":"Hari ini ±14 hari (cache)"],
                [lang==="en"?"Obs. station":"Stasiun obs.",  overlayData?.imei ? `IMEI ${overlayData.imei}` : "—"],
                ["TOL correction",                           "-2.156 m (Luwes → MSL TPXO9)"],
                [lang==="en"?"S-104 standard":"Standar S-104", "IHO S-104 Ed.2.0.0 (Dec 2024)"],
                [lang==="en"?"Chart resolution":"Resolusi grafik", lang==="en"?"Per-minute (cubic spline)":"Per menit (cubic spline)"],
              ] as [string, string|undefined][]).map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontFamily:MONO, fontSize:11, color:"#94a3b8", fontWeight:500 }}>{k}</span>
                  <span style={{ fontFamily:MONO, fontSize:11, color:"#64748b" }}>{v??"—"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer { from { background-position:-200% 0; } to { background-position:200% 0; } }
        @keyframes spin    { to   { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};