/**
 * ProfileModal.tsx — redesign konsisten dengan tema Searibu.
 * Role (general/researcher) tetap ada untuk keperluan UX/informasi,
 * namun tidak mempengaruhi akses fitur S-104 (cukup Pro).
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, User, FlaskConical, ShieldCheck, Anchor } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import type { UserRole } from "../../types";

const FONT = "'Inter', system-ui, sans-serif";

/* ── Design tokens — sama dengan AuthModal di Navbar ── */
const M = {
  bg:      "#0f1824",
  surface: "#162030",
  border:  "#1e3044",
  border2: "#243548",
  amber:   "#f5c518",
  amberD:  "#d4a814",
  sky:     "#38bdf8",
  text1:   "#f0f6ff",
  text2:   "#8ba3be",
  text3:   "#4a6580",
  error:   "#f87171",
  green:   "#4ade80",
  DARK1:   "#2b2b2b",
};

interface Props {
  open:     boolean;
  onClose:  () => void;
  language: "en" | "id";
}

const COPY = {
  en: {
    title:       "My Profile",
    roleLabel:   "Account type",
    roleNote:    "Your account type is shown in your profile. It does not affect feature access — all features are available based on your subscription.",
    general:     "General User",
    generalDesc: "Marine tourism, safety check, activity guide, weather forecast.",
    researcher:  "Researcher / Professional",
    researcherDesc: "Professional maritime use — tidal analysis, export workflows.",
    saving:      "Saving...",
    save:        "Save changes",
    saved:       "Saved",
    cancel:      "Cancel",
    noChange:    "No changes to save",
    errorMsg:    "Failed to update. Please try again.",
    memberSince: "Member since",
  },
  id: {
    title:       "Profil Saya",
    roleLabel:   "Jenis akun",
    roleNote:    "Jenis akun ditampilkan di profilmu. Tidak mempengaruhi akses fitur — semua fitur tersedia berdasarkan langgananmu.",
    general:     "Pengguna Umum",
    generalDesc: "Wisata bahari, cek keamanan aktivitas, prakiraan cuaca.",
    researcher:  "Peneliti / Profesional",
    researcherDesc: "Penggunaan maritim profesional — analisis pasut, alur ekspor data.",
    saving:      "Menyimpan...",
    save:        "Simpan perubahan",
    saved:       "Tersimpan",
    cancel:      "Batal",
    noChange:    "Tidak ada perubahan",
    errorMsg:    "Gagal memperbarui. Coba lagi.",
    memberSince: "Bergabung sejak",
  },
};

export const ProfileModal: React.FC<Props> = ({ open, onClose, language }) => {
  const c = COPY[language];
  const { user, updateRole } = useSubContext();

  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? "general");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user?.role) { setSelectedRole(user.role); setStatus("idle"); }
  }, [open, user?.role]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !user) return null;

  const hasChanged = selectedRole !== user.role;
  const isAdmin    = user.is_admin === true;

  const handleSave = async () => {
    if (!hasChanged) return;
    setStatus("saving");
    try {
      await updateRole(selectedRole);
      setStatus("saved");
      setTimeout(() => { setStatus("idle"); onClose(); }, 900);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });

  const initials = user.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const roles: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "general",    label: c.general,    desc: c.generalDesc,    icon: <User size={16} /> },
    { value: "researcher", label: c.researcher, desc: c.researcherDesc, icon: <FlaskConical size={16} /> },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(5,12,24,0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 800, padding: 16,
      }}
    >
      <div style={{
        background: M.bg,
        border: `1px solid ${M.border}`,
        borderRadius: 16,
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 32px 80px rgba(0,0,0,0.60)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Amber top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${M.amber}, #f59e0b)` }} />

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, rgba(245,193,24,0.10) 0%, rgba(56,189,248,0.06) 100%)`, borderBottom: `1px solid ${M.border}`, padding: "22px 22px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {/* Avatar + info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: user.avatar ? "transparent" : `rgba(245,193,24,0.15)`,
                border: `2px solid rgba(245,193,24,0.35)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: M.amber }}>{initials}</span>}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: M.text1, margin: 0 }}>{user.full_name}</p>
                  {isAdmin && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 99, background: "rgba(245,193,24,0.12)", border: "1px solid rgba(245,193,24,0.3)", fontFamily: FONT, fontSize: 10, fontWeight: 700, color: M.amber }}>
                      <ShieldCheck size={9} />Admin
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: FONT, fontSize: 12, color: M.text2, margin: 0 }}>{user.email}</p>
                {user.created_at && (
                  <p style={{ fontFamily: FONT, fontSize: 10, color: M.text3, margin: "3px 0 0" }}>
                    {c.memberSince}: {fmtDate(user.created_at)}
                  </p>
                )}
              </div>
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", borderRadius: 8, padding: 7, display: "flex", color: M.text2, transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; e.currentTarget.style.color = M.amber; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px 22px" }}>
          {/* Role label + note */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: M.text2, marginBottom: 6 }}>
              {c.roleLabel}
            </p>
            <div style={{ background: "rgba(56,189,248,0.06)", border: `1px solid rgba(56,189,248,0.15)`, borderRadius: 8, padding: "8px 11px" }}>
              <p style={{ fontFamily: FONT, fontSize: 11.5, color: M.text2, margin: 0, lineHeight: 1.55 }}>
                {c.roleNote}
              </p>
            </div>
          </div>

          {/* Role cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {roles.map((r) => {
              const sel = selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 13px",
                    border: sel ? `1.5px solid ${M.amber}` : `1.5px solid ${M.border2}`,
                    borderRadius: 10,
                    background: sel ? "rgba(245,193,24,0.07)" : M.surface,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = M.border; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = M.border2; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: sel ? "rgba(245,193,24,0.12)" : M.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: sel ? M.amber : M.text2,
                    transition: "all 0.15s",
                  }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: sel ? M.amber : M.text1, margin: "0 0 3px" }}>{r.label}</p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: sel ? "rgba(245,193,24,0.65)" : M.text3, margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
                  </div>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    border: `2px solid ${sel ? M.amber : M.text3}`,
                    background: sel ? M.amber : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {sel && <Check size={8} color={M.DARK1} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error */}
          {status === "error" && (
            <div style={{ padding: "8px 11px", borderRadius: 8, marginBottom: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p style={{ fontFamily: FONT, fontSize: 12, color: M.error, margin: 0 }}>{c.errorMsg}</p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: 9,
                border: `1.5px solid ${M.border2}`, background: M.surface,
                fontFamily: FONT, fontSize: 13, fontWeight: 600,
                color: M.text2, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = M.text3; e.currentTarget.style.color = M.text1; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}
            >
              {c.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={status === "saving" || status === "saved" || !hasChanged}
              style={{
                flex: 2, padding: "10px", borderRadius: 9, border: "none",
                background: status === "saved"
                  ? "rgba(74,222,128,0.15)"
                  : !hasChanged
                    ? M.border
                    : M.amber,
                fontFamily: FONT, fontSize: 13, fontWeight: 700,
                color: status === "saved"
                  ? M.green
                  : !hasChanged
                    ? M.text3
                    : M.DARK1,
                cursor: (!hasChanged || status === "saving" || status === "saved") ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "all 0.18s",
                opacity: status === "saving" ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (hasChanged && status === "idle") e.currentTarget.style.background = M.amberD; }}
              onMouseLeave={e => { if (hasChanged && status === "idle") e.currentTarget.style.background = M.amber; }}
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