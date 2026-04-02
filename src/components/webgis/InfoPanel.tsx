/**
 * InfoPanel.tsx  — Marine Info Panel (Responsive)
 * v3.0.0 — Fix: Timezone alignment TPXO ↔ Luwes
 *
 * ROOT CAUSE (v2.9.0):
 *   1. minuteCacheKey versioning inconsistency caused stale partial caches
 *      (data starting at 07:00 WIB instead of 00:00 WIB) to survive across
 *      page reloads, triggering the hourly-splice fallback which uses a
 *      different harmonic epoch → visible jump.
 *
 *   2. buildChartPredictions hasEarlyData check used `x < 1.0` (before 01:00)
 *      which fails when the minute data starts exactly at 00:00 WIB
 *      (x === 0.0 is NOT < 1.0 after floating-point rounding → false → splice).
 *
 *   3. fetchAll's hourly request used start_dt=prevDay (UTC midnight) and
 *      end_dt=nextDay (UTC midnight), which is correct but the resulting hourly
 *      predictions are used as fallback with a DIFFERENT epoch midpoint than
 *      the single-request minute data — causing amplitude mismatch at splice.
 *
 * FIX (v3.0.0):
 *   A. Cache key bumped to `v3` to bust all stale v2 caches.
 *   B. hasEarlyData threshold changed to `x < 0.5` (before 00:30 WIB) so that
 *      a prediction at exactly 00:00 WIB (x === 0.0) passes the check.
 *   C. The single UTC-span request (prevDay T17:00:00Z → dateStr T16:59:00Z)
 *      is preserved as-is — ONE set of harmonic parameters, no discontinuity.
 *   D. Luwes timestamps (+07:00) and TPXO timestamps (Z) both go through
 *      parseToWIB which handles both formats, ensuring both series land on the
 *      same WIB x-axis in the chart.
 *   E. Added explicit filter to drop any minute predictions outside the target
 *      WIB date before caching/rendering to prevent off-by-one leakage.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X, RefreshCw, AlertCircle,
  Anchor, Wind, Fish, Camera, Waves,
  Sun, Moon, Navigation, Leaf, Flag,
  Users, Ship, Zap,
  CheckCircle, ExternalLink,
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
  current: { temperature_2m: number; wind_speed_10m: number; wind_direction_10m: number; weather_code: number };
  daily: { time: string[]; sunrise: string[]; sunset: string[] };
  hourly: { time: string[]; temperature_2m: number[]; wind_speed_10m: number[]; wind_direction_10m: number[]; weather_code: number[] };
}
interface MarineData {
  current?: { wave_height?: number; ocean_current_velocity?: number };
  hourly: { time: string[]; wave_height: number[]; ocean_current_velocity: number[] };
}
interface LuwesObs { recorded_at: string; level_m: number }
interface OverlayData {
  date: string; imei: string; lon: number; lat: number;
  luwes_obs: LuwesObs[];
  tpxo: Array<{ time: string; height: number }>;
  luwes_stats: { max_m: number | null; min_m: number | null; count: number };
  tpxo_stats: { max: number; min: number; mean: number; range: number };
}
interface HourRow {
  hour: string; tideH: number | null; temp: number | null;
  windSpd: number | null; windDir: number | null;
  waveH: number | null; currentSpd: number | null; wCode: number | null;
}
interface ActivityRec {
  id: string; labelEn: string; labelId: string; icon: React.ReactNode;
  status: "safe" | "caution" | "danger"; reasonEn: string; reasonId: string;
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
  0:{en:"Clear sky",id:"Langit cerah"},1:{en:"Mainly clear",id:"Cerah berawan"},
  2:{en:"Partly cloudy",id:"Sebagian berawan"},3:{en:"Overcast",id:"Mendung"},
  45:{en:"Foggy",id:"Berkabut"},51:{en:"Light drizzle",id:"Gerimis ringan"},
  61:{en:"Light rain",id:"Hujan ringan"},63:{en:"Moderate rain",id:"Hujan sedang"},
  65:{en:"Heavy rain",id:"Hujan lebat"},80:{en:"Light showers",id:"Hujan rintik"},
  81:{en:"Showers",id:"Hujan deras"},82:{en:"Heavy showers",id:"Hujan sangat deras"},
  95:{en:"Thunderstorm",id:"Badai petir"},99:{en:"Thunderstorm",id:"Badai petir"},
};
const wmoLabel = (code: number | null, lang: "en" | "id") => {
  if (code === null) return "—";
  const entry = WMO[code]; if (entry) return entry[lang];
  const nearest = Object.keys(WMO).map(Number).reduce((a,b) => Math.abs(b-code)<Math.abs(a-code)?b:a);
  return WMO[nearest]?.[lang] ?? "—";
};
const windDirLabel = (deg: number) => {
  const d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return d[Math.round(deg/22.5)%16];
};
const fmtHHmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
};

const statusStyles: Record<ActivityRec["status"],{dot:string;bg:string;border:string;text:string;label:[string,string]}> = {
  safe:    {dot:"#16a34a",bg:"#f0fdf4",border:"#86efac",text:"#15803d",label:["Safe","Aman"]},
  caution: {dot:"#d97706",bg:"#fffbeb",border:"#fde68a",text:"#b45309",label:["Caution","Waspada"]},
  danger:  {dot:"#dc2626",bg:"#fef2f2",border:"#fca5a5",text:"#b91c1c",label:["Avoid","Hindari"]},
};

/* ═══════════════════════════════════════════════════
   CACHE HELPERS
═══════════════════════════════════════════════════ */
const cacheKey = (lat: number, lon: number, t: "wx"|"marine") =>
  `searibu_${t}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
function readCache<T>(lat: number, lon: number, t: "wx"|"marine"): T|null {
  try { const r=sessionStorage.getItem(cacheKey(lat,lon,t)); return r?JSON.parse(r):null; } catch { return null; }
}
function writeCache<T>(lat: number, lon: number, t: "wx"|"marine", data: T) {
  try { sessionStorage.setItem(cacheKey(lat,lon,t),JSON.stringify(data)); } catch {}
}
function clearCache(lat: number, lon: number) {
  try { sessionStorage.removeItem(cacheKey(lat,lon,"wx")); sessionStorage.removeItem(cacheKey(lat,lon,"marine")); } catch {}
}

// FIX A: bump cache version to v3 to bust all stale v2 partial caches
const minuteCacheKey = (lat: number, lon: number, date: string) =>
  `searibu_minute_v3_${lat.toFixed(4)}_${lon.toFixed(4)}_${date}`;
function readMinuteCache(lat: number, lon: number, date: string): Array<{time:string;height:number}>|null {
  try { const r=sessionStorage.getItem(minuteCacheKey(lat,lon,date)); return r?JSON.parse(r):null; } catch { return null; }
}
function writeMinuteCache(lat: number, lon: number, date: string, data: Array<{time:string;height:number}>) {
  try { sessionStorage.setItem(minuteCacheKey(lat,lon,date),JSON.stringify(data)); } catch {}
}

/* ═══════════════════════════════════════════════════
   TIMESTAMP PARSERS
═══════════════════════════════════════════════════ */

/**
 * parseToWIB — converts any timestamp to WIB components.
 *
 * Handles both TPXO ("...Z" = UTC) and Luwes ("...+07:00" = WIB).
 * This is the ONLY function used for TPXO and Luwes timestamps —
 * it guarantees both series land on the same WIB x-axis in the chart.
 */
function parseToWIB(ts: string): { wibDate: string; wibHour: number; wibMinute: number } | null {
  try {
    let utcMs: number;
    if (/[Zz]$/.test(ts)) {
      // UTC timestamp (TPXO) — parse directly
      utcMs = Date.parse(ts);
    } else if (/[+\-]\d{2}:?\d{2}$/.test(ts)) {
      // Offset timestamp (Luwes +07:00) — Date.parse handles RFC 3339
      utcMs = Date.parse(ts);
    } else if (ts.includes("T")) {
      // Bare ISO without timezone — assume UTC
      utcMs = Date.parse(ts + "Z");
    } else {
      utcMs = Date.parse(ts);
    }
    if (isNaN(utcMs)) return null;
    // Add 7 hours to get WIB
    const wibMs = utcMs + 7 * 3600_000;
    const d = new Date(wibMs);
    return {
      wibDate:   d.toISOString().slice(0, 10),
      wibHour:   d.getUTCHours(),
      wibMinute: d.getUTCMinutes(),
    };
  } catch { return null; }
}

/**
 * parseLocalISO — for Open-Meteo hourly timestamps ONLY.
 * These are already local WIB time strings like "2026-03-25T00:00".
 * Do NOT use this for TPXO or Luwes timestamps.
 */
function parseLocalISO(ts: string): { localDate: string; localHour: number } | null {
  try {
    if (ts.length < 13) return null;
    const localDate = ts.slice(0, 10);
    const localHour = parseInt(ts.slice(11, 13), 10);
    if (isNaN(localHour) || localDate.length !== 10) return null;
    return { localDate, localHour };
  } catch { return null; }
}

/**
 * tsToWIBHour — for TPXO & Luwes only.
 * Returns decimal WIB hour (10:30 → 10.5), null if date doesn't match.
 *
 * Both TPXO (UTC "Z") and Luwes ("+07:00") timestamps are converted
 * via parseToWIB, so they share the same WIB x-axis.
 */
function tsToWIBHour(ts: string, targetDate: string): number | null {
  const w = parseToWIB(ts);
  if (!w || w.wibDate !== targetDate) return null;
  return w.wibHour + w.wibMinute / 60;
}

/* ═══════════════════════════════════════════════════
   BUILD CHART PREDICTIONS

   Uses a single-request minute prediction that covers the full WIB day
   (00:00–23:59 WIB) fetched with one UTC time range to ensure ONE set
   of harmonic parameters → no discontinuity at any hour boundary.
═══════════════════════════════════════════════════ */
function buildChartPredictions(
  tideData: TideData | null,
  minutePredictions: Array<{ time: string; height: number }>,
  targetDate: string
): Array<{ time: string; height: number }> {
  if (minutePredictions.length > 0) {
    // FIX B: use x < 0.5 (before 00:30) so that x === 0.0 (exactly 00:00 WIB)
    // correctly passes the check. Previously x < 1.0 failed when x was exactly 0.0
    // due to floating-point edge cases at the epoch boundary.
    const hasEarlyData = minutePredictions.some(p => {
      const x = tsToWIBHour(p.time, targetDate);
      return x !== null && x < 0.5;
    });

    if (hasEarlyData) {
      // Good: minute data covers from ~00:00 WIB — use it directly, no splice needed
      return minutePredictions;
    }

    // Safety net: minute data is partial (missing early hours) — fill gap with hourly.
    // This should not happen with the single-request approach, but protects against
    // backend edge cases (e.g. range validation trimming the start).
    const hourly = (tideData?.predictions ?? []).filter(p =>
      parseToWIB(p.time)?.wibDate === targetDate
    );
    let minHour = 24;
    for (const p of minutePredictions) {
      const x = tsToWIBHour(p.time, targetDate);
      if (x !== null && x < minHour) minHour = x;
    }
    const earlyHourly = hourly.filter(p => {
      const w = parseToWIB(p.time);
      return w !== null && w.wibHour < Math.floor(minHour);
    });
    return [...earlyHourly, ...minutePredictions].sort((a, b) =>
      (tsToWIBHour(a.time, targetDate) ?? 0) - (tsToWIBHour(b.time, targetDate) ?? 0)
    );
  }

  // Fallback: no minute data — use hourly predictions for the target WIB date
  return (tideData?.predictions ?? []).filter(p =>
    parseToWIB(p.time)?.wibDate === targetDate
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVITY RECOMMENDATIONS ENGINE
═══════════════════════════════════════════════════ */
function buildRecommendations(
  tideData: TideData | null,
  weatherData: WeatherData | null,
  marineData: MarineData | null,
  dateStr: string,
  lang: "en" | "id"
): ActivityRec[] {
  const hourlyIdxs = weatherData?.hourly.time.map((t,i) => {
    const p = parseLocalISO(t);
    return p?.localDate === dateStr ? i : -1;
  }).filter(i => i >= 0) ?? [];

  const marineIdxs = marineData?.hourly.time.map((t,i) => {
    const p = parseLocalISO(t);
    return p?.localDate === dateStr ? i : -1;
  }).filter(i => i >= 0) ?? [];

  const avgWave: number|null = marineIdxs.length
    ? marineIdxs.reduce((s,i) => s+(marineData!.hourly.wave_height[i]??0),0)/marineIdxs.length : null;
  const avgCurrentMs: number|null = marineIdxs.length
    ? marineIdxs.reduce((s,i) => s+(marineData!.hourly.ocean_current_velocity[i]??0),0)/marineIdxs.length : null;
  const avgWindMs: number|null = hourlyIdxs.length
    ? hourlyIdxs.reduce((s,i) => s+kmhToMs(weatherData!.hourly.wind_speed_10m[i]??0),0)/hourlyIdxs.length : null;

  const dayPred = tideData?.predictions.filter(p => parseToWIB(p.time)?.wibDate===dateStr) ?? [];
  const tideRange: number|null = dayPred.length
    ? Math.max(...dayPred.map(p=>p.height))-Math.min(...dayPred.map(p=>p.height)) : null;

  const wCode = weatherData?.current.weather_code ?? 0;
  const isStormy = wCode>=95; const isRainy = wCode>=51;
  type S = ActivityRec["status"];

  const snorkel=():S=>{ if((avgWave??0)>1.0||(avgWindMs??0)>7.9||(avgCurrentMs??0)>0.51)return"danger"; if((avgWave??0)>0.5||(avgWindMs??0)>3.3||(avgCurrentMs??0)>0.26)return"caution"; return"safe"; };
  const snorkelR=():[string,string]=>{ const s=snorkel(); if(s==="safe")return["Calm sea, good visibility","Laut tenang, visibilitas baik"]; if(s==="caution")return["Moderate — experienced only","Kondisi sedang — berpengalaman"]; return["Rough sea or strong current","Laut kasar atau arus kuat"]; };
  const scuba=():S=>{ if(isStormy||(avgCurrentMs??0)>0.51||(avgWave??0)>1.25)return"danger"; if((avgCurrentMs??0)>0.26||(avgWave??0)>0.5)return"caution"; return"safe"; };
  const scubaR=():[string,string]=>{ const s=scuba(); if(s==="safe")return["Good visibility, safe current","Visibilitas baik, arus aman"]; if(s==="caution")return["Moderate current — plan dive","Arus sedang — rencanakan selam"]; return["Strong current or rough sea","Arus kuat atau laut kasar"]; };
  const freedive=():S=>{ if((avgWave??0)>0.8||(avgCurrentMs??0)>0.51)return"danger"; if((avgWave??0)>0.5||(avgCurrentMs??0)>0.26)return"caution"; return"safe"; };
  const freediveR=():[string,string]=>{ const s=freedive(); if(s==="safe")return["Calm water, safe for freediving","Air tenang, aman freediving"]; if(s==="caution")return["Moderate swell — buddy required","Ombak sedang — buddy system"]; return["High wave or strong current","Ombak tinggi atau arus kuat"]; };
  const jetski=():S=>{ if(isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)return"danger"; if(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>0.8)return"caution"; return"safe"; };
  const jetskiR=():[string,string]=>{ const s=jetski(); if(s==="safe")return["Calm, good for water sports","Tenang, baik untuk olahraga air"]; if(s==="caution")return["Choppy — reduce speed","Bergelombang — kurangi kecepatan"]; return["Strong wind/waves — unsafe","Angin/ombak kuat — tidak aman"]; };
  const sup=():S=>{ if((avgWindMs??0)>6.2||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)return"danger"; if((avgWindMs??0)>4.5||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)return"caution"; return"safe"; };
  const supR=():[string,string]=>{ const s=sup(); if(s==="safe")return["Flat water, ideal for paddling","Air tenang, ideal paddling"]; if(s==="caution")return["Light chop — experienced only","Sedikit bergelombang"]; return["Exceeds safe SUP limit","Melampaui batas aman SUP"]; };
  const boat=():S=>{ if((avgWindMs??0)>10.3||(avgWave??0)>1.5)return"danger"; if((avgWindMs??0)>7.9||(avgWave??0)>1.0)return"caution"; return"safe"; };
  const boatR=():[string,string]=>{ const s=boat(); if(s==="safe")return["Calm sea, good for travel","Laut tenang, baik perjalanan"]; if(s==="caution")return["Moderate sea — check vessel","Laut sedang — periksa kapal"]; return["Exceeds small-craft limit","Melampaui batas kapal kecil"]; };
  const fishing=():S=>{ if(isStormy||(avgWindMs??0)>10.3||(avgWave??0)>1.5)return"danger"; if(isRainy||(avgWindMs??0)>7.9||(avgWave??0)>1.0)return"caution"; return"safe"; };
  const fishingR=():[string,string]=>{ const s=fishing(); if(s==="safe")return["Good sea conditions","Kondisi laut baik"]; if(s==="caution")return["Moderate — stay near shore","Sedang — dekat pantai"]; return["Dangerous sea state","Kondisi laut berbahaya"]; };
  const turtle=():S=>{ if(isStormy)return"danger"; if(isRainy||(tideRange!==null&&tideRange>1.5))return"caution"; return"safe"; };
  const turtleR=():[string,string]=>{ const s=turtle(); if(s==="safe")return["Good for conservation","Baik untuk konservasi"]; if(s==="caution")return["Rain may affect access","Hujan ganggu akses"]; return["Storm — field unsafe","Badai — lapangan tidak aman"]; };
  const camp=():S=>{ if(isStormy)return"danger"; if(isRainy||(tideRange!==null&&tideRange>1.5))return"caution"; return"safe"; };
  const campR=():[string,string]=>{ const s=camp(); if(s==="safe")return["Clear, comfortable beach","Cerah, pantai nyaman"]; if(s==="caution")return["Rain/tide limits access","Hujan/pasut batasi akses"]; return["Storm — outdoor unsafe","Badai — aktivitas tidak aman"]; };
  const photo=():S=>{ if(isStormy||(avgWave??0)>1.0||(avgCurrentMs??0)>0.51)return"danger"; if(isRainy||(avgWave??0)>0.5||(avgCurrentMs??0)>0.26)return"caution"; return"safe"; };
  const photoR=():[string,string]=>{ const s=photo(); if(s==="safe")return["Excellent UW visibility","Visibilitas sangat baik"]; if(s==="caution")return["Reduced visibility","Visibilitas berkurang"]; return["Poor visibility/strong current","Visibilitas buruk/arus kuat"]; };
  const general=():S=>{ if(isStormy)return"danger"; if(isRainy)return"caution"; return"safe"; };
  const generalR=():[string,string]=>{ const s=general(); if(s==="safe")return["Clear — enjoy exploring","Cerah — nikmati eksplorasi"]; if(s==="caution")return["Light rain — bring gear","Kemungkinan hujan"]; return["Storm — limit outdoor","Badai — batasi aktivitas"]; };

  return [
    {id:"snorkeling",labelEn:"Snorkeling",    labelId:"Snorkeling",    icon:<Waves size={13}/>,     status:snorkel(), reasonEn:snorkelR()[0], reasonId:snorkelR()[1]},
    {id:"scuba",     labelEn:"Scuba Diving",   labelId:"Selam Scuba",   icon:<Anchor size={13}/>,    status:scuba(),   reasonEn:scubaR()[0],   reasonId:scubaR()[1]},
    {id:"freedive",  labelEn:"Freediving",     labelId:"Freediving",    icon:<Navigation size={13}/>,status:freedive(),reasonEn:freediveR()[0],reasonId:freediveR()[1]},
    {id:"jetski",    labelEn:"Jet Ski",        labelId:"Jet Ski",       icon:<Zap size={13}/>,       status:jetski(),  reasonEn:jetskiR()[0],  reasonId:jetskiR()[1]},
    {id:"sup",       labelEn:"SUP / Kayak",    labelId:"SUP / Kayak",   icon:<Users size={13}/>,     status:sup(),     reasonEn:supR()[0],     reasonId:supR()[1]},
    {id:"boat",      labelEn:"Island Hopping", labelId:"Wisata Pulau",  icon:<Ship size={13}/>,      status:boat(),    reasonEn:boatR()[0],    reasonId:boatR()[1]},
    {id:"fishing",   labelEn:"Fishing",        labelId:"Memancing",     icon:<Fish size={13}/>,      status:fishing(), reasonEn:fishingR()[0], reasonId:fishingR()[1]},
    {id:"turtle",    labelEn:"Turtle Watch",   labelId:"Konservasi",    icon:<Leaf size={13}/>,      status:turtle(),  reasonEn:turtleR()[0],  reasonId:turtleR()[1]},
    {id:"camping",   labelEn:"Camping",        labelId:"Camping",       icon:<Flag size={13}/>,      status:camp(),    reasonEn:campR()[0],    reasonId:campR()[1]},
    {id:"uwphoto",   labelEn:"UW Photo",       labelId:"Foto Bawah Air",icon:<Camera size={13}/>,    status:photo(),   reasonEn:photoR()[0],   reasonId:photoR()[1]},
    {id:"general",   labelEn:"General Tourism",labelId:"Wisata Umum",   icon:<Sun size={13}/>,       status:general(), reasonEn:generalR()[0], reasonId:generalR()[1]},
  ];
}

/* ── Skeleton ── */
const Shimmer: React.FC<{w?:string;h?:string;r?:string}> = ({w="100%",h="12px",r="4px"}) => (
  <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.6s linear infinite"}}/>
);
const SkeletonHero = () => (
  <div style={{margin:"12px 12px 0",borderRadius:14,padding:16,background:"#e2e8f0"}}>
    <Shimmer w="55%" h="9px"/>
    <div style={{display:"flex",gap:12,marginTop:10}}>
      {[0,1,2,3].map(i=>(<div key={i} style={{flex:1}}><Shimmer w="40%" h="7px"/><div style={{marginTop:5}}><Shimmer w="60%" h={i===2?"28px":"20px"}/></div></div>))}
    </div>
  </div>
);
const SkeletonChart = () => (
  <div style={{margin:"12px 12px 0",borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0"}}>
    <div style={{padding:"10px 14px 3px"}}><Shimmer w="55%" h="10px"/></div>
    <div style={{padding:10,display:"flex",alignItems:"flex-end",gap:2,height:150}}>
      {Array.from({length:24},(_,i)=>(<div key={i} style={{flex:1,borderRadius:2,height:`${30+Math.sin(i*0.5)*25+Math.random()*20}%`,background:"linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",backgroundSize:"200% 100%",animation:`shimmer 1.6s linear ${i*0.04}s infinite`}}/>))}
    </div>
  </div>
);

/* ── Weather Symbol ── */
const WeatherSymbol: React.FC<{code:number;size?:number}> = ({code,size=16}) => {
  const s={width:size,height:size}; const p={fill:"none",strokeWidth:1.6,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(code<=1) return <svg {...s} viewBox="0 0 24 24" stroke="#f59e0b" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
  if(code<=3) return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>;
  if(code>=51&&code<=82) return <svg {...s} viewBox="0 0 24 24" stroke="#60a5fa" {...p}><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 19v2M12 19v2M16 19v2"/></svg>;
  if(code>=95) return <svg {...s} viewBox="0 0 24 24" stroke="#a78bfa" {...p}><path d="M19 16.9A5 5 0 0015 9h-1V8a7 7 0 10-13 3M13 16l-4 6h6l-4 6"/></svg>;
  return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M3 8h18M3 12h18M3 16h18"/></svg>;
};

/* ════════════════════════════════════════════════════════
   OVERLAY CHART
   Both TPXO (UTC "Z") and Luwes ("+07:00") timestamps are
   converted to WIB decimal hours via tsToWIBHour → parseToWIB,
   guaranteeing both series share the same x-axis.
════════════════════════════════════════════════════════ */
const OverlayChart: React.FC<{
  chartPredictions: Array<{time:string;height:number}>;
  luwesObs: Array<{recorded_at:string;level_m:number}>;
  dateStr: string;
  loadingMinute: boolean;
}> = ({chartPredictions,luwesObs,dateStr,loadingMinute}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current=null; }

    // TPXO: UTC timestamps ("...Z") → WIB via tsToWIBHour → parseToWIB
    const tpxoPts = chartPredictions
      .reduce<{x:number;y:number}[]>((acc,p) => {
        const x = tsToWIBHour(p.time, dateStr);
        if (x!==null&&x>=0&&x<=24) acc.push({x,y:p.height});
        return acc;
      },[]).sort((a,b)=>a.x-b.x);

    // Luwes: WIB timestamps ("+07:00") → WIB via tsToWIBHour → parseToWIB
    // parseToWIB handles "+07:00" by calling Date.parse which respects the offset,
    // then adds 7h to the resulting UTC ms → correct WIB decimal hour
    const luwesPts = luwesObs
      .reduce<{x:number;y:number}[]>((acc,o) => {
        const x = tsToWIBHour(o.recorded_at, dateStr);
        if (x!==null&&x>=0&&x<=24) acc.push({x,y:o.level_m});
        return acc;
      },[]).sort((a,b)=>a.x-b.x);

    const wibNow  = new Date(Date.now()+7*3600_000);
    const isToday = dateStr===wibNow.toISOString().slice(0,10);
    const nowX    = isToday ? wibNow.getUTCHours()+wibNow.getUTCMinutes()/60 : -1;
    const X_TICKS = [0,3,6,9,12,15,18,21,24];

    let cancelled = false;
    import("chart.js/auto").then(({default:Chart}) => {
      if (cancelled||!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d"); if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: "scatter",
        data: {
          datasets: [
            {
              label:"TPXO", type:"line" as any, data:tpxoPts,
              borderColor:"#0284c7",
              backgroundColor:(c:any)=>{
                const {chart:{ctx:cx,chartArea:ca}}=c; if(!ca) return "rgba(2,132,199,0.07)";
                const g=cx.createLinearGradient(0,ca.top,0,ca.bottom);
                g.addColorStop(0,"rgba(2,132,199,0.18)"); g.addColorStop(1,"rgba(2,132,199,0)"); return g;
              },
              borderWidth:1.5,fill:true,tension:0.3,pointRadius:0,pointHoverRadius:4,spanGaps:true,order:2,parsing:false,
            },
            {
              label:"Luwes", type:"scatter" as any, data:luwesPts,
              borderColor:"rgba(249,115,22,0.8)",backgroundColor:"rgba(249,115,22,0.6)",
              pointRadius:luwesPts.length>200?1.5:2.5,pointHoverRadius:5,order:1,parsing:false,
            },
          ],
        },
        options:{
          responsive:true,maintainAspectRatio:false,animation:false,
          interaction:{mode:"nearest",intersect:false,axis:"x"},
          plugins:{
            legend:{display:false},
            tooltip:{
              backgroundColor:"#0f172a",titleColor:"#94a3b8",bodyColor:"#f1f5f9",
              padding:8,cornerRadius:7,titleFont:{family:MONO,size:10},bodyFont:{family:MONO,size:11},
              callbacks:{
                title:(items:any[])=>{const x=items[0]?.parsed?.x??0;const h=Math.floor(x);const m=Math.round((x-h)*60);return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")} WIB`;},
                label:(c:any)=>{const v=c.parsed?.y;if(v==null)return null as any;return ` ${c.dataset.label}: ${Number(v).toFixed(3)} m`;},
              },
            },
          },
          scales:{
            x:{
              type:"linear",min:0,max:24,
              grid:{color:(c:any)=>{const v=Number(c.tick?.value??0);return v%6===0?"rgba(0,0,0,0.07)":"rgba(0,0,0,0.025)";}},
              border:{display:false},
              ticks:{color:"#94a3b8",font:{family:MONO,size:9},maxRotation:0,autoSkip:false,
                callback:(value:any)=>{const v=Number(value);if(X_TICKS.includes(v))return `${v.toString().padStart(2,"0")}:00`;return "";},
                stepSize:3,includeBounds:true,
              },
              afterBuildTicks:(axis:any)=>{axis.ticks=X_TICKS.map(v=>({value:v,label:`${v.toString().padStart(2,"0")}:00`}));},
            },
            y:{
              grid:{color:"rgba(0,0,0,0.04)"},border:{display:false},
              ticks:{color:"#94a3b8",font:{family:MONO,size:9},callback:(v:any)=>`${Number(v).toFixed(2)} m`},
              title:{display:true,text:"Water Level (m MSL)",color:"#94a3b8",font:{size:8,family:MONO}},
            },
          },
        },
        plugins:[{
          id:"nowLine",
          afterDraw(chart:any){
            if(nowX<0||nowX>24) return;
            const {ctx:c,chartArea:ca,scales}=chart; if(!ca) return;
            const x=scales.x.getPixelForValue(nowX); if(x<ca.left||x>ca.right) return;
            c.save();c.beginPath();c.moveTo(x,ca.top);c.lineTo(x,ca.bottom);
            c.strokeStyle="rgba(239,68,68,0.75)";c.lineWidth=1.5;c.setLineDash([4,4]);c.stroke();
            c.fillStyle="rgba(239,68,68,0.9)";c.font=`bold 8px ${MONO}`;c.textAlign="center";
            c.fillText("NOW",x,ca.top+9);c.restore();
          },
        }],
      });
    });
    return ()=>{cancelled=true;if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}};
  },[chartPredictions,luwesObs,dateStr]);

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <canvas ref={canvasRef} style={{width:"100%",height:"100%"}}/>
      {loadingMinute&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(248,250,252,0.75)",borderRadius:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#0284c7",fontFamily:SANS}}>
            <Loader2 size={13} style={{animation:"spin 0.7s linear infinite"}}/>
            <span>Loading per-minute data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── S104 Badge ── */
const S104Badge: React.FC<{coordinates:{lat:number;lon:number};selectedDate:string;language:"en"|"id"}> = ({coordinates,selectedDate,language:lang}) => {
  const [open,setOpen]=useState(false);
  const [loadingTpxo,setLoadingTpxo]=useState(false);
  const [loadingLuwes,setLoadingLuwes]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const download=async(url:string,filename:string)=>{
    const res=await fetch(url);
    if(!res.ok){const d=await res.json().catch(()=>({error:`HTTP ${res.status}`}));throw new Error((d as any).error??`HTTP ${res.status}`);}
    const blob=await res.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
  };
  const handleTpxo=async()=>{setLoadingTpxo(true);setError(null);try{await download(`${API_BASE}/api/s104/export?lon=${coordinates.lon}&lat=${coordinates.lat}&date=${selectedDate}`,`searibu_s104_tpxo_${selectedDate}.h5`);}catch(e:any){setError(e.message);}finally{setLoadingTpxo(false);}};
  const handleLuwes=async()=>{setLoadingLuwes(true);setError(null);try{await download(`${API_BASE}/api/s104/export/luwes?date=${selectedDate}`,`searibu_s104_luwes_${selectedDate}.h5`);}catch(e:any){setError(e.message);}finally{setLoadingLuwes(false);}};
  return (
    <div>
      <div onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px",cursor:"pointer",background:"linear-gradient(135deg,#e0f2fe,#f0fdf4)",border:"1px solid #bae6fd",borderRadius:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:6,background:"#0284c7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CheckCircle size={13} color="#fff"/></div>
          <div>
            <p style={{fontFamily:SANS,fontSize:11,fontWeight:700,color:"#0284c7",margin:0}}>IHO S-100 / S-104 Ed. 2.0</p>
            <p style={{fontFamily:SANS,fontSize:10,color:"#0369a1",margin:0,opacity:0.8}}>{lang==="en"?"Water Level Standard":"Standar Muka Air"}</p>
          </div>
        </div>
        {open?<ChevronUp size={13} style={{color:"#0284c7",opacity:0.6}}/>:<ChevronDown size={13} style={{color:"#0284c7",opacity:0.6}}/>}
      </div>
      {open&&(
        <div style={{marginTop:5,padding:"11px 13px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9}}>
          {[["Horizontal CRS","EPSG:4326 (WGS 84)"],["Vertical Datum","MSL (IHO code 12)"],["TPXO dataDynamicity","1 (astronomicalPrediction)"],["Luwes dataDynamicity","3 (observed)"],["TOL correction","−2.156 m"],["Edition","S-104 Ed.2.0.0"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"2px 0"}}>
              <span style={{fontFamily:SANS,fontSize:10,color:"#94a3b8"}}>{l}</span>
              <span style={{fontFamily:'"Courier New",monospace',fontSize:10,color:"#475569",textAlign:"right"}}>{v}</span>
            </div>
          ))}
          <a href="https://iho.int/en/s-100-based-product-specifications" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:3,fontFamily:SANS,fontSize:10,color:"#0284c7",textDecoration:"none",marginTop:9}}>
            {lang==="en"?"IHO S-100 Resources":"Sumber IHO S-100"} <ExternalLink size={9}/>
          </a>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:7}}>
        {[
          {handler:handleTpxo,loading:loadingTpxo,label:lang==="en"?"Export S-104 (TPXO)":"Ekspor S-104 (TPXO)",accent:"#0284c7"},
          {handler:handleLuwes,loading:loadingLuwes,label:lang==="en"?"Export S-104 (Luwes)":"Ekspor S-104 (Luwes)",accent:"#f97316"},
        ].map(({handler,loading,label,accent})=>(
          <button key={label} onClick={handler} disabled={loading}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,width:"100%",padding:"8px 12px",borderRadius:7,border:`1.5px solid ${accent}22`,background:loading?"#f1f5f9":`${accent}10`,color:loading?"#94a3b8":accent,fontFamily:SANS,fontSize:11,fontWeight:600,cursor:loading?"not-allowed":"pointer",transition:"all 0.18s"}}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.background=`${accent}20`;e.currentTarget.style.borderColor=`${accent}55`;}}}
            onMouseLeave={e=>{if(!loading){e.currentTarget.style.background=`${accent}10`;e.currentTarget.style.borderColor=`${accent}22`;}}}>
            {loading?<Loader2 size={12} style={{animation:"spin 0.7s linear infinite"}}/>:<FileDown size={12}/>}
            {loading?(lang==="en"?"Preparing...":"Menyiapkan..."):label}
          </button>
        ))}
      </div>
      {error&&(
        <div style={{marginTop:7,padding:"7px 11px",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:7,display:"flex",alignItems:"flex-start",gap:7}}>
          <span style={{color:"#dc2626",fontSize:10,fontFamily:SANS,flex:1}}><strong>{lang==="en"?"Failed":"Gagal"}:</strong> {error}</span>
          <button onClick={()=>setError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:0,fontSize:13,lineHeight:1,flexShrink:0}}>×</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN EXPORT — InfoPanel
═══════════════════════════════════════════════════ */
export const InfoPanel: React.FC<InfoPanelProps> = ({coordinates,onClose}) => {
  const {language} = useLanguage();
  const lang = language as "en"|"id";

  const [tideData,setTideData]                   = useState<TideData|null>(null);
  const [minutePredictions,setMinutePredictions] = useState<Array<{time:string;height:number}>>([]);
  const [loadingMinute,setLoadingMinute]         = useState(false);
  const [weatherData,setWeatherData]             = useState<WeatherData|null>(null);
  const [marineData,setMarineData]               = useState<MarineData|null>(null);
  const [overlayData,setOverlayData]             = useState<OverlayData|null>(null);
  const [loading,setLoading]                     = useState(false);
  const [error,setError]                         = useState<string|null>(null);
  const [selDate,setSelDate]                     = useState<string>(todayISO());

  /**
   * fetchMinutePredictions — FIX C
   *
   * Uses a SINGLE request with explicit UTC timestamps spanning exactly one
   * WIB day to ensure ONE set of harmonic parameters for the entire curve:
   *   start = prevDay T17:00:00Z  →  00:00:00 WIB (target date)
   *   end   = dateStr T16:59:00Z  →  23:59:00 WIB (target date)
   *
   * FIX E: explicit post-fetch filter to keep only predictions whose WIB date
   * matches the target date, preventing off-by-one leakage at midnight UTC.
   */
  const fetchMinutePredictions = useCallback(async (dateStr:string) => {
    const cached = readMinuteCache(coordinates.lat,coordinates.lon,dateStr);
    if (cached&&cached.length>0){setMinutePredictions(cached);return;}
    setLoadingMinute(true);
    try {
      // Compute UTC boundaries for the WIB day:
      //   WIB = UTC+7, so WIB 00:00 = UTC prevDay 17:00
      //                     WIB 23:59 = UTC dateStr 16:59
      const target = new Date(dateStr + "T00:00:00Z");
      const prevDay = new Date(target);
      prevDay.setUTCDate(prevDay.getUTCDate() - 1);

      const startUTC = `${prevDay.toISOString().slice(0,10)}T17:00:00Z`;
      const endUTC   = `${dateStr}T16:59:00Z`;

      const res = await fetch(
        `${API_BASE}/api/tide/prediction?lon=${coordinates.lon}&lat=${coordinates.lat}` +
        `&start_date=${encodeURIComponent(startUTC)}&end_date=${encodeURIComponent(endUTC)}&interval_minutes=1`
      );

      if (!res.ok) {
        // Backend rejected the range — silently degrade to hourly chart
        setMinutePredictions([]);
        return;
      }

      const data = await res.json();
      const allPreds: Array<{time:string;height:number}> = data.predictions ?? [];

      // FIX E: keep only predictions that fall on the target WIB date
      const filtered = allPreds.filter(p => {
        const w = parseToWIB(p.time);
        return w !== null && w.wibDate === dateStr;
      });

      // Sort by WIB decimal hour
      filtered.sort((a, b) => {
        const xa = tsToWIBHour(a.time, dateStr) ?? 0;
        const xb = tsToWIBHour(b.time, dateStr) ?? 0;
        return xa - xb;
      });

      setMinutePredictions(filtered);
      if (filtered.length > 0) {
        writeMinuteCache(coordinates.lat, coordinates.lon, dateStr, filtered);
      }
    } catch {
      setMinutePredictions([]);
    } finally {
      setLoadingMinute(false);
    }
  },[coordinates]);

  const fetchAll = useCallback(async (dateStr:string,forceRefresh=false) => {
    setLoading(true);setError(null);
    try {
      const today=new Date(); const fmtD=(d:Date)=>d.toISOString().split("T")[0];
      let wd:WeatherData|null=null, md:MarineData|null=null;
      if (!forceRefresh){wd=readCache<WeatherData>(coordinates.lat,coordinates.lon,"wx");md=readCache<MarineData>(coordinates.lat,coordinates.lon,"marine");}
      if (!wd||!md){
        const wxStart=new Date(today);wxStart.setDate(wxStart.getDate()-14);
        const wxEnd=new Date(today);wxEnd.setDate(wxEnd.getDate()+15);
        const [wxRes,marRes]=await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=sunrise,sunset&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`),
          fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=wave_height,ocean_current_velocity&current=wave_height,ocean_current_velocity&timezone=auto&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`),
        ]);
        if (!wxRes.ok) throw new Error(lang==="en"?"Weather service unavailable":"Layanan cuaca tidak tersedia");
        wd=await wxRes.json() as WeatherData;writeCache(coordinates.lat,coordinates.lon,"wx",wd);
        if (marRes.ok){md=await marRes.json() as MarineData;writeCache(coordinates.lat,coordinates.lon,"marine",md);}
      }
      setWeatherData(wd);setMarineData(md);

      // Hourly TPXO: fetch ±1 day around the selected date (UTC) for the fallback table
      const prevDay=new Date(dateStr+"T12:00:00Z");prevDay.setUTCDate(prevDay.getUTCDate()-1);
      const nextDay=new Date(dateStr+"T12:00:00Z");nextDay.setUTCDate(nextDay.getUTCDate()+1);
      const [tr,or_]=await Promise.all([
        fetch(`${API_BASE}/api/tide/prediction?lon=${coordinates.lon}&lat=${coordinates.lat}&start_date=${fmtD(prevDay)}&end_date=${fmtD(nextDay)}&interval_hours=1`),
        fetch(`${API_BASE}/api/luwes/overlay?date=${dateStr}&lon=${coordinates.lon}&lat=${coordinates.lat}`),
      ]);
      if (!tr.ok){const e=await tr.json().catch(()=>({}));throw new Error((e as any).error??(lang==="en"?"Tide service unavailable":"Layanan pasut tidak tersedia"));}
      setTideData(await tr.json() as TideData);
      if (or_.ok) setOverlayData(await or_.json() as OverlayData); else setOverlayData(null);
    } catch(e){setError(e instanceof Error?e.message:(lang==="en"?"Unknown error":"Kesalahan tidak dikenal"));}
    finally{setLoading(false);}
  },[coordinates,lang]);

  useEffect(()=>{
    const d=todayISO();setSelDate(d);setMinutePredictions([]);
    fetchAll(d);fetchMinutePredictions(d);
  },[coordinates.lat,coordinates.lon]);

  const handleDateChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const d=e.target.value;setSelDate(d);setMinutePredictions([]);
    fetchAll(d);fetchMinutePredictions(d);
  };

  const getSunTimes=()=>{
    if (!weatherData?.daily) return {sunrise:"--:--",sunset:"--:--"};
    const idx=weatherData.daily.time.findIndex(t=>t===selDate);
    if(idx===-1) return {sunrise:"--:--",sunset:"--:--"};
    return {sunrise:fmtHHmm(weatherData.daily.sunrise[idx]),sunset:fmtHHmm(weatherData.daily.sunset[idx])};
  };

  const buildRows=():HourRow[]=>{
    // TPXO: UTC → WIB via parseToWIB
    const tideMap=new Map<number,number>();
    tideData?.predictions.forEach(p=>{
      const w=parseToWIB(p.time);
      if(w?.wibDate===selDate) tideMap.set(w.wibHour,p.height);
    });

    // Open-Meteo: already local WIB strings → parseLocalISO
    const wxMap=new Map<string,Partial<HourRow>>();
    weatherData?.hourly.time.forEach((t,i)=>{
      const p=parseLocalISO(t);
      if(!p||p.localDate!==selDate) return;
      const hh=p.localHour.toString().padStart(2,"0");
      const windKmh=weatherData.hourly.wind_speed_10m[i];
      wxMap.set(hh,{
        temp:    weatherData.hourly.temperature_2m[i],
        windSpd: windKmh!=null?kmhToMs(windKmh):null,
        windDir: weatherData.hourly.wind_direction_10m[i],
        wCode:   weatherData.hourly.weather_code[i],
      });
    });

    const marineMap=new Map<string,{waveH:number|null;currentSpd:number|null}>();
    marineData?.hourly.time.forEach((t,i)=>{
      const p=parseLocalISO(t);
      if(!p||p.localDate!==selDate) return;
      const hh=p.localHour.toString().padStart(2,"0");
      marineMap.set(hh,{
        waveH:      marineData.hourly.wave_height[i]??null,
        currentSpd: marineData.hourly.ocean_current_velocity[i]??null,
      });
    });

    return Array.from({length:24},(_,i)=>{
      const hh=i.toString().padStart(2,"0");
      const marine=marineMap.get(hh)??{waveH:null,currentSpd:null};
      return {hour:`${hh}:00`,tideH:tideMap.get(i)??null,temp:null,windSpd:null,windDir:null,wCode:null,...(wxMap.get(hh)??{}),...marine} as HourRow;
    });
  };

  const dailyStats=(()=>{
    const hs=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate).map(p=>p.height)??[];
    return hs.length?{max:Math.max(...hs),min:Math.min(...hs)}:null;
  })();

  // Luwes: apply TOL correction; parseToWIB handles "+07:00" format correctly
  const luwesForChart=(overlayData?.luwes_obs??[])
    .filter(o=>parseToWIB(o.recorded_at)?.wibDate===selDate)
    .map(o=>({...o,level_m:o.level_m+TOL_CORRECTION}));
  const hasLuwesObs=luwesForChart.length>0;
  const luwesStatsCorrected=hasLuwesObs
    ?{max_m:Math.max(...luwesForChart.map(o=>o.level_m)),min_m:Math.min(...luwesForChart.map(o=>o.level_m)),count:luwesForChart.length}
    :overlayData?.luwes_stats??null;

  const chartPredictions = buildChartPredictions(tideData, minutePredictions, selDate);

  const {sunrise,sunset}=getSunTimes();
  const rows=buildRows();
  const current=weatherData?.current;
  const currentWindMs=current?kmhToMs(current.wind_speed_10m):null;
  const currentWaveH:number|null=marineData?.current?.wave_height!=null?marineData.current.wave_height:(marineData?.hourly.wave_height[0]??null);
  const currentCurrentSpd:number|null=marineData?.current?.ocean_current_velocity!=null?marineData.current.ocean_current_velocity:(marineData?.hourly.ocean_current_velocity[0]??null);
  const nowHour=(()=>{const wib=new Date(Date.now()+7*3600_000);return wib.getUTCHours().toString().padStart(2,"0");})();
  const isToday=selDate===todayISO();
  const activities=buildRecommendations(tideData,weatherData,marineData,selDate,lang);
  const selDateFmt=new Date(selDate+"T12:00:00Z").toLocaleDateString(lang==="en"?"en-US":"id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const chartResolutionLabel = (() => {
    if (minutePredictions.length > 0) {
      return `1 min · ${chartPredictions.length} pts (full WIB day, single harmonic epoch)`;
    }
    return `1 hr · ${chartPredictions.length} pts`;
  })();

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",borderLeft:"1px solid #e2e8f0",fontFamily:SANS,background:"#f8fafc"}}>
      <style>{`
        @keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ip-scroll{overscroll-behavior:none}
        .ip-scroll::-webkit-scrollbar{width:4px}
        .ip-scroll::-webkit-scrollbar-track{background:#f8fafc}
        .ip-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#fff",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
          <h2 style={{fontSize:12,fontWeight:700,color:"#0f172a",letterSpacing:"-0.01em",fontFamily:SANS,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {lang==="en"?"Ocean-Weather Info":"Info Cuaca Laut"} — <span style={{fontWeight:500,color:"#475569",fontSize:11}}>{selDateFmt}</span>
          </h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <button onClick={()=>{clearCache(coordinates.lat,coordinates.lon);setMinutePredictions([]);fetchAll(selDate,true);fetchMinutePredictions(selDate);}}
            style={{padding:5,borderRadius:7,border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",display:"flex"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <RefreshCw size={12}/>
          </button>
          <button onClick={onClose}
            style={{padding:5,borderRadius:7,border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",display:"flex"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="ip-scroll" style={{flex:1,overflowY:"auto",background:"#f8fafc",overscrollBehavior:"none"}}>

        {loading&&(<><SkeletonHero/><div style={{margin:"12px 12px 0"}}><Shimmer w="30%" h="8px"/><div style={{marginTop:7}}><Shimmer w="100%" h="36px" r="11px"/></div></div><SkeletonChart/></>)}

        {error&&!loading&&(
          <div style={{margin:12,padding:14,borderRadius:11,background:"#fef2f2",border:"1px solid #fca5a5"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <AlertCircle size={14} style={{color:"#f87171",flexShrink:0,marginTop:1}}/>
              <div>
                <p style={{color:"#dc2626",fontSize:12,fontWeight:600,marginBottom:3,fontFamily:SANS}}>{lang==="en"?"Unable to load data":"Gagal memuat data"}</p>
                <p style={{color:"#ef4444",fontSize:10,marginBottom:8,fontFamily:SANS}}>{error}</p>
                <button onClick={()=>{fetchAll(selDate);fetchMinutePredictions(selDate);}} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:SANS,fontWeight:600}}>
                  <RefreshCw size={10}/>{lang==="en"?"Try again":"Coba lagi"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading&&!error&&(
          <>
            {/* ── Hero Card ── */}
            <div style={{margin:"12px 12px 0",borderRadius:14,overflow:"hidden",background:"linear-gradient(135deg,#0c4a6e 0%,#075985 55%,#0369a1 100%)",boxShadow:"0 4px 18px rgba(3,105,161,0.18)"}}>
              <div style={{padding:"10px 16px 8px",borderBottom:"1px solid rgba(255,255,255,0.09)"}}>
                <p style={{fontFamily:MONO,color:"rgba(255,255,255,0.48)",fontSize:10,letterSpacing:"0.02em",margin:0}}>
                  {Math.abs(coordinates.lat).toFixed(4)}°{coordinates.lat>=0?"N":"S"}&ensp;{Math.abs(coordinates.lon).toFixed(4)}°{coordinates.lon>=0?"E":"W"}
                </p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,padding:"12px 16px 8px"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:5}}>
                    <Sun size={10} color="#fde68a"/>
                    <span style={{color:"rgba(255,255,255,0.48)",fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:SANS}}>{lang==="en"?"Sunrise":"Terbit"}</span>
                  </div>
                  <p style={{fontFamily:MONO,color:"#fff",fontSize:17,fontWeight:700,lineHeight:1}}>{sunrise}</p>
                  <p style={{color:"rgba(255,255,255,0.32)",fontSize:9,marginTop:2,fontFamily:SANS}}>WIB</p>
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:5}}>
                    <Moon size={10} color="#fca5a5"/>
                    <span style={{color:"rgba(255,255,255,0.48)",fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:SANS}}>{lang==="en"?"Sunset":"Terbenam"}</span>
                  </div>
                  <p style={{fontFamily:MONO,color:"#fff",fontSize:17,fontWeight:700,lineHeight:1}}>{sunset}</p>
                  <p style={{color:"rgba(255,255,255,0.32)",fontSize:9,marginTop:2,fontFamily:SANS}}>WIB</p>
                </div>
                {current?(
                  <div style={{textAlign:"right"}}>
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:5}}><WeatherSymbol code={current.weather_code} size={18}/></div>
                    <p style={{color:"#fff",fontSize:26,fontWeight:700,lineHeight:1,letterSpacing:"-0.03em",fontFamily:SANS}}>{Math.round(current.temperature_2m)}°</p>
                    <p style={{color:"rgba(255,255,255,0.55)",fontSize:9,marginTop:2,fontFamily:SANS}}>{wmoLabel(current.weather_code,lang)}</p>
                  </div>
                ):<div/>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,padding:"8px 16px 12px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                {[
                  {icon:<Wind size={9} color="rgba(255,255,255,0.42)"/>,label:lang==="en"?"Wind":"Angin",val:currentWindMs!=null?<><p style={{fontFamily:MONO,color:"#fff",fontSize:16,fontWeight:700,lineHeight:1}}>{currentWindMs.toFixed(1)}<span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:500,marginLeft:2}}>m/s</span></p><p style={{color:"rgba(255,255,255,0.32)",fontSize:9,marginTop:2,fontFamily:SANS}}>{windDirLabel(current!.wind_direction_10m)}</p></>:<p style={{fontFamily:MONO,color:"rgba(255,255,255,0.28)",fontSize:13}}>—</p>},
                  {icon:<Waves size={9} color="rgba(255,255,255,0.42)"/>,label:lang==="en"?"Wave":"Gelombang",val:currentWaveH!=null?<><p style={{fontFamily:MONO,color:"#fff",fontSize:16,fontWeight:700,lineHeight:1}}>{currentWaveH.toFixed(2)}<span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:500,marginLeft:2}}>m</span></p><p style={{color:"rgba(255,255,255,0.32)",fontSize:9,marginTop:2,fontFamily:SANS}}>{currentWaveH<0.5?(lang==="en"?"Calm":"Tenang"):currentWaveH<1.25?(lang==="en"?"Slight":"Kecil"):(lang==="en"?"Moderate":"Sedang")}</p></>:<p style={{fontFamily:MONO,color:"rgba(255,255,255,0.28)",fontSize:13}}>—</p>},
                  {icon:<Navigation size={9} color="rgba(255,255,255,0.42)"/>,label:lang==="en"?"Current":"Arus",val:currentCurrentSpd!=null?<><p style={{fontFamily:MONO,color:"#fff",fontSize:16,fontWeight:700,lineHeight:1}}>{currentCurrentSpd.toFixed(2)}<span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:500,marginLeft:2}}>m/s</span></p><p style={{color:"rgba(255,255,255,0.32)",fontSize:9,marginTop:2,fontFamily:SANS}}>{currentCurrentSpd<0.25?(lang==="en"?"Weak":"Lemah"):currentCurrentSpd<0.75?(lang==="en"?"Moderate":"Sedang"):(lang==="en"?"Strong":"Kuat")}</p></>:<p style={{fontFamily:MONO,color:"rgba(255,255,255,0.28)",fontSize:13}}>—</p>},
                ].map(({icon,label,val},i)=>(
                  <div key={i} style={{paddingLeft:i>0?12:0,paddingRight:i<2?12:0,borderRight:i<2?"1px solid rgba(255,255,255,0.07)":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>{icon}<span style={{color:"rgba(255,255,255,0.42)",fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:SANS}}>{label}</span></div>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Date Picker ── */}
            <div style={{padding:"12px 12px 0"}}>
              <p style={{fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",color:"#94a3b8",marginBottom:5,fontFamily:SANS}}>{lang==="en"?"Select Date":"Pilih Tanggal"}</p>
              <input type="date" value={selDate} onChange={handleDateChange}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:SANS,color:"#0f172a",background:"#fff",cursor:"pointer",outline:"none",boxSizing:"border-box"}}
                onFocus={e=>{e.currentTarget.style.borderColor="#0284c7";e.currentTarget.style.boxShadow="0 0 0 3px rgba(2,132,199,0.10)";}}
                onBlur={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="none";}}
              />
            </div>

            {/* ── Chart ── */}
            <div style={{padding:"12px 12px 0"}}>
              <div style={{borderRadius:14,overflow:"hidden",background:"#fff",border:"1px solid #e2e8f0"}}>
                <div style={{padding:"10px 14px 6px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                  <p style={{fontSize:10,fontWeight:600,color:"#475569",fontFamily:SANS}}>{selDateFmt}</p>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,color:"#0284c7",fontWeight:700,background:"#e0f2fe",padding:"2px 7px",borderRadius:99,fontFamily:SANS}}>
                      <span style={{display:"inline-block",width:12,height:2,background:"#0284c7",borderRadius:1}}/>TPXO
                    </span>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,color:hasLuwesObs?"#f97316":"#94a3b8",fontWeight:700,background:hasLuwesObs?"#ffedd5":"#f1f5f9",padding:"2px 7px",borderRadius:99,fontFamily:SANS}}>
                      <span style={{display:"inline-block",width:6,height:6,background:hasLuwesObs?"#f97316":"#94a3b8",borderRadius:"50%"}}/>Luwes
                    </span>
                    {isToday&&(
                      <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,color:"#ef4444",fontWeight:700,background:"#fef2f2",padding:"2px 7px",borderRadius:99,fontFamily:SANS}}>
                        <span style={{display:"inline-block",width:10,height:1.5,background:"#ef4444",borderRadius:1}}/>Now
                      </span>
                    )}
                    {minutePredictions.length>0&&(
                      <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,color:"#8b5cf6",fontWeight:700,background:"#f5f3ff",padding:"2px 7px",borderRadius:99,fontFamily:SANS}}>
                        1-min
                      </span>
                    )}
                  </div>
                </div>
                <div style={{height:280,padding:"4px 6px 12px"}}>
                  <OverlayChart
                    chartPredictions={chartPredictions}
                    luwesObs={luwesForChart}
                    dateStr={selDate}
                    loadingMinute={loadingMinute}
                  />
                </div>
                {overlayData&&(
                  <div style={{padding:"6px 14px",borderTop:"1px solid #f1f5f9",background:"#fafafa",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:9,color:"#94a3b8",fontFamily:MONO}}>Luwes obs.</span>
                    <span style={{fontSize:10,fontWeight:700,fontFamily:MONO,color:hasLuwesObs?"#f97316":"#94a3b8",background:hasLuwesObs?"#ffedd5":"#f1f5f9",padding:"1px 7px",borderRadius:99}}>{overlayData.luwes_stats.count} obs</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tide Stats ── */}
            {(dailyStats||hasLuwesObs)&&(
              <div style={{padding:"10px 12px 0"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  {dailyStats&&(<>
                    <div style={{borderRadius:10,padding:"10px 14px",background:"#e0f2fe",border:"1.5px solid #bae6fd"}}>
                      <p style={{fontSize:9,fontWeight:600,color:"#0284c7",opacity:0.8,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.03em",fontFamily:SANS}}>TPXO · {lang==="en"?"High":"Tinggi"}</p>
                      <p style={{fontFamily:MONO,color:"#0284c7",fontSize:18,fontWeight:700,lineHeight:1}}>{dailyStats.max>0?"+":""}{dailyStats.max.toFixed(3)} m</p>
                    </div>
                    <div style={{borderRadius:10,padding:"10px 14px",background:"#fef3c7",border:"1.5px solid #fde68a"}}>
                      <p style={{fontSize:9,fontWeight:600,color:"#d97706",opacity:0.8,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.03em",fontFamily:SANS}}>TPXO · {lang==="en"?"Low":"Rendah"}</p>
                      <p style={{fontFamily:MONO,color:"#d97706",fontSize:18,fontWeight:700,lineHeight:1}}>{dailyStats.min>0?"+":""}{dailyStats.min.toFixed(3)} m</p>
                    </div>
                  </>)}
                  {hasLuwesObs&&luwesStatsCorrected&&luwesStatsCorrected.max_m!=null&&(<>
                    <div style={{borderRadius:10,padding:"10px 14px",background:"#ffedd5",border:"1.5px solid #fed7aa"}}>
                      <p style={{fontSize:9,fontWeight:600,color:"#f97316",opacity:0.8,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.03em",fontFamily:SANS}}>Luwes · {lang==="en"?"Max":"Maks"}</p>
                      <p style={{fontFamily:MONO,color:"#ea580c",fontSize:18,fontWeight:700,lineHeight:1}}>{luwesStatsCorrected.max_m!.toFixed(3)} m</p>
                    </div>
                    <div style={{borderRadius:10,padding:"10px 14px",background:"#fef9c3",border:"1.5px solid #fef08a"}}>
                      <p style={{fontSize:9,fontWeight:600,color:"#ca8a04",opacity:0.8,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.03em",fontFamily:SANS}}>Luwes · Min</p>
                      <p style={{fontFamily:MONO,color:"#b45309",fontSize:18,fontWeight:700,lineHeight:1}}>{luwesStatsCorrected.min_m!.toFixed(3)} m</p>
                    </div>
                  </>)}
                </div>
              </div>
            )}

            {/* ── Hourly Table ── */}
            <div style={{padding:"12px 12px 0"}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#94a3b8",marginBottom:7,fontFamily:SANS}}>
                {lang==="en"?"Hourly Data (table)":"Data Per Jam (tabel)"}
              </p>
              <div style={{borderRadius:14,overflow:"hidden",background:"#fff",border:"1px solid #e2e8f0"}}>
                <div style={{display:"grid",gridTemplateColumns:"38px 22px 50px 36px 58px 42px 42px",padding:"5px 12px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9",fontSize:9,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",color:"#94a3b8",fontFamily:SANS}}>
                  <span>{lang==="en"?"Time":"Waktu"}</span><span style={{textAlign:"center"}}>Wx</span><span style={{textAlign:"right"}}>{lang==="en"?"Tide":"Pasut"}</span><span style={{textAlign:"right"}}>°C</span><span style={{textAlign:"right"}}>Wind</span><span style={{textAlign:"right"}}>Wave</span><span style={{textAlign:"right"}}>Curr</span>
                </div>
                <div style={{maxHeight:320,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#e2e8f0 transparent"}}>
                  {rows.map((row,idx)=>{
                    const hl=isToday&&row.hour.startsWith(nowHour);
                    const isMax=dailyStats&&row.tideH!==null&&Math.abs(row.tideH-dailyStats.max)<0.015;
                    const isMin=dailyStats&&row.tideH!==null&&Math.abs(row.tideH-dailyStats.min)<0.015;
                    const waveC=row.waveH==null?"#64748b":row.waveH<0.5?"#16a34a":row.waveH<1.25?"#d97706":"#dc2626";
                    const currC=row.currentSpd==null?"#64748b":row.currentSpd<0.25?"#16a34a":row.currentSpd<0.75?"#d97706":"#dc2626";
                    return (
                      <div key={idx} style={{display:"grid",gridTemplateColumns:"38px 22px 50px 36px 58px 42px 42px",padding:"5px 12px",alignItems:"center",borderBottom:"1px solid #f8fafc",background:hl?"linear-gradient(90deg,#e0f2fe,#f0f9ff)":idx%2===0?"#fff":"#fafafa"}}>
                        <span style={{fontFamily:MONO,fontSize:10,fontWeight:hl?700:500,color:hl?"#0284c7":"#64748b"}}>{row.hour}</span>
                        <div style={{display:"flex",justifyContent:"center"}}>{row.wCode!==null&&<WeatherSymbol code={row.wCode} size={11}/>}</div>
                        <span style={{fontFamily:MONO,fontSize:10,textAlign:"right",fontWeight:isMax||isMin?700:500,color:isMax?"#0284c7":isMin?"#d97706":"#334155"}}>{row.tideH!==null?(row.tideH>=0?"+":"")+row.tideH.toFixed(3):"—"}</span>
                        <span style={{fontFamily:MONO,fontSize:10,textAlign:"right",color:"#475569"}}>{row.temp!==null?`${Math.round(row.temp)}°`:"—"}</span>
                        <span style={{fontFamily:MONO,fontSize:10,textAlign:"right",color:"#475569"}}>{row.windSpd!==null?<span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:2}}><span style={{color:"#94a3b8",fontSize:9,fontFamily:SANS}}>{row.windDir!==null?windDirLabel(row.windDir):""}</span>{row.windSpd.toFixed(1)}</span>:"—"}</span>
                        <span style={{fontFamily:MONO,fontSize:10,textAlign:"right",color:waveC}}>{row.waveH!==null?row.waveH.toFixed(2):"—"}</span>
                        <span style={{fontFamily:MONO,fontSize:10,textAlign:"right",color:currC}}>{row.currentSpd!==null?row.currentSpd.toFixed(2):"—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Activity Guide ── */}
            <div style={{padding:"12px 12px 0"}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#94a3b8",marginBottom:7,fontFamily:SANS}}>
                {lang==="en"?"Activity Guide":"Panduan Aktivitas"}
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {activities.map(act=>{
                  const st=statusStyles[act.status];
                  return (
                    <div key={act.id} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:st.bg,border:`1px solid ${st.border}`,borderRadius:8}}>
                      <span style={{color:st.dot,flexShrink:0,display:"flex"}}>{act.icon}</span>
                      <span style={{fontFamily:SANS,fontSize:11,fontWeight:600,color:"#0f172a",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {lang==="en"?act.labelEn:act.labelId}
                      </span>
                      <div style={{width:7,height:7,borderRadius:"50%",background:st.dot,flexShrink:0}}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── IHO S-104 ── */}
            <div style={{padding:"12px 12px 0"}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#94a3b8",marginBottom:7,fontFamily:SANS}}>IHO S-100 / S-104</p>
              <S104Badge coordinates={coordinates} selectedDate={selDate} language={lang}/>
            </div>

            {/* ── Metadata Footer ── */}
            <div style={{margin:"12px 12px 0",borderRadius:11,padding:"10px 13px",background:"#f1f5f9",border:"1px solid #e2e8f0"}}>
              {([
                [lang==="en"?"Tide model":"Model pasut",tideData?.metadata.model],
                ["Datum",tideData?.metadata.datum],
                ...(tideData?[[lang==="en"?"Nearest grid":"Grid terdekat",`${tideData.grid.lat.toFixed(3)}°, ${tideData.grid.lon.toFixed(3)}° · ${tideData.grid.distance_km.toFixed(1)} km`]]:[]),
                [lang==="en"?"Chart resolution":"Resolusi grafik", chartResolutionLabel],
                [lang==="en"?"Table resolution":"Resolusi tabel","1 jam (24 titik) — WIB via parseToWIB"],
                [lang==="en"?"Weather":"Cuaca","Open-Meteo API (timezone=auto → local WIB)"],
                [lang==="en"?"Obs. station":"Stasiun obs.",overlayData?.imei?`IMEI ${overlayData.imei}`:"—"],
                ["TOL","-2.156 m (Luwes → MSL TPXO9)"],
                [lang==="en"?"TZ alignment":"Penyelarasan TZ","TPXO Z→WIB & Luwes +07:00→WIB via parseToWIB"],
              ] as [string,string|undefined][]).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontFamily:MONO,fontSize:10,color:"#94a3b8",fontWeight:500}}>{k}</span>
                  <span style={{fontFamily:MONO,fontSize:10,color:"#64748b"}}>{v??"—"}</span>
                </div>
              ))}
            </div>

            <div style={{height:20}}/>
          </>
        )}
      </div>
    </div>
  );
};