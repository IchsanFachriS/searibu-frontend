import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X, RefreshCw, AlertCircle, Wind,
  Waves, Sun, Moon, Navigation, Lock,
} from "lucide-react";
import { useLanguage }  from "../../context/LanguageContext";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal }      from "../subscription/PricingModal";
import { S104ExportSection } from "../subscription/S104ExportSection";

/* ── Types ─────────────────────────────────────────────────────────── */
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
    time: string[]; wave_height: number[]; ocean_current_velocity: number[];
    wave_direction: number[]; ocean_current_direction: number[];
  };
}
interface LuwesObs    { recorded_at: string; level_m: number }
interface OverlayData { date: string; imei: string; lon: number; lat: number; luwes_obs: LuwesObs[]; tpxo: Array<{ time: string; height: number }>; luwes_stats: { max_m: number | null; min_m: number | null; count: number }; tpxo_stats: { max: number; min: number; mean: number; range: number } }
interface HourRow {
  hour: string;
  tideH: number | null; temp: number | null;
  windSpd: number | null; windDir: number | null; wCode: number | null;
  waveH: number | null; waveDir: number | null;
  currentSpd: number | null; currentDir: number | null;
}
interface InfoPanelProps { coordinates: { lat: number; lon: number }; onClose: () => void }

/* ── Design tokens — dark nautical ────────────────────────────────── */
const FONT  = "'Inter', system-ui, sans-serif";
const MONO  = "'Inter', monospace";

const C = {
  bg:      "#0f1824",
  surface: "#111d2c",
  card:    "#152232",
  raised:  "#1a2840",
  border:  "#1e3044",
  border2: "#243548",
  sky:     "#38bdf8",
  skyD:    "#0ea5e9",
  text1:   "#e8f4fd",
  text2:   "#7fa8c9",
  text3:   "#3d5a75",
  green:   "#34d399",
  greenD:  "#059669",
  orange:  "#fb923c",
  red:     "#f87171",
  tpxo:    "#5b8ecf",
  luwes:   "#e879a0",
};

/* ── Constants ─────────────────────────────────────────────────────── */
const TOL_CORRECTION = -1.944;
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
const FREE_HIST_DAYS = 10;
const FREE_FWD_DAYS  = 3;
const PRO_FWD_DAYS   = 10;

/* ── Utilities ─────────────────────────────────────────────────────── */
const kmhToMs = (v: number) => v / 3.6;
const todayISO = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
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
const fmtHHmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
};
const windDirLabel = (deg: number) => {
  const d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return d[Math.round(deg / 22.5) % 16];
};

/* ── WMO weather labels (short) ────────────────────────────────────── */
const WMO_SHORT: Record<number, { en: string; id: string; color: string }> = {
  0:  { en: "Clear",    id: "Cerah",    color: C.sky    },
  1:  { en: "Clear",    id: "Cerah",    color: C.sky    },
  2:  { en: "Partly Cloudy", id: "Berawan Sebagian",color: C.text2  },
  3:  { en: "Cloudy",   id: "Mendung",  color: C.text2  },
  45: { en: "Fog",      id: "Kabut",    color: C.text3  },
  51: { en: "Drizzle",  id: "Gerimis",  color: C.skyD   },
  61: { en: "Lt.Rain",  id: "Hj.Ringan",color: C.skyD   },
  63: { en: "Rain",     id: "Hujan",    color: C.skyD   },
  65: { en: "Hvy.Rain", id: "Hj.Lebat", color: C.red    },
  80: { en: "Showers",  id: "Rintik",   color: C.skyD   },
  81: { en: "Showers",  id: "Rintik",   color: C.skyD   },
  82: { en: "Showers",  id: "Rintik",   color: C.skyD   },
  95: { en: "Storm",    id: "Badai",    color: C.red    },
  99: { en: "Storm",    id: "Badai",    color: C.red    },
};
const wmoShort = (code: number | null, lang: "en"|"id") => {
  if (code === null) return { label: "—", color: C.text3 };
  const entry = WMO_SHORT[code];
  if (entry) return { label: entry[lang], color: entry.color };
  const nearest = Object.keys(WMO_SHORT).map(Number)
    .reduce((a, b) => Math.abs(b - code) < Math.abs(a - code) ? b : a);
  return { label: WMO_SHORT[nearest]?.[lang] ?? "—", color: WMO_SHORT[nearest]?.color ?? C.text3 };
};
const wmoLabel = (code: number | null, lang: "en"|"id") => {
  const WMO: Record<number, { en: string; id: string }> = {
    0:{en:"Clear sky",id:"Langit cerah"},1:{en:"Mainly clear",id:"Cerah berawan"},
    2:{en:"Partly cloudy",id:"Sebagian berawan"},3:{en:"Overcast",id:"Mendung"},
    45:{en:"Foggy",id:"Berkabut"},51:{en:"Light drizzle",id:"Gerimis ringan"},
    61:{en:"Light rain",id:"Hujan ringan"},63:{en:"Rain",id:"Hujan"},
    65:{en:"Heavy rain",id:"Hujan lebat"},80:{en:"Showers",id:"Hujan rintik"},
    95:{en:"Thunderstorm",id:"Badai petir"},
  };
  if (code === null) return "—";
  const e = WMO[code]; if (e) return e[lang];
  const n = Object.keys(WMO).map(Number).reduce((a,b) => Math.abs(b-code)<Math.abs(a-code)?b:a);
  return WMO[n]?.[lang] ?? "—";
};

/* ── Session cache ─────────────────────────────────────────────────── */
const cacheKey = (lat: number, lon: number, t: "wx"|"marine") =>
  `searibu_${t}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
function readCache<T>(lat: number, lon: number, t: "wx"|"marine"): T | null {
  try { const r = sessionStorage.getItem(cacheKey(lat,lon,t)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function writeCache<T>(lat: number, lon: number, t: "wx"|"marine", data: T) {
  try { sessionStorage.setItem(cacheKey(lat,lon,t), JSON.stringify(data)); } catch {}
}
function clearCache(lat: number, lon: number) {
  try { sessionStorage.removeItem(cacheKey(lat,lon,"wx")); sessionStorage.removeItem(cacheKey(lat,lon,"marine")); } catch {}
}

/* ── Cubic spline ──────────────────────────────────────────────────── */
function buildCubicSpline(knots: { x: number; y: number }[]): (x: number) => number {
  const n = knots.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => knots[0].y;
  if (n === 2) { const [a,b] = knots; return (x) => a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); }
  const xs = knots.map(k => k.x), ys = knots.map(k => k.y);
  const h = Array.from({length:n-1},(_,i) => xs[i+1]-xs[i]);
  const rhs=new Array(n).fill(0), upper=new Array(n).fill(0), mu=new Array(n).fill(0);
  for(let i=1;i<n-1;i++){const tot=h[i-1]+h[i];upper[i]=h[i]/tot;rhs[i]=6*((ys[i+1]-ys[i])/h[i]-(ys[i]-ys[i-1])/h[i-1])/tot;mu[i]=h[i-1]/(h[i-1]+h[i]);}
  const dM=new Array(n).fill(2),r2=[...rhs];
  for(let i=1;i<n-1;i++){const w=mu[i]/dM[i-1];dM[i]-=w*upper[i-1];r2[i]-=w*r2[i-1];}
  const M=new Array(n).fill(0);M[n-2]=r2[n-2]/dM[n-2];
  for(let i=n-3;i>=1;i--)M[i]=(r2[i]-upper[i]*M[i+1])/dM[i];
  return (x:number)=>{
    if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];
    let lo=0,hi=n-2;while(lo<hi){const mid=(lo+hi)>>1;if(xs[mid+1]<x)lo=mid+1;else hi=mid;}
    const i=lo,dx=x-xs[i],hi_=h[i];
    return ys[i]+dx*((ys[i+1]-ys[i])/hi_-hi_*(2*M[i]+M[i+1])/6+dx*(M[i]/2+dx*(M[i+1]-M[i])/(6*hi_)));
  };
}
function interpolateTPXO(knots: {x:number;y:number}[]): {x:number;y:number}[] {
  if(knots.length<2)return knots;
  const spline=buildCubicSpline(knots);
  const xMin=knots[0].x,xMax=knots[knots.length-1].x;
  const result: {x:number;y:number}[]=[];
  for(let min=0;min<=(xMax-xMin)*60+0.5;min++){
    const x=xMin+min/60;if(x>xMax+1e-9)break;
    result.push({x:Math.min(x,xMax),y:spline(Math.min(x,xMax))});
  }
  return result;
}

/* ── Shimmer ───────────────────────────────────────────────────────── */
const Shimmer: React.FC<{w?:string;h?:string;r?:string}> = ({w="100%",h="12px",r="4px"}) => (
  <div style={{width:w,height:h,borderRadius:r,background:`linear-gradient(90deg,${C.border} 25%,${C.raised} 50%,${C.border} 75%)`,backgroundSize:"200% 100%",animation:"ip-shimmer 1.5s linear infinite"}} />
);

/* ── Overlay chart ─────────────────────────────────────────────────── */
const OverlayChart: React.FC<{
  tpxoPredictions: Array<{time:string;height:number}>;
  luwesObs: Array<{recorded_at:string;level_m:number}>;
  dateStr: string;
}> = ({tpxoPredictions,luwesObs,dateStr}) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const chartRef    = useRef<any>(null);
  const tipId       = useRef(`ip-tip-${Math.random().toString(36).slice(2,7)}`);
  const bulletRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const nextDate = addDays(dateStr, 1);
    const tpxoKnots: {x:number;y:number}[] = [];
    tpxoPredictions.forEach(p => {
      const w = parseToWIB(p.time); if (!w) return;
      if (w.wibDate === dateStr) tpxoKnots.push({x:w.wibHour+w.wibMinute/60,y:p.height});
      else if (w.wibDate === nextDate && w.wibHour===0 && w.wibMinute===0) tpxoKnots.push({x:24,y:p.height});
    });
    tpxoKnots.sort((a,b)=>a.x-b.x);
    const tpxoPts = interpolateTPXO(tpxoKnots);
    const luwesPts: {x:number;y:number}[] = [];
    luwesObs.forEach(o => { const w=parseToWIB(o.recorded_at); if(w&&w.wibDate===dateStr) luwesPts.push({x:w.wibHour+w.wibMinute/60,y:o.level_m}); });

    const nearY = (pts:{x:number;y:number}[],x:number,maxD=0.15)=>{
      if(!pts.length)return null;
      let best=pts[0],bestD=Math.abs(x-pts[0].x);
      for(const pt of pts){const d=Math.abs(x-pt.x);if(d<bestD){bestD=d;best=pt;}}
      return bestD<=maxD?best.y:null;
    };
    const nearTPXO = (x:number)=>nearY(tpxoPts,x,3/60);

    const wibNow  = new Date(Date.now()+7*3600_000);
    const isToday = dateStr===wibNow.toISOString().slice(0,10);
    const nowX    = isToday ? wibNow.getUTCHours()+wibNow.getUTCMinutes()/60 : -1;
    const tid     = tipId.current;

    const ensureTip = ():HTMLDivElement => {
      let el = document.getElementById(tid) as HTMLDivElement|null;
      if(!el){
        el=document.createElement("div"); el.id=tid;
        el.style.cssText=`position:fixed;pointer-events:none;z-index:99999;background:${C.bg};color:${C.text1};border-radius:8px;padding:9px 13px;font-family:${FONT};font-size:11.5px;box-shadow:0 8px 24px rgba(0,0,0,0.60);min-width:120px;line-height:1.65;display:none;border:1px solid ${C.border2};`;
        document.body.appendChild(el);
      }
      return el;
    };
    const hideTip = ()=>{ const el=document.getElementById(tid);if(el)el.style.display="none";if(bulletRef.current)bulletRef.current.style.display="none"; };

    let cancelled = false;
    import("chart.js/auto").then(({default:Chart})=>{
      if(cancelled||!canvasRef.current)return;
      const ctx=canvasRef.current.getContext("2d");if(!ctx)return;
      chartRef.current = new Chart(ctx,{
        type:"scatter",
        data:{datasets:[
          {label:"Predicted",type:"line" as any,data:tpxoPts,borderColor:C.tpxo,backgroundColor:(c:any)=>{
            const {chart:{ctx:cx,chartArea:ca}}=c;if(!ca)return`rgba(91,142,207,0.08)`;
            const g=cx.createLinearGradient(0,ca.top,0,ca.bottom);
            g.addColorStop(0,"rgba(91,142,207,0.18)");g.addColorStop(1,"rgba(91,142,207,0)");return g;
          },borderWidth:2,fill:true,tension:0,pointRadius:0,spanGaps:false,order:2,parsing:false},
          {label:"Observed",type:"scatter" as any,data:luwesPts,borderColor:`${C.luwes}bb`,backgroundColor:`${C.luwes}99`,pointRadius:2,order:1,parsing:false},
        ]},
        options:{
          responsive:true,maintainAspectRatio:false,animation:false,
          interaction:{mode:"index",intersect:false,axis:"x"},
          plugins:{legend:{display:false},tooltip:{enabled:false}},
          scales:{
            x:{type:"linear",min:0,max:24,padding:{left:5,right:5},
              grid:{color:(c:any)=>c.tick.value%3===0?"rgba(56,189,248,0.06)":"rgba(56,189,248,0.025)"},
              border:{display:false},
              ticks:{color:C.text3,font:{family:MONO,size:9.5},maxRotation:0,stepSize:1,autoSkip:false,includeBounds:true,
                callback:(v:any)=>{const n=Number(v);if(n===0)return"00:00";if(n===24)return"24:00";return n%3===0?`${n.toString().padStart(2,"0")}:00`:"";}}},
            y:{grid:{color:`rgba(56,189,248,0.04)`},border:{display:false},
              ticks:{color:C.text3,font:{family:MONO,size:9.5},callback:(v:any)=>`${Number(v).toFixed(2)}m`},
              title:{display:true,text:"m MSL",color:C.text3,font:{size:9,family:MONO}}},
          },
          onHover:(event:any,_elements:any[],chart:any)=>{
            if(!event?.native){hideTip();return;}
            const xVal=chart.scales.x?.getValueForPixel(event.x);
            if(xVal==null||xVal<0||xVal>24){hideTip();return;}
            const tVal=nearTPXO(xVal),lVal=nearY(luwesPts,xVal,0.12);
            if(tVal===null&&lVal===null){hideTip();return;}
            const hh=Math.floor(xVal),mm=Math.round((xVal-hh)*60);
            const timeStr=`${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")} WIB`;
            let html=`<div style="color:${C.text3};font-size:9.5px;font-weight:600;letter-spacing:0.05em;margin-bottom:5px;text-transform:uppercase;">${timeStr}</div>`;
            if(tVal!==null) html+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:${lVal!==null?3:0}px;"><span style="width:7px;height:7px;border-radius:50%;background:${C.tpxo};flex-shrink:0;"></span><span style="color:${C.text2};font-size:10px;">Pred</span><span style="margin-left:auto;font-weight:600;color:${C.text1};">${tVal.toFixed(3)}m</span></div>`;
            if(lVal!==null) html+=`<div style="display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:${C.luwes};flex-shrink:0;"></span><span style="color:${C.text2};font-size:10px;">Obs</span><span style="margin-left:auto;font-weight:600;color:${C.text1};">${lVal.toFixed(3)}m</span></div>`;
            const tip=ensureTip();tip.innerHTML=html;tip.style.display="block";
            const canvas=canvasRef.current;if(!canvas)return;
            const rect=canvas.getBoundingClientRect();
            const xPx=chart.scales.x.getPixelForValue(xVal);
            const scX=rect.width/(canvas.offsetWidth||1),scY=rect.height/(canvas.offsetHeight||1);
            const screenX=rect.left+xPx*scX;
            if(bulletRef.current&&tVal!==null){
              const tY=rect.top+chart.scales.y.getPixelForValue(tVal)*scY;
              const pr=canvas.parentElement;
              if(pr){const pr_=pr.getBoundingClientRect();bulletRef.current.style.display="block";bulletRef.current.style.left=`${screenX-pr_.left-5}px`;bulletRef.current.style.top=`${tY-pr_.top-5}px`;}
            } else if(bulletRef.current) bulletRef.current.style.display="none";
            const tipW=150,tipH=tVal!==null&&lVal!==null?76:52;
            const yA=tVal!==null?rect.top+chart.scales.y.getPixelForValue(tVal)*scY:rect.top+chart.scales.y.getPixelForValue(lVal!)*scY;
            let left=screenX-tipW/2,top=yA-tipH-10;
            if(left<8)left=8;if(left+tipW>window.innerWidth-8)left=window.innerWidth-tipW-8;if(top<8)top=yA+10;
            tip.style.left=`${left}px`;tip.style.top=`${top}px`;
          },
        },
        plugins:[{id:"nowLine",afterDraw(chart:any){
          if(nowX<0||nowX>24)return;
          const{ctx:c,chartArea:ca,scales}=chart;
          const x=scales.x.getPixelForValue(nowX);
          if(x<ca.left||x>ca.right)return;
          c.save();c.beginPath();c.moveTo(x,ca.top);c.lineTo(x,ca.bottom);
          c.strokeStyle="rgba(248,113,113,0.65)";c.lineWidth=1.5;c.setLineDash([4,4]);c.stroke();
          c.fillStyle="rgba(248,113,113,0.85)";c.font=`bold 8.5px ${MONO}`;c.textAlign="center";c.fillText("NOW",x,ca.top+9);
          c.restore();
        }}],
      });
      canvasRef.current?.addEventListener("mouseleave",hideTip);
    });
    return ()=>{cancelled=true;if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}document.getElementById(tipId.current)?.remove();};
  },[tpxoPredictions,luwesObs,dateStr]);

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <canvas ref={canvasRef} style={{width:"100%",height:"100%"}}/>
      <div ref={bulletRef} style={{position:"absolute",display:"none",width:10,height:10,borderRadius:"50%",background:C.tpxo,border:`2.5px solid ${C.bg}`,boxShadow:`0 0 0 2px rgba(91,142,207,0.40)`,pointerEvents:"none",zIndex:10}} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   InfoPanel
══════════════════════════════════════════════════════════════════ */
export const InfoPanel: React.FC<InfoPanelProps> = ({ coordinates, onClose }) => {
  const { language } = useLanguage();
  const lang = language as "en"|"id";
  const { isPro } = useSubContext();
  const [showPricing, setShowPricing] = useState(false);

  const [tideData,    setTideData]    = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [marineData,  setMarineData]  = useState<MarineData | null>(null);
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [selDate,     setSelDate]     = useState<string>(todayISO());

  const todayStr   = todayISO();
  const minDateISO = isPro ? "2000-01-01" : addDays(todayStr, -FREE_HIST_DAYS);
  const maxDateISO = isPro ? addDays(todayStr, PRO_FWD_DAYS) : addDays(todayStr, FREE_FWD_DAYS);

  const fetchAll = useCallback(async (dateStr: string, forceRefresh = false) => {
    setLoading(true); setError(null);
    if (dateStr < minDateISO || dateStr > maxDateISO) {
      setError(lang==="en" ? `Date out of range. Choose between ${isPro?"any past date":minDateISO} and ${maxDateISO}.` : `Tanggal di luar jangkauan. Pilih antara ${isPro?"tanggal manapun":minDateISO} dan ${maxDateISO}.`);
      setLoading(false); return;
    }
    try {
      const today = new Date(); const fmtD = (d:Date) => d.toISOString().split("T")[0];
      let wd: WeatherData|null = null, md: MarineData|null = null;
      if (!forceRefresh) { wd=readCache(coordinates.lat,coordinates.lon,"wx"); md=readCache(coordinates.lat,coordinates.lon,"marine"); }
      if (!wd||!md) {
        const dB=isPro?16:FREE_HIST_DAYS+2, dF=isPro?PRO_FWD_DAYS+2:FREE_FWD_DAYS+2;
        const wxS=new Date(today);wxS.setDate(wxS.getDate()-dB);
        const wxE=new Date(today);wxE.setDate(wxE.getDate()+dF+1);
        const [wxRes,marRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=sunrise,sunset&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&start_date=${fmtD(wxS)}&end_date=${fmtD(wxE)}`),
          fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=wave_height,ocean_current_velocity,wave_direction,ocean_current_direction&current=wave_height,ocean_current_velocity&timezone=auto&start_date=${fmtD(wxS)}&end_date=${fmtD(wxE)}`),
        ]);
        if (!wxRes.ok) throw new Error(lang==="en"?"Weather service unavailable":"Layanan cuaca tidak tersedia");
        wd = await wxRes.json() as WeatherData; writeCache(coordinates.lat,coordinates.lon,"wx",wd);
        if (marRes.ok) { md = await marRes.json() as MarineData; writeCache(coordinates.lat,coordinates.lon,"marine",md); }
      }
      setWeatherData(wd); setMarineData(md);
      const [tr,or_] = await Promise.all([
        fetch(`${API_BASE}/api/tide/prediction?lon=${coordinates.lon}&lat=${coordinates.lat}&start_date=${addDays(dateStr,-1)}&end_date=${addDays(dateStr,1)}&interval_hours=1`),
        fetch(`${API_BASE}/api/luwes/overlay?date=${dateStr}&lon=${coordinates.lon}&lat=${coordinates.lat}`),
      ]);
      if (!tr.ok) { const e=await tr.json().catch(()=>({})); throw new Error((e as any).error??(lang==="en"?"Tide service unavailable":"Layanan pasut tidak tersedia")); }
      setTideData(await tr.json() as TideData);
      setOverlayData(or_.ok ? await or_.json() as OverlayData : null);
    } catch(e) { setError(e instanceof Error ? e.message : (lang==="en"?"Unknown error":"Kesalahan tidak dikenal")); }
    finally { setLoading(false); }
  }, [coordinates, lang, isPro, minDateISO, maxDateISO]);

  useEffect(() => { const d=todayISO(); setSelDate(d); fetchAll(d); }, [coordinates.lat, coordinates.lon]);

  /* ── Derived values ── */
  const getSunTimes = () => {
    if (!weatherData?.daily) return {sunrise:"--:--",sunset:"--:--"};
    const idx = weatherData.daily.time.findIndex(t=>t===selDate);
    if (idx===-1) return {sunrise:"--:--",sunset:"--:--"};
    return {sunrise:fmtHHmm(weatherData.daily.sunrise[idx]),sunset:fmtHHmm(weatherData.daily.sunset[idx])};
  };

  const buildRows = (): HourRow[] => {
    const tideMap = new Map<number,number>();
    tideData?.predictions.forEach(p=>{const w=parseToWIB(p.time);if(w&&w.wibDate===selDate)tideMap.set(w.wibHour,p.height);});
    const wxMap = new Map<string,Partial<HourRow>>();
    weatherData?.hourly.time.forEach((t,i)=>{if(!t.startsWith(selDate))return;const hh=new Date(t).getHours().toString().padStart(2,"0");wxMap.set(hh,{temp:weatherData.hourly.temperature_2m[i],windSpd:weatherData.hourly.wind_speed_10m[i]!=null?kmhToMs(weatherData.hourly.wind_speed_10m[i]):null,windDir:weatherData.hourly.wind_direction_10m[i],wCode:weatherData.hourly.weather_code[i]});});
    const marMap = new Map<string,{waveH:number|null;waveDir:number|null;currentSpd:number|null;currentDir:number|null}>();
    marineData?.hourly.time.forEach((t,i)=>{if(!t.startsWith(selDate))return;const hh=new Date(t).getHours().toString().padStart(2,"0");marMap.set(hh,{waveH:marineData.hourly.wave_height[i]??null,waveDir:marineData.hourly.wave_direction?.[i]??null,currentSpd:marineData.hourly.ocean_current_velocity[i]??null,currentDir:marineData.hourly.ocean_current_direction?.[i]??null});});
    return Array.from({length:24},(_,i)=>{
      const hh=i.toString().padStart(2,"0");
      const marine=marMap.get(hh)??{waveH:null,waveDir:null,currentSpd:null,currentDir:null};
      const wx=wxMap.get(hh)??{};
      return {hour:`${hh}:00`,tideH:tideMap.get(i)??null,temp:null,windSpd:null,windDir:null,wCode:null,...wx,...marine} as HourRow;
    });
  };

  const tpxoHighLow = (() => {
    const hs=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];
    if(!hs.length)return null;
    let hi=hs[0],lo=hs[0];
    for(const p of hs){if(p.height>hi.height)hi=p;if(p.height<lo.height)lo=p;}
    const fT=(iso:string)=>{const w=parseToWIB(iso);return w?`${w.wibHour.toString().padStart(2,"0")}:00`:"--:--";};
    return {max:hi.height,maxTime:fT(hi.time),min:lo.height,minTime:fT(lo.time)};
  })();

  const luwesForChart = (overlayData?.luwes_obs??[])
    .filter(o=>parseToWIB(o.recorded_at)?.wibDate===selDate)
    .map(o=>({...o,level_m:o.level_m+TOL_CORRECTION}));
  const hasLuwes = luwesForChart.length > 0;

  const {sunrise,sunset} = getSunTimes();
  const rows     = buildRows();
  const current  = weatherData?.current;
  const cWindMs  = current ? kmhToMs(current.wind_speed_10m) : null;
  const cWaveH   = marineData?.current?.wave_height ?? marineData?.hourly.wave_height[0] ?? null;
  const cCurrSpd = marineData?.current?.ocean_current_velocity ?? marineData?.hourly.ocean_current_velocity[0] ?? null;
  const nowHour  = new Date(Date.now()+7*3600_000).getUTCHours().toString().padStart(2,"0");
  const isToday  = selDate===todayISO();
  const selDateFmt = new Date(selDate+"T12:00:00Z").toLocaleDateString(lang==="en"?"en-US":"id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const maxHourIdx = (() => { const dp=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];if(!dp.length)return -1;let b=0;for(let i=1;i<dp.length;i++)if(dp[i].height>dp[b].height)b=i;const w=parseToWIB(dp[b].time);return w?w.wibHour:-1; })();
  const minHourIdx = (() => { const dp=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];if(!dp.length)return -1;let b=0;for(let i=1;i<dp.length;i++)if(dp[i].height<dp[b].height)b=i;const w=parseToWIB(dp[b].time);return w?w.wibHour:-1; })();

  const arrowStyle = (deg: number|null): React.CSSProperties => ({
    display:"inline-block", transform:deg!=null?`rotate(${deg}deg)`:"none",
    fontSize:9, lineHeight:1, color:C.text3, flexShrink:0,
  });

  /* ── Label helpers ── */
  const T = {
    marineInfo: lang==="en"?"Marine Information":"Informasi Kelautan",
    refresh:    lang==="en"?"Refresh":"Perbarui",
    selectDate: lang==="en"?"Date":"Tanggal",
    proRange:   lang==="en"?`Pro: all historical · ${PRO_FWD_DAYS}d ahead`:`Pro: semua historis · ${PRO_FWD_DAYS}h ke depan`,
    freeRange:  lang==="en"?`Free: past ${FREE_HIST_DAYS}d – ${FREE_FWD_DAYS}d ahead`:`Gratis: ${FREE_HIST_DAYS} hari lalu – ${FREE_FWD_DAYS} hari ke depan`,
    upgradeLink:lang==="en"?"Upgrade →":"Upgrade →",
    obsVsPred:  hasLuwes?(lang==="en"?"Observation vs Prediction":"Observasi vs Prediksi"):(lang==="en"?"Tidal Prediction":"Prediksi Pasut"),
    highLabel:  lang==="en"?"High Water":"Air Tinggi",
    lowLabel:   lang==="en"?"Low Water":"Air Rendah",
    hourlyData: lang==="en"?"Hourly Data (WIB)":"Data Per Jam (WIB)",
    s104:       lang==="en"?"IHO S-104 Export":"Ekspor IHO S-104",
    unableLoad: lang==="en"?"Unable to load data":"Gagal memuat data",
    tryAgain:   lang==="en"?"Try again":"Coba lagi",
    today:      lang==="en"?"Today":"Hari ini",
    wind:       lang==="en"?"Wind":"Angin",
    wave:       lang==="en"?"Wave":"Gelombang",
    current:    lang==="en"?"Current":"Arus",
    rise:       lang==="en"?"Rise":"Terbit",
    set:        lang==="en"?"Set":"Terbenam",
    colTime:    "TIME", colWeather: lang==="en"?"WEATHER":"CUACA",
    colTide:    "TIDE", colTemp:"°C", colWind:"WIND", colWave:"WAVE", colCurr:"CURR.",
  };

  return (
    <div style={{
      width:"100%", height:"100%",
      display:"flex", flexDirection:"column",
      background:C.bg,
      borderLeft:`1px solid ${C.border}`,
      fontFamily:FONT,
      overscrollBehavior:"contain",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 14px",
        height:50,
        background:C.surface,
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:16,background:C.sky,borderRadius:2,flexShrink:0}}/>
          <span style={{fontSize:13,fontWeight:700,color:C.text1,letterSpacing:"-0.01em"}}>
            {T.marineInfo}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <button
            onClick={()=>{clearCache(coordinates.lat,coordinates.lon);fetchAll(selDate,true);}}
            title={T.refresh}
            style={{padding:6,borderRadius:7,border:"none",background:"transparent",cursor:"pointer",color:C.text3,display:"flex",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.raised;e.currentTarget.style.color=C.sky;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.text3;}}
          ><RefreshCw size={13}/></button>
          <button
            onClick={onClose}
            style={{padding:6,borderRadius:7,border:"none",background:"transparent",cursor:"pointer",color:C.text3,display:"flex",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.raised;e.currentTarget.style.color=C.text1;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.text3;}}
          ><X size={15}/></button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        scrollbarWidth:"thin",
        scrollbarColor:`${C.border2} transparent`,
        overscrollBehavior:"contain",
        WebkitOverflowScrolling:"touch",
      }}
        onWheel={e=>e.stopPropagation()}
        onTouchMove={e=>e.stopPropagation()}
      >

        {/* ── Loading ── */}
        {loading && (
          <div style={{padding:"14px 14px 0",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{borderRadius:12,background:C.card,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
              <Shimmer w="55%" h="9px"/><Shimmer w="40%" h="32px"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:4}}>
                {[0,1,2].map(i=><div key={i} style={{padding:"10px 12px",background:C.raised,borderRadius:8}}><Shimmer w="60%" h="8px"/><div style={{marginTop:5}}><Shimmer w="50%" h="20px"/></div></div>)}
              </div>
            </div>
            <Shimmer h="34px" r="8px"/>
            <div style={{borderRadius:12,overflow:"hidden",border:`1px solid ${C.border}`}}><div style={{height:240,padding:8,background:C.surface}}><Shimmer h="100%" r="4px"/></div></div>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div style={{margin:14,padding:14,borderRadius:12,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.22)"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <AlertCircle size={15} style={{color:C.red,flexShrink:0,marginTop:1}}/>
              <div>
                <p style={{color:C.red,fontSize:13,fontWeight:600,marginBottom:4,fontFamily:FONT}}>{T.unableLoad}</p>
                <p style={{color:"rgba(248,113,113,0.75)",fontSize:11.5,marginBottom:10,fontFamily:FONT}}>{error}</p>
                <button onClick={()=>fetchAll(selDate)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11.5,color:C.red,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,fontWeight:600}}>
                  <RefreshCw size={11}/>{T.tryAgain}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Hero card ── */}
            <div style={{margin:"14px 14px 0",borderRadius:14,overflow:"hidden",background:C.card,border:`1px solid ${C.border}`}}>
              {/* Coord bar */}
              <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontFamily:MONO,fontSize:10,color:C.text3,letterSpacing:"0.03em"}}>
                  {Math.abs(coordinates.lat).toFixed(4)}°{coordinates.lat>=0?"N":"S"}&ensp;{Math.abs(coordinates.lon).toFixed(4)}°{coordinates.lon>=0?"E":"W"}
                </span>
                {isToday && <span style={{fontSize:9.5,fontWeight:700,color:C.sky,letterSpacing:"0.05em",textTransform:"uppercase" as const}}>{T.today}</span>}
              </div>

              {/* Temp + sun */}
              {current && (
                <div style={{padding:"14px 14px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                      <span style={{fontFamily:MONO,fontSize:42,fontWeight:800,color:C.text1,lineHeight:1,letterSpacing:"-0.04em"}}>
                        {Math.round(current.temperature_2m)}°
                      </span>
                      <span style={{fontSize:13,color:C.text2,fontWeight:500}}>{wmoLabel(current.weather_code,lang)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,textAlign:"right" as const}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                      <span style={{fontSize:9.5,color:C.text3,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase" as const}}>{T.rise}</span>
                      <Sun size={10} color={C.sky} />
                      <span style={{fontFamily:MONO,fontSize:12,fontWeight:700,color:C.text1}}>{sunrise}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                      <span style={{fontSize:9.5,color:C.text3,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase" as const}}>{T.set}</span>
                      <Moon size={10} color={C.text3} />
                      <span style={{fontFamily:MONO,fontSize:12,fontWeight:700,color:C.text1}}>{sunset}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wind / Wave / Current */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",marginTop:12,borderTop:`1px solid ${C.border}`}}>
                {[
                  {icon:<Wind size={11}/>,      label:T.wind,    value:cWindMs!=null?cWindMs.toFixed(1):"—",     unit:"m/s", sub:cWindMs!=null?`${windDirLabel(current!.wind_direction_10m)} ${Math.round(current!.wind_direction_10m)}°`:""},
                  {icon:<Waves size={11}/>,     label:T.wave,    value:cWaveH!=null?cWaveH.toFixed(2):"—",       unit:"m",   sub:cWaveH!=null?(cWaveH<0.5?(lang==="en"?"Calm":"Tenang"):cWaveH<1.25?(lang==="en"?"Slight":"Kecil"):cWaveH<2.5?(lang==="en"?"Moderate":"Sedang"):(lang==="en"?"Rough":"Kasar")):""},
                  {icon:<Navigation size={11}/>,label:T.current, value:cCurrSpd!=null?cCurrSpd.toFixed(2):"—",   unit:"m/s", sub:cCurrSpd!=null?(cCurrSpd<0.25?(lang==="en"?"Weak":"Lemah"):cCurrSpd<0.75?(lang==="en"?"Moderate":"Sedang"):(lang==="en"?"Strong":"Kuat")):""},
                ].map((item,i)=>(
                  <div key={i} style={{padding:"10px 12px 12px",borderRight:i<2?`1px solid ${C.border}`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
                      <span style={{color:C.text3}}>{item.icon}</span>
                      <span style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase" as const}}>{item.label}</span>
                    </div>
                    <p style={{fontFamily:MONO,color:C.text1,fontSize:18,fontWeight:700,lineHeight:1,margin:0}}>
                      {item.value}<span style={{fontSize:10,color:C.text2,fontWeight:400,marginLeft:2}}>{item.unit}</span>
                    </p>
                    {item.sub&&<p style={{color:C.text3,fontSize:9,marginTop:3,fontFamily:FONT,whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis"}}>{item.sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Date picker ── */}
            <div style={{padding:"12px 14px 0"}}>
              <label style={{display:"block",fontSize:9.5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:C.text3,marginBottom:6}}>{T.selectDate}</label>
              <input
                type="date" value={selDate} min={minDateISO} max={maxDateISO}
                onChange={e=>{const c=e.target.value;if(c>=minDateISO&&c<=maxDateISO){setSelDate(c);fetchAll(c);}}}
                style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border2}`,borderRadius:8,fontSize:13,fontWeight:600,fontFamily:MONO,color:C.text1,background:C.raised,cursor:"pointer",outline:"none",boxSizing:"border-box" as const,transition:"border-color .15s"}}
                onFocus={e=>{e.currentTarget.style.borderColor=C.sky;}}
                onBlur={e=>{e.currentTarget.style.borderColor=C.border2;}}
              />
              {isPro
                ? <p style={{fontFamily:FONT,fontSize:10.5,color:C.text3,marginTop:5}}>{T.proRange}</p>
                : <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,padding:"7px 10px",background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.20)",borderRadius:7}}>
                    <Lock size={10} style={{color:"rgba(251,146,60,0.70)",flexShrink:0}}/>
                    <span style={{fontFamily:FONT,fontSize:10.5,color:"rgba(251,146,60,0.70)",flex:1}}>
                      {T.freeRange}.&nbsp;
                      <button onClick={()=>setShowPricing(true)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(251,146,60,0.90)",fontWeight:700,fontSize:10.5,padding:"0 2px",fontFamily:FONT,textDecoration:"underline"}}>
                        {T.upgradeLink}
                      </button>
                    </span>
                  </div>
              }
            </div>

            {/* ── Chart ── */}
            <div style={{padding:"12px 14px 0"}}>
              {/* Legend row */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap" as const,gap:6}}>
                <span style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:C.text3}}>{T.obsVsPred}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,color:C.text2,fontWeight:600}}>
                    <span style={{display:"inline-block",width:14,height:2,background:C.tpxo,borderRadius:1}}/>
                    {lang==="en"?"Pred":"Prediksi"}
                  </span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,color:hasLuwes?C.luwes:C.text3,fontWeight:600}}>
                    <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:hasLuwes?C.luwes:C.border}}/>
                    {lang==="en"?"Obs":"Observasi"}
                  </span>
                  {isToday&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,color:"rgba(248,113,113,0.75)",fontWeight:600}}>
                    <span style={{display:"inline-block",width:10,height:1.5,background:"rgba(248,113,113,0.65)",borderRadius:1}}/>
                    Now
                  </span>}
                </div>
              </div>
              <div style={{borderRadius:12,overflow:"hidden",background:C.surface,border:`1px solid ${C.border}`}}>
                <div style={{padding:"8px 12px 4px",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:11.5,fontWeight:600,color:C.text2,fontFamily:FONT}}>{selDateFmt}</span>
                </div>
                <div style={{height:260,padding:"6px 8px 12px",position:"relative"}}>
                  <OverlayChart tpxoPredictions={tideData?.predictions??[]} luwesObs={luwesForChart} dateStr={selDate}/>
                </div>
              </div>
            </div>

            {/* ── High / Low ── */}
            {tpxoHighLow && (
              <div style={{padding:"10px 14px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {label:T.highLabel,value:tpxoHighLow.max,time:tpxoHighLow.maxTime,isHigh:true},
                  {label:T.lowLabel, value:tpxoHighLow.min,time:tpxoHighLow.minTime,isHigh:false},
                ].map(item=>(
                  <div key={item.label} style={{
                    borderRadius:10,padding:"10px 13px",
                    background:item.isHigh?"rgba(56,189,248,0.06)":"rgba(251,146,60,0.05)",
                    border:`1px solid ${item.isHigh?"rgba(56,189,248,0.18)":"rgba(251,146,60,0.15)"}`,
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:item.isHigh?C.sky:C.orange}}/>
                      <span style={{fontSize:9,fontWeight:700,color:item.isHigh?C.text2:"rgba(251,146,60,0.70)",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{item.label}</span>
                    </div>
                    <p style={{fontFamily:MONO,color:item.isHigh?C.sky:C.orange,fontSize:20,fontWeight:800,lineHeight:1,margin:0}}>
                      {item.value>0?"+":""}{item.value.toFixed(3)}
                      <span style={{fontSize:10,color:item.isHigh?C.text3:"rgba(251,146,60,0.55)",fontWeight:400,marginLeft:2}}>m</span>
                    </p>
                    <p style={{fontFamily:FONT,fontSize:10,color:C.text3,marginTop:3}}>~{item.time} WIB</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Hourly Table ── */}
            <div style={{marginTop:14}}>
              <div style={{padding:"0 14px 7px"}}>
                <span style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:C.text3}}>{T.hourlyData}</span>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:C.surface}}>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                  <div style={{minWidth:460}}>
                    {/* Header */}
                    <div style={{display:"grid",gridTemplateColumns:"11% 13% 16% 10% 16% 17% 17%",padding:"0",borderBottom:`1px solid ${C.border}`,background:C.card}}>
                      {[T.colTime,T.colWeather,T.colTide,T.colTemp,T.colWind,T.colWave,T.colCurr].map((h,i)=>(
                        <div key={i} style={{padding:"7px 8px",fontSize:8.5,fontWeight:700,letterSpacing:"0.06em",color:C.text3,textAlign:i>1?"right":"left" as any,whiteSpace:"nowrap" as const}}>
                          {h}
                        </div>
                      ))}
                    </div>
                    {/* Rows */}
                    <div style={{height:336,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:`${C.border2} transparent`}}>
                      {rows.map((row,idx)=>{
                        const hl       = isToday && row.hour.startsWith(nowHour+":00");
                        const isMax    = idx===maxHourIdx;
                        const isMin    = idx===minHourIdx;
                        const wx       = wmoShort(row.wCode,lang);
                        const waveC    = row.waveH==null?C.text3:row.waveH<0.5?C.green:row.waveH<1.25?C.orange:C.red;
                        const currC    = row.currentSpd==null?C.text3:row.currentSpd<0.25?C.green:row.currentSpd<0.75?C.orange:C.red;
                        const tideFmt  = row.tideH!=null?(row.tideH>=0?"+":"")+row.tideH.toFixed(3):"—";
                        return (
                          <div key={idx} style={{
                            display:"grid",
                            gridTemplateColumns:"11% 13% 16% 10% 16% 17% 17%",
                            borderBottom:idx<rows.length-1?`1px solid ${C.border}`:"none",
                            background: hl
                              ? "rgba(56,189,248,0.07)"
                              : idx%2===0 ? C.surface : `rgba(21,34,50,0.40)`,
                          }}>
                            {/* TIME */}
                            <div style={{padding:"7px 8px",fontFamily:MONO,fontSize:9.5,fontWeight:hl?700:400,color:hl?C.sky:C.text2,display:"flex",alignItems:"center"}}>
                              {row.hour}
                            </div>
                            {/* WEATHER */}
                            <div style={{padding:"7px 8px",display:"flex",alignItems:"center"}}>
                              {row.wCode!==null&&(
                                <span style={{fontFamily:FONT,fontSize:9,fontWeight:700,color:wx.color,letterSpacing:"0.02em",textTransform:"uppercase" as const,whiteSpace:"nowrap" as const,lineHeight:1.2}}>
                                  {wx.label}
                                </span>
                              )}
                            </div>
                            {/* TIDE */}
                            <div style={{padding:"7px 8px",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                              <span style={{fontFamily:MONO,fontSize:9.5,fontWeight:isMax||isMin?700:400,color:isMax?C.sky:isMin?C.orange:C.text1,whiteSpace:"nowrap" as const}}>
                                {tideFmt}
                              </span>
                            </div>
                            {/* TEMP */}
                            <div style={{padding:"7px 8px",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                              <span style={{fontFamily:MONO,fontSize:9.5,color:C.text2}}>{row.temp!=null?`${Math.round(row.temp)}°`:"—"}</span>
                            </div>
                            {/* WIND */}
                            <div style={{padding:"7px 8px",display:"flex",flexDirection:"column" as const,alignItems:"flex-end",justifyContent:"center",gap:1}}>
                              {row.windSpd!=null?(
                                <>
                                  <div style={{display:"flex",alignItems:"center",gap:2}}>
                                    {row.windDir!=null&&<span style={arrowStyle(row.windDir)}>↑</span>}
                                    <span style={{fontFamily:MONO,fontSize:9.5,color:C.text2,whiteSpace:"nowrap" as const}}>{row.windSpd.toFixed(1)}</span>
                                  </div>
                                  {row.windDir!=null&&<span style={{fontSize:8,color:C.text3,fontFamily:FONT,lineHeight:1}}>{windDirLabel(row.windDir)}</span>}
                                </>
                              ):<span style={{fontFamily:MONO,fontSize:9.5,color:C.text3}}>—</span>}
                            </div>
                            {/* WAVE */}
                            <div style={{padding:"7px 8px",display:"flex",flexDirection:"column" as const,alignItems:"flex-end",justifyContent:"center",gap:1}}>
                              {row.waveH!=null?(
                                <>
                                  <div style={{display:"flex",alignItems:"center",gap:2}}>
                                    {row.waveDir!=null&&<span style={arrowStyle(row.waveDir)}>↑</span>}
                                    <span style={{fontFamily:MONO,fontSize:9.5,color:waveC,fontWeight:row.waveH>=1.25?600:400,whiteSpace:"nowrap" as const}}>{row.waveH.toFixed(2)}</span>
                                  </div>
                                  {row.waveDir!=null&&<span style={{fontSize:8,color:C.text3,fontFamily:FONT,lineHeight:1}}>{windDirLabel(row.waveDir)}</span>}
                                </>
                              ):<span style={{fontFamily:MONO,fontSize:9.5,color:C.text3}}>—</span>}
                            </div>
                            {/* CURRENT */}
                            <div style={{padding:"7px 8px",display:"flex",flexDirection:"column" as const,alignItems:"flex-end",justifyContent:"center",gap:1}}>
                              {row.currentSpd!=null?(
                                <>
                                  <div style={{display:"flex",alignItems:"center",gap:2}}>
                                    {row.currentDir!=null&&<span style={arrowStyle(row.currentDir)}>↑</span>}
                                    <span style={{fontFamily:MONO,fontSize:9.5,color:currC,fontWeight:row.currentSpd>=0.75?600:400,whiteSpace:"nowrap" as const}}>{row.currentSpd.toFixed(2)}</span>
                                  </div>
                                  {row.currentDir!=null&&<span style={{fontSize:8,color:C.text3,fontFamily:FONT,lineHeight:1}}>{windDirLabel(row.currentDir)}</span>}
                                </>
                              ):<span style={{fontFamily:MONO,fontSize:9.5,color:C.text3}}>—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Footer legend */}
                    <div style={{padding:"6px 10px",borderTop:`1px solid ${C.border}`,background:C.card,display:"flex",alignItems:"center",flexWrap:"wrap" as const,gap:10}}>
                      {[{c:C.green,l:lang==="en"?"Low":"Rendah"},{c:C.orange,l:lang==="en"?"Moderate":"Sedang"},{c:C.red,l:lang==="en"?"High":"Tinggi"}].map(({c,l})=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
                          <div style={{width:5,height:5,borderRadius:"50%",background:c}}/>
                          <span style={{fontSize:9,color:C.text3,fontFamily:FONT}}>{l}</span>
                        </div>
                      ))}
                      <span style={{fontSize:8.5,color:C.text3,fontFamily:FONT,marginLeft:"auto"}}>↑ dir · m/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── S-104 Export ── */}
            <div style={{padding:"12px 14px 20px"}}>
              <label style={{display:"block",fontSize:9.5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:C.text3,marginBottom:8}}>{T.s104}</label>
              <S104ExportSection coordinates={coordinates} selectedDate={selDate} language={lang}/>
            </div>
          </>
        )}
      </div>

      <PricingModal open={showPricing} onClose={()=>setShowPricing(false)} language={lang} initialTab="pricing"/>
      <style>{`
        @keyframes ip-shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};