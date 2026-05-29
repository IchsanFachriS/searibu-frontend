import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X, RefreshCw, AlertCircle, Anchor, Wind,
  Waves, Sun, Moon, Navigation, Lock,
} from "lucide-react";
import { useLanguage }  from "../../context/LanguageContext";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal }      from "../subscription/PricingModal";
import { S104ExportSection } from "../subscription/S104ExportSection";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface TideData {
  grid:        { id: number; lon: number; lat: number; distance_km: number };
  predictions: Array<{ time: string; height: number }>;
  statistics:  { max: number; min: number; mean: number; range: number };
  metadata:    { model: string; datum: string; timezone: string; constituents: string[] };
}

interface WeatherData {
  current: { temperature_2m: number; wind_speed_10m: number; wind_direction_10m: number; weather_code: number };
  daily:   { time: string[]; sunrise: string[]; sunset: string[] };
  hourly:  { time: string[]; temperature_2m: number[]; wind_speed_10m: number[]; wind_direction_10m: number[]; weather_code: number[] };
}

interface MarineData {
  current?: { wave_height?: number; ocean_current_velocity?: number };
  hourly: {
    time: string[];
    wave_height: number[];
    ocean_current_velocity: number[];
    wave_direction: number[]; 
    ocean_current_direction: number[];
  };
}

interface LuwesObs    { recorded_at: string; level_m: number }
interface OverlayData { date: string; imei: string; lon: number; lat: number; luwes_obs: LuwesObs[]; tpxo: Array<{ time: string; height: number }>; luwes_stats: { max_m: number | null; min_m: number | null; count: number }; tpxo_stats: { max: number; min: number; mean: number; range: number } }

interface HourRow {
  hour: string;
  tideH: number | null;
  temp: number | null;
  windSpd: number | null;
  windDir: number | null;
  waveH: number | null;
  waveDir: number | null;
  currentSpd: number | null;
  currentDir: number | null;
  wCode: number | null;
}
interface InfoPanelProps { coordinates: { lat: number; lon: number }; onClose: () => void }

/* ── Design tokens ─────────────────────────────────────────────────────── */

const NAVY    = "#0c4a6e";
const OCEAN   = "#075985";
const PRIMARY = "#0369a1";
const SKY     = "#0ea5e9";

const CHART_TPXO  = "#5b7093";
const CHART_LUWES = "#e879a0";

const BG_PAGE  = "#f0f6fb";
const BG_CARD  = "#ffffff";
const BG_MUTED = "#f5f9fc";
const BORDER   = "#dbeafe";
const BORDER_SM = "#e8f0f7";
const TEXT_PRI  = "#0f2744";
const TEXT_SEC  = "#4a6580";
const TEXT_HINT = "#8faabb";
const HIGH_BG   = "#eff8ff";
const HIGH_BDR  = "#bfdbfe";
const HIGH_TEXT = "#4f7af3";
const LOW_BG    = "#fffbf0";
const LOW_BDR   = "#fde68a";
const LOW_TEXT  = "#b45309";

const SANS = '"Plus Jakarta Sans", "Inter", "DM Sans", system-ui, sans-serif';
const MONO = '"Inter", "DM Sans", system-ui, sans-serif';

const TOL_CORRECTION = -2.156;
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";

const FREE_HIST_DAYS = 10;
const FREE_FWD_DAYS  = 3;
const PRO_FWD_DAYS   = 10;

/* ── Utility functions ─────────────────────────────────────────────────── */

const kmhToMs = (v: number) => v / 3.6;

const todayISO = () => {
  const wib = new Date(Date.now() + 7 * 3600_000);
  return wib.toISOString().slice(0, 10);
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseToWIB(ts: string): { wibDate: string; wibHour: number; wibMinute: number } | null {
  try {
    let ms = NaN;
    if (ts.endsWith("Z") || ts.includes("+")) ms = Date.parse(ts);
    else if (ts.includes("T")) ms = Date.parse(ts + "Z");
    if (isNaN(ms)) return null;
    const wib = new Date(ms + 7 * 3600_000);
    return { wibDate: wib.toISOString().slice(0, 10), wibHour: wib.getUTCHours(), wibMinute: wib.getUTCMinutes() };
  } catch { return null; }
}

const WMO: Record<number, { en: string; id: string }> = {
  0:  { en: "Clear sky",      id: "Langit cerah" },
  1:  { en: "Mainly clear",   id: "Cerah berawan" },
  2:  { en: "Partly cloudy",  id: "Sebagian berawan" },
  3:  { en: "Overcast",       id: "Mendung" },
  45: { en: "Foggy",          id: "Berkabut" },
  51: { en: "Light drizzle",  id: "Gerimis ringan" },
  61: { en: "Light rain",     id: "Hujan ringan" },
  63: { en: "Moderate rain",  id: "Hujan sedang" },
  65: { en: "Heavy rain",     id: "Hujan lebat" },
  80: { en: "Light showers",  id: "Hujan rintik" },
  81: { en: "Showers",        id: "Hujan deras" },
  82: { en: "Heavy showers",  id: "Hujan sangat deras" },
  95: { en: "Thunderstorm",   id: "Badai petir" },
  99: { en: "Thunderstorm",   id: "Badai petir" },
};

const wmoLabel = (code: number | null, lang: "en" | "id") => {
  if (code === null) return "—";
  const entry = WMO[code];
  if (entry) return entry[lang];
  const nearest = Object.keys(WMO).map(Number).reduce((a, b) => Math.abs(b - code) < Math.abs(a - code) ? b : a);
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

/* ── Session cache ─────────────────────────────────────────────────────── */

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
  try { sessionStorage.removeItem(cacheKey(lat, lon, "wx")); sessionStorage.removeItem(cacheKey(lat, lon, "marine")); } catch {}
}

/* ── Cubic spline interpolation for TPXO chart ─────────────────────────── */

function buildCubicSpline(knots: { x: number; y: number }[]): (x: number) => number {
  const n = knots.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => knots[0].y;
  if (n === 2) { const [a, b] = knots; return (x) => a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); }
  const xs = knots.map((k) => k.x);
  const ys = knots.map((k) => k.y);
  const h  = Array.from({ length: n - 1 }, (_, i) => xs[i + 1] - xs[i]);
  const rhs = new Array(n).fill(0.0);
  const upper = new Array(n).fill(0.0);
  const mu    = new Array(n).fill(0.0);
  for (let i = 1; i < n - 1; i++) { const tot = h[i - 1] + h[i]; upper[i] = h[i] / tot; rhs[i] = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]) / tot; mu[i] = h[i - 1] / (h[i - 1] + h[i]); }
  const diagMod = new Array(n).fill(2.0);
  const rhs2 = [...rhs];
  for (let i = 1; i < n - 1; i++) { const w = mu[i] / diagMod[i - 1]; diagMod[i] -= w * upper[i - 1]; rhs2[i] -= w * rhs2[i - 1]; }
  const M = new Array(n).fill(0.0);
  M[n - 2] = rhs2[n - 2] / diagMod[n - 2];
  for (let i = n - 3; i >= 1; i--) M[i] = (rhs2[i] - upper[i] * M[i + 1]) / diagMod[i];
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 2;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (xs[mid + 1] < x) lo = mid + 1; else hi = mid; }
    const i = lo; const dx = x - xs[i]; const hi_ = h[i];
    return ys[i] + dx * ((ys[i + 1] - ys[i]) / hi_ - hi_ * (2 * M[i] + M[i + 1]) / 6 + dx * (M[i] / 2 + dx * (M[i + 1] - M[i]) / (6 * hi_)));
  };
}

function interpolateTPXOPerMinute(knots: { x: number; y: number }[]): { x: number; y: number }[] {
  if (knots.length < 2) return knots;
  const spline = buildCubicSpline(knots);
  const xMin = knots[0].x; const xMax = knots[knots.length - 1].x;
  const result: { x: number; y: number }[] = [];
  for (let min = 0; min <= (xMax - xMin) * 60 + 0.5; min++) {
    const x = xMin + min / 60;
    if (x > xMax + 1e-9) break;
    result.push({ x: Math.min(x, xMax), y: spline(Math.min(x, xMax)) });
  }
  return result;
}

/* ── Shimmer skeleton loaders ──────────────────────────────────────────── */

const Shimmer: React.FC<{ w?: string; h?: string; r?: string }> = ({ w = "100%", h = "12px", r = "4px" }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#dbeafe 25%,#eff6ff 50%,#dbeafe 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s linear infinite" }} />
);

const SkeletonHero = () => (
  <div style={{ margin: "14px 14px 0", borderRadius: 14, padding: 18, background: "#dbeafe" }}>
    <Shimmer w="55%" h="9px" />
    <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
      {[0,1,2,3].map((i) => (
        <div key={i} style={{ flex: 1 }}>
          <Shimmer w="40%" h="7px" />
          <div style={{ marginTop: 5 }}><Shimmer w="60%" h={i === 2 ? "28px" : "20px"} /></div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonChart = () => (
  <div style={{ margin: "14px 14px 0", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
    <div style={{ padding: "10px 14px 3px" }}><Shimmer w="50%" h="9px" /></div>
    <div style={{ padding: 10, display: "flex", alignItems: "flex-end", gap: 2, height: 160 }}>
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, height: `${30 + Math.sin(i * 0.5) * 25 + Math.random() * 20}%`, background: "linear-gradient(90deg,#dbeafe 25%,#eff6ff 50%,#dbeafe 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.6s linear ${i * 0.04}s infinite` }} />
      ))}
    </div>
  </div>
);

/* ── Weather symbol SVG ────────────────────────────────────────────────── */

const WeatherSymbol: React.FC<{ code: number; size?: number }> = ({ code, size = 16 }) => {
  const s = { width: size, height: size };
  const p = { fill: "none", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (code <= 1) return <svg {...s} viewBox="0 0 24 24" stroke="#f59e0b" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
  if (code <= 3) return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" /></svg>;
  if (code >= 51 && code <= 82) return <svg {...s} viewBox="0 0 24 24" stroke="#60a5fa" {...p}><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 19v2M12 19v2M16 19v2" /></svg>;
  if (code >= 95) return <svg {...s} viewBox="0 0 24 24" stroke="#a78bfa" {...p}><path d="M19 16.9A5 5 0 0015 9h-1V8a7 7 0 10-13 3M13 16l-4 6h6l-4 6" /></svg>;
  return <svg {...s} viewBox="0 0 24 24" stroke="#94a3b8" {...p}><path d="M3 8h18M3 12h18M3 16h18" /></svg>;
};

/* ── Overlay chart (TPXO + Luwes) ─────────────────────────────────────── */

const OverlayChart: React.FC<{
  tpxoPredictions: Array<{ time: string; height: number }>;
  luwesObs:        Array<{ recorded_at: string; level_m: number }>;
  dateStr:         string;
}> = ({ tpxoPredictions, luwesObs, dateStr }) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const chartRef    = useRef<any>(null);
  const tooltipIdRef = useRef(`searibu-tip-${Math.random().toString(36).slice(2, 7)}`);
  const bulletRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const nextDate = addDays(dateStr, 1);
    const tpxoKnots: { x: number; y: number }[] = [];
    tpxoPredictions.forEach((p) => {
      const w = parseToWIB(p.time);
      if (!w) return;
      if (w.wibDate === dateStr)   tpxoKnots.push({ x: w.wibHour + w.wibMinute / 60, y: p.height });
      else if (w.wibDate === nextDate && w.wibHour === 0 && w.wibMinute === 0) tpxoKnots.push({ x: 24, y: p.height });
    });
    tpxoKnots.sort((a, b) => a.x - b.x);
    const tpxoPts = interpolateTPXOPerMinute(tpxoKnots);

    const luwesPts: { x: number; y: number }[] = [];
    luwesObs.forEach((o) => {
      const w = parseToWIB(o.recorded_at);
      if (w && w.wibDate === dateStr) luwesPts.push({ x: w.wibHour + w.wibMinute / 60, y: o.level_m });
    });

    const nearestY = (pts: { x: number; y: number }[], x: number, maxDist = 0.15): number | null => {
      if (!pts.length) return null;
      let best = pts[0], bestD = Math.abs(x - pts[0].x);
      for (const pt of pts) { const d = Math.abs(x - pt.x); if (d < bestD) { bestD = d; best = pt; } }
      return bestD <= maxDist ? best.y : null;
    };
    const nearestTPXO = (x: number) => nearestY(tpxoPts, x, 3 / 60);

    const wibNow = new Date(Date.now() + 7 * 3600_000);
    const isToday = dateStr === wibNow.toISOString().slice(0, 10);
    const nowX = isToday ? wibNow.getUTCHours() + wibNow.getUTCMinutes() / 60 : -1;
    const tooltipId = tooltipIdRef.current;

    const ensureTooltip = (): HTMLDivElement => {
      let el = document.getElementById(tooltipId) as HTMLDivElement | null;
      if (!el) {
        el = document.createElement("div");
        el.id = tooltipId;
        el.style.cssText = `position:fixed;pointer-events:none;z-index:99999;background:${NAVY};color:#e0f2fe;border-radius:8px;padding:8px 12px;font-family:${MONO};font-size:11.5px;box-shadow:0 4px 18px rgba(7,89,133,0.22);min-width:110px;line-height:1.65;display:none;border:1px solid rgba(14,165,233,0.18);`;
        document.body.appendChild(el);
      }
      return el;
    };

    const hideTooltip = () => {
      const el = document.getElementById(tooltipId);
      if (el) el.style.display = "none";
      if (bulletRef.current) bulletRef.current.style.display = "none";
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
            { label: "Predicted", type: "line" as any, data: tpxoPts, borderColor: CHART_TPXO, backgroundColor: (c: any) => { const { chart: { ctx: cx, chartArea: ca } } = c; if (!ca) return "rgba(59,130,246,0.09)"; const g = cx.createLinearGradient(0, ca.top, 0, ca.bottom); g.addColorStop(0, "rgba(59,130,246,0.16)"); g.addColorStop(1, "rgba(59,130,246,0)"); return g; }, borderWidth: 2, fill: true, tension: 0, pointRadius: 0, spanGaps: false, order: 2, parsing: false },
            { label: "Observed", type: "scatter" as any, data: luwesPts, borderColor: `${CHART_LUWES}bb`, backgroundColor: `${CHART_LUWES}99`, pointRadius: 1.8, order: 1, parsing: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: "index", intersect: false, axis: "x" },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { type: "linear", min: 0, max: 24, padding: { left: 5, right: 5 }, grid: { color: (c: any) => c.tick.value % 3 === 0 ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)" }, border: { display: false }, ticks: { color: TEXT_HINT, font: { family: MONO, size: 9.5 }, maxRotation: 0, stepSize: 1, autoSkip: false, includeBounds: true, callback: (v: any) => { const n = Number(v); if (n === 0) return "00:00"; if (n === 24) return "24:00"; return n % 3 === 0 ? `${n.toString().padStart(2,"0")}:00` : ""; } } },
            y: { grid: { color: "rgba(59,130,246,0.05)" }, border: { display: false }, ticks: { color: TEXT_HINT, font: { family: MONO, size: 9.5 }, callback: (v: any) => `${Number(v).toFixed(2)} m` }, title: { display: true, text: "Water Level (m)", color: TEXT_HINT, font: { size: 9.5, family: MONO } } },
          },
          onHover: (event: any, _elements: any[], chart: any) => {
            if (!event?.native) { hideTooltip(); return; }
            const xVal = chart.scales.x?.getValueForPixel(event.x);
            if (xVal == null || xVal < 0 || xVal > 24) { hideTooltip(); return; }
            const tpxoVal = nearestTPXO(xVal);
            const luwesVal = nearestY(luwesPts, xVal, 0.12);
            if (tpxoVal === null && luwesVal === null) { hideTooltip(); return; }
            const hh = Math.floor(xVal); const mm = Math.round((xVal - hh) * 60);
            const timeLabel = `${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")} WIB`;
            let html = `<div style="color:#7dd3fc;font-size:9.5px;font-weight:600;letter-spacing:0.05em;margin-bottom:5px;text-transform:uppercase;">${timeLabel}</div>`;
            if (tpxoVal !== null)  html += `<div style="display:flex;align-items:center;gap:5px;margin-bottom:${luwesVal !== null ? 3 : 0}px;"><span style="width:7px;height:7px;border-radius:50%;background:${CHART_TPXO};flex-shrink:0;"></span><span style="color:#93c5fd;font-size:10px;">Prediction</span><span style="margin-left:auto;font-weight:600;color:#dbeafe;">${tpxoVal.toFixed(3)} m</span></div>`;
            if (luwesVal !== null) html += `<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:${CHART_LUWES};flex-shrink:0;"></span><span style="color:#f9a8d4;font-size:10px;">Observation</span><span style="margin-left:auto;font-weight:600;color:#fce7f3;">${luwesVal.toFixed(3)} m</span></div>`;
            const tip = ensureTooltip();
            tip.innerHTML = html; tip.style.display = "block";
            const canvas = canvasRef.current; if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const xPx = chart.scales.x.getPixelForValue(xVal);
            const scaleX = rect.width / (canvas.offsetWidth || 1);
            const scaleY = rect.height / (canvas.offsetHeight || 1);
            const screenX = rect.left + xPx * scaleX;
            if (bulletRef.current && tpxoVal !== null) {
              const tpxoScreenY = rect.top + chart.scales.y.getPixelForValue(tpxoVal) * scaleY;
              const canvasParent = canvas.parentElement;
              if (canvasParent) {
                const pr = canvasParent.getBoundingClientRect();
                bulletRef.current.style.display = "block";
                bulletRef.current.style.left = `${screenX - pr.left - 6}px`;
                bulletRef.current.style.top  = `${tpxoScreenY - pr.top - 6}px`;
              }
            } else if (bulletRef.current) bulletRef.current.style.display = "none";
            const tipW = 168; const tipH = tpxoVal !== null && luwesVal !== null ? 78 : 54;
            const yAnchor = tpxoVal !== null ? rect.top + chart.scales.y.getPixelForValue(tpxoVal) * scaleY : rect.top + chart.scales.y.getPixelForValue(luwesVal!) * scaleY;
            let left = screenX - tipW / 2; let top = yAnchor - tipH - 10;
            if (left < 8) left = 8; if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
            if (top < 8) top = yAnchor + 10;
            tip.style.left = `${left}px`; tip.style.top = `${top}px`;
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
            c.strokeStyle = "rgba(251,113,133,0.75)"; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.stroke();
            c.fillStyle = "rgba(251,113,133,0.95)"; c.font = `bold 9px ${MONO}`; c.textAlign = "center"; c.fillText("NOW", x, ca.top + 10);
            c.restore();
          },
        }],
      });
      canvasRef.current?.addEventListener("mouseleave", hideTooltip);
    });

    return () => {
      cancelled = true;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      document.getElementById(tooltipIdRef.current)?.remove();
    };
  }, [tpxoPredictions, luwesObs, dateStr]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <div ref={bulletRef} style={{ position: "absolute", display: "none", width: 11, height: 11, borderRadius: "50%", background: CHART_TPXO, border: "2.5px solid #fff", boxShadow: `0 0 0 2px rgba(59,130,246,0.30)`, pointerEvents: "none", zIndex: 10, transition: "left 0.04s, top 0.04s" }} />
    </div>
  );
};

/* ── InfoPanel ─────────────────────────────────────────────────────────── */

export const InfoPanel: React.FC<InfoPanelProps> = ({ coordinates, onClose }) => {
  const { language } = useLanguage();
  const lang = language as "en" | "id";
  const { isPro } = useSubContext();
  const [showPricing, setShowPricing] = useState(false);

  const [tideData,    setTideData]    = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [marineData,  setMarineData]  = useState<MarineData | null>(null);
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [weatherFromCache, setWeatherFromCache] = useState(false);
  const [selDate, setSelDate] = useState<string>(todayISO());

  const todayStr   = todayISO();
  const minDateISO = isPro ? "2000-01-01" : addDays(todayStr, -FREE_HIST_DAYS);
  const maxDateISO = isPro ? addDays(todayStr, PRO_FWD_DAYS) : addDays(todayStr, FREE_FWD_DAYS);

  const fetchAll = useCallback(async (dateStr: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    if (dateStr < minDateISO || dateStr > maxDateISO) {
      setError(
        lang === "en"
          ? `Date out of range. Please choose between ${isPro ? "any past date" : minDateISO} and ${maxDateISO}.`
          : `Tanggal di luar jangkauan. Pilih antara ${isPro ? "tanggal manapun" : minDateISO} dan ${maxDateISO}.`,
      );
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const fmtD  = (d: Date) => d.toISOString().split("T")[0];
      let wd: WeatherData | null = null;
      let md: MarineData  | null = null;
      let usedCache = false;

      if (!forceRefresh) {
        wd = readCache<WeatherData>(coordinates.lat, coordinates.lon, "wx");
        md = readCache<MarineData>(coordinates.lat, coordinates.lon, "marine");
        if (wd && md) usedCache = true;
      }

      if (!wd || !md) {
        const wxDaysBack = isPro ? 16 : FREE_HIST_DAYS + 2;
        const wxDaysFwd  = isPro ? PRO_FWD_DAYS + 2 : FREE_FWD_DAYS + 2;
        const wxStart = new Date(today); wxStart.setDate(wxStart.getDate() - wxDaysBack);
        const wxEnd   = new Date(today); wxEnd.setDate(wxEnd.getDate() + wxDaysFwd + 1);

        const [wxRes, marRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=sunrise,sunset&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`),
          fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=wave_height,ocean_current_velocity,wave_direction,ocean_current_direction&current=wave_height,ocean_current_velocity&timezone=auto&start_date=${fmtD(wxStart)}&end_date=${fmtD(wxEnd)}`),        ]);

        if (!wxRes.ok) throw new Error(lang === "en" ? "Weather service unavailable" : "Layanan cuaca tidak tersedia");
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

      if (!tr.ok) { const e = await tr.json().catch(() => ({})); throw new Error((e as any).error ?? (lang === "en" ? "Tide service unavailable" : "Layanan pasut tidak tersedia")); }
      setTideData(await tr.json() as TideData);
      setOverlayData(or_.ok ? await or_.json() as OverlayData : null);

    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "en" ? "Unknown error" : "Kesalahan tidak dikenal"));
    } finally { setLoading(false); }
  }, [coordinates, lang, isPro, minDateISO, maxDateISO]);

  useEffect(() => { const d = todayISO(); setSelDate(d); fetchAll(d); }, [coordinates.lat, coordinates.lon]);

  const getSunTimes = () => {
    if (!weatherData?.daily) return { sunrise: "--:--", sunset: "--:--" };
    const idx = weatherData.daily.time.findIndex((t) => t === selDate);
    if (idx === -1) return { sunrise: "--:--", sunset: "--:--" };
    return { sunrise: fmtHHmm(weatherData.daily.sunrise[idx]), sunset: fmtHHmm(weatherData.daily.sunset[idx]) };
  };

  const buildRows = (): HourRow[] => {
    const tideMap = new Map<number, number>();
    tideData?.predictions.forEach((p) => { const w = parseToWIB(p.time); if (w && w.wibDate === selDate) tideMap.set(w.wibHour, p.height); });
    const wxMap = new Map<string, Partial<HourRow>>();
    weatherData?.hourly.time.forEach((t, i) => { if (!t.startsWith(selDate)) return; const hh = new Date(t).getHours().toString().padStart(2,"0"); wxMap.set(hh, { temp: weatherData.hourly.temperature_2m[i], windSpd: weatherData.hourly.wind_speed_10m[i] != null ? kmhToMs(weatherData.hourly.wind_speed_10m[i]) : null, windDir: weatherData.hourly.wind_direction_10m[i], wCode: weatherData.hourly.weather_code[i] }); });
    const marineMap = new Map<string, { waveH: number | null; waveDir: number | null; currentSpd: number | null; currentDir: number | null }>();
    marineData?.hourly.time.forEach((t, i) => { if (!t.startsWith(selDate)) return; const hh = new Date(t).getHours().toString().padStart(2,"0"); marineMap.set(hh, { waveH: marineData.hourly.wave_height[i] ?? null, waveDir: marineData.hourly.wave_direction?.[i] ?? null, currentSpd: marineData.hourly.ocean_current_velocity[i] ?? null, currentDir: marineData.hourly.ocean_current_direction?.[i] ?? null }); });
    return Array.from({ length: 24 }, (_, i) => {
      const hh = i.toString().padStart(2,"0");
      const marine = marineMap.get(hh) ?? { waveH: null, waveDir: null, currentSpd: null, currentDir: null };
      const wx = wxMap.get(hh) ?? {};
      return {
        hour: `${hh}:00`,
        tideH: tideMap.get(i) ?? null,
        temp: null,
        windSpd: null,
        windDir: null,
        wCode: null,
        ...wx,       
        ...marine,   
      } as HourRow;
    });
  };

  const tpxoHighLow = (() => {
    const hs = tideData?.predictions.filter((p) => parseToWIB(p.time)?.wibDate === selDate) ?? [];
    if (!hs.length) return null;
    let hi = hs[0], lo = hs[0];
    for (const p of hs) { if (p.height > hi.height) hi = p; if (p.height < lo.height) lo = p; }
    const fmtT = (iso: string) => { const w = parseToWIB(iso); return w ? `${w.wibHour.toString().padStart(2,"0")}:00` : "--:--"; };
    return { max: hi.height, maxTime: fmtT(hi.time), min: lo.height, minTime: fmtT(lo.time) };
  })();

  const luwesForChart = (overlayData?.luwes_obs ?? [])
    .filter((o) => parseToWIB(o.recorded_at)?.wibDate === selDate)
    .map((o) => ({ ...o, level_m: o.level_m + TOL_CORRECTION }));
  const hasLuwesObs = luwesForChart.length > 0;

  const luwesStatsCorrected = hasLuwesObs
    ? { max_m: Math.max(...luwesForChart.map((o) => o.level_m)), min_m: Math.min(...luwesForChart.map((o) => o.level_m)), count: luwesForChart.length }
    : overlayData?.luwes_stats ?? null;

  const { sunrise, sunset } = getSunTimes();
  const rows       = buildRows();
  const current    = weatherData?.current;
  const currentWindMs      = current ? kmhToMs(current.wind_speed_10m) : null;
  const currentWaveH       = marineData?.current?.wave_height ?? marineData?.hourly.wave_height[0] ?? null;
  const currentCurrentSpd  = marineData?.current?.ocean_current_velocity ?? marineData?.hourly.ocean_current_velocity[0] ?? null;
  const nowHour   = new Date(Date.now() + 7 * 3600_000).getUTCHours().toString().padStart(2,"0");
  const isToday   = selDate === todayISO();

  const maxHourIdx = (() => { const dp = tideData?.predictions.filter((p) => parseToWIB(p.time)?.wibDate === selDate) ?? []; if (!dp.length) return -1; let b = 0; for (let i = 1; i < dp.length; i++) if (dp[i].height > dp[b].height) b = i; const w = parseToWIB(dp[b].time); return w ? w.wibHour : -1; })();
  const minHourIdx = (() => { const dp = tideData?.predictions.filter((p) => parseToWIB(p.time)?.wibDate === selDate) ?? []; if (!dp.length) return -1; let b = 0; for (let i = 1; i < dp.length; i++) if (dp[i].height < dp[b].height) b = i; const w = parseToWIB(dp[b].time); return w ? w.wibHour : -1; })();

  const selDateFmt = new Date(selDate + "T12:00:00Z").toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.value;
    if (chosen < minDateISO || chosen > maxDateISO) return;
    setSelDate(chosen);
    fetchAll(chosen);
  };

  const SL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: TEXT_HINT, marginBottom: 7, fontFamily: SANS }}>{children}</p>
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", borderLeft: `1px solid ${BORDER}`, fontFamily: SANS, background: BG_PAGE, overscrollBehavior: "contain", minWidth: 0 }}>

      {/* Top bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: BG_CARD, borderBottom: `1px solid ${BORDER}`, gap: 7, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, letterSpacing: "-0.01em", fontFamily: SANS, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {lang === "en" ? "Marine Information" : "Informasi Kelautan"}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <button onClick={() => { clearCache(coordinates.lat, coordinates.lon); fetchAll(selDate, true); }} title={lang === "en" ? "Refresh weather data" : "Perbarui data cuaca"} style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: TEXT_HINT, display: "flex" }} onMouseEnter={(e) => (e.currentTarget.style.background = BG_MUTED)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><RefreshCw size={13} /></button>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: TEXT_HINT, display: "flex" }} onMouseEnter={(e) => (e.currentTarget.style.background = BG_MUTED)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><X size={15} /></button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent`, overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", minWidth: 0 }} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>

        {loading && (<><SkeletonHero /><div style={{ margin: "14px 14px 0" }}><Shimmer w="30%" h="8px" /><div style={{ marginTop: 7 }}><Shimmer w="100%" h="34px" r="10px" /></div></div><SkeletonChart /></>)}

        {error && !loading && (
          <div style={{ margin: 14, padding: 14, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertCircle size={15} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: "#be123c", fontSize: 13, fontWeight: 600, marginBottom: 3, fontFamily: SANS }}>{lang === "en" ? "Unable to load data" : "Gagal memuat data"}</p>
                <p style={{ color: "#e11d48", fontSize: 11.5, marginBottom: 9, fontFamily: SANS }}>{error}</p>
                <button onClick={() => fetchAll(selDate)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#be123c", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
                  <RefreshCw size={11} />{lang === "en" ? "Try again" : "Coba lagi"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Hero card */}
            <div style={{ margin: "14px 14px 0", borderRadius: 14, overflow: "hidden", background: `linear-gradient(135deg,${NAVY} 0%,${OCEAN} 55%,${PRIMARY} 100%)`, boxShadow: "0 4px 14px rgba(7,89,133,0.12)" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontFamily: MONO, color: "rgba(186,230,253,0.60)", fontSize: 10, letterSpacing: "0.03em", margin: 0 }}>
                  {Math.abs(coordinates.lat).toFixed(4)}°{coordinates.lat >= 0 ? "N" : "S"}&ensp;{Math.abs(coordinates.lon).toFixed(4)}°{coordinates.lon >= 0 ? "E" : "W"}
                </p>
                {isToday && <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: "rgba(186,230,253,0.50)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{lang === "en" ? "Today" : "Hari ini"}</span>}
              </div>
              <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", gap: 14 }}>
                {current && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div>
                      <p style={{ color: "#e0f2fe", fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: SANS, margin: 0 }}>{Math.round(current.temperature_2m)}°</p>
                      <p style={{ color: "rgba(186,230,253,0.65)", fontSize: 11, fontWeight: 500, fontFamily: SANS, margin: "4px 0 0", whiteSpace: "nowrap" }}>{wmoLabel(current.weather_code, lang)}</p>
                    </div>
                    <div style={{ marginTop: 4 }}><WeatherSymbol code={current.weather_code} size={22} /></div>
                  </div>
                )}
                <div style={{ width: 1, height: 52, background: "rgba(186,230,253,0.15)", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Sun size={11} color="#fde68a" style={{ flexShrink: 0 }} />
                    <span style={{ color: "rgba(186,230,253,0.45)", fontSize: 9.5, fontWeight: 600, fontFamily: SANS, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{lang === "en" ? "Rise" : "Terbit"}</span>
                    <span style={{ fontFamily: MONO, color: "#e0f2fe", fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{sunrise}</span>
                    <span style={{ color: "rgba(186,230,253,0.35)", fontSize: 9, fontFamily: SANS }}>WIB</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Moon size={11} color="#fda4af" style={{ flexShrink: 0 }} />
                    <span style={{ color: "rgba(186,230,253,0.45)", fontSize: 9.5, fontWeight: 600, fontFamily: SANS, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{lang === "en" ? "Set" : "Terbenam"}</span>
                    <span style={{ fontFamily: MONO, color: "#e0f2fe", fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{sunset}</span>
                    <span style={{ color: "rgba(186,230,253,0.35)", fontSize: 9, fontFamily: SANS }}>WIB</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(186,230,253,0.1)" }}>
                {[
                  { icon: <Wind      size={11} color="rgba(186,230,253,0.45)" />, label: lang==="en"?"Wind":"Angin",     value: currentWindMs != null ? currentWindMs.toFixed(1) : "—",     unit: "m/s", sub: currentWindMs != null ? `${windDirLabel(current!.wind_direction_10m)} ${current!.wind_direction_10m.toFixed(0)}°` : "", accent: "#93c5fd" },
                  { icon: <Waves     size={11} color="rgba(186,230,253,0.45)" />, label: lang==="en"?"Wave":"Gelombang", value: currentWaveH != null ? currentWaveH.toFixed(2) : "—",         unit: "m",   sub: currentWaveH != null ? (currentWaveH<0.5?(lang==="en"?"Calm":"Tenang"):currentWaveH<1.25?(lang==="en"?"Slight":"Kecil"):currentWaveH<2.5?(lang==="en"?"Moderate":"Sedang"):(lang==="en"?"Rough":"Kasar")) : "", accent: "#7dd3fc" },
                  { icon: <Navigation size={11} color="rgba(186,230,253,0.45)" />, label: lang==="en"?"Current":"Arus", value: currentCurrentSpd != null ? currentCurrentSpd.toFixed(2) : "—", unit: "m/s", sub: currentCurrentSpd != null ? (currentCurrentSpd<0.25?(lang==="en"?"Weak":"Lemah"):currentCurrentSpd<0.75?(lang==="en"?"Moderate":"Sedang"):(lang==="en"?"Strong":"Kuat")) : "", accent: "#a5f3fc" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "10px 12px 12px", borderRight: i < 2 ? "1px solid rgba(186,230,253,0.08)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 5 }}>{item.icon}<span style={{ color: "rgba(186,230,253,0.45)", fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, fontFamily: SANS }}>{item.label}</span></div>
                    <p style={{ fontFamily: MONO, color: "#e0f2fe", fontSize: 17, fontWeight: 700, lineHeight: 1, margin: 0 }}>{item.value}<span style={{ fontSize: 9.5, color: item.accent, fontWeight: 400, marginLeft: 2, opacity: 0.8 }}>{item.unit}</span></p>
                    {item.sub && <p style={{ color: "rgba(186,230,253,0.35)", fontSize: 9, marginTop: 3, fontFamily: SANS, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{item.sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div style={{ padding: "14px 14px 0" }}>
              <SL>{lang === "en" ? "Select Date" : "Pilih Tanggal"}</SL>
              <input
                type="date"
                value={selDate}
                min={minDateISO}
                max={maxDateISO}
                onChange={handleDateChange}
                style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: SANS, color: TEXT_PRI, background: BG_CARD, cursor: "pointer", outline: "none", boxSizing: "border-box" as const, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = SKY; e.currentTarget.style.boxShadow = "0 0 0 2.5px rgba(14,165,233,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
              />
              {isPro ? (
                <p style={{ fontFamily: SANS, fontSize: 10.5, color: TEXT_HINT, marginTop: 5 }}>
                  {lang === "en"
                    ? `Pro: any historical date · ${PRO_FWD_DAYS} days ahead`
                    : `Pro: semua tanggal historis · ${PRO_FWD_DAYS} hari ke depan`}
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "7px 11px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
                  <Lock size={11} style={{ color: "#b45309", flexShrink: 0 }} />
                  <span style={{ fontFamily: SANS, fontSize: 10.5, color: "#b45309", lineHeight: 1.4, flex: 1 }}>
                    {lang === "en"
                      ? `Free: past ${FREE_HIST_DAYS} days – ${FREE_FWD_DAYS} days ahead. `
                      : `Gratis: ${FREE_HIST_DAYS} hari lalu – ${FREE_FWD_DAYS} hari ke depan. `}
                    <button onClick={() => setShowPricing(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706", fontWeight: 700, fontSize: 10.5, padding: "0 2px", fontFamily: SANS, textDecoration: "underline", inlineSize: "max-content" }}>
                      {lang === "en" ? "Upgrade for more →" : "Upgrade untuk lebih →"}
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Overlay chart */}
            <div style={{ padding: "14px 14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 4, flexWrap: "wrap" as const }}>
                <SL>{hasLuwesObs ? (lang==="en"?"Observation vs Prediction":"Observasi vs Prediksi") : (lang==="en"?"Prediction Tide Levels":"Tinggi Pasut Prediksi")}</SL>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, color: HIGH_TEXT, fontWeight: 700, background: HIGH_BG, border: `1px solid ${HIGH_BDR}`, padding: "2px 8px", borderRadius: 99, fontFamily: SANS }}><span style={{ display: "inline-block", width: 12, height: 2, background: CHART_TPXO, borderRadius: 1 }} />Prediction</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, color: hasLuwesObs?"#be185d":"#8faabb", fontWeight: 700, background: hasLuwesObs?"#fdf2f8":"#f0f6fb", border: `1px solid ${hasLuwesObs?"#fbcfe8":"#dbeafe"}`, padding: "2px 8px", borderRadius: 99, fontFamily: SANS }}><span style={{ display: "inline-block", width: 6, height: 6, background: hasLuwesObs?CHART_LUWES:"#b0c8d8", borderRadius: "50%" }} />Observation</span>
                  {isToday && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, color: "#e11d48", fontWeight: 700, background: "#fff1f2", border: "1px solid #fecdd3", padding: "2px 8px", borderRadius: 99, fontFamily: SANS }}><span style={{ display: "inline-block", width: 8, height: 1.5, background: "#fb7185", borderRadius: 1 }} />Now</span>}
                </div>
              </div>
              <div style={{ borderRadius: 12, overflow: "hidden", background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: TEXT_SEC, fontFamily: SANS, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1, paddingRight: 7 }}>{selDateFmt}</p>
                </div>
                <div style={{ height: 280, padding: "4px 8px 12px", position: "relative" }}>
                  <OverlayChart tpxoPredictions={tideData?.predictions ?? []} luwesObs={luwesForChart} dateStr={selDate} />
                </div>
              </div>
            </div>

            {/* High / Low */}
            <div style={{ padding: "10px 14px 0" }}>
              {tpxoHighLow && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ borderRadius: 11, padding: "10px 14px", background: HIGH_BG, border: `1.5px solid ${HIGH_BDR}`, boxShadow: "0 1px 2px rgba(59,130,246,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: CHART_TPXO, flexShrink: 0 }} /><p style={{ fontSize: 9, fontWeight: 700, color: HIGH_TEXT, opacity: 0.8, textTransform: "uppercase" as const, letterSpacing: "0.04em", fontFamily: SANS, margin: 0 }}>TPXO · {lang==="en"?"High":"Tertinggi"}</p></div>
                    <p style={{ fontFamily: MONO, color: HIGH_TEXT, fontSize: 20, fontWeight: 800, lineHeight: 1, margin: 0 }}>{tpxoHighLow.max > 0 ? "+" : ""}{tpxoHighLow.max.toFixed(3)} m</p>
                    <p style={{ fontFamily: SANS, fontSize: 10, color: HIGH_TEXT, marginTop: 3, opacity: 0.6 }}>~{tpxoHighLow.maxTime} WIB</p>
                  </div>
                  <div style={{ borderRadius: 11, padding: "10px 14px", background: LOW_BG, border: `1.5px solid ${LOW_BDR}`, boxShadow: "0 1px 2px rgba(245,158,11,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} /><p style={{ fontSize: 9, fontWeight: 700, color: LOW_TEXT, opacity: 0.8, textTransform: "uppercase" as const, letterSpacing: "0.04em", fontFamily: SANS, margin: 0 }}>TPXO · {lang==="en"?"Low":"Terendah"}</p></div>
                    <p style={{ fontFamily: MONO, color: LOW_TEXT, fontSize: 20, fontWeight: 800, lineHeight: 1, margin: 0 }}>{tpxoHighLow.min > 0 ? "+" : ""}{tpxoHighLow.min.toFixed(3)} m</p>
                    <p style={{ fontFamily: SANS, fontSize: 10, color: LOW_TEXT, marginTop: 3, opacity: 0.6 }}>~{tpxoHighLow.minTime} WIB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hourly Data - PEMBARUAN STRUKTUR TABEL 100% RESPONSIF */}
            <div style={{ padding: "14px 0 0" }}>
              <div style={{ padding: "0 14px", marginBottom: 7 }}>
                <SL>{lang==="en"?"Hourly Data (00:00–23:00 WIB)":"Data Per Jam (00:00–23:00 WIB)"}</SL>
              </div>
              <div style={{ background: BG_CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ width: "100%", minWidth: "460px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{
                        background: BG_MUTED,
                        borderBottom: `1px solid ${BORDER_SM}`,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: TEXT_HINT,
                        fontFamily: SANS,
                      }}>
                        <th style={{ width: "13%", padding: "8px 10px", textAlign: "left", fontWeight: 700 }}>{lang==="en"?"TIME":"JAM"}</th>
                        <th style={{ width: "9%", padding: "8px 5px", textAlign: "center", fontWeight: 700 }}>WX</th>
                        <th style={{ width: "17%", padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>TIDE</th>
                        <th style={{ width: "11%", padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>°C</th>
                        <th style={{ width: "17%", padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>WIND</th>
                        <th style={{ width: "17%", padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>WAVE</th>
                        <th style={{ width: "16%", padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>CURR.</th>
                      </tr>
                    </thead>
                  </table>
                  
                  <div style={{ height: 350, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <tbody>
                        {rows.map((row, idx) => {
                          const hl = isToday && row.hour.startsWith(nowHour + ":00");
                          const isMax = idx === maxHourIdx;
                          const isMin = idx === minHourIdx;
                          const waveC = row.waveH == null ? TEXT_HINT : row.waveH < 0.5 ? "#16a34a" : row.waveH < 1.25 ? "#d97706" : "#e11d48";
                          const currC = row.currentSpd == null ? TEXT_HINT : row.currentSpd < 0.25 ? "#16a34a" : row.currentSpd < 0.75 ? "#d97706" : "#e11d48";
                          const isLast = idx === rows.length - 1;
                          const arrowStyle = (deg: number | null): React.CSSProperties => ({
                            display: "inline-block",
                            transform: deg !== null ? `rotate(${deg}deg)` : "none",
                            fontSize: 8,
                            lineHeight: 1,
                            color: TEXT_HINT,
                            flexShrink: 0,
                          });
                          return (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: isLast ? "none" : `1px solid ${BORDER_SM}`,
                                background: hl
                                  ? `linear-gradient(90deg,${HIGH_BG},#f5fbff)`
                                  : idx % 2 === 0 ? BG_CARD : BG_MUTED,
                              }}
                            >
                              {/* TIME */}
                              <td style={{ width: "13%", padding: "8px 10px", fontFamily: MONO, fontSize: 9.5, fontWeight: hl ? 700 : 400, color: hl ? PRIMARY : TEXT_SEC, whiteSpace: "nowrap", overflow: "hidden" }}>
                                {row.hour}
                              </td>

                              {/* WX */}
                              <td style={{ width: "9%", padding: "8px 5px", textCombineUpright: "center", verticalAlign: "middle" }}>
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  {row.wCode !== null && <WeatherSymbol code={row.wCode} size={11} />}
                                </div>
                              </td>

                              {/* TIDE */}
                              <td style={{ width: "17%", padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden" }}>
                                <span style={{
                                  fontFamily: MONO, fontSize: 9.5,
                                  fontWeight: isMax || isMin ? 700 : 400,
                                  color: isMax ? HIGH_TEXT : isMin ? LOW_TEXT : TEXT_PRI,
                                }}>
                                  {row.tideH !== null ? (row.tideH >= 0 ? "+" : "") + row.tideH.toFixed(3) : "—"}
                                </span>
                              </td>

                              {/* TEMP */}
                              <td style={{ width: "11%", padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden" }}>
                                <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_SEC }}>
                                  {row.temp !== null ? `${Math.round(row.temp)}°` : "—"}
                                </span>
                              </td>

                              {/* WIND */}
                              <td style={{ width: "17%", padding: "8px 10px", textAlign: "right" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                  {row.windSpd !== null ? (
                                    <>
                                      <div style={{ display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
                                        {row.windDir !== null && <span style={arrowStyle(row.windDir)}>↑</span>}
                                        <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_SEC }}>{row.windSpd.toFixed(1)}</span>
                                      </div>
                                      {row.windDir !== null && (
                                        <span style={{ fontSize: 8, color: TEXT_HINT, fontFamily: SANS, lineHeight: 1, whiteSpace: "nowrap" }}>{windDirLabel(row.windDir)}</span>
                                      )}
                                    </>
                                  ) : <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_HINT }}>—</span>}
                               </div>
                              </td>

                              {/* WAVE */}
                              <td style={{ width: "17%", padding: "8px 10px", textAlign: "right" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                  {row.waveH !== null ? (
                                    <>
                                      <div style={{ display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
                                        {row.waveDir !== null && <span style={arrowStyle(row.waveDir)}>↑</span>}
                                        <span style={{ fontFamily: MONO, fontSize: 9.5, color: waveC, fontWeight: row.waveH >= 1.25 ? 600 : 400 }}>{row.waveH.toFixed(2)}</span>
                                      </div>
                                      {row.waveDir !== null && (
                                        <span style={{ fontSize: 8, color: TEXT_HINT, fontFamily: SANS, lineHeight: 1, whiteSpace: "nowrap" }}>{windDirLabel(row.waveDir)}</span>
                                      )}
                                    </>
                                  ) : <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_HINT }}>—</span>}
                                </div>
                              </td>

                              {/* CURRENT */}
                              <td style={{ width: "16%", padding: "8px 10px", textAlign: "right" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                  {row.currentSpd !== null ? (
                                    <>
                                      <div style={{ display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
                                        {row.currentDir !== null && <span style={arrowStyle(row.currentDir)}>↑</span>}
                                        <span style={{ fontFamily: MONO, fontSize: 9.5, color: currC, fontWeight: row.currentSpd >= 0.75 ? 600 : 400 }}>{row.currentSpd.toFixed(2)}</span>
                                      </div>
                                      {row.currentDir !== null && (
                                        <span style={{ fontSize: 8, color: TEXT_HINT, fontFamily: SANS, lineHeight: 1, whiteSpace: "nowrap" }}>{windDirLabel(row.currentDir)}</span>
                                      )}
                                    </>
                                  ) : <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_HINT }}>—</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend footer */}
                <div style={{
                  padding: "6px 12px",
                  borderTop: `1px solid ${BORDER_SM}`,
                  background: BG_MUTED,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap" as const,
                  gap: 8,
                  minWidth: "460px",
                }}>
                  {[
                    { color: "#16a34a", label: lang==="en"?"Low":"Rendah" },
                    { color: "#d97706", label: lang==="en"?"Moderate":"Sedang" },
                    { color: "#e11d48", label: lang==="en"?"High":"Tinggi" },
                  ].map(({ color, label }) => (
                    <div key={color} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: TEXT_HINT, fontFamily: SANS }}>{label}</span>
                    </div>
                  ))}
                  <span style={{ fontSize: 8.5, color: TEXT_HINT, fontFamily: SANS, marginLeft: "auto" }}>
                    ↑ {lang==="en"?"dir · m/s":"arah · m/s"}
                  </span>
                </div>
              </div>
            </div>

            {/* S-104 export */}
            <div style={{ padding: "14px 14px 0" }}>
              <SL>{lang==="en"?"IHO S-104 Compliance":"Kepatuhan IHO S-104"}</SL>
              <S104ExportSection coordinates={coordinates} selectedDate={selDate} language={lang} />
            </div>
          </>
        )}
      </div>

      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} language={lang} initialTab="pricing" />

      <style>{`
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};