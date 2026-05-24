import React, { useState } from "react";
import {
  CheckCircle, ChevronDown, ChevronUp, ExternalLink,
  FileDown, Loader2, Lock,
} from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal } from "./PricingModal";

const API     = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
const SANS    = '"Inter", "DM Sans", system-ui, sans-serif';
const PRIMARY = "#0369a1";

interface Props {
  coordinates:  { lat: number; lon: number };
  selectedDate: string;
  language:     "en" | "id";
}

const LABELS = {
  en: {
    header:        "IHO S-104",
    headerSub:     "Water Level Standard",
    detailTitle:   "S-104 Compliance Details",
    detailBody:    "Compliant with IHO S-104 Edition 2.0.0 (adopted December 2024). Export as HDF5 files compatible with ECDIS, HDFView, and s100py.",
    exportTpxo:    "Export S-104 (TPXO)",
    exportLuwes:   "Export S-104 (Luwes)",
    preparing:     "Preparing...",
    errorLabel:    "Export failed",
    // When researcher but no Pro
    needsProBadge: "Pro required",
    needsProHint:  "S-104 export is available for Researchers on the Pro plan",
    upgradeBtn:    "Upgrade to Pro",
    // When Pro but not researcher
    needsRoleBadge: "Researcher account required",
    needsRoleHint:  "S-104 export is only available to Researcher / Professional accounts",
    changeRoleBtn:  "Change account type",
  },
  id: {
    header:        "IHO S-104",
    headerSub:     "Standar Muka Air",
    detailTitle:   "Detail Kepatuhan S-104",
    detailBody:    "Memenuhi IHO S-104 Edition 2.0.0 (diadopsi Desember 2024). Ekspor ke file HDF5 yang kompatibel dengan ECDIS, HDFView, dan s100py.",
    exportTpxo:    "Ekspor S-104 (TPXO)",
    exportLuwes:   "Ekspor S-104 (Luwes)",
    preparing:     "Menyiapkan...",
    errorLabel:    "Ekspor gagal",
    needsProBadge: "Butuh Pro",
    needsProHint:  "Ekspor S-104 tersedia untuk Peneliti dengan paket Pro",
    upgradeBtn:    "Upgrade ke Pro",
    needsRoleBadge: "Butuh akun Peneliti",
    needsRoleHint:  "Ekspor S-104 hanya tersedia untuk akun Peneliti / Profesional",
    changeRoleBtn:  "Ubah jenis akun",
  },
};

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

const ExportBtn: React.FC<{
  label:   string;
  loading: boolean;
  onClick: () => void;
  accent:  string;
}> = ({ label, loading, onClick, accent }) => (
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
      cursor: loading ? "not-allowed" : "pointer",
      transition: "all .18s",
    }}
    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.borderColor = `${accent}50`; } }}
    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = `${accent}0d`; e.currentTarget.style.borderColor = `${accent}28`; } }}
  >
    {loading ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <FileDown size={12} />}
    {label}
  </button>
);

export const S104ExportSection: React.FC<Props> = ({ coordinates, selectedDate, language: lang }) => {
  const l = LABELS[lang];
  const { canAccess, isPro, isResearcher } = useSubContext();
  const hasFullAccess = canAccess("s104_export"); // researcher + Pro

  const [open,         setOpen]         = useState(false);
  const [loadingTpxo,  setLoadingTpxo]  = useState(false);
  const [loadingLuwes, setLoadingLuwes] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showPricing,  setShowPricing]  = useState(false);

  const lockReason: "needs_pro" | "needs_role" | null =
    hasFullAccess       ? null :
    isResearcher        ? "needs_pro" :
    "needs_role";

  const handleTpxo = async () => {
    setLoadingTpxo(true); setError(null);
    try {
      await downloadFile(`${API}/api/s104/export?lon=${coordinates.lon}&lat=${coordinates.lat}&date=${selectedDate}`, `searibu_s104_tpxo_${selectedDate}.h5`);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingTpxo(false); }
  };

  const handleLuwes = async () => {
    setLoadingLuwes(true); setError(null);
    try {
      await downloadFile(`${API}/api/s104/export/luwes?date=${selectedDate}`, `searibu_s104_luwes_${selectedDate}.h5`);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingLuwes(false); }
  };

  return (
    <>
      {/* Export buttons area */}
      <div style={{ marginTop: 7, position: "relative" }}>
        {/* Lock overlay */}
        {lockReason && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            background: "rgba(248,250,252,0.95)",
            backdropFilter: "blur(3px)",
            borderRadius: 10, border: "1px solid #dbeafe", padding: "14px 16px",
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "4px 11px", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "#64748b" }}>
              <Lock size={10} />
              {lockReason === "needs_pro" ? l.needsProBadge : l.needsRoleBadge}
            </div>
            <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              {lockReason === "needs_pro" ? l.needsProHint : l.needsRoleHint}
            </p>
            {lockReason === "needs_pro" && (
              <button
                onClick={() => setShowPricing(true)}
                style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: PRIMARY, color: "#fff", fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {l.upgradeBtn}
              </button>
            )}
          </div>
        )}

        {/* Buttons (visible but blurred when locked) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity: hasFullAccess ? 1 : 0.18, pointerEvents: hasFullAccess ? "auto" : "none" }}>
          <ExportBtn label={loadingTpxo  ? l.preparing : l.exportTpxo}  loading={loadingTpxo}  onClick={handleTpxo}  accent="#5b7093" />
          <ExportBtn label={loadingLuwes ? l.preparing : l.exportLuwes} loading={loadingLuwes} onClick={handleLuwes} accent="#e879a0" />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 7, padding: "7px 11px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 7 }}>
          <span style={{ color: "#be123c", fontSize: 11, fontFamily: SANS, flex: 1 }}>
            <strong>{l.errorLabel}:</strong> {error}
          </span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#be123c", padding: 0, fontSize: 13, lineHeight: 1, flexShrink: 0 }}>x</button>
        </div>
      )}

      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} language={lang} initialTab="pricing" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
};