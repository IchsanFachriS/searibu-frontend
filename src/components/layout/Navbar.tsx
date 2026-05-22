import React, { useState, useEffect, useRef } from "react";
import {
  LogIn, X, Eye, EyeOff, CheckCircle, Loader2,
  LogOut, ChevronDown, Anchor, Menu, User, FlaskConical, Check,
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useLanguage } from "../../context/LanguageContext";
import { SubscriptionStatusBadge } from "../subscription";
import { useSubContext } from "../../context/SubscriptionContext";
import { ProfileModal } from "../profile/ProfileModal";
import { ShieldCheck } from "lucide-react";
import { AdminPanel } from "../admin/AdminPanel";
import type { UserRole, AuthUser } from "../../types";

const API         = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SANS        = '"Montserrat", system-ui, sans-serif';
const NAVY        = "#024e78";
const PRIMARY     = "#0369a1";
const PRIMARY_SOFT= "#0ea5e9";

type ModalType = "signin" | "signup" | null;
type SignupStep = 1 | 2;   // step 1 = name/email/pass, step 2 = role selection

const NAV_KEYS   = ["home", "webgis", "about", "guide"] as const;
const NAV_LABELS = {
  en: ["Home", "WebGIS", "About", "Guide"],
  id: ["Beranda", "WebGIS", "Tentang", "Panduan"],
};

const ROLE_OPTS: { value: UserRole; labelEn: string; labelId: string; descEn: string; descId: string; icon: React.ReactNode }[] = [
  {
    value:   "general",
    labelEn: "General User",
    labelId: "Pengguna Umum",
    descEn:  "Marine tourism, safety check, activity guide, weather.",
    descId:  "Wisata bahari, cek keamanan, panduan aktivitas, cuaca.",
    icon:    <User size={16} />,
  },
  {
    value:   "researcher",
    labelEn: "Researcher / Professional",
    labelId: "Peneliti / Profesional",
    descEn:  "Full technical access including S-104 HDF5 export (Pro required).",
    descId:  "Akses teknis penuh termasuk ekspor S-104 HDF5 (butuh Pro).",
    icon:    <FlaskConical size={16} />,
  },
];

async function apiRegister(fullName: string, email: string, password: string, role: UserRole) {
  const res = await fetch(`${API}/api/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ full_name: fullName, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { message: string; user: AuthUser };
}

async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as { message: string; user: AuthUser };
}

/* ── InputField ─────────────────────────────────────────────────────────── */
const InputField: React.FC<{
  label:         string;
  type?:         string;
  value:         string;
  onChange:      (v: string) => void;
  placeholder?:  string;
  error?:        string;
  autoComplete?: string;
}> = ({ label, type = "text", value, onChange, placeholder, error, autoComplete }) => {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, fontFamily: SANS, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword ? (showPass ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`, fontSize: 13, fontFamily: SANS, background: error ? "#fef2f2" : "#f8fafc", outline: "none", boxSizing: "border-box" as const, color: "#0f172a", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = error ? "#f87171" : PRIMARY; e.currentTarget.style.background = "#fff"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = error ? "#fef2f2" : "#f8fafc"; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 11, color: "#dc2626", fontFamily: SANS }}>{error}</p>}
    </div>
  );
};

/* ── GoogleButton ───────────────────────────────────────────────────────── */
const GoogleButton: React.FC<{ label: string; onClick: () => void; loading?: boolean }> = ({ label, onClick, loading }) => (
  <button onClick={onClick} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 16px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#374151", opacity: loading ? 0.7 : 1 }}>
    {loading ? <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite", color: "#9ca3af" }} /> : (
      <svg width="17" height="17" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    )}
    <span>{loading ? "Connecting…" : label}</span>
  </button>
);

const OrDivider: React.FC<{ language: string }> = ({ language }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    <span style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8" }}>{language === "id" ? "atau" : "or"}</span>
    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
  </div>
);

/* ── RoleStep — step 2 of signup ────────────────────────────────────────── */
const RoleStep: React.FC<{
  selectedRole: UserRole;
  onSelect:     (r: UserRole) => void;
  language:     string;
}> = ({ selectedRole, onSelect, language }) => (
  <div>
    <p style={{ fontFamily: SANS, fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.55 }}>
      {language === "id"
        ? "Pilih jenis akun Anda. Anda dapat mengubahnya nanti di profil."
        : "Choose your account type. You can change this later in your profile."}
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ROLE_OPTS.map((r) => {
        const isSelected = selectedRole === r.value;
        return (
          <button
            key={r.value}
            onClick={() => onSelect(r.value)}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 14px", borderRadius: 10, width: "100%", textAlign: "left",
              border: isSelected ? `2px solid ${PRIMARY}` : "1.5px solid #e2e8f0",
              background: isSelected ? "#eff8ff" : "#fff",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#bfdbfe"; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: isSelected ? PRIMARY : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "#fff" : "#64748b", transition: "all 0.15s" }}>
              {r.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: isSelected ? PRIMARY : "#0f172a", margin: "0 0 2px" }}>
                {language === "id" ? r.labelId : r.labelEn}
              </p>
              <p style={{ fontFamily: SANS, fontSize: 11, color: isSelected ? "#0369a1" : "#94a3b8", margin: 0, lineHeight: 1.45 }}>
                {language === "id" ? r.descId : r.descEn}
              </p>
            </div>
            <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${isSelected ? PRIMARY : "#cbd5e1"}`, background: isSelected ? PRIMARY : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {isSelected && <Check size={9} color="#fff" />}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* ── AuthModal ──────────────────────────────────────────────────────────── */
const AuthModal: React.FC<{
  mode:      ModalType;
  onClose:   () => void;
  onSwitch:  (m: ModalType) => void;
  onSuccess: (user: AuthUser, msg: string) => void;
  language:  string;
}> = ({ mode, onClose, onSwitch, onSuccess, language }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sign-in state
  const [siEmail, setSiEmail] = useState("");
  const [siPass,  setSiPass]  = useState("");
  const [siErr,   setSiErr]   = useState("");
  const [siLoad,  setSiLoad]  = useState(false);

  // Sign-up state — step 1
  const [suName,  setSuName]  = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass,  setSuPass]  = useState("");
  const [suErrs,  setSuErrs]  = useState<Record<string, string>>({});
  const [suApi,   setSuApi]   = useState("");
  const [suLoad,  setSuLoad]  = useState(false);
  const [suStep,  setSuStep]  = useState<SignupStep>(1);
  const [suRole,  setSuRole]  = useState<UserRole>("general");

  // Google
  const [googleLoad, setGoogleLoad] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { if (suStep === 2) setSuStep(1); else onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, suStep]);

  // Reset on open
  useEffect(() => {
    if (mode) {
      setSuStep(1);
      setSuRole("general");
      setSuErrs({});
      setSuApi("");
    }
  }, [mode]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoad(true);
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch Google profile");
        const profile = await res.json();
        const backendRes = await fetch(`${API}/api/auth/google`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: profile.email, full_name: profile.name, google_id: profile.sub, avatar: profile.picture }),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          onSuccess({ ...data.user, avatar: profile.picture }, data.message);
        } else {
          onSuccess({ id: 0, full_name: profile.name, email: profile.email, role: "general", created_at: new Date().toISOString(), avatar: profile.picture, is_admin: false }, language === "id" ? "Berhasil masuk dengan Google!" : "Signed in with Google!");
        }
      } catch (e: any) {
        const msg = e.message || "Google sign-in failed";
        setSiErr(msg); setSuApi(msg);
      } finally { setGoogleLoad(false); }
    },
    onError: () => {
      setGoogleLoad(false);
      const msg = language === "id" ? "Login Google dibatalkan" : "Google sign-in was cancelled";
      setSiErr(msg); setSuApi(msg);
    },
    flow: "implicit",
  });

  if (!mode) return null;
  const isSignIn = mode === "signin";

  const doSignIn = async () => {
    setSiErr("");
    if (!siEmail) { setSiErr("Email is required"); return; }
    if (!siPass)  { setSiErr("Password is required"); return; }
    setSiLoad(true);
    try { const r = await apiLogin(siEmail, siPass); onSuccess(r.user, r.message); }
    catch (e: any) { setSiErr(e.message); }
    finally { setSiLoad(false); }
  };

  // Step 1 validation — proceed to role step
  const doStep1 = () => {
    setSuApi("");
    const e: Record<string, string> = {};
    if (!suName.trim() || suName.trim().length < 2)       e.name  = "Name must be at least 2 characters";
    if (!suEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))     e.email = "Invalid email format";
    if (suPass.length < 6)                                 e.pass  = "Password must be at least 6 characters";
    setSuErrs(e);
    if (!Object.keys(e).length) setSuStep(2);
  };

  // Step 2 — final register
  const doSignUp = async () => {
    setSuLoad(true);
    try { const r = await apiRegister(suName, suEmail, suPass, suRole); onSuccess(r.user, r.message); }
    catch (err: any) { setSuApi(err.message); setSuStep(1); }
    finally { setSuLoad(false); }
  };

  const primaryBtn: React.CSSProperties = {
    width: "100%", padding: "11px", borderRadius: 7, border: "none", cursor: "pointer",
    fontFamily: SANS, fontSize: 13, fontWeight: 600,
    background: PRIMARY, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background 0.2s",
  };

  const googleLabel = isSignIn
    ? (language === "id" ? "Masuk dengan Google" : "Continue with Google")
    : (language === "id" ? "Daftar dengan Google" : "Continue with Google");

  // Step indicator for sign-up
  const StepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {([1, 2] as SignupStep[]).map((s, i) => (
        <React.Fragment key={s}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: suStep >= s ? PRIMARY : "#e2e8f0",
            fontSize: 10, fontWeight: 700, fontFamily: SANS,
            color: suStep >= s ? "#fff" : "#94a3b8",
            transition: "all 0.2s",
          }}>
            {suStep > s ? <Check size={11} /> : s}
          </div>
          {i === 0 && <div style={{ flex: 1, height: 2, background: suStep > 1 ? PRIMARY : "#e2e8f0", transition: "background 0.3s" }} />}
        </React.Fragment>
      ))}
      <span style={{ fontFamily: SANS, fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 4 }}>
        {suStep === 1
          ? (language === "id" ? "Data akun" : "Account info")
          : (language === "id" ? "Jenis akun" : "Account type")}
      </span>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(2,78,120,0.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, WebkitBackdropFilter: "blur(6px)", padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px 24px 24px", width: "100%", maxWidth: 400, position: "relative", boxShadow: "0 20px 60px rgba(2,78,120,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, borderRadius: 6 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
          <X size={14} />
        </button>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Anchor size={13} color="#fff" />
            </div>
            <h2 style={{ fontFamily: SANS, fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {isSignIn
                ? (language === "id" ? "Masuk ke Searibu" : "Sign In to Searibu")
                : suStep === 1
                ? (language === "id" ? "Buat Akun Baru" : "Create Account")
                : (language === "id" ? "Jenis Akun" : "Account Type")}
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 12, color: "#94a3b8", marginLeft: 38 }}>
            {isSignIn
              ? (language === "id" ? "Selamat datang kembali" : "Welcome back")
              : (language === "id" ? "Bergabunglah dengan Searibu" : "Join the Searibu community")}
          </p>
        </div>

        {/* SIGN IN */}
        {isSignIn && (
          <>
            <GoogleButton label={googleLabel} onClick={() => handleGoogleLogin()} loading={googleLoad} />
            <OrDivider language={language} />
            <InputField label="Email" type="email" value={siEmail} onChange={setSiEmail} placeholder="name@email.com" autoComplete="email" />
            <InputField label="Password" type="password" value={siPass} onChange={setSiPass} placeholder="••••••••" autoComplete="current-password" />
            {siErr && <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 7, background: "#fef2f2", border: "1px solid #fca5a5" }}><p style={{ fontSize: 12, color: "#dc2626", fontFamily: SANS, margin: 0 }}>{siErr}</p></div>}
            <button onClick={doSignIn} disabled={siLoad} style={{ ...primaryBtn, opacity: siLoad ? 0.65 : 1, marginTop: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = NAVY)} onMouseLeave={(e) => (e.currentTarget.style.background = PRIMARY)}>
              {siLoad && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
              {language === "id" ? "Masuk" : "Sign In"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#64748b", fontFamily: SANS }}>
              {language === "id" ? "Belum punya akun?" : "Don't have an account?"}{" "}
              <button onClick={() => onSwitch("signup")} style={{ background: "none", border: "none", cursor: "pointer", color: PRIMARY, fontWeight: 600, fontSize: 12, fontFamily: SANS, textDecoration: "underline" }}>
                {language === "id" ? "Daftar" : "Sign up"}
              </button>
            </p>
          </>
        )}

        {/* SIGN UP — STEP 1 */}
        {!isSignIn && suStep === 1 && (
          <>
            <GoogleButton label={googleLabel} onClick={() => handleGoogleLogin()} loading={googleLoad} />
            <OrDivider language={language} />
            <StepIndicator />
            <InputField label={language === "id" ? "Nama Lengkap" : "Full Name"} value={suName} onChange={setSuName} placeholder="Full name" error={suErrs.name} autoComplete="name" />
            <InputField label="Email" type="email" value={suEmail} onChange={setSuEmail} placeholder="name@email.com" error={suErrs.email} autoComplete="email" />
            <InputField label="Password" type="password" value={suPass} onChange={setSuPass} placeholder="Min. 6 characters" error={suErrs.pass} autoComplete="new-password" />
            {suApi && <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 7, background: "#fef2f2", border: "1px solid #fca5a5" }}><p style={{ fontSize: 12, color: "#dc2626", fontFamily: SANS, margin: 0 }}>{suApi}</p></div>}
            <button onClick={doStep1} style={{ ...primaryBtn, marginTop: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = NAVY)} onMouseLeave={(e) => (e.currentTarget.style.background = PRIMARY)}>
              {language === "id" ? "Lanjut" : "Continue"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#64748b", fontFamily: SANS }}>
              {language === "id" ? "Sudah punya akun?" : "Already have an account?"}{" "}
              <button onClick={() => onSwitch("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: PRIMARY, fontWeight: 600, fontSize: 12, fontFamily: SANS, textDecoration: "underline" }}>
                {language === "id" ? "Masuk" : "Sign in"}
              </button>
            </p>
          </>
        )}

        {/* SIGN UP — STEP 2: ROLE */}
        {!isSignIn && suStep === 2 && (
          <>
            <StepIndicator />
            <RoleStep selectedRole={suRole} onSelect={setSuRole} language={language} />
            {suApi && <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 7, background: "#fef2f2", border: "1px solid #fca5a5" }}><p style={{ fontSize: 12, color: "#dc2626", fontFamily: SANS, margin: 0 }}>{suApi}</p></div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setSuStep(1)} style={{ flex: 1, padding: "10px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                {language === "id" ? "Kembali" : "Back"}
              </button>
              <button onClick={doSignUp} disabled={suLoad} style={{ flex: 2, ...primaryBtn, opacity: suLoad ? 0.65 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = NAVY)} onMouseLeave={(e) => (e.currentTarget.style.background = PRIMARY)}>
                {suLoad && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
                {language === "id" ? "Daftar Sekarang" : "Create Account"}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── UserDropdown ───────────────────────────────────────────────────────── */
const UserDropdown: React.FC<{ user: AuthUser; onLogout: () => void; language: string }> = ({ user, onLogout, language }) => {
  const [open,        setOpen]        = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen,   setAdminOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
 
  const initials    = user.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const roleLabelEn = user.role === "researcher" ? "Researcher" : "General User";
  const roleLabelId = user.role === "researcher" ? "Peneliti"   : "Pengguna Umum";
  const isAdmin     = user.is_admin === true;
 
  return (
    <>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {user.avatar
            ? <img src={user.avatar} alt={user.full_name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(14,165,233,0.4)" }} />
            : <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${NAVY},${PRIMARY})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: SANS, flexShrink: 0 }}>{initials}</div>
          }
          <span className="nb-username" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "#fff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.full_name.split(" ")[0]}
          </span>
          <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.6)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
 
        {open && (
          <div style={{ position: "absolute", right: 0, top: 42, width: 220, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 32px rgba(2,78,120,0.14)", overflow: "hidden", zIndex: 200 }}>
 
            {/* User info */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${NAVY},${PRIMARY})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: SANS, flexShrink: 0 }}>{initials}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.full_name}</p>
                  <p style={{ fontFamily: SANS, fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
                </div>
              </div>
 
              {/* Badges row */}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {/* Role badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: user.role === "researcher" ? "#eff8ff" : "#f8fafc", border: `1px solid ${user.role === "researcher" ? "#bfdbfe" : "#e2e8f0"}` }}>
                  {user.role === "researcher"
                    ? <FlaskConical size={9} color={PRIMARY} />
                    : <User        size={9} color="#64748b" />}
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: user.role === "researcher" ? PRIMARY : "#64748b" }}>
                    {language === "id" ? roleLabelId : roleLabelEn}
                  </span>
                </div>
 
                {/* Admin badge */}
                {isAdmin && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)" }}>
                    <ShieldCheck size={9} color="#d97706" />
                    <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: "#d97706" }}>Admin</span>
                  </div>
                )}
              </div>
            </div>
 
            {/* Admin Panel button — only for admins */}
            {isAdmin && (
              <button
                onClick={() => { setOpen(false); setAdminOpen(true); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 600, color: "#d97706", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,191,36,0.07)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <ShieldCheck size={13} />
                {language === "id" ? "Panel Admin" : "Admin Panel"}
              </button>
            )}
 
            {/* Profile button */}
            <button
              onClick={() => { setOpen(false); setProfileOpen(true); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 500, color: "#374151", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <User size={13} color="#64748b" />
              {language === "id" ? "Profil & Jenis Akun" : "Profile & Account Type"}
            </button>
 
            {/* Logout */}
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 500, color: "#dc2626", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={13} />
              {language === "id" ? "Keluar" : "Sign Out"}
            </button>
          </div>
        )}
      </div>
 
      {/* Modals */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        language={language as "en" | "id"}
      />
      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        language={language as "en" | "id"}
      />
    </>
  );
};

/* ── SuccessToast ───────────────────────────────────────────────────────── */
const SuccessToast: React.FC<{ message: string; userName: string; onClose: () => void }> = ({ message, userName, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 300, pointerEvents: "none", width: "calc(100% - 32px)", maxWidth: 360 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "11px 16px", boxShadow: "0 8px 32px rgba(22,163,74,0.14)", position: "relative", overflow: "hidden" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle size={15} style={{ color: "#16a34a" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 1 }}>{message}</p>
          <p style={{ fontFamily: SANS, fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: PRIMARY, fontWeight: 600 }}>{userName}</span>
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: "#16a34a", animation: "shrinkBar 4s linear forwards" }} />
      </div>
      <style>{`@keyframes shrinkBar { from { width: 100%; } to { width: 0; } }`}</style>
    </div>
  );
};

/* ── Navbar ─────────────────────────────────────────────────────────────── */
interface NavbarProps { activePage: string; setActivePage: (p: string) => void; }

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { language, setLanguage } = useLanguage();
  const { user: currentUser, setUser: setCurrentUser } = useSubContext();
  const [modal,      setModal]      = useState<ModalType>(null);
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [toast,      setToast]      = useState<{ message: string; userName: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [activePage]);

  const handleSuccess = (user: AuthUser, msg: string) => {
    setCurrentUser(user);
    setModal(null);
    setToast({ message: msg, userName: user.full_name });
  };

  const navLabels = NAV_LABELS[language as "en" | "id"];
  const onHome    = activePage === "home";
  const glass     = !isMobile && onHome && !scrolled;

  return (
    <>
      {toast && <SuccessToast message={toast.message} userName={toast.userName} onClose={() => setToast(null)} />}

      <style>{`
        .nb-link { font-family:'Montserrat',system-ui,sans-serif; font-size:13px; font-weight:600; letter-spacing:0.04em; border:none; background:none; cursor:pointer; padding:6px 2px; position:relative; transition:color 0.18s ease; white-space:nowrap; }
        .nb-link::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px; background:${PRIMARY_SOFT}; transform:scaleX(0); transform-origin:left; transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); border-radius:1px; }
        .nb-link.active::after, .nb-link:hover::after { transform:scaleX(1); }
        .nb-signin { font-family:'Montserrat',system-ui,sans-serif; font-size:12px; font-weight:600; letter-spacing:0.04em; border:1.5px solid; border-radius:7px; padding:6px 12px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.2s ease; white-space:nowrap; }
        .nb-mobile-link { display:block; width:100%; font-family:'Montserrat',system-ui,sans-serif; font-size:14px; font-weight:500; padding:14px 20px; background:none; border:none; cursor:pointer; text-align:left; color:#374151; border-left:3px solid transparent; transition:background 0.15s,color 0.15s,border-color 0.15s; }
        .nb-mobile-link.active { color:${PRIMARY}; border-left-color:${PRIMARY_SOFT}; background:rgba(3,105,161,0.06); font-weight:600; }
        .nb-mobile-link:hover { background:#f1f5f9; }
        .nb-mobile-drawer { position:fixed; top:62px; left:0; right:0; background:rgba(255,255,255,0.99); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-bottom:1px solid #e2e8f0; z-index:148; padding:6px 0 16px; box-shadow:0 8px 24px rgba(2,78,120,0.09); animation:drawerIn 0.2s ease; max-height:calc(100vh - 62px); overflow-y:auto; }
        @keyframes drawerIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .nb-mobile-overlay { position:fixed; inset:0; top:62px; background:rgba(2,78,120,0.25); z-index:147; }
        @media (max-width:380px) { .nb-username { display:none !important; } }
        @media (min-width:769px) { .nb-mobile-drawer{display:none!important;} .nb-hamburger{display:none!important;} .nb-mobile-overlay{display:none!important;} }
        @media (max-width:768px) { .nb-desktop-nav{display:none!important;} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 150, height: 62, background: glass ? "linear-gradient(to bottom,rgba(2,78,120,0.75) 0%,rgba(2,78,120,0) 100%)" : "rgba(2,78,120,0.97)", backdropFilter: scrolled ? "blur(18px)" : "none", WebkitBackdropFilter: scrolled ? "blur(18px)" : "none", borderBottom: glass ? "none" : "1px solid rgba(14,165,233,0.15)", boxShadow: scrolled && !glass ? "0 1px 12px rgba(2,78,120,0.20)" : "none", transition: "background 0.32s ease" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", padding: "0 14px", gap: 0 }}>
          <button onClick={() => setActivePage("home")} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginRight: 28, flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <img src="/logo.svg" alt="Searibu" style={{ height: 32, width: "auto", display: "block", filter: "brightness(0) invert(1)" }} />
          </button>

          <nav className="nb-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}>
            {navLabels.map((label, i) => (
              <button key={NAV_KEYS[i]} onClick={() => setActivePage(NAV_KEYS[i])} className={`nb-link ${activePage === NAV_KEYS[i] ? "active" : ""}`} style={{ color: activePage === NAV_KEYS[i] ? "#fff" : "rgba(255,255,255,0.65)" }}>
                {label}
              </button>
            ))}
          </nav>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(255,255,255,0.10)", borderRadius: 8, padding: "3px" }}>
              {(["en", "id"] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", padding: "4px 8px", borderRadius: 5, border: "none", cursor: "pointer", transition: "all 0.18s", background: language === l ? "rgba(255,255,255,0.22)" : "transparent", color: language === l ? "#fff" : "rgba(255,255,255,0.45)" }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <SubscriptionStatusBadge language={language as "en" | "id"} />
            {currentUser
              ? <UserDropdown user={currentUser} onLogout={() => setCurrentUser(null)} language={language} />
              : (
                <button onClick={() => setModal("signin")} className="nb-signin" style={{ borderColor: "rgba(255,255,255,0.40)", color: "rgba(255,255,255,0.90)", background: "rgba(255,255,255,0.08)" }} onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = PRIMARY_SOFT; b.style.borderColor = PRIMARY_SOFT; b.style.color = "#fff"; }} onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = "rgba(255,255,255,0.08)"; b.style.borderColor = "rgba(255,255,255,0.40)"; b.style.color = "rgba(255,255,255,0.90)"; }}>
                  <LogIn size={12} />
                  {language === "id" ? "Masuk" : "Sign In"}
                </button>
              )
            }
            <button className="nb-hamburger" onClick={() => setMobileOpen((o) => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 7, color: "#fff", display: "flex", alignItems: "center", flexShrink: 0 }}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="nb-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && (
        <div className="nb-mobile-drawer">
          {navLabels.map((label, i) => (
            <button key={NAV_KEYS[i]} onClick={() => setActivePage(NAV_KEYS[i])} className={`nb-mobile-link ${activePage === NAV_KEYS[i] ? "active" : ""}`}>{label}</button>
          ))}
        </div>
      )}

      <AuthModal mode={modal} onClose={() => setModal(null)} onSwitch={setModal} onSuccess={handleSuccess} language={language} />
    </>
  );
};