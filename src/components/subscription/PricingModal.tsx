/**
 * PricingModal.tsx
 * Full-screen pricing page / modal.
 * - 3 plan cards (Free / Pro Monthly / Pro Annual)
 * - Upgrade modal with Midtrans Snap payment
 * - Subscription status card
 * - POST /api/create-payment  → Midtrans Snap
 * - GET  /api/subscription    → refresh after payment
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  X, Check, Lock, Zap, Download, BarChart2,
  Calendar, Shield, RefreshCw, AlertCircle, Loader2,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { useMidtrans } from "../../hooks/useMidtrans";

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const NAVY = "#0c4a6e";
const PRIMARY = "#0369a1";
const SKY = "#0ea5e9";
const TEAL = "#0d9488";

/* ─── copy ────────────────────────────────────────────────── */
const COPY = {
  en: {
    title: "Choose your plan",
    sub: "Get accurate tidal, weather, and marine data for Kepulauan Seribu",
    monthly: "Billed monthly",
    annual: "Billed annually",
    save: "Save 40%",
    currentPlan: "Current plan",
    upgrade: "Upgrade",
    freeName: "Free",
    monthlyName: "Pro Monthly",
    annualName: "Pro Annual",
    freeDesc: "For occasional visitors",
    monthlyDesc: "For regular trip planners",
    annualDesc: "Best value for enthusiasts",
    freePrice: "Rp 0",
    monthlyPrice: "Rp 39.000",
    annualPrice: "Rp 139.000",
    perMonth: "/mo",
    perYear: "/yr",
    features: {
      free: [
        { on: true,  label: "3-day tidal forecast" },
        { on: true,  label: "Basic tidal chart" },
        { on: true,  label: "Current weather data" },
        { on: true,  label: "Activity guide (today)" },
        { on: false, label: "S-104 HDF5 export" },
        { on: false, label: "14-day extended forecast" },
        { on: false, label: "Hourly weather table" },
        { on: false, label: "Luwes overlay chart" },
      ],
      pro: [
        { on: true, label: "14-day tidal forecast" },
        { on: true, label: "Full interactive tidal chart" },
        { on: true, label: "Hourly weather table" },
        { on: true, label: "Full activity guide (all dates)" },
        { on: true, label: "S-104 HDF5 export (TPXO + Luwes)" },
        { on: true, label: "Luwes observation overlay" },
        { on: true, label: "Priority data access" },
        { on: true, label: "Priority support" },
      ],
    },
    statusTitle: "Your subscription",
    planLabel: "Plan",
    expiresLabel: "Renews",
    manageBilling: "Manage billing",
    proFeatures: "Pro features included",
    featExport: "S-104 HDF5 export",
    featForecast: "14-day forecast",
    featActivity: "Full activity guide",
    featLuwes: "Luwes overlay",
    upgradeModal: {
      title: "Upgrade to Pro",
      sub: "Select a billing period to continue",
      cta: "Pay with Midtrans",
      cancel: "Maybe later",
      processing: "Processing…",
      successTitle: "Payment successful!",
      successSub: "Your Pro plan is now active.",
      pendingTitle: "Payment pending",
      pendingSub: "We'll activate your plan once payment is confirmed.",
      errorTitle: "Payment failed",
      retry: "Try again",
    },
    notLoggedIn: "Sign in to upgrade your plan",
  },
  id: {
    title: "Pilih paket Anda",
    sub: "Dapatkan data pasut, cuaca, dan kelautan akurat untuk Kepulauan Seribu",
    monthly: "Ditagih bulanan",
    annual: "Ditagih tahunan",
    save: "Hemat 40%",
    currentPlan: "Paket saat ini",
    upgrade: "Upgrade",
    freeName: "Gratis",
    monthlyName: "Pro Bulanan",
    annualName: "Pro Tahunan",
    freeDesc: "Untuk pengunjung sesekali",
    monthlyDesc: "Untuk perencana perjalanan rutin",
    annualDesc: "Paling hemat untuk penggemar",
    freePrice: "Rp 0",
    monthlyPrice: "Rp 39.000",
    annualPrice: "Rp 139.000",
    perMonth: "/bln",
    perYear: "/thn",
    features: {
      free: [
        { on: true,  label: "Prakiraan pasut 3 hari" },
        { on: true,  label: "Grafik pasut dasar" },
        { on: true,  label: "Data cuaca saat ini" },
        { on: true,  label: "Panduan aktivitas (hari ini)" },
        { on: false, label: "Ekspor S-104 HDF5" },
        { on: false, label: "Prakiraan 14 hari" },
        { on: false, label: "Tabel cuaca per jam" },
        { on: false, label: "Grafik overlay Luwes" },
      ],
      pro: [
        { on: true, label: "Prakiraan pasut 14 hari" },
        { on: true, label: "Grafik pasut interaktif penuh" },
        { on: true, label: "Tabel cuaca per jam" },
        { on: true, label: "Panduan aktivitas penuh (semua tanggal)" },
        { on: true, label: "Ekspor S-104 HDF5 (TPXO + Luwes)" },
        { on: true, label: "Overlay observasi Luwes" },
        { on: true, label: "Akses data prioritas" },
        { on: true, label: "Dukungan prioritas" },
      ],
    },
    statusTitle: "Langganan Anda",
    planLabel: "Paket",
    expiresLabel: "Perpanjang",
    manageBilling: "Kelola tagihan",
    proFeatures: "Fitur Pro yang disertakan",
    featExport: "Ekspor S-104 HDF5",
    featForecast: "Prakiraan 14 hari",
    featActivity: "Panduan aktivitas penuh",
    featLuwes: "Overlay Luwes",
    upgradeModal: {
      title: "Upgrade ke Pro",
      sub: "Pilih periode tagihan untuk melanjutkan",
      cta: "Bayar dengan Midtrans",
      cancel: "Mungkin nanti",
      processing: "Memproses…",
      successTitle: "Pembayaran berhasil!",
      successSub: "Paket Pro Anda sekarang aktif.",
      pendingTitle: "Pembayaran tertunda",
      pendingSub: "Kami akan mengaktifkan paket Anda setelah pembayaran dikonfirmasi.",
      errorTitle: "Pembayaran gagal",
      retry: "Coba lagi",
    },
    notLoggedIn: "Masuk untuk upgrade paket",
  },
};

/* ─── helpers ─────────────────────────────────────────────── */
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
};

/* ─── small reusable components ───────────────────────────── */
const FeatureRow: React.FC<{ on: boolean; label: string }> = ({ on, label }) => (
  <div
    style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      fontFamily: SANS, fontSize: 13, color: on ? "#374151" : "#94a3b8",
      marginBottom: 7, lineHeight: 1.4,
    }}
  >
    <div
      style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        background: on ? "#dcfce7" : "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {on
        ? <Check size={9} color="#16a34a" />
        : <Lock size={9} color="#cbd5e1" />}
    </div>
    {label}
  </div>
);

type ModalPayState = "idle" | "loading" | "success" | "pending" | "error";

/* ═══════════════════════════════════════════════════════════
   PricingModal
═══════════════════════════════════════════════════════════ */
interface Props {
  open: boolean;
  onClose: () => void;
  language?: "en" | "id";
  initialTab?: "pricing" | "status";
}

export const PricingModal: React.FC<Props> = ({
  open,
  onClose,
  language = "en",
  initialTab = "pricing",
}) => {
  const l = COPY[language];
  const { sub, isPro, user, refresh } = useSubContext();
  const { openPayment } = useMidtrans();

  const [tab, setTab] = useState<"pricing" | "status">(initialTab);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro_monthly" | "pro_annual">("pro_monthly");
  const [payState, setPayState] = useState<ModalPayState>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // reset on open
  useEffect(() => {
    if (open) { setTab(initialTab); setPayState("idle"); setPayError(null); setShowUpgrade(false); }
  }, [open, initialTab]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { if (showUpgrade) setShowUpgrade(false); else onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, showUpgrade, onClose]);

  const handleUpgrade = useCallback(async () => {
    if (!user?.email) return;
    setPayState("loading");
    setPayError(null);
    try {
      await openPayment(selectedPlan, user.email, {
        onSuccess: async () => {
          setPayState("success");
          await refresh();
        },
        onPending: () => setPayState("pending"),
        onError: (r) => {
          setPayState("error");
          setPayError(r?.status_message || "Payment error");
        },
        onClose: () => {
          if (payState === "loading") setPayState("idle");
        },
      });
    } catch (e: any) {
      setPayState("error");
      setPayError(e.message || "Unknown error");
    }
  }, [user?.email, selectedPlan, openPayment, refresh, payState]);

  if (!open) return null;

  const planName =
    sub.plan === "free" ? l.freeName :
    sub.plan === "pro_monthly" ? l.monthlyName : l.annualName;

  /* ── styles ─────────────────────────────────────────────── */
  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(2,78,120,0.40)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  };
  const sheet: React.CSSProperties = {
    background: "#fff", borderRadius: 16, width: "100%", maxWidth: 760,
    maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 24px 64px rgba(2,78,120,0.22)",
  };

  return (
    <div
      ref={overlayRef}
      style={overlay}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div style={sheet}>
        {/* ── header ─────────────────────────────────────── */}
        <div
          style={{
            background: `linear-gradient(135deg,${NAVY} 0%,${PRIMARY} 60%,${SKY} 100%)`,
            padding: "20px 24px 0", flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                {l.title}
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "4px 0 0" }}>
                {l.sub}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                borderRadius: 8, padding: 7, display: "flex", color: "#fff",
              }}
            >
              <X size={15} />
            </button>
          </div>
          {/* tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {(["pricing", "status"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "7px 18px", border: "none", cursor: "pointer",
                  fontFamily: SANS, fontSize: 13, fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? PRIMARY : "rgba(255,255,255,0.65)",
                  transition: "all .15s",
                }}
              >
                {t === "pricing"
                  ? (language === "en" ? "Plans" : "Paket")
                  : (language === "en" ? "My subscription" : "Langganan saya")}
              </button>
            ))}
          </div>
        </div>

        {/* ── body ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", WebkitOverflowScrolling: "touch" }}>

          {/* ════ PRICING TAB ══════════════════════════════ */}
          {tab === "pricing" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                  gap: 14,
                }}
              >
                {/* Free */}
                <PlanCard
                  name={l.freeName}
                  desc={l.freeDesc}
                  price={l.freePrice}
                  period=""
                  features={l.features.free}
                  isCurrent={sub.plan === "free"}
                  isCurrentLabel={l.currentPlan}
                  language={language}
                />

                {/* Pro Monthly */}
                <PlanCard
                  name={l.monthlyName}
                  desc={l.monthlyDesc}
                  price={l.monthlyPrice}
                  period={l.perMonth}
                  subLabel={l.monthly}
                  features={l.features.pro}
                  isCurrent={sub.plan === "pro_monthly" && isPro}
                  featured
                  isCurrentLabel={l.currentPlan}
                  upgradeLabel={l.upgrade}
                  onUpgrade={() => { setSelectedPlan("pro_monthly"); setShowUpgrade(true); }}
                  language={language}
                />

                {/* Pro Annual */}
                <PlanCard
                  name={l.annualName}
                  desc={l.annualDesc}
                  price={l.annualPrice}
                  period={l.perYear}
                  subLabel={l.annual}
                  saveBadge={l.save}
                  features={l.features.pro}
                  isCurrent={sub.plan === "pro_annual" && isPro}
                  isCurrentLabel={l.currentPlan}
                  upgradeLabel={l.upgrade}
                  onUpgrade={() => { setSelectedPlan("pro_annual"); setShowUpgrade(true); }}
                  language={language}
                />
              </div>

              {/* Pro features grid */}
              {!isPro && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>
                    {l.proFeatures}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
                    {[
                      { icon: <Download size={14} />, title: l.featExport },
                      { icon: <Calendar size={14} />, title: l.featForecast },
                      { icon: <Shield size={14} />, title: l.featActivity },
                      { icon: <BarChart2 size={14} />, title: l.featLuwes },
                    ].map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "center", gap: 9,
                          padding: "10px 13px", borderRadius: 9,
                          background: "#f0f9ff", border: "1px solid #bae6fd",
                        }}
                      >
                        <div style={{ color: PRIMARY, flexShrink: 0 }}>{f.icon}</div>
                        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "#075985" }}>{f.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ STATUS TAB ═══════════════════════════════ */}
          {tab === "status" && (
            <StatusTab
              sub={sub}
              isPro={isPro}
              user={user}
              planName={planName}
              language={language}
              l={l}
              fmtDate={fmtDate}
              onUpgrade={() => { setTab("pricing"); }}
              onRefresh={refresh}
            />
          )}
        </div>
      </div>

      {/* ── upgrade inner modal ──────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          language={language}
          l={l}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          payState={payState}
          payError={payError}
          user={user}
          onPay={handleUpgrade}
          onClose={() => { setShowUpgrade(false); setPayState("idle"); setPayError(null); }}
          onDone={() => { setShowUpgrade(false); setTab("status"); }}
        />
      )}
    </div>
  );
};

/* ── PlanCard ──────────────────────────────────────────────── */
interface PlanCardProps {
  name: string; desc: string; price: string; period: string;
  subLabel?: string; saveBadge?: string;
  features: { on: boolean; label: string }[];
  isCurrent: boolean; featured?: boolean;
  isCurrentLabel: string; upgradeLabel?: string;
  onUpgrade?: () => void; language?: "en" | "id";
}

const PlanCard: React.FC<PlanCardProps> = ({
  name, desc, price, period, subLabel, saveBadge,
  features, isCurrent, featured, isCurrentLabel,
  upgradeLabel, onUpgrade,
}) => (
  <div
    style={{
      background: "#fff",
      border: featured ? `2px solid ${PRIMARY}` : "1px solid #e2e8f0",
      borderRadius: 12, padding: "18px 16px",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}
  >
    {featured && (
      <div
        style={{
          position: "absolute", top: -1, right: 14,
          background: PRIMARY, color: "#fff",
          fontFamily: SANS, fontSize: 10, fontWeight: 700,
          padding: "3px 10px", borderRadius: "0 0 8px 8px",
          letterSpacing: "0.04em",
        }}
      >
        POPULAR
      </div>
    )}
    {saveBadge && (
      <div
        style={{
          display: "inline-block", marginBottom: 8,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          color: "#15803d", fontFamily: SANS,
          fontSize: 10, fontWeight: 700, padding: "3px 10px",
          borderRadius: 99,
        }}
      >
        {saveBadge}
      </div>
    )}

    <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>
      {name}
    </div>
    <div style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>{desc}</div>

    <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
      <span style={{ fontFamily: SANS, fontSize: price === "Rp 0" ? 18 : 22, fontWeight: 700, color: "#0f172a" }}>
        {price}
      </span>
      {period && (
        <span style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8" }}>{period}</span>
      )}
    </div>
    {subLabel && (
      <div style={{ fontFamily: SANS, fontSize: 10, color: "#cbd5e1", marginBottom: 14 }}>{subLabel}</div>
    )}

    <div style={{ flex: 1, marginTop: subLabel ? 0 : 14, marginBottom: 14 }}>
      {features.map((f, i) => <FeatureRow key={i} on={f.on} label={f.label} />)}
    </div>

    {isCurrent ? (
      <div
        style={{
          textAlign: "center", padding: "8px", borderRadius: 8,
          background: "#f0f9ff", border: "1px solid #bae6fd",
          fontFamily: SANS, fontSize: 12, fontWeight: 600, color: PRIMARY,
        }}
      >
        ✓ {isCurrentLabel}
      </div>
    ) : onUpgrade ? (
      <button
        onClick={onUpgrade}
        style={{
          width: "100%", padding: "9px", borderRadius: 8, border: "none",
          background: featured ? PRIMARY : "#f8fafc",
          color: featured ? "#fff" : "#374151",
          fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "opacity .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {upgradeLabel} →
      </button>
    ) : null}
  </div>
);

/* ── StatusTab ──────────────────────────────────────────────── */
const PRO_FEAT_ICONS: Record<string, React.ReactNode> = {
  s104: <Download size={13} />,
  forecast: <Calendar size={13} />,
  activity: <Shield size={13} />,
  luwes: <BarChart2 size={13} />,
};

const StatusTab: React.FC<{
  sub: any; isPro: boolean; user: any; planName: string;
  language: "en" | "id"; l: any; fmtDate: (s: string | null) => string;
  onUpgrade: () => void; onRefresh: () => void;
}> = ({ sub, isPro, user, planName, language, l, fmtDate, onUpgrade, onRefresh }) => {
  const initials = user
    ? user.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* user + plan header */}
      <div
        style={{
          background: isPro
            ? `linear-gradient(135deg,${NAVY},${PRIMARY})`
            : "#f8fafc",
          border: isPro ? "none" : "1px solid #e2e8f0",
          borderRadius: 12, padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: "50%",
              background: isPro ? "rgba(255,255,255,0.18)" : "#e0f2fe",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SANS, fontSize: 14, fontWeight: 700,
              color: isPro ? "#fff" : PRIMARY, flexShrink: 0,
            }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
              : initials}
          </div>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: isPro ? "#fff" : "#0f172a" }}>
              {user?.full_name || "Guest"}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: isPro ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>
              {user?.email || "—"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: isPro ? "rgba(255,255,255,0.18)" : "#fff",
              border: isPro ? "1px solid rgba(255,255,255,0.25)" : "1px solid #e2e8f0",
              borderRadius: 99, padding: "4px 12px",
              fontFamily: SANS, fontSize: 11, fontWeight: 700,
              color: isPro ? "#fff" : "#64748b",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPro ? "#4ade80" : "#94a3b8" }} />
            {isPro ? (language === "en" ? "Pro active" : "Pro aktif") : planName}
          </div>
          <button
            onClick={onRefresh}
            title="Refresh"
            style={{ background: "none", border: "none", cursor: "pointer", color: isPro ? "rgba(255,255,255,0.6)" : "#94a3b8", padding: 4 }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* plan details */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: l.planLabel, value: planName },
            { label: l.expiresLabel, value: fmtDate(sub.expires_at) },
            { label: language === "en" ? "Status" : "Status", value: sub.status },
            { label: language === "en" ? "Member since" : "Bergabung", value: fmtDate(user?.created_at ?? null) },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontFamily: SANS, fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* pro feature badges */}
      {isPro && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#15803d", marginBottom: 10 }}>
            {l.proFeatures}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
            {[
              { key: "s104", label: l.featExport },
              { key: "forecast", label: l.featForecast },
              { key: "activity", label: l.featActivity },
              { key: "luwes", label: l.featLuwes },
            ].map(({ key, label }) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "#fff", border: "1px solid #bbf7d0",
                  borderRadius: 8, padding: "8px 10px",
                }}
              >
                <div style={{ color: "#16a34a", flexShrink: 0 }}>{PRO_FEAT_ICONS[key]}</div>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "#166534" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* upgrade CTA for free users */}
      {!isPro && (
        <button
          onClick={onUpgrade}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "11px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg,${NAVY},${PRIMARY})`,
            color: "#fff", fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Zap size={14} />
          {language === "en" ? "Upgrade to Pro" : "Upgrade ke Pro"}
        </button>
      )}
    </div>
  );
};

/* ── UpgradeModal ───────────────────────────────────────────── */
const UpgradeModal: React.FC<{
  language: "en" | "id"; l: any;
  selectedPlan: "pro_monthly" | "pro_annual";
  setSelectedPlan: (p: "pro_monthly" | "pro_annual") => void;
  payState: ModalPayState; payError: string | null;
  user: any;
  onPay: () => void; onClose: () => void; onDone: () => void;
}> = ({ language, l, selectedPlan, setSelectedPlan, payState, payError, user, onPay, onClose, onDone }) => {
  const um = l.upgradeModal;
  const plans = [
    { id: "pro_monthly" as const, name: l.monthlyName, price: `${l.monthlyPrice}${l.perMonth}` },
    { id: "pro_annual"  as const, name: l.annualName,  price: `${l.annualPrice}${l.perYear}`, save: l.save },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(2,78,120,0.45)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14, padding: "24px",
          width: "100%", maxWidth: 380,
          boxShadow: "0 20px 60px rgba(2,78,120,0.22)",
        }}
      >
        {/* success */}
        {payState === "success" && (
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Check size={24} color="#16a34a" />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{um.successTitle}</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#64748b", marginBottom: 20 }}>{um.successSub}</p>
            <button onClick={onDone} style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {language === "en" ? "Continue" : "Lanjut"}
            </button>
          </div>
        )}

        {/* pending */}
        {payState === "pending" && (
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <RefreshCw size={22} color="#d97706" />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{um.pendingTitle}</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#64748b", marginBottom: 20 }}>{um.pendingSub}</p>
            <button onClick={onClose} style={{ padding: "9px 28px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", fontFamily: SANS, fontSize: 13, cursor: "pointer" }}>
              {language === "en" ? "Close" : "Tutup"}
            </button>
          </div>
        )}

        {/* error */}
        {payState === "error" && (
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertCircle size={22} color="#dc2626" />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{um.errorTitle}</p>
            <p style={{ fontFamily: SANS, fontSize: 12, color: "#dc2626", marginBottom: 20, lineHeight: 1.5 }}>{payError}</p>
            <button onClick={onPay} style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {um.retry}
            </button>
          </div>
        )}

        {/* idle / loading */}
        {(payState === "idle" || payState === "loading") && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: SANS, fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>{um.title}</h3>
                {!user && (
                  <p style={{ fontFamily: SANS, fontSize: 12, color: "#f87171", margin: "6px 0 0" }}>{l.notLoggedIn}</p>
                )}
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                <X size={15} />
              </button>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#64748b", marginBottom: 16 }}>{um.sub}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 9, cursor: "pointer",
                    border: selectedPlan === p.id ? `2px solid ${PRIMARY}` : "1px solid #e2e8f0",
                    background: selectedPlan === p.id ? "#eff8ff" : "#fff",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${selectedPlan === p.id ? PRIMARY : "#cbd5e1"}`,
                        background: selectedPlan === p.id ? PRIMARY : "transparent",
                      }}
                    />
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: selectedPlan === p.id ? PRIMARY : "#0f172a" }}>
                      {p.name}
                    </span>
                    {p.save && (
                      <span style={{ background: "#dcfce7", color: "#15803d", fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>
                        {p.save}
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: selectedPlan === p.id ? PRIMARY : "#64748b" }}>
                    {p.price}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onPay}
              disabled={payState === "loading" || !user}
              style={{
                width: "100%", padding: "11px", borderRadius: 9, border: "none",
                background: !user ? "#e2e8f0" : `linear-gradient(135deg,${NAVY},${PRIMARY})`,
                color: !user ? "#94a3b8" : "#fff",
                fontFamily: SANS, fontSize: 13, fontWeight: 700,
                cursor: !user || payState === "loading" ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: payState === "loading" ? 0.7 : 1, marginBottom: 10,
              }}
            >
              {payState === "loading"
                ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> {um.processing}</>
                : um.cta}
            </button>
            <button
              onClick={onClose}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 12, color: "#94a3b8", padding: 6 }}
            >
              {um.cancel}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default PricingModal;