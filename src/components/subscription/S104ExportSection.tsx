/**
 * S104ExportSection.tsx
 * Replaces the inline S104Badge in InfoPanel.
 * - Free users: see locked overlay with upgrade CTA
 * - Pro users: export buttons work normally
 *
 * Integrates with:
 *   GET /api/s104/export         (TPXO HDF5)
 *   GET /api/s104/export/luwes   (Luwes HDF5)
 *   SubscriptionContext          (canAccess check)
 */

import React, { useState } from "react";
import {
  CheckCircle, ChevronDown, ChevronUp, ExternalLink,
  FileDown, Loader2, Lock,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal } from "./PricingModal";

const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
const SANS = '"Inter","DM Sans",system-ui,sans-serif';
const PRIMARY = "#0369a1";

interface Props {
  coordinates: { lat: number; lon: number };
  selectedDate: string;
  language: "en" | "id";
}

const LABELS = {
  en: {
    header: "IHO S-100 / S-104 Ed. 2.0",
    headerSub: "Water Level Standard",
    detailTitle: "S-104 Compliance Details",
    detailBody:
      "Compliant with IHO S-104 Edition 2.0.0 (adopted December 2024). Export as HDF5 files compatible with ECDIS, HDFView, and s100py.",
    exportTpxo: "Export S-104 (TPXO)",
    exportLuwes: "Export S-104 (Luwes)",
    preparing: "Preparing…",
    errorLabel: "Export failed",
    lockedBadge: "Pro feature",
    lockedHint: "S-104 export is available on the Pro plan",
    upgradeBtn: "Upgrade to Pro →",
  },
  id: {
    header: "IHO S-100 / S-104 Ed. 2.0",
    headerSub: "Standar Muka Air",
    detailTitle: "Detail Kepatuhan S-104",
    detailBody:
      "Memenuhi IHO S-104 Edition 2.0.0 (diadopsi Desember 2024). Ekspor ke file HDF5 yang kompatibel dengan ECDIS, HDFView, dan s100py.",
    exportTpxo: "Ekspor S-104 (TPXO)",
    exportLuwes: "Ekspor S-104 (Luwes)",
    preparing: "Menyiapkan…",
    errorLabel: "Ekspor gagal",
    lockedBadge: "Fitur Pro",
    lockedHint: "Ekspor S-104 tersedia di paket Pro",
    upgradeBtn: "Upgrade ke Pro →",
  },
};

const INFO_ROWS = [
  ["Standard",         "IHO S-104 Ed.2.0.0"],
  ["Horizontal CRS",   "EPSG:4326 (WGS 84)"],
  ["Vertical Datum",   "MSL (IHO code 12)"],
  ["TPXO data",        "dataDynamicity = 1 (astronomicalPrediction)"],
  ["Luwes data",       "dataDynamicity = 3 (observed)"],
  ["TOL correction",   "−2.156 m (Luwes → MSL)"],
  ["Encoding",         "HDF5"],
  ["Adopted",          "December 2024"],
];

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const d = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((d as any).error ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const S104ExportSection: React.FC<Props> = ({ coordinates, selectedDate, language: lang }) => {
  const l = LABELS[lang];
  const { canAccess } = useSubContext();
  const hasAccess = canAccess("s104_export");

  const [open, setOpen]               = useState(false);
  const [loadingTpxo, setLoadingTpxo] = useState(false);
  const [loadingLuwes, setLoadingLuwes] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const handleTpxo = async () => {
    setLoadingTpxo(true); setError(null);
    try {
      await downloadFile(
        `${API}/api/s104/export?lon=${coordinates.lon}&lat=${coordinates.lat}&date=${selectedDate}`,
        `searibu_s104_tpxo_${selectedDate}.h5`
      );
    } catch (e: any) { setError(e.message); }
    finally { setLoadingTpxo(false); }
  };

  const handleLuwes = async () => {
    setLoadingLuwes(true); setError(null);
    try {
      await downloadFile(
        `${API}/api/s104/export/luwes?date=${selectedDate}`,
        `searibu_s104_luwes_${selectedDate}.h5`
      );
    } catch (e: any) { setError(e.message); }
    finally { setLoadingLuwes(false); }
  };

  return (
    <>
      {/* header toggle */}
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 13px", cursor: "pointer",
          background: "linear-gradient(135deg,#eff8ff,#f0fdf4)",
          border: "1px solid #bfdbfe", borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={13} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: PRIMARY, margin: 0 }}>{l.header}</p>
            <p style={{ fontFamily: SANS, fontSize: 10, color: "#0369a1", margin: 0, opacity: 0.75 }}>{l.headerSub}</p>
          </div>
        </div>
        {open ? <ChevronUp size={13} style={{ color: PRIMARY, opacity: 0.5 }} /> : <ChevronDown size={13} style={{ color: PRIMARY, opacity: 0.5 }} />}
      </div>

      {/* detail panel */}
      {open && (
        <div style={{ marginTop: 5, padding: "11px 13px", background: "#f8fafc", border: "1px solid #dbeafe", borderRadius: 10 }}>
          <p style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: "#0f172a", marginBottom: 7 }}>{l.detailTitle}</p>
          <p style={{ fontFamily: SANS, fontSize: 11, color: "#475569", lineHeight: 1.65, marginBottom: 9 }}>{l.detailBody}</p>
          <div style={{ borderTop: "1px solid #e8f0f7", paddingTop: 7, marginBottom: 9 }}>
            {INFO_ROWS.map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
                <span style={{ fontFamily: SANS, fontSize: 10, color: "#8faabb" }}>{k}</span>
                <span style={{ fontFamily: '"Courier New",monospace', fontSize: 10, color: "#475569", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <a href="https://iho.int/en/s-100-based-product-specifications" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: SANS, fontSize: 10.5, color: PRIMARY, textDecoration: "none", marginBottom: 10 }}>
            {lang === "en" ? "IHO S-100 Resources" : "Sumber IHO S-100"} <ExternalLink size={9} />
          </a>
        </div>
      )}

      {/* export buttons — gated */}
      <div style={{ marginTop: 7, position: "relative" }}>
        {!hasAccess && (
          /* locked overlay */
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 10,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              background: "rgba(248,250,252,0.92)",
              backdropFilter: "blur(3px)",
              borderRadius: 10,
              border: "1px solid #dbeafe",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "4px 11px", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "#64748b" }}>
              <Lock size={10} /> {l.lockedBadge}
            </div>
            <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", margin: 0, textAlign: "center" }}>{l.lockedHint}</p>
            <button
              onClick={() => setShowPricing(true)}
              style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: PRIMARY, color: "#fff", fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {l.upgradeBtn}
            </button>
          </div>
        )}

        {/* actual buttons (dimmed when locked) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity: hasAccess ? 1 : 0.2, pointerEvents: hasAccess ? "auto" : "none" }}>
          <ExportBtn
            label={loadingTpxo ? l.preparing : l.exportTpxo}
            loading={loadingTpxo}
            onClick={handleTpxo}
            accent="#5b7093"
          />
          <ExportBtn
            label={loadingLuwes ? l.preparing : l.exportLuwes}
            loading={loadingLuwes}
            onClick={handleLuwes}
            accent="#e879a0"
          />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 7, padding: "7px 11px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 7 }}>
          <span style={{ color: "#be123c", fontSize: 11, fontFamily: SANS, flex: 1 }}>
            <strong>{l.errorLabel}:</strong> {error}
          </span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#be123c", padding: 0, fontSize: 13, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} language={lang} initialTab="pricing" />
    </>
  );
};

const ExportBtn: React.FC<{ label: string; loading: boolean; onClick: () => void; accent: string }> = ({ label, loading, onClick, accent }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      width: "100%", padding: "8px 13px", borderRadius: 8,
      border: `1.5px solid ${accent}28`,
      background: loading ? "#f8fafc" : `${accent}0d`,
      color: loading ? "#8faabb" : accent,
      fontFamily: SANS, fontSize: 11.5, fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer", transition: "all .18s",
    }}
    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.borderColor = `${accent}50`; } }}
    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = `${accent}0d`; e.currentTarget.style.borderColor = `${accent}28`; } }}
  >
    {loading ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <FileDown size={12} />}
    {label}
  </button>
);

export default S104ExportSection;