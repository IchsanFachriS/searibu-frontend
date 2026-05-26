import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogIn, X, Eye, EyeOff, CheckCircle, Loader2,
  LogOut, ChevronDown, Anchor, Menu, User, FlaskConical, Check,
  Zap, ShieldCheck, Waves,
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useLanguage }    from "../../context/LanguageContext";
import { useSubContext }  from "../../context/SubscriptionContext";
import { ProfileModal }   from "../profile/ProfileModal";
import { AdminPanel }     from "../admin/AdminPanel";
import { PricingModal }   from "../subscription/PricingModal";
import type { UserRole, AuthUser } from "../../types";

const API       = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FONT      = "'Inter', system-ui, sans-serif";
const DARK1     = "#2b2b2b";
const OFF_WHITE = "#f5f0e8";
const AMBER     = "#f5c518";
const GREEN     = "#9de05a";
const BLUE_DEEP = "#1a3bbf";

type ModalType  = "signin" | "signup" | null;
type SignupStep = 1 | 2;

const NAV_ROUTES: Record<string, string> = { home: "/", webgis: "/webgis", about: "/about", guide: "/guide" };
const ROUTE_TO_KEY: Record<string, string> = { "/": "home", "/webgis": "webgis", "/about": "about", "/guide": "guide" };
const NAV_KEYS   = ["home", "webgis", "about", "guide"] as const;
const NAV_LABELS = { en: ["Home", "WebGIS", "About", "Guide"], id: ["Beranda", "WebGIS", "Tentang", "Panduan"] };

const ROLE_OPTS: { value: UserRole; labelEn: string; labelId: string; descEn: string; descId: string; icon: React.ReactNode }[] = [
  { value: "general",    labelEn: "General User",              labelId: "Pengguna Umum",       descEn: "Marine tourism, safety check, activity guide, weather.", descId: "Wisata bahari, cek keamanan, panduan aktivitas, cuaca.", icon: <User size={15} /> },
  { value: "researcher", labelEn: "Researcher / Professional", labelId: "Peneliti / Profesional", descEn: "Full technical access including S-104 HDF5 export (Pro required).", descId: "Akses teknis penuh termasuk ekspor S-104 HDF5 (butuh Pro).", icon: <FlaskConical size={15} /> },
];

async function apiRegister(fullName: string, email: string, password: string, role: UserRole) {
  const res  = await fetch(`${API}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, email, password, role }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { message: string; user: AuthUser };
}

async function apiLogin(email: string, password: string) {
  const res  = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as { message: string; user: AuthUser };
}

/* ── Design tokens untuk auth modal — konsisten dengan Searibu ── */
const M = {
  bg:      "#0f1824",    /* dark navy background — meniru atmosphere nautical */
  surface: "#162030",    /* card background */
  border:  "#1e3044",    /* subtle border */
  border2: "#243548",    /* sedikit lebih terang */
  amber:   "#f5c518",    /* amber accent = Searibu brand */
  amberD:  "#d4a814",    /* amber hover */
  sky:     "#38bdf8",    /* input focus */
  text1:   "#f0f6ff",    /* primary text */
  text2:   "#8ba3be",    /* muted text */
  text3:   "#4a6580",    /* faintest */
  error:   "#f87171",
  green:   "#4ade80",
};

/* ── InputField — redesign sesuai tema dark nautical ── */
const InputField: React.FC<{ label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; autoComplete?: string }> = ({ label, type = "text", value, onChange, placeholder, error, autoComplete }) => {
  const [showPass, setShowPass] = useState(false);
  const isPwd = type === "password";
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, fontFamily: FONT, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: M.text2, marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPwd ? (showPass ? "text" : "password") : type}
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${error ? "#ef4444" : M.border2}`, fontSize: 13, fontFamily: FONT, background: error ? "rgba(239,68,68,0.06)" : M.surface, outline: "none", boxSizing: "border-box" as const, color: M.text1, transition: "border-color 0.18s, box-shadow 0.18s" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = error ? "#f87171" : M.sky; e.currentTarget.style.boxShadow = error ? "none" : `0 0 0 3px rgba(56,189,248,0.12)`; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = error ? "#ef4444" : M.border2; e.currentTarget.style.boxShadow = "none"; }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: M.text3 }}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && <p style={{ marginTop: 5, fontSize: 11, color: M.error, fontFamily: FONT }}>{error}</p>}
    </div>
  );
};

/* ── GoogleButton ── */
const GoogleButton: React.FC<{ label: string; onClick: () => void; loading?: boolean }> = ({ label, onClick, loading }) => (
  <button onClick={onClick} disabled={loading}
    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 16px", borderRadius: 9, border: `1.5px solid ${M.border2}`, background: M.surface, cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: M.text1, opacity: loading ? 0.7 : 1, transition: "all 0.15s" }}
    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = M.border; e.currentTarget.style.background = M.border; }}
    onMouseLeave={(e) => { if (!loading) e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.background = M.surface; }}>
    {loading
      ? <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite", color: M.text2 }} />
      : <svg width="17" height="17" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>}
    <span>{loading ? (label.includes("Sign") ? "Connecting…" : "Menghubungkan…") : label}</span>
  </button>
);

const OrDivider: React.FC<{ language: string }> = ({ language }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
    <div style={{ flex: 1, height: 1, background: M.border2 }} />
    <span style={{ fontFamily: FONT, fontSize: 11, color: M.text3 }}>{language === "id" ? "atau" : "or"}</span>
    <div style={{ flex: 1, height: 1, background: M.border2 }} />
  </div>
);

/* ── RoleStep ── */
const RoleStep: React.FC<{ selectedRole: UserRole; onSelect: (r: UserRole) => void; language: string }> = ({ selectedRole, onSelect, language }) => (
  <div>
    <p style={{ fontFamily: FONT, fontSize: 12, color: M.text2, marginBottom: 14, lineHeight: 1.6 }}>
      {language === "id" ? "Pilih jenis akun Anda. Dapat diubah nanti di profil." : "Choose your account type. You can change this later in your profile."}
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ROLE_OPTS.map((r) => {
        const sel = selectedRole === r.value;
        return (
          <button key={r.value} onClick={() => onSelect(r.value)}
            style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, width: "100%", textAlign: "left", border: sel ? `1.5px solid ${M.amber}` : `1.5px solid ${M.border2}`, background: sel ? "rgba(245,193,24,0.08)" : M.surface, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = M.border; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = M.border2; }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: sel ? "rgba(245,193,24,0.15)" : M.border, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? M.amber : M.text2, transition: "all 0.15s" }}>
              {r.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: sel ? M.amber : M.text1, margin: "0 0 2px" }}>{language === "id" ? r.labelId : r.labelEn}</p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: sel ? "rgba(245,193,24,0.7)" : M.text3, margin: 0, lineHeight: 1.5 }}>{language === "id" ? r.descId : r.descEn}</p>
            </div>
            <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${sel ? M.amber : M.text3}`, background: sel ? M.amber : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {sel && <Check size={9} color={DARK1} />}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* ── AuthModal — redesigned dark nautical ── */
const AuthModal: React.FC<{ mode: ModalType; onClose: () => void; onSwitch: (m: ModalType) => void; onSuccess: (user: AuthUser, msg: string) => void; language: string }> = ({ mode, onClose, onSwitch, onSuccess, language }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [siEmail, setSiEmail] = useState(""); const [siPass,  setSiPass]  = useState(""); const [siErr,   setSiErr]   = useState(""); const [siLoad,  setSiLoad]  = useState(false);
  const [suName,  setSuName]  = useState(""); const [suEmail, setSuEmail] = useState(""); const [suPass,  setSuPass]  = useState(""); const [suErrs,  setSuErrs]  = useState<Record<string, string>>({}); const [suApi,   setSuApi]   = useState(""); const [suLoad,  setSuLoad]  = useState(false); const [suStep,  setSuStep]  = useState<SignupStep>(1); const [suRole,  setSuRole]  = useState<UserRole>("general");
  const [gLoad,   setGLoad]   = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { if (suStep === 2) setSuStep(1); else onClose(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose, suStep]);
  useEffect(() => { if (mode) { setSuStep(1); setSuRole("general"); setSuErrs({}); setSuApi(""); setSiErr(""); } }, [mode]);

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tok) => {
      setGLoad(true);
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } });
        if (!res.ok) throw new Error("Google profile fetch failed");
        const p = await res.json();
        const br = await fetch(`${API}/api/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: p.email, full_name: p.name, google_id: p.sub, avatar: p.picture }) });
        if (br.ok) { const d = await br.json(); onSuccess({ ...d.user, avatar: p.picture }, d.message); }
        else onSuccess({ id: 0, full_name: p.name, email: p.email, role: "general", created_at: new Date().toISOString(), avatar: p.picture, is_admin: false }, language === "id" ? "Berhasil masuk!" : "Signed in!");
      } catch (e: any) { const m = e.message || "Google sign-in failed"; setSiErr(m); setSuApi(m); }
      finally { setGLoad(false); }
    },
    onError: () => { setGLoad(false); const m = language === "id" ? "Login Google dibatalkan" : "Google sign-in was cancelled"; setSiErr(m); setSuApi(m); },
    flow: "implicit",
  });

  if (!mode) return null;
  const isSignIn = mode === "signin";

  const doSignIn = async () => {
    setSiErr(""); if (!siEmail) { setSiErr("Email is required"); return; } if (!siPass) { setSiErr("Password is required"); return; }
    setSiLoad(true);
    try { const r = await apiLogin(siEmail, siPass); onSuccess(r.user, r.message); }
    catch (e: any) { setSiErr(e.message); } finally { setSiLoad(false); }
  };

  const doStep1 = () => {
    setSuApi(""); const e: Record<string, string> = {};
    if (!suName.trim() || suName.trim().length < 2) e.name  = "Name must be at least 2 characters";
    if (!suEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Invalid email format";
    if (suPass.length < 6) e.pass = "Password must be at least 6 characters";
    setSuErrs(e); if (!Object.keys(e).length) setSuStep(2);
  };

  const doSignUp = async () => {
    setSuLoad(true);
    try { const r = await apiRegister(suName, suEmail, suPass, suRole); onSuccess(r.user, r.message); }
    catch (err: any) { setSuApi(err.message); setSuStep(1); } finally { setSuLoad(false); }
  };

  const gLabel = isSignIn ? (language === "id" ? "Masuk dengan Google" : "Continue with Google") : (language === "id" ? "Daftar dengan Google" : "Continue with Google");

  const primaryBtn: React.CSSProperties = { width: "100%", padding: "11px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 700, background: M.amber, color: DARK1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" };

  const StepDots = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {([1, 2] as SignupStep[]).map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: suStep >= s ? M.amber : M.border2, fontSize: 10, fontWeight: 700, fontFamily: FONT, color: suStep >= s ? DARK1 : M.text3, transition: "all 0.2s" }}>
            {suStep > s ? <Check size={11} color={DARK1} /> : s}
          </div>
          {i === 0 && <div style={{ flex: 1, height: 2, background: suStep > 1 ? M.amber : M.border2, transition: "background 0.3s" }} />}
        </React.Fragment>
      ))}
      <span style={{ fontFamily: FONT, fontSize: 10, color: M.text3, whiteSpace: "nowrap", marginLeft: 4 }}>
        {suStep === 1 ? (language === "id" ? "Data akun" : "Account info") : (language === "id" ? "Jenis akun" : "Account type")}
      </span>
    </div>
  );

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(5,12,24,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: M.bg, border: `1px solid ${M.border}`, borderRadius: 16, padding: 0, width: "100%", maxWidth: 420, position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.60)", maxHeight: "92vh", overflowY: "auto", overflow: "hidden" }}>

        {/* Top accent bar + header */}
        <div style={{ background: `linear-gradient(135deg, rgba(245,193,24,0.12) 0%, rgba(56,189,248,0.08) 100%)`, borderBottom: `1px solid ${M.border}`, padding: "24px 24px 20px" }}>
          {/* Amber top line */}
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <img 
                  src="/logo.svg" 
                  alt="Searibu Logo" 
                  style={{ 
                    height: 24,           /* Mengatur tinggi logo agar pas dengan modal */
                    width: "auto",        /* Menjaga rasio aspek tetap proporsional */
                    display: "block", 
                    filter: "brightness(0) invert(1)", /* Trik CSS untuk mengubah SVG hitam menjadi putih bersih */
                    alignSelf: "flex-start" 
                  }} 
                />
                <h2 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: M.text1, margin: 0, letterSpacing: "-0.01em" }}>
                  {isSignIn
                    ? (language === "id" ? "Masuk" : "Sign In")
                    : suStep === 1
                      ? (language === "id" ? "Buat Akun" : "Create Account")
                      : (language === "id" ? "Jenis Akun" : "Account Type")}
                </h2>
              </div>
            </div>
            <button onClick={onClose} style={{ background: M.border, border: `1px solid ${M.border2}`, cursor: "pointer", borderRadius: 8, padding: 7, display: "flex", color: M.text2, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = M.amber; e.currentTarget.style.color = M.amber; }} onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: M.text2, margin: 0 }}>
            {isSignIn ? (language === "id" ? "Selamat datang kembali di Searibu" : "Welcome back to Searibu") : (language === "id" ? "Bergabunglah dan eksplorasi lautan Seribu" : "Join and explore the Seribu islands")}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {/* Sign In */}
          {isSignIn && (<>
            <GoogleButton label={gLabel} onClick={() => handleGoogle()} loading={gLoad} />
            <OrDivider language={language} />
            <InputField label="Email" type="email" value={siEmail} onChange={setSiEmail} placeholder="name@email.com" autoComplete="email" />
            <InputField label="Password" type="password" value={siPass} onChange={setSiPass} placeholder="••••••••" autoComplete="current-password" />
            {siErr && <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}><p style={{ fontSize: 12, color: M.error, fontFamily: FONT, margin: 0 }}>{siErr}</p></div>}
            <button onClick={doSignIn} disabled={siLoad} style={{ ...primaryBtn, opacity: siLoad ? 0.7 : 1, marginTop: 4 }} onMouseEnter={e => { if (!siLoad) e.currentTarget.style.background = M.amberD; }} onMouseLeave={e => { e.currentTarget.style.background = M.amber; }}>
              {siLoad && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
              {language === "id" ? "Masuk" : "Sign In"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: M.text2, fontFamily: FONT }}>
              {language === "id" ? "Belum punya akun?" : "Don't have an account?"}{" "}
              <button onClick={() => onSwitch("signup")} style={{ background: "none", border: "none", cursor: "pointer", color: M.amber, fontWeight: 600, fontSize: 12, fontFamily: FONT }}>{language === "id" ? "Daftar" : "Sign up"}</button>
            </p>
          </>)}

          {/* Sign Up step 1 */}
          {!isSignIn && suStep === 1 && (<>
            <GoogleButton label={gLabel} onClick={() => handleGoogle()} loading={gLoad} />
            <OrDivider language={language} />
            <StepDots />
            <InputField label={language === "id" ? "Nama Lengkap" : "Full Name"} value={suName} onChange={setSuName} placeholder="Full name" error={suErrs.name} autoComplete="name" />
            <InputField label="Email" type="email" value={suEmail} onChange={setSuEmail} placeholder="name@email.com" error={suErrs.email} autoComplete="email" />
            <InputField label="Password" type="password" value={suPass} onChange={setSuPass} placeholder="Min. 6 characters" error={suErrs.pass} autoComplete="new-password" />
            {suApi && <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}><p style={{ fontSize: 12, color: M.error, fontFamily: FONT, margin: 0 }}>{suApi}</p></div>}
            <button onClick={doStep1} style={{ ...primaryBtn, marginTop: 4 }} onMouseEnter={e => { e.currentTarget.style.background = M.amberD; }} onMouseLeave={e => { e.currentTarget.style.background = M.amber; }}>
              {language === "id" ? "Lanjut" : "Continue"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: M.text2, fontFamily: FONT }}>
              {language === "id" ? "Sudah punya akun?" : "Already have an account?"}{" "}
              <button onClick={() => onSwitch("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: M.amber, fontWeight: 600, fontSize: 12, fontFamily: FONT }}>{language === "id" ? "Masuk" : "Sign in"}</button>
            </p>
          </>)}

          {/* Sign Up step 2 */}
          {!isSignIn && suStep === 2 && (<>
            <StepDots />
            <RoleStep selectedRole={suRole} onSelect={setSuRole} language={language} />
            {suApi && <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}><p style={{ fontSize: 12, color: M.error, fontFamily: FONT, margin: 0 }}>{suApi}</p></div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setSuStep(1)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1.5px solid ${M.border2}`, background: M.surface, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: M.text2, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = M.text3; e.currentTarget.style.color = M.text1; }} onMouseLeave={e => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}>
                {language === "id" ? "Kembali" : "Back"}
              </button>
              <button onClick={doSignUp} disabled={suLoad} style={{ flex: 2, ...primaryBtn, opacity: suLoad ? 0.7 : 1 }} onMouseEnter={e => { if (!suLoad) e.currentTarget.style.background = M.amberD; }} onMouseLeave={e => { e.currentTarget.style.background = M.amber; }}>
                {suLoad && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
                {language === "id" ? "Daftar Sekarang" : "Create Account"}
              </button>
            </div>
          </>)}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── UserDropdown ── */
const UserDropdown: React.FC<{ user: AuthUser; onLogout: () => void; language: string; lightMode?: boolean }> = ({ user, onLogout, language, lightMode = false }) => {
  const [open, setOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [adminOpen, setAdminOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null); const dropRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 }); const DROPDOWN_W = 240;
  const openDrop = () => { if (btnRef.current) { const r = btnRef.current.getBoundingClientRect(); const margin = 8; let left = r.right - DROPDOWN_W; left = Math.max(margin, Math.min(left, window.innerWidth - DROPDOWN_W - margin)); setDropPos({ top: r.bottom + 6, left }); } setOpen(o => !o); };
  useEffect(() => { const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const initials = user.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const isAdmin  = user.is_admin === true;
  const textColor = lightMode ? "#1a1a1a" : OFF_WHITE;
  const hoverBg   = lightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.10)";
  return (
    <>
      <button ref={btnRef} onClick={openDrop} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px", borderRadius: 8, border: lightMode ? "1px solid #e4ddd4" : "none", background: lightMode ? "#f7f4ef" : "transparent", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)} onMouseLeave={(e) => (e.currentTarget.style.background = lightMode ? "#f7f4ef" : "transparent")}>
        {user.avatar ? <img src={user.avatar} alt={user.full_name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(245,193,24,0.5)" }} /> : <div style={{ width: 28, height: 28, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", color: DARK1, fontSize: 11, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>{initials}</div>}
        <span className="nb-username" style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: textColor, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.full_name.split(" ")[0]}</span>
        <ChevronDown size={12} style={{ color: lightMode ? "#6b6b6b" : "rgba(245,240,232,0.55)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div ref={dropRef} style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: DROPDOWN_W, background: "#fff", border: "1px solid #e4ddd4", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.14)", overflow: "hidden", zIndex: 9999 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #f2ede6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {user.avatar ? <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", color: DARK1, fontSize: 12, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>{initials}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.full_name}</p>
                <p style={{ fontFamily: FONT, fontSize: 10, color: "#9a9a9a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" as const }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: user.role === "researcher" ? "#eef1fb" : "#f2ede6", border: `1px solid ${user.role === "researcher" ? "#a0adf5" : "#e4ddd4"}` }}>
                {user.role === "researcher" ? <FlaskConical size={9} color={BLUE_DEEP} /> : <User size={9} color="#6b6b6b" />}
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: user.role === "researcher" ? BLUE_DEEP : "#6b6b6b" }}>{language === "id" ? (user.role === "researcher" ? "Peneliti" : "Pengguna Umum") : (user.role === "researcher" ? "Researcher" : "General User")}</span>
              </div>
              {isAdmin && <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "rgba(245,193,24,0.12)", border: "1px solid rgba(245,193,24,0.35)" }}><ShieldCheck size={9} color="#b8940a" /><span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#b8940a" }}>Admin</span></div>}
            </div>
          </div>
          {isAdmin && <button onClick={() => { setOpen(false); setAdminOpen(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f2ede6", cursor: "pointer", fontSize: 13, fontFamily: FONT, fontWeight: 600, color: "#b8940a", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,193,24,0.07)")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}><ShieldCheck size={13} />{language === "id" ? "Panel Admin" : "Admin Panel"}</button>}
          <button onClick={() => { setOpen(false); setProfileOpen(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f2ede6", cursor: "pointer", fontSize: 13, fontFamily: FONT, fontWeight: 500, color: "#2b2b2b", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#faf8f5")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}><User size={13} color="#6b6b6b" />{language === "id" ? "Profil & Jenis Akun" : "Profile & Account Type"}</button>
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: FONT, fontWeight: 500, color: "#dc2626", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}><LogOut size={13} />{language === "id" ? "Keluar" : "Sign Out"}</button>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} language={language as "en" | "id"} />
      <AdminPanel   open={adminOpen}   onClose={() => setAdminOpen(false)}   language={language as "en" | "id"} />
    </>
  );
};

/* ── MobileSubBadge ── */
const MobileSubBadge: React.FC<{ language: string }> = ({ language }) => {
  const { isPro, isAdmin } = useSubContext(); const [open, setOpen] = useState(false);
  if (isAdmin) return <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, border: "1px solid rgba(245,193,24,0.50)", background: "rgba(245,193,24,0.10)", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#b8940a", userSelect: "none" }}><ShieldCheck size={11} />Admin</div>;
  const label = isPro ? "Pro" : (language === "id" ? "Gratis" : "Free");
  const isProStyle: React.CSSProperties = { border: "1px solid rgba(22,163,74,0.4)", background: "rgba(22,163,74,0.08)", color: "#15803d" };
  const freeStyle:  React.CSSProperties = { border: "1px solid #d1d5db", background: "#f9fafb", color: "#374151" };
  return (<><button onClick={() => setOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: 700, transition: "all 0.15s", ...(isPro ? isProStyle : freeStyle) }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.80")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><Zap size={11} fill={isPro ? "#15803d" : "none"} />{label}</button><PricingModal open={open} onClose={() => setOpen(false)} language={language as "en" | "id"} initialTab={isPro ? "status" : "pricing"} /></>);
};

/* ── SuccessToast ── */
const SuccessToast: React.FC<{ message: string; userName: string; onClose: () => void }> = ({ message, userName, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: 82, left: "50%", transform: "translateX(-50%)", zIndex: 600, pointerEvents: "none", width: "calc(100% - 32px)", maxWidth: 360 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #d4edda", borderRadius: 12, padding: "11px 16px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)", position: "relative", overflow: "hidden" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircle size={15} style={{ color: "#16a34a" }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 1 }}>{message}</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#9a9a9a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ color: BLUE_DEEP, fontWeight: 600 }}>{userName}</span></p>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, background: "#16a34a", animation: "shrinkBar 4s linear forwards" }} />
      </div>
      <style>{`@keyframes shrinkBar { from { width: 100%; } to { width: 0; } }`}</style>
    </div>
  );
};

/* ── DesktopSubBadge ── */
const DesktopSubBadge: React.FC<{ language: string }> = ({ language }) => {
  const { isPro, isAdmin } = useSubContext(); const [open, setOpen] = useState(false);
  if (isAdmin) return <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(245,193,24,0.45)", background: "rgba(245,193,24,0.12)", fontFamily: FONT, fontSize: 11, fontWeight: 700, color: AMBER, userSelect: "none", cursor: "default", letterSpacing: "0.03em" }} title="Admin — full access"><ShieldCheck size={10} fill={AMBER} />Admin</div>;
  const label = isPro ? "Pro" : (language === "id" ? "Free" : "Free");
  return (<><button onClick={() => setOpen(true)} title={isPro ? "Pro plan active" : "Upgrade to Pro"} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, border: isPro ? "1px solid rgba(157,224,90,0.35)" : "1px solid rgba(255,255,255,0.20)", background: isPro ? "rgba(157,224,90,0.12)" : "rgba(255,255,255,0.07)", cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 700, color: isPro ? GREEN : "rgba(245,240,232,0.60)", transition: "all 0.18s", letterSpacing: "0.03em" }} onMouseEnter={(e) => (e.currentTarget.style.background = isPro ? "rgba(157,224,90,0.18)" : "rgba(255,255,255,0.12)")} onMouseLeave={(e) => (e.currentTarget.style.background = isPro ? "rgba(157,224,90,0.12)" : "rgba(255,255,255,0.07)")}><Zap size={10} fill={isPro ? GREEN : "none"} />{label}</button><PricingModal open={open} onClose={() => setOpen(false)} language={language as "en" | "id"} initialTab={isPro ? "status" : "pricing"} /></>);
};

/* ── NAVBAR ── */
export const Navbar: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { user: currentUser, setUser: setCurrentUser } = useSubContext();
  const navigate = useNavigate(); const location = useLocation();
  const activePage = ROUTE_TO_KEY[location.pathname] ?? "home";
  const [modal, setModal] = useState<ModalType>(null); const [scrolled, setScrolled] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [isMobile, setIsMobile] = useState(false); const [toast, setToast] = useState<{ message: string; userName: string } | null>(null);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 8); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => { const check = () => setIsMobile(window.innerWidth <= 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  const handleSuccess = (user: AuthUser, msg: string) => { setCurrentUser(user); setModal(null); setToast({ message: msg, userName: user.full_name }); };
  const goTo = (key: string) => navigate(NAV_ROUTES[key] ?? "/");
  const navLabels = NAV_LABELS[language as "en" | "id"]; const onHome = activePage === "home"; const glass = !isMobile && onHome && !scrolled;
  return (
    <>
      {toast && <SuccessToast message={toast.message} userName={toast.userName} onClose={() => setToast(null)} />}
      <style>{`
        .nb-link { font-family:${FONT}; font-size:13px; font-weight:500; letter-spacing:0.02em; border:none; background:none; cursor:pointer; padding:6px 4px; position:relative; transition:color 0.18s ease; white-space:nowrap; color:rgba(245,240,232,0.65); }
        .nb-link::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:${AMBER}; transform:scaleX(0); transform-origin:left; transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); border-radius:1px; }
        .nb-link.active  { color:${OFF_WHITE} !important; font-weight:600; }
        .nb-link.active::after, .nb-link:hover::after { transform:scaleX(1); }
        .nb-link:hover   { color:${OFF_WHITE} !important; }
        .nb-signin { font-family:${FONT}; font-size:12px; font-weight:600; letter-spacing:0.03em; border-radius:8px; padding:7px 14px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.18s ease; white-space:nowrap; border:1.5px solid rgba(245,240,232,0.30); color:${OFF_WHITE}; background:rgba(255,255,255,0.08); }
        .nb-signin:hover { background:${AMBER}; border-color:${AMBER}; color:${DARK1}; }
        .nb-mobile-link { display:block; width:100%; font-family:${FONT}; font-size:15px; font-weight:500; padding:15px 20px; background:none; border:none; cursor:pointer; text-align:left; color:#1a1a1a; border-left:3px solid transparent; transition:background 0.12s, color 0.12s, border-color 0.12s; }
        .nb-mobile-link.active { color:${BLUE_DEEP}; border-left-color:${BLUE_DEEP}; background:rgba(26,59,191,0.05); font-weight:600; }
        .nb-mobile-link:hover { background:#f7f4ef; }
        .nb-mobile-drawer { position:fixed; top:70px; left:0; right:0; background:#ffffff; border-bottom:1px solid #e4ddd4; z-index:400; padding-bottom:8px; box-shadow:0 8px 28px rgba(0,0,0,0.10); animation:drawerIn 0.2s ease; max-height:calc(100vh - 70px); overflow-y:auto; }
        @keyframes drawerIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .nb-mobile-overlay { position:fixed; inset:0; top:70px; background:rgba(26,26,26,0.28); z-index:390; }
        @media (max-width:380px) { .nb-username { display:none !important; } }
        @media (max-width:768px)  { .nb-hide-mobile { display:none !important; } }
        @media (min-width:769px)  { .nb-mobile-drawer { display:none !important; } .nb-hamburger { display:none !important; } .nb-mobile-overlay { display:none !important; } }
        @media (max-width:768px)  { .nb-desktop-nav { display:none !important; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, height: 70, background: glass ? "linear-gradient(to bottom, rgba(26,26,26,0.70) 0%, rgba(26,26,26,0) 100%)" : scrolled ? "rgba(28,28,28,0.98)" : "#1e1e1e", backdropFilter: scrolled ? "blur(20px)" : "none", WebkitBackdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: glass ? "none" : "1px solid rgba(255,255,255,0.08)", boxShadow: scrolled && !glass ? "0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.20)" : "none", transition: "background 0.32s ease, border-color 0.32s ease" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", padding: "0 16px", gap: 0 }}>
          <button onClick={() => goTo("home")} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginRight: 32, flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.80")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <img src="/logo.svg" alt="Searibu" style={{ height: 30, width: "auto", display: "block", filter: "brightness(0) invert(1)" }} />
          </button>
          <nav className="nb-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 28, flex: 1 }}>
            {navLabels.map((label, i) => (<button key={NAV_KEYS[i]} onClick={() => goTo(NAV_KEYS[i])} className={`nb-link ${activePage === NAV_KEYS[i] ? "active" : ""}`}>{label}</button>))}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px", flexShrink: 0 }}>
              {(["en", "id"] as const).map(l => (<button key={l} onClick={() => setLanguage(l)} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "4px 9px", borderRadius: 5, border: "none", cursor: "pointer", transition: "all 0.15s", background: language === l ? AMBER : "transparent", color: language === l ? DARK1 : "rgba(245,240,232,0.45)" }}>{l.toUpperCase()}</button>))}
            </div>
            <span className="nb-hide-mobile"><DesktopSubBadge language={language} /></span>
            <span className="nb-hide-mobile">
              {currentUser
                ? <UserDropdown user={currentUser} onLogout={() => setCurrentUser(null)} language={language} lightMode={false} />
                : <button onClick={() => setModal("signin")} className="nb-signin"><LogIn size={12} />{language === "id" ? "Masuk" : "Sign In"}</button>}
            </span>
            <button className="nb-hamburger" onClick={() => setMobileOpen(o => !o)} style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", padding: "7px", borderRadius: 8, color: OFF_WHITE, display: "flex", alignItems: "center", flexShrink: 0, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      {mobileOpen && <div className="nb-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && (
        <div className="nb-mobile-drawer">
          {navLabels.map((label, i) => (<button key={NAV_KEYS[i]} onClick={() => goTo(NAV_KEYS[i])} className={`nb-mobile-link ${activePage === NAV_KEYS[i] ? "active" : ""}`}>{label}</button>))}
          <div style={{ padding: "14px 20px 14px", borderTop: "1px solid #f0ece4", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            <MobileSubBadge language={language} />
            {currentUser
              ? <UserDropdown user={currentUser} onLogout={() => { setCurrentUser(null); setMobileOpen(false); }} language={language} lightMode={true} />
              : <button onClick={() => { setModal("signin"); setMobileOpen(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${BLUE_DEEP}`, background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: BLUE_DEEP, transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_DEEP; (e.currentTarget as HTMLElement).style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = BLUE_DEEP; }}>
                  <LogIn size={13} />{language === "id" ? "Masuk" : "Sign In"}
                </button>}
          </div>
        </div>
      )}
      <AuthModal mode={modal} onClose={() => setModal(null)} onSwitch={setModal} onSuccess={handleSuccess} language={language} />
    </>
  );
};