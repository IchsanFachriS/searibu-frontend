/**
 * ProfileModal.tsx
 * Modal untuk melihat profil dan mengubah role user.
 * Dipanggil dari UserDropdown di Navbar.
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, User, FlaskConical } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import type { UserRole } from "../../types";

const SANS    = '"Montserrat", system-ui, sans-serif';
const PRIMARY = "#0369a1";
const NAVY    = "#024e78";

interface Props {
  open:     boolean;
  onClose:  () => void;
  language: "en" | "id";
}

const COPY = {
  en: {
    title:       "My Profile",
    roleLabel:   "Account type",
    roleHint:    "Choose your account type. This affects which features are available to you.",
    general:     "General User",
    generalDesc: "Marine tourism, safety check, activity guide, weather forecast.",
    researcher:  "Researcher / Professional",
    researcherDesc: "Full access including technical data, tidal charts, and S-104 HDF5 export (requires Pro).",
    saving:      "Saving...",
    save:        "Save changes",
    saved:       "Saved",
    cancel:      "Cancel",
    noChange:    "No changes to save",
    errorMsg:    "Failed to update. Please try again.",
    memberSince: "Member since",
    currentRole: "Current type",
  },
  id: {
    title:       "Profil Saya",
    roleLabel:   "Jenis akun",
    roleHint:    "Pilih jenis akun Anda. Ini mempengaruhi fitur yang tersedia.",
    general:     "Pengguna Umum",
    generalDesc: "Wisata bahari, cek keamanan aktivitas, prakiraan cuaca.",
    researcher:  "Peneliti / Profesional",
    researcherDesc: "Akses penuh termasuk data teknis, grafik pasut, dan ekspor S-104 HDF5 (butuh Pro).",
    saving:      "Menyimpan...",
    save:        "Simpan perubahan",
    saved:       "Tersimpan",
    cancel:      "Batal",
    noChange:    "Tidak ada perubahan",
    errorMsg:    "Gagal memperbarui. Coba lagi.",
    memberSince: "Bergabung sejak",
    currentRole: "Jenis saat ini",
  },
};

export const ProfileModal: React.FC<Props> = ({ open, onClose, language }) => {
  const c = COPY[language];
  const { user, isResearcher, updateRole } = useSubContext();

  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? "general");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync with current user role when modal opens
  useEffect(() => {
    if (open && user?.role) {
      setSelectedRole(user.role);
      setStatus("idle");
    }
  }, [open, user?.role]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !user) return null;

  const hasChanged = selectedRole !== user.role;

  const handleSave = async () => {
    if (!hasChanged) return;
    setStatus("saving");
    try {
      await updateRole(selectedRole);
      setStatus("saved");
      setTimeout(() => { setStatus("idle"); onClose(); }, 1000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });

  const roles: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "general",
      label: c.general,
      desc:  c.generalDesc,
      icon:  <User size={18} />,
    },
    {
      value: "researcher",
      label: c.researcher,
      desc:  c.researcherDesc,
      icon:  <FlaskConical size={18} />,
    },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(2,78,120,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: 16,
      }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 14,
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 60px rgba(2,78,120,0.18)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg,${NAVY} 0%,${PRIMARY} 100%)`,
          padding: "20px 20px 18px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}>
          <div>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10, overflow: "hidden",
            }}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                    {user.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </span>
              }
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              {user.full_name}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "3px 0 0" }}>
              {user.email}
            </p>
            {user.created_at && (
              <p style={{ fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "4px 0 0" }}>
                {c.memberSince}: {fmtDate(user.created_at)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none",
              cursor: "pointer", borderRadius: 8, padding: 7,
              display: "flex", color: "#fff", flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 24px" }}>
          {/* Role label */}
          <p style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#64748b", marginBottom: 6,
          }}>
            {c.roleLabel}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.5 }}>
            {c.roleHint}
          </p>

          {/* Role cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {roles.map((r) => {
              const isSelected = selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 14px",
                    border: isSelected ? `2px solid ${PRIMARY}` : "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    background: isSelected ? "#eff8ff" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.18s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#bfdbfe"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: isSelected ? PRIMARY : "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isSelected ? "#fff" : "#64748b",
                    transition: "all 0.18s",
                  }}>
                    {r.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: SANS, fontSize: 13, fontWeight: 600,
                      color: isSelected ? PRIMARY : "#0f172a",
                      margin: "0 0 3px",
                    }}>
                      {r.label}
                    </p>
                    <p style={{
                      fontFamily: SANS, fontSize: 11,
                      color: isSelected ? "#0369a1" : "#94a3b8",
                      margin: 0, lineHeight: 1.5,
                    }}>
                      {r.desc}
                    </p>
                  </div>

                  {/* Check indicator */}
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    border: `2px solid ${isSelected ? PRIMARY : "#cbd5e1"}`,
                    background: isSelected ? PRIMARY : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.18s",
                  }}>
                    {isSelected && <Check size={10} color="#fff" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {status === "error" && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 14,
              background: "#fef2f2", border: "1px solid #fca5a5",
            }}>
              <p style={{ fontFamily: SANS, fontSize: 12, color: "#dc2626", margin: 0 }}>
                {c.errorMsg}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", background: "#fff",
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                color: "#64748b", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              {c.cancel}
            </button>

            <button
              onClick={handleSave}
              disabled={status === "saving" || status === "saved"}
              style={{
                flex: 2, padding: "10px", borderRadius: 8, border: "none",
                background: status === "saved"
                  ? "#16a34a"
                  : !hasChanged
                  ? "#e2e8f0"
                  : PRIMARY,
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                color: !hasChanged ? "#94a3b8" : "#fff",
                cursor: (!hasChanged || status === "saving" || status === "saved") ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "all 0.2s",
                opacity: status === "saving" ? 0.8 : 1,
              }}
            >
              {status === "saving" && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
              {status === "saved"  && <Check size={13} />}
              {status === "saving" ? c.saving  :
               status === "saved"  ? c.saved   :
               !hasChanged         ? c.noChange :
               c.save}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};