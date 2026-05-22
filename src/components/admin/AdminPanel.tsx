/**
 * AdminPanel.tsx
 * Admin dashboard modal — stats overview + recent payments.
 * Accessible only to users with is_admin = true.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Users, CreditCard, TrendingUp, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, ShieldCheck,
  FlaskConical, User,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";

const API  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SANS = '"Montserrat", system-ui, sans-serif';
const MONO = '"Courier New", monospace';
const PRIMARY = "#0369a1";
const NAVY    = "#024e78";

interface Stats {
  users: {
    total:   number;
    by_role: Record<string, number>;
    admins:  number;
    new_30d: number;
  };
  subscriptions: { pro_active: number };
  payments: { total_settled: number; total_revenue_idr: number };
}

interface Payment {
  order_id:     string;
  email:        string;
  full_name:    string;
  plan:         string;
  amount_idr:   number;
  status:       string;
  payment_type: string | null;
  created_at:   string | null;
  settled_at:   string | null;
}

interface Props {
  open:    boolean;
  onClose: () => void;
  language:"en" | "id";
}

const PLAN_LABEL: Record<string, string> = {
  pro_monthly: "Pro Monthly",
  pro_annual:  "Pro Annual",
  free:        "Free",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  settlement: { bg: "#dcfce7", text: "#15803d" },
  pending:    { bg: "#fef9c3", text: "#854d0e" },
  cancel:     { bg: "#fee2e2", text: "#991b1b" },
  expire:     { bg: "#fee2e2", text: "#991b1b" },
  deny:       { bg: "#fee2e2", text: "#991b1b" },
  failure:    { bg: "#fee2e2", text: "#991b1b" },
};

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/stats?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setStats(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingStats(false);
    }
  }, [email]);

  const fetchPayments = useCallback(async (off: number) => {
    if (!email) return;
    setLoadingPay(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/payments?email=${encodeURIComponent(email)}&limit=${LIMIT}&offset=${off}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setPayments(data.payments);
      setTotalPay(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingPay(false);
    }
  }, [email]);

  useEffect(() => {
    if (open) {
      setTab("stats");
      setOffset(0);
      fetchStats();
    }
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
      title:        "Admin Panel",
      tabs:         ["Overview", "Payments"],
      totalUsers:   "Total Users",
      general:      "General",
      researcher:   "Researcher",
      admins:       "Admins",
      new30d:       "New (30d)",
      proActive:    "Active Pro",
      totalPay:     "Settled Payments",
      revenue:      "Total Revenue",
      noData:       "No data available",
      loading:      "Loading...",
      refresh:      "Refresh",
      prev:         "Prev",
      next:         "Next",
      colOrder:     "Order ID",
      colUser:      "User",
      colPlan:      "Plan",
      colAmount:    "Amount",
      colStatus:    "Status",
      colDate:      "Date",
    },
    id: {
      title:        "Panel Admin",
      tabs:         ["Ringkasan", "Pembayaran"],
      totalUsers:   "Total Pengguna",
      general:      "Umum",
      researcher:   "Peneliti",
      admins:       "Admin",
      new30d:       "Baru (30h)",
      proActive:    "Pro Aktif",
      totalPay:     "Pembayaran Lunas",
      revenue:      "Total Pendapatan",
      noData:       "Tidak ada data",
      loading:      "Memuat...",
      refresh:      "Perbarui",
      prev:         "Sebelum",
      next:         "Berikut",
      colOrder:     "Order ID",
      colUser:      "Pengguna",
      colPlan:      "Paket",
      colAmount:    "Jumlah",
      colStatus:    "Status",
      colDate:      "Tanggal",
    },
  }[language];

  const totalPages = Math.ceil(totalPay / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(2,78,120,0.4)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 400, padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 680,
        maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(2,78,120,0.22)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg,${NAVY} 0%,${PRIMARY} 100%)`,
          padding: "18px 20px 0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={16} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{C.title}</h2>
                <p style={{ fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0 }}>{user?.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => { fetchStats(); if (tab === "payments") fetchPayments(offset); }}
                style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, color: "#fff", fontFamily: SANS, fontSize: 11, fontWeight: 600 }}
              >
                <RefreshCw size={12} /> {C.refresh}
              </button>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", borderRadius: 8, padding: 7, display: "flex", color: "#fff" }}>
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
                  padding: "7px 16px", border: "none", cursor: "pointer",
                  fontFamily: SANS, fontSize: 12, fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  background: tab === t ? "#fff" : "transparent",
                  color:      tab === t ? PRIMARY : "rgba(255,255,255,0.65)",
                  transition: "all .15s",
                }}
              >
                {C.tabs[i]}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", WebkitOverflowScrolling: "touch" }}>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: 16 }}>
              <p style={{ fontFamily: SANS, fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            loadingStats
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} />
                  <span style={{ fontFamily: SANS, fontSize: 13 }}>{C.loading}</span>
                </div>
              : stats
              ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* User cards */}
                  <div>
                    <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>
                      {C.totalUsers}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                      {[
                        { label: C.totalUsers,  value: stats.users.total,                              icon: <Users size={14} />,       color: PRIMARY,   bg: "#eff8ff" },
                        { label: C.new30d,       value: stats.users.new_30d,                            icon: <TrendingUp size={14} />,  color: "#16a34a", bg: "#f0fdf4" },
                        { label: C.general,      value: stats.users.by_role["general"]    ?? 0,         icon: <User size={14} />,        color: "#64748b", bg: "#f8fafc" },
                        { label: C.researcher,   value: stats.users.by_role["researcher"] ?? 0,         icon: <FlaskConical size={14} />,color: "#7c3aed", bg: "#f5f3ff" },
                      ].map((item) => (
                        <div key={item.label} style={{ padding: "14px 16px", borderRadius: 10, background: item.bg, border: `1px solid ${item.color}22`, display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: item.color, margin: 0, lineHeight: 1 }}>{item.value.toLocaleString()}</p>
                            <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subscription + Revenue */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[
                      { label: C.proActive,  value: stats.subscriptions.pro_active.toLocaleString(),   icon: <ShieldCheck size={14} />, color: "#0369a1", bg: "#eff8ff" },
                      { label: C.totalPay,   value: stats.payments.total_settled.toLocaleString(),      icon: <CreditCard size={14} />,  color: "#d97706", bg: "#fffbeb" },
                      { label: C.revenue,    value: fmtRupiah(stats.payments.total_revenue_idr),         icon: <TrendingUp size={14} />,  color: "#15803d", bg: "#f0fdf4" },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "12px 14px", borderRadius: 10, background: item.bg, border: `1px solid ${item.color}22` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ color: item.color }}>{item.icon}</div>
                          <span style={{ fontFamily: SANS, fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{item.label}</span>
                        </div>
                        <p style={{ fontFamily: MONO, fontSize: item.label === C.revenue ? 13 : 20, fontWeight: 700, color: item.color, margin: 0, lineHeight: 1 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Admin count note */}
                  <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", margin: 0 }}>
                    {C.admins}: <strong style={{ color: "#374151" }}>{stats.users.admins}</strong>
                  </p>
                </div>
              )
              : <p style={{ fontFamily: SANS, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>{C.noData}</p>
          )}

          {/* ── PAYMENTS TAB ── */}
          {tab === "payments" && (
            loadingPay
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} />
                  <span style={{ fontFamily: SANS, fontSize: 13 }}>{C.loading}</span>
                </div>
              : (
                <div>
                  {payments.length === 0
                    ? <p style={{ fontFamily: SANS, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>{C.noData}</p>
                    : (
                      <>
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12, minWidth: 520 }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                {[C.colOrder, C.colUser, C.colPlan, C.colAmount, C.colStatus, C.colDate].map((h) => (
                                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "#94a3b8", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((p, i) => {
                                const sc = STATUS_COLOR[p.status] ?? { bg: "#f1f5f9", text: "#64748b" };
                                return (
                                  <tr key={p.order_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                                      <span style={{ fontFamily: MONO, fontSize: 10, color: "#64748b" }}>{p.order_id.slice(-10)}</span>
                                    </td>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", maxWidth: 160 }}>
                                      <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.full_name}</p>
                                      <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</p>
                                    </td>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                      {PLAN_LABEL[p.plan] ?? p.plan}
                                    </td>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", fontFamily: MONO, fontWeight: 600, color: "#0f172a" }}>
                                      {fmtRupiah(p.amount_idr)}
                                    </td>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                                        {p.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                      {fmtDate(p.created_at)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                          <span style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8" }}>
                            {offset + 1}–{Math.min(offset + LIMIT, totalPay)} / {totalPay}
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                              disabled={offset === 0}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: offset === 0 ? "not-allowed" : "pointer", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: offset === 0 ? "#cbd5e1" : "#374151", opacity: offset === 0 ? 0.5 : 1 }}
                            >
                              <ChevronLeft size={12} /> {C.prev}
                            </button>
                            <span style={{ fontFamily: SANS, fontSize: 11, color: "#64748b", padding: "6px 8px" }}>
                              {currentPage} / {totalPages || 1}
                            </span>
                            <button
                              onClick={() => setOffset((o) => o + LIMIT)}
                              disabled={offset + LIMIT >= totalPay}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: offset + LIMIT >= totalPay ? "not-allowed" : "pointer", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: offset + LIMIT >= totalPay ? "#cbd5e1" : "#374151", opacity: offset + LIMIT >= totalPay ? 0.5 : 1 }}
                            >
                              {C.next} <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      </>
                    )
                  }
                </div>
              )
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};