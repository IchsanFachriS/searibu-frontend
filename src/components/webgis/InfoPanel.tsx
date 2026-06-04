import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X, RefreshCw, AlertCircle, Wind,
  Waves, Sun, Moon, Navigation, Lock,
} from "lucide-react";
import { useLanguage }  from "../../context/LanguageContext";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal }      from "../subscription/PricingModal";
import { S104ExportSection } from "../subscription/S104ExportSection";

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
  hourly: { time: string[]; wave_height: number[]; ocean_current_velocity: number[]; wave_direction: number[]; ocean_current_direction: number[] };
}
interface LuwesObs    { recorded_at: string; level_m: number }
interface OverlayData { date: string; imei: string; lon: number; lat: number; luwes_obs: LuwesObs[]; tpxo: Array<{ time: string; height: number }>; luwes_stats: { max_m: number | null; min_m: number | null; count: number }; tpxo_stats: { max: number; min: number; mean: number; range: number } }
interface HourRow { hour: string; tideH: number | null; temp: number | null; windSpd: number | null; windDir: number | null; wCode: number | null; waveH: number | null; waveDir: number | null; currentSpd: number | null; currentDir: number | null; }
interface InfoPanelProps { coordinates: { lat: number; lon: number }; onClose: () => void }

/* ── Design tokens — light mode, index.css palette ─────────────────── */
const FONT = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'Inter', monospace";

const C = {
  bg:       "#f7f4ef",
  surface:  "#ffffff",
  surface2: "#f2ede6",
  border:   "#e4ddd4",
  borderS:  "#ccc5bb",
  text1:    "#1a1a1a",
  text2:    "#3d3d3d",
  text3:    "#6b6b6b",
  text4:    "#9a9a9a",
  blue:     "#1a3bbf",
  blueH:    "#142d99",
  blueL:    "#ddf0fb",
  blueM:    "#4fd4e8",
  amber:    "#f5c518",
  amberBg:  "rgba(245,193,24,0.10)",
  green:    "#15803d",
  greenBg:  "#dcfce7",
  orange:   "#c2410c",
  orangeBg: "rgba(194,65,12,0.08)",
  red:      "#dc2626",
  redBg:    "#fee2e2",
  tpxo:     "#1a3bbf",
  luwes:    "#db2777",
  shadow:   "0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
  shadowSm: "0 1px 3px rgba(0,0,0,0.07)",
};

const TOL_CORRECTION = -1.944;
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
const FREE_HIST_DAYS = 10;
const FREE_FWD_DAYS  = 3;
const PRO_FWD_DAYS   = 10;

const kmhToMs = (v: number) => v / 3.6;
const todayISO = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
function addDays(d: string, n: number): string { const dt = new Date(d+"T12:00:00Z"); dt.setUTCDate(dt.getUTCDate()+n); return dt.toISOString().slice(0,10); }
function parseToWIB(ts: string): { wibDate: string; wibHour: number; wibMinute: number } | null {
  try {
    let ms = NaN;
    if (ts.endsWith("Z")||ts.includes("+")) ms=Date.parse(ts); else if(ts.includes("T")) ms=Date.parse(ts+"Z");
    if (isNaN(ms)) return null;
    const w = new Date(ms+7*3600_000);
    return { wibDate:w.toISOString().slice(0,10), wibHour:w.getUTCHours(), wibMinute:w.getUTCMinutes() };
  } catch { return null; }
}
const fmtHHmm = (iso: string) => { const d=new Date(iso); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; };
const windDirLabel = (deg: number) => ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(deg/22.5)%16];

const WMO_SHORT: Record<number,{en:string;id:string;color:string}> = {
  0:{en:"Clear",id:"Cerah",color:"#0284c7"},1:{en:"Clear",id:"Cerah",color:"#0284c7"},
  2:{en:"Partly Cloudy",id:"Berawan",color:"#6b6b6b"},3:{en:"Overcast",id:"Mendung",color:"#6b6b6b"},
  45:{en:"Fog",id:"Kabut",color:"#9a9a9a"},51:{en:"Drizzle",id:"Gerimis",color:"#0369a1"},
  61:{en:"Light Rain",id:"Hj.Ringan",color:"#0369a1"},63:{en:"Rain",id:"Hujan",color:"#0369a1"},
  65:{en:"Heavy Rain",id:"Hj.Lebat",color:"#dc2626"},80:{en:"Showers",id:"Rintik",color:"#0369a1"},
  81:{en:"Showers",id:"Rintik",color:"#0369a1"},82:{en:"Showers",id:"Rintik",color:"#0369a1"},
  95:{en:"Storm",id:"Badai",color:"#dc2626"},99:{en:"Storm",id:"Badai",color:"#dc2626"},
};
const wmoShort = (code:number|null,lang:"en"|"id") => {
  if(code===null) return {label:"—",color:C.text4};
  const e=WMO_SHORT[code]; if(e) return {label:e[lang],color:e.color};
  const n=Object.keys(WMO_SHORT).map(Number).reduce((a,b)=>Math.abs(b-code)<Math.abs(a-code)?b:a);
  return {label:WMO_SHORT[n]?.[lang]??"—",color:WMO_SHORT[n]?.color??C.text4};
};
const wmoLabel = (code:number|null,lang:"en"|"id") => {
  const W:Record<number,{en:string;id:string}> = {0:{en:"Clear sky",id:"Langit cerah"},1:{en:"Mainly clear",id:"Cerah berawan"},2:{en:"Partly cloudy",id:"Sebagian berawan"},3:{en:"Overcast",id:"Mendung"},45:{en:"Foggy",id:"Berkabut"},51:{en:"Light drizzle",id:"Gerimis ringan"},61:{en:"Light rain",id:"Hujan ringan"},63:{en:"Rain",id:"Hujan"},65:{en:"Heavy rain",id:"Hujan lebat"},80:{en:"Showers",id:"Hujan rintik"},95:{en:"Thunderstorm",id:"Badai petir"}};
  if(code===null) return "—"; const e=W[code]; if(e) return e[lang];
  const n=Object.keys(W).map(Number).reduce((a,b)=>Math.abs(b-code)<Math.abs(a-code)?b:a);
  return W[n]?.[lang]??"—";
};

const cacheKey = (lat:number,lon:number,t:"wx"|"marine") => `searibu_${t}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
function readCache<T>(lat:number,lon:number,t:"wx"|"marine"):T|null { try{const r=sessionStorage.getItem(cacheKey(lat,lon,t));return r?JSON.parse(r):null;}catch{return null;} }
function writeCache<T>(lat:number,lon:number,t:"wx"|"marine",data:T){try{sessionStorage.setItem(cacheKey(lat,lon,t),JSON.stringify(data));}catch{}}
function clearCache(lat:number,lon:number){try{sessionStorage.removeItem(cacheKey(lat,lon,"wx"));sessionStorage.removeItem(cacheKey(lat,lon,"marine"));}catch{}}

function buildCubicSpline(knots:{x:number;y:number}[]):(x:number)=>number{
  const n=knots.length;if(n===0)return()=>0;if(n===1)return()=>knots[0].y;if(n===2){const[a,b]=knots;return(x)=>a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}
  const xs=knots.map(k=>k.x),ys=knots.map(k=>k.y),h=Array.from({length:n-1},(_,i)=>xs[i+1]-xs[i]),rhs=new Array(n).fill(0),upper=new Array(n).fill(0),mu=new Array(n).fill(0);
  for(let i=1;i<n-1;i++){const tot=h[i-1]+h[i];upper[i]=h[i]/tot;rhs[i]=6*((ys[i+1]-ys[i])/h[i]-(ys[i]-ys[i-1])/h[i-1])/tot;mu[i]=h[i-1]/(h[i-1]+h[i]);}
  const dM=new Array(n).fill(2),r2=[...rhs];for(let i=1;i<n-1;i++){const w=mu[i]/dM[i-1];dM[i]-=w*upper[i-1];r2[i]-=w*r2[i-1];}
  const M=new Array(n).fill(0);M[n-2]=r2[n-2]/dM[n-2];for(let i=n-3;i>=1;i--)M[i]=(r2[i]-upper[i]*M[i+1])/dM[i];
  return(x:number)=>{if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let lo=0,hi=n-2;while(lo<hi){const mid=(lo+hi)>>1;if(xs[mid+1]<x)lo=mid+1;else hi=mid;}const i=lo,dx=x-xs[i],hi_=h[i];return ys[i]+dx*((ys[i+1]-ys[i])/hi_-hi_*(2*M[i]+M[i+1])/6+dx*(M[i]/2+dx*(M[i+1]-M[i])/(6*hi_)));};
}
function interpolateTPXO(knots:{x:number;y:number}[]):{x:number;y:number}[]{
  if(knots.length<2)return knots;const spline=buildCubicSpline(knots);const xMin=knots[0].x,xMax=knots[knots.length-1].x;const result:{x:number;y:number}[]=[];
  for(let min=0;min<=(xMax-xMin)*60+0.5;min++){const x=xMin+min/60;if(x>xMax+1e-9)break;result.push({x:Math.min(x,xMax),y:spline(Math.min(x,xMax))});}
  return result;
}

const Shimmer:React.FC<{w?:string;h?:string;r?:string}> = ({w="100%",h="12px",r="6px"}) => (
  <div style={{width:w,height:h,borderRadius:r,background:`linear-gradient(90deg,${C.border} 25%,${C.surface2} 50%,${C.border} 75%)`,backgroundSize:"200% 100%",animation:"ip-shimmer 1.5s linear infinite"}}/>
);

/* ── Chart (light mode) ─────────────────────────────────────────────── */
const OverlayChart:React.FC<{tpxoPredictions:Array<{time:string;height:number}>;luwesObs:Array<{recorded_at:string;level_m:number}>;dateStr:string}> = ({tpxoPredictions,luwesObs,dateStr}) => {
  const canvasRef=useRef<HTMLCanvasElement>(null),chartRef=useRef<any>(null),tipId=useRef(`ip-tip-${Math.random().toString(36).slice(2,7)}`),bulletRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!canvasRef.current)return;if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}
    const nextDate=addDays(dateStr,1),tpxoKnots:{x:number;y:number}[]=[];
    tpxoPredictions.forEach(p=>{const w=parseToWIB(p.time);if(!w)return;if(w.wibDate===dateStr)tpxoKnots.push({x:w.wibHour+w.wibMinute/60,y:p.height});else if(w.wibDate===nextDate&&w.wibHour===0&&w.wibMinute===0)tpxoKnots.push({x:24,y:p.height});});
    tpxoKnots.sort((a,b)=>a.x-b.x);const tpxoPts=interpolateTPXO(tpxoKnots);
    const luwesPts:{x:number;y:number}[]=[];luwesObs.forEach(o=>{const w=parseToWIB(o.recorded_at);if(w&&w.wibDate===dateStr)luwesPts.push({x:w.wibHour+w.wibMinute/60,y:o.level_m});});
    const nearY=(pts:{x:number;y:number}[],x:number,maxD=0.15)=>{if(!pts.length)return null;let best=pts[0],bestD=Math.abs(x-pts[0].x);for(const pt of pts){const d=Math.abs(x-pt.x);if(d<bestD){bestD=d;best=pt;}}return bestD<=maxD?best.y:null;};
    const nearTPXO=(x:number)=>nearY(tpxoPts,x,3/60);
    const wibNow=new Date(Date.now()+7*3600_000),isToday=dateStr===wibNow.toISOString().slice(0,10),nowX=isToday?wibNow.getUTCHours()+wibNow.getUTCMinutes()/60:-1,tid=tipId.current;
    const ensureTip=():HTMLDivElement=>{let el=document.getElementById(tid) as HTMLDivElement|null;if(!el){el=document.createElement("div");el.id=tid;el.style.cssText=`position:fixed;pointer-events:none;z-index:99999;background:#fff;color:#1a1a1a;border-radius:10px;padding:10px 14px;font-family:${FONT};font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,0.14);min-width:130px;line-height:1.65;display:none;border:1px solid #e4ddd4;`;document.body.appendChild(el);}return el;};
    const hideTip=()=>{const el=document.getElementById(tid);if(el)el.style.display="none";if(bulletRef.current)bulletRef.current.style.display="none";};
    let cancelled=false;
    import("chart.js/auto").then(({default:Chart})=>{
      if(cancelled||!canvasRef.current)return;const ctx=canvasRef.current.getContext("2d");if(!ctx)return;
      chartRef.current=new Chart(ctx,{type:"scatter",data:{datasets:[
        {label:"Predicted",type:"line" as any,data:tpxoPts,borderColor:C.tpxo,backgroundColor:(c:any)=>{const{chart:{ctx:cx,chartArea:ca}}=c;if(!ca)return"rgba(26,59,191,0.07)";const g=cx.createLinearGradient(0,ca.top,0,ca.bottom);g.addColorStop(0,"rgba(26,59,191,0.16)");g.addColorStop(1,"rgba(26,59,191,0)");return g;},borderWidth:2.5,fill:true,tension:0,pointRadius:0,spanGaps:false,order:2,parsing:false},
        {label:"Observed",type:"scatter" as any,data:luwesPts,borderColor:`${C.luwes}cc`,backgroundColor:`${C.luwes}aa`,pointRadius:3,order:1,parsing:false},
      ]},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"index",intersect:false,axis:"x"},plugins:{legend:{display:false},tooltip:{enabled:false}},
        scales:{
          x:{type:"linear",min:0,max:24,grid:{color:"rgba(0,0,0,0.05)"},border:{display:false},ticks:{color:C.text4,font:{family:MONO,size:9.5},maxRotation:0,stepSize:1,autoSkip:false,includeBounds:true,callback:(v:any)=>{const n=Number(v);if(n===0)return"00:00";if(n===24)return"24:00";return n%3===0?`${n.toString().padStart(2,"0")}:00`:""}}},
          y:{grid:{color:"rgba(0,0,0,0.05)"},border:{display:false},ticks:{color:C.text4,font:{family:MONO,size:9.5},callback:(v:any)=>`${Number(v).toFixed(2)}m`},title:{display:true,text:"m MSL",color:C.text4,font:{size:9,family:MONO}}},
        },
        onHover:(event:any,_:any[],chart:any)=>{
          if(!event?.native){hideTip();return;}const xVal=chart.scales.x?.getValueForPixel(event.x);if(xVal==null||xVal<0||xVal>24){hideTip();return;}
          const tVal=nearTPXO(xVal),lVal=nearY(luwesPts,xVal,0.12);if(tVal===null&&lVal===null){hideTip();return;}
          const hh=Math.floor(xVal),mm=Math.round((xVal-hh)*60),timeStr=`${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")} WIB`;
          let html=`<div style="color:${C.text4};font-size:10px;font-weight:700;letter-spacing:0.06em;margin-bottom:6px;text-transform:uppercase;">${timeStr}</div>`;
          if(tVal!==null) html+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:${lVal!==null?4:0}px;"><span style="width:8px;height:8px;border-radius:50%;background:${C.tpxo};flex-shrink:0;"></span><span style="color:${C.text3};font-size:11px;">Pred</span><span style="margin-left:auto;font-weight:700;color:${C.text1};font-size:12px;">${tVal.toFixed(3)}m</span></div>`;
          if(lVal!==null) html+=`<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${C.luwes};flex-shrink:0;"></span><span style="color:${C.text3};font-size:11px;">Obs</span><span style="margin-left:auto;font-weight:700;color:${C.text1};font-size:12px;">${lVal.toFixed(3)}m</span></div>`;
          const tip=ensureTip();tip.innerHTML=html;tip.style.display="block";
          const canvas=canvasRef.current;if(!canvas)return;const rect=canvas.getBoundingClientRect();const xPx=chart.scales.x.getPixelForValue(xVal);const scX=rect.width/(canvas.offsetWidth||1),scY=rect.height/(canvas.offsetHeight||1);const screenX=rect.left+xPx*scX;
          if(bulletRef.current&&tVal!==null){const tY=rect.top+chart.scales.y.getPixelForValue(tVal)*scY;const pr=canvas.parentElement;if(pr){const pr_=pr.getBoundingClientRect();bulletRef.current.style.display="block";bulletRef.current.style.left=`${screenX-pr_.left-5}px`;bulletRef.current.style.top=`${tY-pr_.top-5}px`;}}else if(bulletRef.current)bulletRef.current.style.display="none";
          const tipW=150,tipH=tVal!==null&&lVal!==null?78:54;const yA=tVal!==null?rect.top+chart.scales.y.getPixelForValue(tVal)*scY:rect.top+chart.scales.y.getPixelForValue(lVal!)*scY;let left=screenX-tipW/2,top=yA-tipH-12;if(left<8)left=8;if(left+tipW>window.innerWidth-8)left=window.innerWidth-tipW-8;if(top<8)top=yA+12;tip.style.left=`${left}px`;tip.style.top=`${top}px`;
        },
      },plugins:[{id:"nowLine",afterDraw(chart:any){if(nowX<0||nowX>24)return;const{ctx:c,chartArea:ca,scales}=chart;const x=scales.x.getPixelForValue(nowX);if(x<ca.left||x>ca.right)return;c.save();c.beginPath();c.moveTo(x,ca.top);c.lineTo(x,ca.bottom);c.strokeStyle="rgba(220,38,38,0.50)";c.lineWidth=1.5;c.setLineDash([4,4]);c.stroke();c.fillStyle=C.red;c.font=`bold 8px ${MONO}`;c.textAlign="center";c.fillText("NOW",x,ca.top+8);c.restore();}}]});
      canvasRef.current?.addEventListener("mouseleave",hideTip);
    });
    return()=>{cancelled=true;if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}document.getElementById(tipId.current)?.remove();};
  },[tpxoPredictions,luwesObs,dateStr]);
  return(<div style={{position:"relative",width:"100%",height:"100%"}}><canvas ref={canvasRef} style={{width:"100%",height:"100%"}}/><div ref={bulletRef} style={{position:"absolute",display:"none",width:10,height:10,borderRadius:"50%",background:C.tpxo,border:"2px solid #fff",boxShadow:"0 0 0 2px rgba(26,59,191,0.25)",pointerEvents:"none",zIndex:10}}/></div>);
};

/* ══════════════════════════════════════════════════════════════════
   InfoPanel — white / light mode, consistent with Searibu design system
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
      setError(lang==="en"?`Date out of range. Choose between ${isPro?"any past date":minDateISO} and ${maxDateISO}.`:`Tanggal di luar jangkauan.`);
      setLoading(false); return;
    }
    try {
      const today=new Date(); const fmtD=(d:Date)=>d.toISOString().split("T")[0];
      let wd:WeatherData|null=null, md:MarineData|null=null;
      if(!forceRefresh){wd=readCache(coordinates.lat,coordinates.lon,"wx");md=readCache(coordinates.lat,coordinates.lon,"marine");}
      if(!wd||!md){
        const dB=isPro?16:FREE_HIST_DAYS+2,dF=isPro?PRO_FWD_DAYS+2:FREE_FWD_DAYS+2;
        const wxS=new Date(today);wxS.setDate(wxS.getDate()-dB);const wxE=new Date(today);wxE.setDate(wxE.getDate()+dF+1);
        const[wxRes,marRes]=await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=sunrise,sunset&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&start_date=${fmtD(wxS)}&end_date=${fmtD(wxE)}`),fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coordinates.lat}&longitude=${coordinates.lon}&hourly=wave_height,ocean_current_velocity,wave_direction,ocean_current_direction&current=wave_height,ocean_current_velocity&timezone=auto&start_date=${fmtD(wxS)}&end_date=${fmtD(wxE)}`)]);
        if(!wxRes.ok)throw new Error(lang==="en"?"Weather service unavailable":"Layanan cuaca tidak tersedia");
        wd=await wxRes.json() as WeatherData;writeCache(coordinates.lat,coordinates.lon,"wx",wd);
        if(marRes.ok){md=await marRes.json() as MarineData;writeCache(coordinates.lat,coordinates.lon,"marine",md);}
      }
      setWeatherData(wd);setMarineData(md);
      const[tr,or_]=await Promise.all([fetch(`${API_BASE}/api/tide/prediction?lon=${coordinates.lon}&lat=${coordinates.lat}&start_date=${addDays(dateStr,-1)}&end_date=${addDays(dateStr,1)}&interval_hours=1`),fetch(`${API_BASE}/api/luwes/overlay?date=${dateStr}&lon=${coordinates.lon}&lat=${coordinates.lat}`)]);
      if(!tr.ok){const e=await tr.json().catch(()=>({}));throw new Error((e as any).error??(lang==="en"?"Tide service unavailable":"Layanan pasut tidak tersedia"));}
      setTideData(await tr.json() as TideData);setOverlayData(or_.ok?await or_.json() as OverlayData:null);
    } catch(e){setError(e instanceof Error?e.message:(lang==="en"?"Unknown error":"Kesalahan tidak dikenal"));}
    finally{setLoading(false);}
  }, [coordinates, lang, isPro, minDateISO, maxDateISO]);

  useEffect(() => { const d=todayISO(); setSelDate(d); fetchAll(d); }, [coordinates.lat, coordinates.lon]);

  const getSunTimes = () => {
    if(!weatherData?.daily)return{sunrise:"--:--",sunset:"--:--"};
    const idx=weatherData.daily.time.findIndex(t=>t===selDate);
    if(idx===-1)return{sunrise:"--:--",sunset:"--:--"};
    return{sunrise:fmtHHmm(weatherData.daily.sunrise[idx]),sunset:fmtHHmm(weatherData.daily.sunset[idx])};
  };

  const buildRows = (): HourRow[] => {
    const tideMap=new Map<number,number>();
    tideData?.predictions.forEach(p=>{const w=parseToWIB(p.time);if(w&&w.wibDate===selDate)tideMap.set(w.wibHour,p.height);});
    const wxMap=new Map<string,Partial<HourRow>>();
    weatherData?.hourly.time.forEach((t,i)=>{if(!t.startsWith(selDate))return;const hh=new Date(t).getHours().toString().padStart(2,"0");wxMap.set(hh,{temp:weatherData.hourly.temperature_2m[i],windSpd:weatherData.hourly.wind_speed_10m[i]!=null?kmhToMs(weatherData.hourly.wind_speed_10m[i]):null,windDir:weatherData.hourly.wind_direction_10m[i],wCode:weatherData.hourly.weather_code[i]});});
    const marMap=new Map<string,{waveH:number|null;waveDir:number|null;currentSpd:number|null;currentDir:number|null}>();
    marineData?.hourly.time.forEach((t,i)=>{if(!t.startsWith(selDate))return;const hh=new Date(t).getHours().toString().padStart(2,"0");marMap.set(hh,{waveH:marineData.hourly.wave_height[i]??null,waveDir:marineData.hourly.wave_direction?.[i]??null,currentSpd:marineData.hourly.ocean_current_velocity[i]??null,currentDir:marineData.hourly.ocean_current_direction?.[i]??null});});
    return Array.from({length:24},(_,i)=>{const hh=i.toString().padStart(2,"0");const marine=marMap.get(hh)??{waveH:null,waveDir:null,currentSpd:null,currentDir:null};const wx=wxMap.get(hh)??{};return{hour:`${hh}:00`,tideH:tideMap.get(i)??null,temp:null,windSpd:null,windDir:null,wCode:null,...wx,...marine} as HourRow;});
  };

  const tpxoHighLow = (() => {
    const hs=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];if(!hs.length)return null;
    let hi=hs[0],lo=hs[0];for(const p of hs){if(p.height>hi.height)hi=p;if(p.height<lo.height)lo=p;}
    const fT=(iso:string)=>{const w=parseToWIB(iso);return w?`${w.wibHour.toString().padStart(2,"0")}:00`:"--:--";};
    return{max:hi.height,maxTime:fT(hi.time),min:lo.height,minTime:fT(lo.time)};
  })();

  const luwesForChart=(overlayData?.luwes_obs??[]).filter(o=>parseToWIB(o.recorded_at)?.wibDate===selDate).map(o=>({...o,level_m:o.level_m+TOL_CORRECTION}));
  const hasLuwes=luwesForChart.length>0;
  const{sunrise,sunset}=getSunTimes();
  const rows=buildRows(),current=weatherData?.current;
  const cWindMs=current?kmhToMs(current.wind_speed_10m):null;
  const cWaveH=marineData?.current?.wave_height??marineData?.hourly.wave_height[0]??null;
  const cCurrSpd=marineData?.current?.ocean_current_velocity??marineData?.hourly.ocean_current_velocity[0]??null;
  const nowHour=new Date(Date.now()+7*3600_000).getUTCHours().toString().padStart(2,"0");
  const isToday=selDate===todayISO();
  const selDateFmt=new Date(selDate+"T12:00:00Z").toLocaleDateString(lang==="en"?"en-US":"id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const maxHourIdx=(()=>{const dp=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];if(!dp.length)return -1;let b=0;for(let i=1;i<dp.length;i++)if(dp[i].height>dp[b].height)b=i;const w=parseToWIB(dp[b].time);return w?w.wibHour:-1;})();
  const minHourIdx=(()=>{const dp=tideData?.predictions.filter(p=>parseToWIB(p.time)?.wibDate===selDate)??[];if(!dp.length)return -1;let b=0;for(let i=1;i<dp.length;i++)if(dp[i].height<dp[b].height)b=i;const w=parseToWIB(dp[b].time);return w?w.wibHour:-1;})();
  const arrowStyle=(deg:number|null):React.CSSProperties=>({display:"inline-block",transform:deg!=null?`rotate(${deg}deg)`:"none",fontSize:9,lineHeight:1,color:C.text4,flexShrink:0});

  const T={
    marineInfo:lang==="en"?"Marine Information":"Informasi Kelautan",
    refresh:lang==="en"?"Refresh":"Perbarui",
    selectDate:lang==="en"?"Date":"Tanggal",
    proRange:lang==="en"?`Pro: all historical · ${PRO_FWD_DAYS}d ahead`:`Pro: semua historis · ${PRO_FWD_DAYS}h ke depan`,
    freeRange:lang==="en"?`Free: past ${FREE_HIST_DAYS}d – ${FREE_FWD_DAYS}d ahead`:`Gratis: ${FREE_HIST_DAYS}h lalu – ${FREE_FWD_DAYS}h ke depan`,
    upgradeLink:lang==="en"?"Upgrade →":"Upgrade →",
    obsVsPred:hasLuwes?(lang==="en"?"Observation vs Prediction":"Observasi vs Prediksi"):(lang==="en"?"Tidal Prediction":"Prediksi Pasut"),
    highLabel:lang==="en"?"HIGH WATER":"AIR TINGGI",
    lowLabel:lang==="en"?"LOW WATER":"AIR RENDAH",
    hourlyData:lang==="en"?"Hourly Data (WIB)":"Data Per Jam (WIB)",
    s104:lang==="en"?"IHO S-104 Export":"Ekspor IHO S-104",
    unableLoad:lang==="en"?"Unable to load data":"Gagal memuat data",
    tryAgain:lang==="en"?"Try again":"Coba lagi",
    today:lang==="en"?"Today":"Hari ini",
    wind:lang==="en"?"WIND":"ANGIN",wave:lang==="en"?"WAVE":"GELOMBANG",current:lang==="en"?"CURRENT":"ARUS",
    rise:lang==="en"?"RISE":"TERBIT",set:lang==="en"?"SET":"TERBENAM",
    colTime:"TIME",colWeather:lang==="en"?"WEATHER":"CUACA",colTide:"TIDE(m)",colTemp:"°C",colWind:"WIND",colWave:"WAVE",colCurr:"CURR.",
  };

  const waveStatus=(h:number|null)=>{if(h===null)return"";if(h<0.5)return lang==="en"?"Calm":"Tenang";if(h<1.25)return lang==="en"?"Slight":"Ringan";if(h<2.5)return lang==="en"?"Moderate":"Sedang";return lang==="en"?"Rough":"Kasar";};
  const currStatus=(s:number|null)=>{if(s===null)return"";if(s<0.25)return lang==="en"?"Weak":"Lemah";if(s<0.75)return lang==="en"?"Moderate":"Sedang";return lang==="en"?"Strong":"Kuat";};

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:C.bg,borderLeft:`1.5px solid ${C.border}`,fontFamily:FONT,overscrollBehavior:"contain"}}>

      {/* ── Top bar ── */}
      <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:52,background:C.surface,borderBottom:`1.5px solid ${C.border}`,boxShadow:C.shadowSm}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:3,height:18,background:C.blue,borderRadius:2,flexShrink:0}}/>
          <span style={{fontSize:14,fontWeight:700,color:C.text1,letterSpacing:"-0.01em"}}>{T.marineInfo}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>{clearCache(coordinates.lat,coordinates.lon);fetchAll(selDate,true);}} title={T.refresh}
            style={{padding:"6px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.text3,display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,fontFamily:FONT,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.blueL;e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.color=C.blue;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <RefreshCw size={12}/>
          </button>
          <button onClick={onClose}
            style={{padding:"6px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.text3,display:"flex",alignItems:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redBg;e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`,overscrollBehavior:"contain",WebkitOverflowScrolling:"touch",background:C.bg}}
        onWheel={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>

        {loading && (
          <div style={{padding:"16px 16px 0",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{borderRadius:14,background:C.surface,border:`1.5px solid ${C.border}`,padding:"18px",display:"flex",flexDirection:"column",gap:12}}>
              <Shimmer w="50%" h="10px"/><Shimmer w="35%" h="40px"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:4}}>
                {[0,1,2].map(i=><div key={i} style={{padding:"12px",background:C.bg,borderRadius:9,border:`1px solid ${C.border}`}}><Shimmer w="55%" h="9px"/><div style={{marginTop:6}}><Shimmer w="45%" h="24px"/></div></div>)}
              </div>
            </div>
            <Shimmer h="40px" r="9px"/>
            <div style={{borderRadius:12,overflow:"hidden",border:`1.5px solid ${C.border}`,background:C.surface}}><div style={{height:260,padding:12}}><Shimmer h="100%" r="6px"/></div></div>
          </div>
        )}

        {error && !loading && (
          <div style={{margin:16,padding:14,borderRadius:12,background:C.redBg,border:`1px solid rgba(220,38,38,0.20)`}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <AlertCircle size={15} style={{color:C.red,flexShrink:0,marginTop:1}}/>
              <div>
                <p style={{color:C.red,fontSize:13,fontWeight:700,marginBottom:4}}>{T.unableLoad}</p>
                <p style={{color:"rgba(220,38,38,0.75)",fontSize:12,marginBottom:10}}>{error}</p>
                <button onClick={()=>fetchAll(selDate)} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>
                  <RefreshCw size={11}/>{T.tryAgain}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (<>

          {/* ── Hero card ── */}
          <div style={{margin:"16px 16px 0",borderRadius:14,overflow:"hidden",background:C.surface,border:`1.5px solid ${C.border}`,boxShadow:C.shadow}}>
            <div style={{height:3,background:`linear-gradient(to right,${C.blue},${C.blueM})`}}/>
            {/* Coord + Today */}
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg}}>
              <span style={{fontFamily:MONO,fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.04em"}}>
                {Math.abs(coordinates.lat).toFixed(4)}°{coordinates.lat>=0?"N":"S"}&ensp;{Math.abs(coordinates.lon).toFixed(4)}°{coordinates.lon>=0?"E":"W"}
              </span>
              {isToday&&<span style={{fontSize:10,fontWeight:800,color:C.blue,letterSpacing:"0.08em",textTransform:"uppercase",background:C.blueL,padding:"2px 9px",borderRadius:99,border:`1px solid rgba(26,59,191,0.18)`}}>{T.today}</span>}
            </div>
            {/* Temp */}
            {current && (
              <div style={{padding:"16px 16px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                    <span style={{fontFamily:MONO,fontSize:52,fontWeight:800,color:C.text1,lineHeight:1,letterSpacing:"-0.04em"}}>{Math.round(current.temperature_2m)}°</span>
                  </div>
                  <p style={{fontSize:14,fontWeight:600,color:C.text2,margin:"5px 0 0"}}>{wmoLabel(current.weather_code,lang)}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"right",paddingTop:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,justifyContent:"flex-end"}}>
                    <span style={{fontSize:10,color:C.text4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{T.rise}</span>
                    <Sun size={11} color="#f59e0b"/>
                    <span style={{fontFamily:MONO,fontSize:13,fontWeight:700,color:C.text1}}>{sunrise}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:7,justifyContent:"flex-end"}}>
                    <span style={{fontSize:10,color:C.text4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{T.set}</span>
                    <Moon size={11} color={C.text4}/>
                    <span style={{fontFamily:MONO,fontSize:13,fontWeight:700,color:C.text1}}>{sunset}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Wind / Wave / Current */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",marginTop:14,borderTop:`1px solid ${C.border}`}}>
              {[
                {icon:<Wind size={12}/>,label:T.wind,value:cWindMs!=null?cWindMs.toFixed(1):"—",unit:"m/s",sub:cWindMs!=null&&current?`${windDirLabel(current.wind_direction_10m)} ${Math.round(current.wind_direction_10m)}°`:"",color:C.blue},
                {icon:<Waves size={12}/>,label:T.wave,value:cWaveH!=null?cWaveH.toFixed(2):"—",unit:"m",sub:waveStatus(cWaveH),color:"#0284c7"},
                {icon:<Navigation size={12}/>,label:T.current,value:cCurrSpd!=null?cCurrSpd.toFixed(2):"—",unit:"m/s",sub:currStatus(cCurrSpd),color:C.text3},
              ].map((item,i)=>(
                <div key={i} style={{padding:"12px 14px 14px",borderRight:i<2?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                    <span style={{color:item.color}}>{item.icon}</span>
                    <span style={{fontSize:9.5,fontWeight:800,color:C.text4,letterSpacing:"0.10em",textTransform:"uppercase"}}>{item.label}</span>
                  </div>
                  <p style={{fontFamily:MONO,color:C.text1,fontSize:22,fontWeight:800,lineHeight:1,margin:0,letterSpacing:"-0.02em"}}>
                    {item.value}<span style={{fontSize:11,color:C.text3,fontWeight:500,marginLeft:3}}>{item.unit}</span>
                  </p>
                  {item.sub&&<p style={{color:C.text3,fontSize:11,fontWeight:600,marginTop:4}}>{item.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ── Date picker ── */}
          <div style={{padding:"14px 16px 0"}}>
            <label style={{display:"block",fontSize:10,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase",color:C.text4,marginBottom:7}}>{T.selectDate}</label>
            <input type="date" value={selDate} min={minDateISO} max={maxDateISO}
              onChange={e=>{const c=e.target.value;if(c>=minDateISO&&c<=maxDateISO){setSelDate(c);fetchAll(c);}}}
              style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:14,fontWeight:600,fontFamily:MONO,color:C.text1,background:C.surface,cursor:"pointer",outline:"none",boxSizing:"border-box",transition:"border-color .15s, box-shadow .15s",boxShadow:C.shadowSm}}
              onFocus={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.boxShadow="0 0 0 3px rgba(26,59,191,0.10)";}}
              onBlur={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow=C.shadowSm;}}
            />
            {isPro
              ? <p style={{fontSize:11,color:C.text4,marginTop:6,fontWeight:500}}>{T.proRange}</p>
              : <div style={{display:"flex",alignItems:"center",gap:7,marginTop:8,padding:"8px 12px",background:C.amberBg,border:`1px solid rgba(245,193,24,0.35)`,borderRadius:8}}>
                  <Lock size={11} style={{color:"#92400e",flexShrink:0}}/>
                  <span style={{fontSize:11,color:"#78350f",fontWeight:600,flex:1}}>
                    {T.freeRange}.&nbsp;
                    <button onClick={()=>setShowPricing(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.blue,fontWeight:800,fontSize:11,padding:"0 2px",textDecoration:"underline"}}>{T.upgradeLink}</button>
                  </span>
                </div>
            }
          </div>

          {/* ── Chart ── */}
          <div style={{padding:"14px 16px 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase",color:C.text4}}>{T.obsVsPred}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:C.text2,fontWeight:700}}>
                  <span style={{display:"inline-block",width:16,height:2.5,background:C.tpxo,borderRadius:2}}/>{lang==="en"?"Pred":"Prediksi"}
                </span>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:hasLuwes?C.luwes:C.text4,fontWeight:700}}>
                  <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:hasLuwes?C.luwes:C.border}}/>{lang==="en"?"Obs":"Observasi"}
                </span>
                {isToday&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:C.red,fontWeight:700}}>
                  <span style={{display:"inline-block",width:12,height:1.5,background:"rgba(220,38,38,0.50)",borderRadius:1}}/>Now
                </span>}
              </div>
            </div>
            <div style={{borderRadius:12,overflow:"hidden",background:C.surface,border:`1.5px solid ${C.border}`,boxShadow:C.shadowSm}}>
              <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,background:C.bg}}>
                <span style={{fontSize:12,fontWeight:700,color:C.text1}}>{selDateFmt}</span>
              </div>
              <div style={{height:260,padding:"8px 10px 14px",position:"relative",background:C.surface}}>
                <OverlayChart tpxoPredictions={tideData?.predictions??[]} luwesObs={luwesForChart} dateStr={selDate}/>
              </div>
            </div>
          </div>

          {/* ── High / Low ── */}
          {tpxoHighLow && (
            <div style={{padding:"12px 16px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:T.highLabel,value:tpxoHighLow.max,time:tpxoHighLow.maxTime,isHigh:true},
                {label:T.lowLabel,value:tpxoHighLow.min,time:tpxoHighLow.minTime,isHigh:false},
              ].map(item=>(
                <div key={item.label} style={{borderRadius:12,padding:"13px 15px",background:item.isHigh?C.blueL:"#fff7ed",border:`1.5px solid ${item.isHigh?"rgba(26,59,191,0.18)":"rgba(194,65,12,0.18)"}`,boxShadow:C.shadowSm}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:item.isHigh?C.blue:C.orange}}/>
                    <span style={{fontSize:9.5,fontWeight:800,color:item.isHigh?C.blue:C.orange,textTransform:"uppercase",letterSpacing:"0.08em"}}>{item.label}</span>
                  </div>
                  <p style={{fontFamily:MONO,color:item.isHigh?C.blue:C.orange,fontSize:26,fontWeight:800,lineHeight:1,margin:0,letterSpacing:"-0.03em"}}>
                    {item.value>0?"+":""}{item.value.toFixed(3)}<span style={{fontSize:13,color:item.isHigh?"rgba(26,59,191,0.55)":"rgba(194,65,12,0.55)",fontWeight:500,marginLeft:3}}>m</span>
                  </p>
                  <p style={{fontSize:11,fontWeight:700,color:item.isHigh?"rgba(26,59,191,0.65)":"rgba(194,65,12,0.65)",marginTop:6}}>~{item.time} WIB</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Hourly Table ── */}
          <div style={{marginTop:16}}>
            <div style={{padding:"0 16px 8px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:3,height:14,background:C.blue,borderRadius:2}}/>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase",color:C.text4}}>{T.hourlyData}</span>
            </div>
            <div style={{borderTop:`1.5px solid ${C.border}`,borderBottom:`1.5px solid ${C.border}`,background:C.surface}}>
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <div style={{minWidth:460}}>
                  {/* Header */}
                  <div style={{display:"grid",gridTemplateColumns:"11% 14% 16% 9% 16% 17% 17%",borderBottom:`1.5px solid ${C.border}`,background:C.surface2}}>
                    {[T.colTime,T.colWeather,T.colTide,T.colTemp,T.colWind,T.colWave,T.colCurr].map((h,i)=>(
                      <div key={i} style={{padding:"9px",fontSize:9,fontWeight:800,letterSpacing:"0.08em",color:C.text3,textAlign:i>1?"right":"left" as any,whiteSpace:"nowrap",borderRight:i<6?`1px solid ${C.border}`:"none"}}>
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Data rows */}
                  <div style={{height:336,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`}}>
                    {rows.map((row,idx)=>{
                      const hl=isToday&&row.hour.startsWith(nowHour+":00");
                      const isMax=idx===maxHourIdx,isMin=idx===minHourIdx;
                      const wx=wmoShort(row.wCode,lang);
                      const waveC=row.waveH==null?C.text4:row.waveH<0.5?C.green:row.waveH<1.25?C.orange:C.red;
                      const currC=row.currentSpd==null?C.text4:row.currentSpd<0.25?C.green:row.currentSpd<0.75?C.orange:C.red;
                      const tideFmt=row.tideH!=null?(row.tideH>=0?"+":"")+row.tideH.toFixed(3):"—";
                      return(
                        <div key={idx} style={{display:"grid",gridTemplateColumns:"11% 14% 16% 9% 16% 17% 17%",borderBottom:idx<rows.length-1?`1px solid ${C.border}`:"none",background:hl?"rgba(26,59,191,0.06)":idx%2===0?C.surface:C.bg}}>
                          <div style={{padding:"7px 9px",fontFamily:MONO,fontSize:10,fontWeight:hl?800:700,color:hl?C.blue:C.text3,display:"flex",alignItems:"center",borderRight:`1px solid ${C.border}`}}>{row.hour}</div>
                          <div style={{padding:"7px 9px",display:"flex",alignItems:"center",borderRight:`1px solid ${C.border}`}}>
                            {row.wCode!==null&&<span style={{fontSize:10,fontWeight:700,color:wx.color,whiteSpace:"nowrap",lineHeight:1.2}}>{wx.label}</span>}
                          </div>
                          <div style={{padding:"7px 9px",display:"flex",alignItems:"center",justifyContent:"flex-end",borderRight:`1px solid ${C.border}`}}>
                            <span style={{fontFamily:MONO,fontSize:10,fontWeight:isMax||isMin?800:700,color:isMax?C.blue:isMin?C.orange:C.text1,whiteSpace:"nowrap"}}>{tideFmt}</span>
                          </div>
                          <div style={{padding:"7px 9px",display:"flex",alignItems:"center",justifyContent:"flex-end",borderRight:`1px solid ${C.border}`}}>
                            <span style={{fontFamily:MONO,fontSize:10,fontWeight:700,color:C.text2}}>{row.temp!=null?`${Math.round(row.temp)}°`:"—"}</span>
                          </div>
                          <div style={{padding:"7px 9px",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",gap:1,borderRight:`1px solid ${C.border}`}}>
                            {row.windSpd!=null?(<>
                              <div style={{display:"flex",alignItems:"center",gap:2}}>{row.windDir!=null&&<span style={arrowStyle(row.windDir)}>↑</span>}<span style={{fontFamily:MONO,fontSize:10,fontWeight:700,color:C.text2,whiteSpace:"nowrap"}}>{row.windSpd.toFixed(1)}</span></div>
                              {row.windDir!=null&&<span style={{fontSize:9,fontWeight:600,color:C.text4,lineHeight:1}}>{windDirLabel(row.windDir)}</span>}
                            </>):<span style={{fontFamily:MONO,fontSize:10,color:C.text4}}>—</span>}
                          </div>
                          <div style={{padding:"7px 9px",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",gap:1,borderRight:`1px solid ${C.border}`}}>
                            {row.waveH!=null?(<>
                              <div style={{display:"flex",alignItems:"center",gap:2}}>{row.waveDir!=null&&<span style={arrowStyle(row.waveDir)}>↑</span>}<span style={{fontFamily:MONO,fontSize:10,fontWeight:row.waveH>=1.25?800:700,color:waveC,whiteSpace:"nowrap"}}>{row.waveH.toFixed(2)}</span></div>
                              {row.waveDir!=null&&<span style={{fontSize:9,fontWeight:600,color:C.text4,lineHeight:1}}>{windDirLabel(row.waveDir)}</span>}
                            </>):<span style={{fontFamily:MONO,fontSize:10,color:C.text4}}>—</span>}
                          </div>
                          <div style={{padding:"7px 9px",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",gap:1}}>
                            {row.currentSpd!=null?(<>
                              <div style={{display:"flex",alignItems:"center",gap:2}}>{row.currentDir!=null&&<span style={arrowStyle(row.currentDir)}>↑</span>}<span style={{fontFamily:MONO,fontSize:10,fontWeight:row.currentSpd>=0.75?800:700,color:currC,whiteSpace:"nowrap"}}>{row.currentSpd.toFixed(2)}</span></div>
                              {row.currentDir!=null&&<span style={{fontSize:9,fontWeight:600,color:C.text4,lineHeight:1}}>{windDirLabel(row.currentDir)}</span>}
                            </>):<span style={{fontFamily:MONO,fontSize:10,color:C.text4}}>—</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Footer legend */}
                  <div style={{padding:"8px 12px",borderTop:`1.5px solid ${C.border}`,background:C.surface2,display:"flex",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    {[{c:C.green,l:lang==="en"?"Low":"Rendah"},{c:C.orange,l:lang==="en"?"Moderate":"Sedang"},{c:C.red,l:lang==="en"?"High":"Tinggi"}].map(({c,l})=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
                        <span style={{fontSize:10,fontWeight:700,color:C.text3}}>{l}</span>
                      </div>
                    ))}
                    <span style={{fontSize:9.5,fontWeight:600,color:C.text4,marginLeft:"auto"}}>↑ dir · m/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── S-104 Export ── */}
          <div style={{padding:"14px 16px 22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:3,height:14,background:C.blue,borderRadius:2}}/>
              <label style={{fontSize:10,fontWeight:800,letterSpacing:"0.10em",textTransform:"uppercase",color:C.text4}}>{T.s104}</label>
            </div>
            <S104ExportSection coordinates={coordinates} selectedDate={selDate} language={lang}/>
          </div>
        </>)}
      </div>

      <PricingModal open={showPricing} onClose={()=>setShowPricing(false)} language={lang} initialTab="pricing"/>
      <style>{`
        @keyframes ip-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};