/**
 * PricingModal.tsx — Dark nautical theme, fully responsive.
 *
 * Layout strategy:
 *   ≥ 680px  → 3-column card row (desktop/tablet landscape)
 *   < 680px  → tabbed single-card view on mobile (Free | Pro Monthly | Pro Annual)
 *              so each card has full width and nothing gets squished
 *
 * Portal-mounted → never trapped in any stacking context.
 *
 * Payment flow: POST /api/create-payment resolves the user account and
 * returns a Mayar.id hosted checkout URL. Subscription activation happens
 * later, asynchronously, via Mayar's webhook — this component never
 * activates Pro directly. After the checkout tab opens, SubscriptionContext
 * refreshes automatically on window focus so Pro status reflects once the
 * webhook has processed the payment.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Check, Lock, Zap, Download, BarChart2,
  Calendar, Shield, RefreshCw, Loader2, CheckCircle, Waves,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "'Inter', monospace";
const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";

/* ── Design tokens ────────────────────────────────────────────────── */
const M = {
  bg: "#0f1824",
  surface: "#162030",
  card: "#1a2840",
  border: "#1e3044",
  border2: "#243548",
  amber: "#f5c518",
  amberD: "#d4a814",
  sky: "#38bdf8",
  text1: "#f0f6ff",
  text2: "#8ba3be",
  text3: "#4a6580",
  green: "#4ade80",
  red: "#f87171",
  DARK1: "#0f1824",
};

/* ── Responsive hook ──────────────────────────────────────────────── */
function useWidth() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 900
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

/* ── Copy ─────────────────────────────────────────────────────────── */
const COPY = {
  en: {
    title: "Choose your plan",
    sub: "Accurate tidal, weather & marine data for Kepulauan Seribu",
    tabPricing: "Plans", tabStatus: "My subscription",
    demoBadge: "Secure payment via Mayar.id",
    freeName: "Free", monthlyName: "Pro Monthly", annualName: "Pro Annual",
    freeDesc: "For occasional visitors",
    monthlyDesc: "For regular trip planners",
    annualDesc: "Best value for enthusiasts",
    freePrice: "Rp 0", monthlyPrice: "Rp 39.000", annualPrice: "Rp 139.000",
    perMonth: "/mo", perYear: "/yr",
    monthly: "Billed monthly", annual: "Billed annually", save: "Save 40%",
    currentPlan: "Current plan", upgrade: "Upgrade",
    features: {
      free: [
        { on: true, label: "3-day tidal forecast" },
        { on: true, label: "Basic tidal chart" },
        { on: true, label: "Current weather data" },
        { on: true, label: "Activity guide (today)" },
        { on: false, label: "S-104 HDF5 export" },
        { on: false, label: "10-day extended forecast" },
        { on: false, label: "Hourly weather table" },
        { on: false, label: "Luwes overlay chart" },
      ],
      pro: [
        { on: true, label: "10-day tidal forecast" },
        { on: true, label: "Full interactive tidal chart" },
        { on: true, label: "Hourly weather table" },
        { on: true, label: "Full activity guide (all dates)" },
        { on: true, label: "S-104 HDF5 export (TPXO + Luwes)" },
        { on: true, label: "Luwes observation overlay" },
        { on: true, label: "Priority data access" },
        { on: true, label: "Priority support" },
      ],
    },
    planLabel: "Plan", expiresLabel: "Renews",
    proFeatures: "Pro features included",
    featExport: "S-104 HDF5 export", featForecast: "10-day forecast",
    featActivity: "Full activity guide", featLuwes: "Luwes overlay",
    upgradeModal: {
      title: "Upgrade to Pro", sub: "Select a billing period to continue",
      cta: "Continue to Mayar.id Checkout", cancel: "Maybe later",
      processing: "Opening checkout…", successTitle: "Pro activated!",
      successSub: "Your Pro plan is now active. Enjoy full access.",
      errorTitle: "Could not start checkout", retry: "Try again",
      demoNote: "You'll complete payment securely on Mayar.id. Your Pro plan activates automatically once payment is confirmed.",
      redirectedTitle: "Complete payment on Mayar.id",
      redirectedSub: "A new tab opened with the Mayar.id checkout page. Once your payment is confirmed, your Pro plan activates automatically — usually within a minute.",
      popupBlockedCta: "Open checkout page",
      checkLater: "I'll check back later", close: "Close",
    },
    notLoggedIn: "Sign in to upgrade your plan",
    planTabFree: "Free", planTabMonthly: "Monthly", planTabAnnual: "Annual",
  },
  id: {
    title: "Pilih paket Anda",
    sub: "Data pasut, cuaca & kelautan akurat untuk Kepulauan Seribu",
    tabPricing: "Paket", tabStatus: "Langganan saya",
    demoBadge: "Pembayaran aman via Mayar.id",
    freeName: "Gratis", monthlyName: "Pro Bulanan", annualName: "Pro Tahunan",
    freeDesc: "Untuk pengunjung sesekali",
    monthlyDesc: "Untuk perencana perjalanan rutin",
    annualDesc: "Paling hemat untuk penggemar",
    freePrice: "Rp 0", monthlyPrice: "Rp 39.000", annualPrice: "Rp 139.000",
    perMonth: "/bln", perYear: "/thn",
    monthly: "Ditagih bulanan", annual: "Ditagih tahunan", save: "Hemat 40%",
    currentPlan: "Paket saat ini", upgrade: "Upgrade",
    features: {
      free: [
        { on: true, label: "Prakiraan pasut 3 hari" },
        { on: true, label: "Grafik pasut dasar" },
        { on: true, label: "Data cuaca saat ini" },
        { on: true, label: "Panduan aktivitas (hari ini)" },
        { on: false, label: "Ekspor S-104 HDF5" },
        { on: false, label: "Prakiraan 10 hari" },
        { on: false, label: "Tabel cuaca per jam" },
        { on: false, label: "Grafik overlay Luwes" },
      ],
      pro: [
        { on: true, label: "Prakiraan pasut 10 hari" },
        { on: true, label: "Grafik pasut interaktif penuh" },
        { on: true, label: "Tabel cuaca per jam" },
        { on: true, label: "Panduan aktivitas penuh (semua tanggal)" },
        { on: true, label: "Ekspor S-104 HDF5 (TPXO + Luwes)" },
        { on: true, label: "Overlay observasi Luwes" },
        { on: true, label: "Akses data prioritas" },
        { on: true, label: "Dukungan prioritas" },
      ],
    },
    planLabel: "Paket", expiresLabel: "Perpanjang",
    proFeatures: "Fitur Pro yang disertakan",
    featExport: "Ekspor S-104 HDF5", featForecast: "Prakiraan 10 hari",
    featActivity: "Panduan aktivitas penuh", featLuwes: "Overlay Luwes",
    upgradeModal: {
      title: "Upgrade ke Pro", sub: "Pilih periode tagihan untuk melanjutkan",
      cta: "Lanjut ke Checkout Mayar.id", cancel: "Mungkin nanti",
      processing: "Membuka checkout…", successTitle: "Pro aktif!",
      successSub: "Paket Pro Anda sekarang aktif. Nikmati akses penuh.",
      errorTitle: "Checkout gagal dimulai", retry: "Coba lagi",
      demoNote: "Pembayaran akan diselesaikan secara aman di Mayar.id. Paket Pro Anda aktif otomatis setelah pembayaran dikonfirmasi.",
      redirectedTitle: "Selesaikan pembayaran di Mayar.id",
      redirectedSub: "Tab baru terbuka dengan halaman checkout Mayar.id. Setelah pembayaran dikonfirmasi, paket Pro Anda akan aktif otomatis — biasanya dalam waktu kurang dari satu menit.",
      popupBlockedCta: "Buka halaman checkout",
      checkLater: "Saya cek nanti", close: "Tutup",
    },
    notLoggedIn: "Masuk untuk upgrade paket",
    planTabFree: "Gratis", planTabMonthly: "Bulanan", planTabAnnual: "Tahunan",
  },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

type DummyPayState = "idle" | "loading" | "redirected" | "success" | "error";
type PlanTab = "free" | "monthly" | "annual";

/* ── FeatureRow ───────────────────────────────────────────────────── */
const FeatureRow: React.FC<{ on: boolean; label: string }> = ({ on, label }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 8, lineHeight: 1.4 }}>
    <div style={{
      width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
      background: on ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${on ? "rgba(74,222,128,0.35)" : M.border2}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {on ? <Check size={9} color={M.green} /> : <Lock size={8} color={M.text3} />}
    </div>
    <span style={{ fontFamily: FONT, fontSize: 12.5, color: on ? M.text2 : M.text3 }}>
      {label}
    </span>
  </div>
);

/* ── PlanCard ─────────────────────────────────────────────────────── */
interface PlanCardProps {
  name: string; desc: string; price: string; period: string;
  subLabel?: string; saveBadge?: string;
  features: { on: boolean; label: string }[];
  isCurrent: boolean; featured?: boolean;
  isCurrentLabel: string; upgradeLabel?: string;
  onUpgrade?: () => void;
  compact?: boolean; // mobile single-column mode
}

const PlanCard: React.FC<PlanCardProps> = ({
  name, desc, price, period, subLabel, saveBadge,
  features, isCurrent, featured,
  isCurrentLabel, upgradeLabel, onUpgrade, compact,
}) => (
  <div style={{
    background: featured ? M.card : M.surface,
    border: featured ? `1.5px solid rgba(245,193,24,0.35)` : `1px solid ${M.border}`,
    borderRadius: 14,
    padding: compact ? "18px 16px" : "20px 18px",
    display: "flex", flexDirection: "column",
    position: "relative",
    boxShadow: featured ? `0 0 32px rgba(245,193,24,0.07)` : "none",
    height: "100%",
  }}>

    {/* POPULAR badge */}
    {featured && !compact && (
      <div style={{
        position: "absolute", top: -1, right: 14,
        background: M.amber, color: M.DARK1,
        fontFamily: FONT, fontSize: 9, fontWeight: 800,
        padding: "3px 10px", borderRadius: "0 0 8px 8px",
        letterSpacing: "0.07em",
      }}>POPULAR</div>
    )}
    {featured && compact && (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "rgba(245,193,24,0.12)", border: "1px solid rgba(245,193,24,0.30)",
        borderRadius: 99, padding: "3px 10px", marginBottom: 10, alignSelf: "flex-start",
        fontFamily: FONT, fontSize: 10, fontWeight: 700, color: M.amber,
      }}>⭐ POPULAR</div>
    )}

    {/* Save badge */}
    {saveBadge && (
      <div style={{
        display: "inline-block", marginBottom: 10, alignSelf: "flex-start",
        background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.25)",
        color: M.green, fontFamily: FONT, fontSize: 10, fontWeight: 700,
        padding: "3px 10px", borderRadius: 99,
      }}>{saveBadge}</div>
    )}

    {/* Name + desc */}
    <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: M.text1, margin: "0 0 3px" }}>{name}</p>
    <p style={{ fontFamily: FONT, fontSize: 11.5, color: M.text3, margin: "0 0 14px" }}>{desc}</p>

    {/* Price */}
    <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 3 }}>
      <span style={{
        fontFamily: MONO, fontSize: compact ? 26 : (price === "Rp 0" ? 22 : 26),
        fontWeight: 800, color: featured ? M.amber : M.text1, letterSpacing: "-0.02em",
      }}>{price}</span>
      {period && <span style={{ fontFamily: FONT, fontSize: 11.5, color: M.text3 }}>{period}</span>}
    </div>
    {subLabel
      ? <p style={{ fontFamily: FONT, fontSize: 10.5, color: M.text3, margin: "0 0 16px" }}>{subLabel}</p>
      : <div style={{ height: 16 }} />
    }

    {/* Features */}
    <div style={{ flex: 1, marginBottom: 16 }}>
      {features.map((f, i) => <FeatureRow key={i} on={f.on} label={f.label} />)}
    </div>

    {/* CTA */}
    {isCurrent ? (
      <div style={{
        textAlign: "center", padding: "9px", borderRadius: 9,
        background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
        fontFamily: FONT, fontSize: 12, fontWeight: 600, color: M.green,
      }}>✓ {isCurrentLabel}</div>
    ) : onUpgrade ? (
      <button
        onClick={onUpgrade}
        style={{
          width: "100%", padding: "11px", borderRadius: 9, border: "none",
          background: featured ? M.amber : M.border2,
          color: featured ? M.DARK1 : M.text2,
          fontFamily: FONT, fontSize: 13, fontWeight: 700,
          cursor: "pointer", transition: "all .18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = featured ? M.amberD : M.border; if (!featured) e.currentTarget.style.color = M.text1; }}
        onMouseLeave={e => { e.currentTarget.style.background = featured ? M.amber : M.border2; if (!featured) e.currentTarget.style.color = M.text2; }}
      >{upgradeLabel} →</button>
    ) : null}
  </div>
);

/* ── MobilePlanTabs — card switcher for narrow screens ────────────── */
const MobilePlanTabs: React.FC<{
  l: typeof COPY["en"]; sub: any; isPro: boolean;
  onUpgrade: (plan: "pro_monthly" | "pro_annual") => void;
}> = ({ l, sub, isPro, onUpgrade }) => {
  const [active, setActive] = useState<PlanTab>("monthly");

  const tabs: { key: PlanTab; label: string }[] = [
    { key: "free", label: l.planTabFree },
    { key: "monthly", label: l.planTabMonthly },
    { key: "annual", label: l.planTabAnnual },
  ];

  const cardProps: Record<PlanTab, PlanCardProps> = {
    free: {
      name: l.freeName, desc: l.freeDesc,
      price: l.freePrice, period: "",
      features: l.features.free,
      isCurrent: sub.plan === "free",
      isCurrentLabel: l.currentPlan,
      compact: true,
    },
    monthly: {
      name: l.monthlyName, desc: l.monthlyDesc,
      price: l.monthlyPrice, period: l.perMonth,
      subLabel: l.monthly, featured: true,
      features: l.features.pro,
      isCurrent: sub.plan === "pro_monthly" && isPro,
      isCurrentLabel: l.currentPlan,
      upgradeLabel: l.upgrade,
      onUpgrade: () => onUpgrade("pro_monthly"),
      compact: true,
    },
    annual: {
      name: l.annualName, desc: l.annualDesc,
      price: l.annualPrice, period: l.perYear,
      subLabel: l.annual, saveBadge: l.save,
      features: l.features.pro,
      isCurrent: sub.plan === "pro_annual" && isPro,
      isCurrentLabel: l.currentPlan,
      upgradeLabel: l.upgrade,
      onUpgrade: () => onUpgrade("pro_annual"),
      compact: true,
    },
  };

  return (
    <div>
      {/* Tab pills */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16,
        background: M.surface, border: `1px solid ${M.border}`,
        borderRadius: 10, padding: 4,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 7, border: "none",
              cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: 600,
              background: active === t.key
                ? (t.key === "free" ? M.border : M.amber)
                : "transparent",
              color: active === t.key
                ? (t.key === "free" ? M.text1 : M.DARK1)
                : M.text3,
              transition: "all .18s",
              whiteSpace: "nowrap",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Active card */}
      <PlanCard {...cardProps[active]} />
    </div>
  );
};

/* ── StatusTab ────────────────────────────────────────────────────── */
const StatusTab: React.FC<{
  sub: any; isPro: boolean; user: any; planName: string;
  language: "en" | "id"; l: typeof COPY["en"];
  onUpgrade: () => void; onRefresh: () => void;
}> = ({ sub, isPro, user, planName, language, l, onUpgrade, onRefresh }) => {
  const initials = user?.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* User card */}
      <div style={{
        background: M.card, border: `1px solid ${M.border}`,
        borderRadius: 12, padding: "16px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, position: "relative", overflow: "hidden",
      }}>
        {isPro && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${M.amber}, #f59e0b)` }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: isPro ? "rgba(245,193,24,0.12)" : M.border,
            border: `2px solid ${isPro ? "rgba(245,193,24,0.35)" : M.border2}`,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />
              : <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: isPro ? M.amber : M.text2 }}>{initials}</span>}
          </div>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: M.text1, margin: 0 }}>{user?.full_name || "Guest"}</p>
            <p style={{ fontFamily: FONT, fontSize: 11, color: M.text3, margin: "2px 0 0" }}>{user?.email || "—"}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: isPro ? "rgba(245,193,24,0.10)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isPro ? "rgba(245,193,24,0.30)" : M.border2}`,
            borderRadius: 99, padding: "4px 12px",
            fontFamily: FONT, fontSize: 11, fontWeight: 700, color: isPro ? M.amber : M.text3,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPro ? M.amber : M.text3 }} />
            {isPro ? (language === "en" ? "Pro active" : "Pro aktif") : planName}
          </div>
          <button
            onClick={onRefresh}
            style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", color: M.text3, padding: 6, borderRadius: 7, display: "flex", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = M.sky; e.currentTarget.style.color = M.sky; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text3; }}
          ><RefreshCw size={12} /></button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(120px,100%), 1fr))",
        gap: 8,
      }}>
        {[
          { label: l.planLabel, value: planName },
          { label: l.expiresLabel, value: fmtDate(sub.expires_at) },
          { label: "Status", value: sub.status },
          { label: language === "en" ? "Member since" : "Bergabung", value: fmtDate(user?.created_at ?? null) },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "10px 12px", background: M.card, border: `1px solid ${M.border}`, borderRadius: 9 }}>
            <p style={{ fontFamily: FONT, fontSize: 9.5, color: M.text3, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: M.text1, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pro features */}
      {isPro && (
        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: M.green, marginBottom: 10 }}>{l.proFeatures}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px,100%), 1fr))", gap: 8 }}>
            {[
              { icon: <Download size={13} />, label: l.featExport },
              { icon: <Calendar size={13} />, label: l.featForecast },
              { icon: <Shield size={13} />, label: l.featActivity },
              { icon: <BarChart2 size={13} />, label: l.featLuwes },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: M.surface, border: "1px solid rgba(74,222,128,0.18)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ color: M.green, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: M.text2 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isPro && (
        <button
          onClick={onUpgrade}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: M.amber, color: M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .18s" }}
          onMouseEnter={e => { e.currentTarget.style.background = M.amberD; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = M.amber; e.currentTarget.style.transform = "none"; }}
        >
          <Zap size={14} fill={M.DARK1} />
          {language === "en" ? "Upgrade to Pro" : "Upgrade ke Pro"}
        </button>
      )}
    </div>
  );
};

/* ── UpgradeModal ─────────────────────────────────────────────────── */
const UpgradeModal: React.FC<{
  language: "en" | "id"; l: typeof COPY["en"];
  selectedPlan: "pro_monthly" | "pro_annual";
  setSelectedPlan: (p: "pro_monthly" | "pro_annual") => void;
  payState: DummyPayState; payError: string | null; user: any;
  pendingCheckoutUrl: string | null;
  onActivate: () => void; onClose: () => void; onDone: () => void;
}> = ({ language, l, selectedPlan, setSelectedPlan, payState, payError, user, pendingCheckoutUrl, onActivate, onClose, onDone }) => {
  const um = l.upgradeModal;
  const plans = [
    { id: "pro_monthly" as const, name: l.monthlyName, price: `${l.monthlyPrice}${l.perMonth}` },
    { id: "pro_annual" as const, name: l.annualName, price: `${l.annualPrice}${l.perYear}`, save: l.save },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(5,12,24,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: M.bg, border: `1px solid ${M.border}`, borderRadius: 16, padding: "clamp(18px,5vw,28px)", width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 24px 60px rgba(0,0,0,0.60)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${M.amber}, #f59e0b)`, borderRadius: "16px 16px 0 0" }} />

        {payState === "success" && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(74,222,128,0.12)", border: "2px solid rgba(74,222,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <CheckCircle size={28} color={M.green} />
            </div>
            <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: M.text1, marginBottom: 8 }}>{um.successTitle}</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: M.text2, marginBottom: 24, lineHeight: 1.6 }}>{um.successSub}</p>
            <button onClick={onDone} style={{ padding: "10px 32px", borderRadius: 9, border: "none", background: M.amber, color: M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {language === "en" ? "Continue" : "Lanjut"}
            </button>
          </div>
        )}

        {payState === "redirected" && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(56,189,248,0.10)", border: "2px solid rgba(56,189,248,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Zap size={26} color={M.sky} />
            </div>
            <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: M.text1, marginBottom: 8 }}>{um.redirectedTitle}</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: M.text2, marginBottom: 22, lineHeight: 1.6 }}>{um.redirectedSub}</p>
            {pendingCheckoutUrl && (
              <a
                href={pendingCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", marginBottom: 14, padding: "10px 24px", borderRadius: 9, background: M.sky, color: M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
              >
                {um.popupBlockedCta}
              </a>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={onDone} style={{ padding: "10px 32px", borderRadius: 9, border: "none", background: M.amber, color: M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {um.checkLater}
              </button>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 12, color: M.text3, padding: 6 }}>
                {um.close}
              </button>
            </div>
          </div>
        )}

        {payState === "error" && (
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: M.text1, marginBottom: 6 }}>{um.errorTitle}</p>
            <p style={{ fontFamily: FONT, fontSize: 12, color: M.red, marginBottom: 20, lineHeight: 1.5 }}>{payError}</p>
            <button onClick={onActivate} style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: M.amber, color: M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{um.retry}</button>
          </div>
        )}

        {(payState === "idle" || payState === "loading") && (
          <>
            {/* Payment notice */}
            <div style={{ background: "rgba(245,193,24,0.07)", border: `1px solid rgba(245,193,24,0.25)`, borderRadius: 9, padding: "9px 12px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Zap size={13} color={M.amber} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: FONT, fontSize: 11.5, color: M.amber, margin: 0, lineHeight: 1.5, opacity: 0.85 }}>{um.demoNote}</p>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: M.text1, margin: 0 }}>{um.title}</h3>
                {!user && <p style={{ fontFamily: FONT, fontSize: 12, color: M.red, margin: "6px 0 0" }}>{l.notLoggedIn}</p>}
              </div>
              <button onClick={onClose} style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", borderRadius: 8, padding: 7, display: "flex", color: M.text2, transition: "all .15s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; e.currentTarget.style.color = M.amber; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}>
                <X size={14} />
              </button>
            </div>

            <p style={{ fontFamily: FONT, fontSize: 13, color: M.text2, marginBottom: 16 }}>{um.sub}</p>

            {/* Plan selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {plans.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: selectedPlan === p.id ? `1.5px solid ${M.amber}` : `1px solid ${M.border2}`, background: selectedPlan === p.id ? "rgba(245,193,24,0.07)" : M.surface, transition: "all .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${selectedPlan === p.id ? M.amber : M.text3}`, background: selectedPlan === p.id ? M.amber : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedPlan === p.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: M.DARK1 }} />}
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: selectedPlan === p.id ? M.amber : M.text1 }}>{p.name}</span>
                    {p.save && <span style={{ background: "rgba(74,222,128,0.10)", color: M.green, border: "1px solid rgba(74,222,128,0.25)", fontFamily: FONT, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>{p.save}</span>}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: selectedPlan === p.id ? M.amber : M.text2, marginLeft: "auto" }}>{p.price}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onActivate}
              disabled={payState === "loading" || !user}
              style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none", background: !user ? M.border : M.amber, color: !user ? M.text3 : M.DARK1, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: !user || payState === "loading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: payState === "loading" ? 0.7 : 1, marginBottom: 10, transition: "all .2s", boxShadow: user && payState !== "loading" ? `0 4px 16px rgba(245,193,24,0.28)` : "none" }}
              onMouseEnter={e => { if (user && payState !== "loading") { e.currentTarget.style.background = M.amberD; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { if (user && payState !== "loading") { e.currentTarget.style.background = M.amber; e.currentTarget.style.transform = "none"; } }}
            >
              {payState === "loading"
                ? <><Loader2 size={14} style={{ animation: "pm-spin .7s linear infinite" }} /> {um.processing}</>
                : <><Zap size={14} fill={M.DARK1} /> {um.cta}</>}
            </button>

            <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 12, color: M.text3, padding: 6, transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = M.text2)}
              onMouseLeave={e => (e.currentTarget.style.color = M.text3)}>
              {um.cancel}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes pm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   PricingModal — main component
══════════════════════════════════════════════════════════════════════ */
interface Props {
  open: boolean; onClose: () => void;
  language?: "en" | "id"; initialTab?: "pricing" | "status";
}

export const PricingModal: React.FC<Props> = ({
  open, onClose, language = "en", initialTab = "pricing",
}) => {
  const l = COPY[language];
  const { sub, isPro, user, refresh } = useSubContext();
  const vw = useWidth();
  const wide = vw >= 680; // threshold: 3-col vs mobile tabs

  const [tab, setTab] = useState<"pricing" | "status">(initialTab);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro_monthly" | "pro_annual">("pro_monthly");
  const [payState, setPayState] = useState<DummyPayState>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setTab(initialTab); setPayState("idle"); setPayError(null); setShowUpgrade(false); setPendingCheckoutUrl(null); }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (showUpgrade) setShowUpgrade(false); else onClose(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, showUpgrade, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleUpgrade = useCallback(async () => {
    if (!user?.email) return;
    setPayState("loading"); setPayError(null); setPendingCheckoutUrl(null);

    // Open the destination tab synchronously, as the very first action in
    // this click handler — before any `await` — so browsers (Safari/iOS in
    // particular) still recognise it as a direct result of the user's click
    // and don't block it as an unsolicited popup. We navigate this
    // already-open tab to the real checkout URL once we have it below.
    // (Deliberately not using "noopener" here: that would make window.open
    // return null, leaving us no reference to navigate later. Instead we
    // null out .opener manually for the same hardening, while it's still
    // same-origin "about:blank".)
    let checkoutTab: Window | null = null;
    try {
      checkoutTab = window.open("", "_blank");
      if (checkoutTab) {
        try { (checkoutTab as any).opener = null; } catch { /* best-effort only */ }
      }
    } catch { /* some browsers/extensions may throw; fall back below */ }

    try {
      const res = await fetch(`${API}/api/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (!data.checkout_url) throw new Error("No checkout URL returned");

      // Navigate the pre-opened tab to Mayar's hosted checkout. Activation
      // happens asynchronously via the Mayar webhook, not from this
      // response — SubscriptionContext refreshes automatically when this
      // tab regains focus.
      if (checkoutTab && !checkoutTab.closed) {
        checkoutTab.location.href = data.checkout_url;
      } else {
        // The pre-opened tab was blocked or closed anyway (rare, but some
        // aggressive ad/popup blockers still catch this) — show a manual
        // link in the modal instead of silently failing.
        setPendingCheckoutUrl(data.checkout_url);
      }
      setPayState("redirected");
    } catch (e: any) {
      checkoutTab?.close();
      setPayState("error"); setPayError(e.message || "Unknown error");
    }
  }, [user?.email, selectedPlan]);

  if (!open) return null;

  const planName =
    sub.plan === "free" ? l.freeName :
      sub.plan === "pro_monthly" ? l.monthlyName :
        l.annualName;

  const openUpgrade = (plan: "pro_monthly" | "pro_annual") => {
    setSelectedPlan(plan); setShowUpgrade(true);
  };

  const modalContent = (
    <>
      <style>{`
        .pm-tab-row::-webkit-scrollbar { display: none; }
        @keyframes pm-spin    { to { transform: rotate(360deg); } }
        @keyframes pm-fadein  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5,12,24,0.80)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: wide ? 16 : 0,          // edge-to-edge on narrow
        }}
      >
        {/* ── Modal sheet ── */}
        <div style={{
          background: M.bg, border: wide ? `1px solid ${M.border}` : "none",
          borderRadius: wide ? 18 : 0,
          width: "100%",
          maxWidth: wide ? 860 : "100vw",
          /* Full height on mobile, capped on desktop */
          height: wide ? "auto" : "100%",
          maxHeight: wide ? "92vh" : "100%",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: wide ? "0 40px 100px rgba(0,0,0,0.70)" : "none",
          animation: "pm-fadein 0.22s ease",
        }}>

          {/* ── HEADER ── */}
          <div style={{
            background: `linear-gradient(135deg, rgba(245,193,24,0.10) 0%, rgba(56,189,248,0.06) 100%)`,
            borderBottom: `1px solid ${M.border}`,
            padding: wide ? "20px 24px 0" : "16px 18px 0",
            flexShrink: 0, position: "relative",
          }}>

            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
                {/* Logo */}
                <img
                  src="/logo.svg" alt="Searibu"
                  style={{ height: 22, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.9, flexShrink: 0 }}
                />
                <h2 style={{ fontFamily: FONT, fontSize: wide ? 18 : 16, fontWeight: 700, color: M.text1, margin: 0, lineHeight: 1.2 }}>
                  {l.title}
                </h2>
                {/* Payment provider badge */}
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 9px", borderRadius: 99,
                  background: "rgba(245,193,24,0.10)", border: "1px solid rgba(245,193,24,0.30)",
                  fontFamily: FONT, fontSize: 10, fontWeight: 700, color: M.amber,
                  flexShrink: 0, whiteSpace: "nowrap",
                }}>{l.demoBadge}</span>
              </div>
              {/* Close button */}
              <button
                onClick={onClose}
                style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", borderRadius: 9, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", color: M.text2, flexShrink: 0, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; e.currentTarget.style.color = M.amber; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}
              ><X size={15} /></button>
            </div>

            {/* Subtitle */}
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: M.text2, margin: "0 0 14px", lineHeight: 1.45 }}>
              {l.sub}
            </p>

            {/* Tabs */}
            <div className="pm-tab-row" style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              {(["pricing", "status"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: `8px ${wide ? "20px" : "14px"}`,
                  border: "none", cursor: "pointer",
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  background: tab === t ? M.surface : "transparent",
                  color: tab === t ? M.amber : M.text2,
                  borderBottom: tab === t ? `2px solid ${M.amber}` : "2px solid transparent",
                  transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {t === "pricing" ? l.tabPricing : l.tabStatus}
                </button>
              ))}
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: wide ? "24px" : "18px 16px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            scrollbarColor: `${M.border2} transparent`,
          }}>

            {/* PRICING TAB */}
            {tab === "pricing" && (
              <div>
                {wide ? (
                  /* ── Desktop: 3-column grid ── */
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
                    <PlanCard
                      name={l.freeName} desc={l.freeDesc} price={l.freePrice} period=""
                      features={l.features.free}
                      isCurrent={sub.plan === "free"} isCurrentLabel={l.currentPlan}
                    />
                    <PlanCard
                      name={l.monthlyName} desc={l.monthlyDesc} price={l.monthlyPrice} period={l.perMonth}
                      subLabel={l.monthly} featured
                      features={l.features.pro}
                      isCurrent={sub.plan === "pro_monthly" && isPro} isCurrentLabel={l.currentPlan}
                      upgradeLabel={l.upgrade} onUpgrade={() => openUpgrade("pro_monthly")}
                    />
                    <PlanCard
                      name={l.annualName} desc={l.annualDesc} price={l.annualPrice} period={l.perYear}
                      subLabel={l.annual} saveBadge={l.save}
                      features={l.features.pro}
                      isCurrent={sub.plan === "pro_annual" && isPro} isCurrentLabel={l.currentPlan}
                      upgradeLabel={l.upgrade} onUpgrade={() => openUpgrade("pro_annual")}
                    />
                  </div>
                ) : (
                  /* ── Mobile: tab switcher ── */
                  <MobilePlanTabs l={l} sub={sub} isPro={isPro} onUpgrade={openUpgrade} />
                )}

                {/* Pro feature pills (desktop only, non-Pro) */}
                {wide && !isPro && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: M.text3, marginBottom: 10 }}>
                      {l.proFeatures}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                      {[
                        { icon: <Download size={13} />, label: l.featExport },
                        { icon: <Calendar size={13} />, label: l.featForecast },
                        { icon: <Shield size={13} />, label: l.featActivity },
                        { icon: <BarChart2 size={13} />, label: l.featLuwes },
                      ].map(({ icon, label }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 9, background: M.surface, border: `1px solid ${M.border}` }}>
                          <div style={{ color: M.amber, flexShrink: 0 }}>{icon}</div>
                          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: M.text2 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STATUS TAB */}
            {tab === "status" && (
              <StatusTab
                sub={sub} isPro={isPro} user={user}
                planName={planName} language={language} l={l}
                onUpgrade={() => setTab("pricing")}
                onRefresh={refresh}
              />
            )}
          </div>
        </div>
      </div>

      {/* UpgradeModal */}
      {showUpgrade && (
        <UpgradeModal
          language={language} l={l}
          selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
          payState={payState} payError={payError} user={user}
          pendingCheckoutUrl={pendingCheckoutUrl}
          onActivate={handleUpgrade}
          onClose={() => { setShowUpgrade(false); setPayState("idle"); setPayError(null); setPendingCheckoutUrl(null); }}
          onDone={() => { setShowUpgrade(false); setTab("status"); }}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default PricingModal;