/**
 * AdminPanel.tsx — redesign konsisten dengan tema dark nautical Searibu.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Users, CreditCard, TrendingUp, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, ShieldCheck,
  FlaskConical, User, Waves,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";

const API  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FONT = "'Inter', system-ui, sans-serif";
const MONO = "'Inter', monospace";

const M = {
  bg:      "#0f1824",
  surface: "#162030",
  card:    "#1a2840",
  border:  "#1e3044",
  border2: "#243548",
  amber:   "#f5c518",
  amberD:  "#d4a814",
  sky:     "#0ea5e9",
  text1:   "#f0f6ff",
  text2:   "#8ba3be",
  text3:   "#4a6580",
  green:   "#4ade80",
  greenD:  "#16a34a",
  red:     "#f87171",
  DARK1:   "#0f1824",
};

interface Stats {
  users: { total: number; by_role: Record<string, number>; admins: number; new_30d: number };
  subscriptions: { pro_active: number };
  payments: { total_settled: number; total_revenue_idr: number };
}

interface Payment {
  order_id: string; email: string; full_name: string;
  plan: string; amount_idr: number; status: string;
  payment_type: string | null; created_at: string | null; settled_at: string | null;
}

interface Props { open: boolean; onClose: () => void; language: "en" | "id" }

const PLAN_LABEL: Record<string, string> = {
  pro_monthly: "Pro Monthly", pro_annual: "Pro Annual", free: "Free",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  settlement: { bg: "rgba(74,222,128,0.10)", color: M.green },
  pending:    { bg: "rgba(245,193,24,0.10)", color: M.amber },
  cancel:     { bg: "rgba(248,113,113,0.10)", color: M.red },
  expire:     { bg: "rgba(248,113,113,0.10)", color: M.red },
  deny:       { bg: "rgba(248,113,113,0.10)", color: M.red },
  failure:    { bg: "rgba(248,113,113,0.10)", color: M.red },
};

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const LIMIT = 10;

export const AdminPanel: React.FC<Props> = ({ open, onClose, language }) => {
  const { user } = useSubContext();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [tab,          setTab]          = useState<"stats" | "payments">("stats");
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [totalPay,     setTotalPay]     = useState(0);
  const [offset,       setOffset]       = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPay,   setLoadingPay]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const email = user?.email ?? "";

  const fetchStats = useCallback(async () => {
    if (!email) return;
    setLoadingStats(true); setError(null);
    try {
      const res = await fetch(`${API}/api/admin/stats?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setStats(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoadingStats(false); }
  }, [email]);

  const fetchPayments = useCallback(async (off: number) => {
    if (!email) return;
    setLoadingPay(true); setError(null);
    try {
      const res = await fetch(`${API}/api/admin/payments?email=${encodeURIComponent(email)}&limit=${LIMIT}&offset=${off}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setPayments(data.payments); setTotalPay(data.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingPay(false); }
  }, [email]);

  useEffect(() => {
    if (open) { setTab("stats"); setOffset(0); fetchStats(); }
  }, [open, fetchStats]);

  useEffect(() => {
    if (open && tab === "payments") fetchPayments(offset);
  }, [open, tab, offset, fetchPayments]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const C = {
    en: {
      title: "Admin Panel", tabs: ["Overview", "Payments"],
      totalUsers: "Total Users", general: "General", researcher: "Researcher",
      admins: "Admins", new30d: "New (30d)", proActive: "Pro Active",
      totalPay: "Settled", revenue: "Revenue",
      noData: "No data", loading: "Loading...", refresh: "Refresh",
      prev: "Prev", next: "Next",
      colOrder: "Order", colUser: "User", colPlan: "Plan",
      colAmount: "Amount", colStatus: "Status", colDate: "Date",
    },
    id: {
      title: "Panel Admin", tabs: ["Ringkasan", "Pembayaran"],
      totalUsers: "Total Pengguna", general: "Umum", researcher: "Peneliti",
      admins: "Admin", new30d: "Baru (30h)", proActive: "Pro Aktif",
      totalPay: "Lunas", revenue: "Pendapatan",
      noData: "Tidak ada data", loading: "Memuat...", refresh: "Perbarui",
      prev: "Sebelum", next: "Berikut",
      colOrder: "Order", colUser: "Pengguna", colPlan: "Paket",
      colAmount: "Jumlah", colStatus: "Status", colDate: "Tanggal",
    },
  }[language];

  const totalPages  = Math.ceil(totalPay / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const Spinner = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: M.text2 }}>
      <Loader2 size={16} style={{ animation: "spin .7s linear infinite", color: M.amber }} />
      <span style={{ fontFamily: FONT, fontSize: 13 }}>{C.loading}</span>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(5,12,24,0.80)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 800, padding: 16,
      }}
    >
      <div style={{
        background: M.bg, border: `1px solid ${M.border}`,
        borderRadius: 18, width: "100%", maxWidth: 700,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 40px 100px rgba(0,0,0,0.70)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Amber top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${M.amber}, #f59e0b)`, zIndex: 2 }} />

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, rgba(245,193,24,0.10) 0%, rgba(14,165,233,0.06) 100%)`,
          borderBottom: `1px solid ${M.border}`,
          padding: "22px 22px 0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245,193,24,0.12)", border: `1px solid rgba(245,193,24,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={17} color={M.amber} />
              </div>
              <div>
                <h2 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: M.text1, margin: 0, letterSpacing: "-0.01em" }}>{C.title}</h2>
                <p style={{ fontFamily: FONT, fontSize: 11, color: M.text2, margin: 0 }}>{user?.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => { fetchStats(); if (tab === "payments") fetchPayments(offset); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: M.text2, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; (e.currentTarget as HTMLElement).style.color = M.amber; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; (e.currentTarget as HTMLElement).style.color = M.text2; }}
              >
                <RefreshCw size={11} /> {C.refresh}
              </button>
              <button
                onClick={onClose}
                style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", borderRadius: 8, padding: 7, display: "flex", color: M.text2, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; e.currentTarget.style.color = M.amber; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {(["stats", "payments"] as const).map((t, i) => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === "payments" && payments.length === 0) fetchPayments(0); }}
                style={{
                  padding: "8px 18px", border: "none", cursor: "pointer",
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  background: tab === t ? M.surface : "transparent",
                  color: tab === t ? M.amber : M.text2,
                  borderBottom: tab === t ? `2px solid ${M.amber}` : "2px solid transparent",
                  transition: "all .15s",
                }}
              >{C.tabs[i]}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: `${M.border2} transparent` }}>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 16 }}>
              <p style={{ fontFamily: FONT, fontSize: 12, color: M.red, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* ── STATS ── */}
          {tab === "stats" && (
            loadingStats ? <Spinner /> :
            stats ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* User cards */}
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: M.text3, marginBottom: 10 }}>{C.totalUsers}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                    {[
                      { label: C.totalUsers, value: stats.users.total, icon: <Users size={14}/>, color: M.sky, accent: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.2)" },
                      { label: C.new30d,     value: stats.users.new_30d, icon: <TrendingUp size={14}/>, color: M.green, accent: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
                      { label: C.general,    value: stats.users.by_role["general"] ?? 0, icon: <User size={14}/>, color: M.text2, accent: "rgba(255,255,255,0.04)", border: M.border2 },
                      { label: C.researcher, value: stats.users.by_role["researcher"] ?? 0, icon: <FlaskConical size={14}/>, color: "#a78bfa", accent: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "14px 16px", borderRadius: 11, background: item.accent, border: `1px solid ${item.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${item.accent}`, border: `1px solid ${item.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div>
                          <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: item.color, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{item.value.toLocaleString()}</p>
                          <p style={{ fontFamily: FONT, fontSize: 11, color: M.text3, margin: "3px 0 0" }}>{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription + Revenue */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { label: C.proActive, value: stats.subscriptions.pro_active.toLocaleString(), icon: <ShieldCheck size={13}/>, color: M.amber, accent: "rgba(245,193,24,0.08)", border: "rgba(245,193,24,0.2)" },
                    { label: C.totalPay,  value: stats.payments.total_settled.toLocaleString(), icon: <CreditCard size={13}/>, color: M.sky, accent: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
                    { label: C.revenue,   value: fmtRupiah(stats.payments.total_revenue_idr), icon: <TrendingUp size={13}/>, color: M.green, accent: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "13px 14px", borderRadius: 11, background: item.accent, border: `1px solid ${item.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{ color: item.color }}>{item.icon}</div>
                        <span style={{ fontFamily: FONT, fontSize: 10, color: M.text3, fontWeight: 600, letterSpacing: "0.04em" }}>{item.label}</span>
                      </div>
                      <p style={{ fontFamily: MONO, fontSize: item.label === C.revenue ? 12 : 22, fontWeight: 800, color: item.color, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <p style={{ fontFamily: FONT, fontSize: 11, color: M.text3, margin: 0 }}>
                  {C.admins}: <strong style={{ color: M.text2 }}>{stats.users.admins}</strong>
                </p>
              </div>
            ) : <p style={{ fontFamily: FONT, fontSize: 13, color: M.text3, textAlign: "center", padding: "48px 0" }}>{C.noData}</p>
          )}

          {/* ── PAYMENTS ── */}
          {tab === "payments" && (
            loadingPay ? <Spinner /> : (
              payments.length === 0
                ? <p style={{ fontFamily: FONT, fontSize: 13, color: M.text3, textAlign: "center", padding: "48px 0" }}>{C.noData}</p>
                : (
                  <div>
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12, minWidth: 520 }}>
                        <thead>
                          <tr>
                            {[C.colOrder, C.colUser, C.colPlan, C.colAmount, C.colStatus, C.colDate].map((h) => (
                              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 9.5, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: M.text3, borderBottom: `1px solid ${M.border}`, background: M.card, whiteSpace: "nowrap" as const }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p, i) => {
                            const sc = STATUS_STYLE[p.status] ?? { bg: "rgba(255,255,255,0.04)", color: M.text3 };
                            return (
                              <tr key={p.order_id} style={{ borderBottom: `1px solid ${M.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                                <td style={{ padding: "9px 10px" }}>
                                  <span style={{ fontFamily: MONO, fontSize: 10, color: M.text3 }}>{p.order_id.slice(-10)}</span>
                                </td>
                                <td style={{ padding: "9px 10px", maxWidth: 160 }}>
                                  <p style={{ margin: 0, fontWeight: 600, color: M.text1, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{p.full_name}</p>
                                  <p style={{ margin: 0, fontSize: 10, color: M.text3, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</p>
                                </td>
                                <td style={{ padding: "9px 10px", whiteSpace: "nowrap" as const, color: M.text1 }}>{PLAN_LABEL[p.plan] ?? p.plan}</td>
                                <td style={{ padding: "9px 10px", whiteSpace: "nowrap" as const, fontFamily: MONO, fontWeight: 700, color: M.amber }}>{fmtRupiah(p.amount_idr)}</td>
                                <td style={{ padding: "9px 10px" }}>
                                  <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 99, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" as const }}>
                                    {p.status}
                                  </span>
                                </td>
                                <td style={{ padding: "9px 10px", fontSize: 10, color: M.text3, whiteSpace: "nowrap" as const }}>{fmtDate(p.created_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: M.text3 }}>
                        {offset + 1}–{Math.min(offset + LIMIT, totalPay)} / {totalPay}
                      </span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                          disabled={offset === 0}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: `1px solid ${M.border2}`, background: M.surface, cursor: offset === 0 ? "not-allowed" : "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: offset === 0 ? M.text3 : M.text2, opacity: offset === 0 ? 0.5 : 1, transition: "all 0.15s" }}
                          onMouseEnter={e => { if (offset > 0) (e.currentTarget as HTMLButtonElement).style.borderColor = M.amber; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = M.border2; }}
                        >
                          <ChevronLeft size={12} /> {C.prev}
                        </button>
                        <span style={{ fontFamily: FONT, fontSize: 11, color: M.text3, padding: "6px 8px" }}>
                          {currentPage} / {totalPages || 1}
                        </span>
                        <button
                          onClick={() => setOffset(o => o + LIMIT)}
                          disabled={offset + LIMIT >= totalPay}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: `1px solid ${M.border2}`, background: M.surface, cursor: offset + LIMIT >= totalPay ? "not-allowed" : "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: offset + LIMIT >= totalPay ? M.text3 : M.text2, opacity: offset + LIMIT >= totalPay ? 0.5 : 1, transition: "all 0.15s" }}
                          onMouseEnter={e => { if (offset + LIMIT < totalPay) (e.currentTarget as HTMLButtonElement).style.borderColor = M.amber; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = M.border2; }}
                        >
                          {C.next} <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
            )
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};