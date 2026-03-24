import React, { useState, useEffect, useRef } from 'react';
import { LogIn, X, Eye, EyeOff, CheckCircle, Loader2, LogOut, ChevronDown, Anchor, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthUser {
  id: number; full_name: string; email: string;
  created_at: string; last_login?: string;
}
type ModalType = 'signin' | 'signup' | null;

async function apiRegister(fullName: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registrasi gagal');
  return data as { message: string; user: AuthUser };
}
async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login gagal');
  return data as { message: string; user: AuthUser };
}

const NAV_ITEMS_EN = ['Home', 'WebGIS', 'About', 'Guide'];
const NAV_ITEMS_ID = ['Beranda', 'WebGIS', 'Tentang', 'Panduan'];
const NAV_KEYS     = ['home', 'webgis', 'about', 'guide'];

/* ── All-sans font stack ── */
const SANS = '"Inter", "DM Sans", "Helvetica Neue", Arial, sans-serif';

/* ── Input Field ── */
const InputField: React.FC<{
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  error?: string; autoComplete?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, error, autoComplete }) => {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, fontFamily: SANS,
        letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword ? (showPass ? 'text' : 'password') : type}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 7,
            border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
            fontSize: 14, fontFamily: SANS, background: error ? '#fef2f2' : '#f9fafb',
            outline: 'none', boxSizing: 'border-box', color: '#111827',
            transition: 'border-color 0.2s, box-shadow 0.2s' }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? '#f87171' : '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.1)'; e.currentTarget.style.background = '#fff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? '#fca5a5' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = error ? '#fef2f2' : '#f9fafb'; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444', fontFamily: SANS }}>{error}</p>}
    </div>
  );
};

/* ── Auth Modal ── */
const AuthModal: React.FC<{
  mode: ModalType; onClose: () => void; onSwitch: (m: ModalType) => void;
  onSuccess: (user: AuthUser, msg: string) => void; language: string;
}> = ({ mode, onClose, onSwitch, onSuccess, language }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [siEmail, setSiEmail]   = useState('');
  const [siPass,  setSiPass]    = useState('');
  const [siErr,   setSiErr]     = useState('');
  const [siLoad,  setSiLoad]    = useState(false);
  const [suName,  setSuName]    = useState('');
  const [suEmail, setSuEmail]   = useState('');
  const [suPass,  setSuPass]    = useState('');
  const [suErrs,  setSuErrs]    = useState<Record<string,string>>({});
  const [suApi,   setSuApi]     = useState('');
  const [suLoad,  setSuLoad]    = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!mode) return null;
  const isSignIn = mode === 'signin';

  const doSignIn = async () => {
    setSiErr('');
    if (!siEmail) { setSiErr('Email diperlukan'); return; }
    if (!siPass)  { setSiErr('Password diperlukan'); return; }
    setSiLoad(true);
    try { const r = await apiLogin(siEmail, siPass); onSuccess(r.user, r.message); }
    catch (e: any) { setSiErr(e.message); } finally { setSiLoad(false); }
  };

  const doSignUp = async () => {
    setSuApi('');
    const e: Record<string,string> = {};
    if (!suName.trim() || suName.trim().length < 2) e.name = 'Nama minimal 2 karakter';
    if (!suEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Format email tidak valid';
    if (suPass.length < 6) e.pass = 'Password minimal 6 karakter';
    setSuErrs(e); if (Object.keys(e).length) return;
    setSuLoad(true);
    try { const r = await apiRegister(suName, suEmail, suPass); onSuccess(r.user, r.message); }
    catch (err: any) { setSuApi(err.message); } finally { setSuLoad(false); }
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
    background: '#c2410c', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.2s',
  };

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        animation: 'mfIn 0.18s ease' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '32px 32px 28px', width: 400,
        maxWidth: '92vw', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        animation: 'mfScale 0.22s cubic-bezier(0.16,1,0.3,1)' }}>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
            cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <X size={15} />
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Anchor size={14} color="#fff" />
            </div>
            {/* Modal title — bold sans-serif */}
            <h2 style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800,
              color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              {isSignIn
                ? (language === 'id' ? 'Masuk ke Searibu' : 'Sign In to Searibu')
                : (language === 'id' ? 'Buat Akun Baru' : 'Create Account')}
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: '#9ca3af', marginLeft: 40 }}>
            {isSignIn
              ? (language === 'id' ? 'Selamat datang kembali' : 'Welcome back')
              : (language === 'id' ? 'Bergabunglah dengan komunitas Searibu' : 'Join the Searibu community')}
          </p>
        </div>

        {isSignIn ? (
          <>
            <InputField label="Email" type="email" value={siEmail} onChange={setSiEmail}
              placeholder="nama@email.com" autoComplete="email" />
            <InputField label="Password" type="password" value={siPass} onChange={setSiPass}
              placeholder="••••••••" autoComplete="current-password" />
            {siErr && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 7,
              background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: 13, color: '#dc2626', fontFamily: SANS, margin: 0 }}>{siErr}</p>
            </div>}
            <button onClick={doSignIn} disabled={siLoad}
              style={{ ...primaryBtn, opacity: siLoad ? 0.65 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#9a3412')}
              onMouseLeave={e => (e.currentTarget.style.background = '#c2410c')}>
              {siLoad && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {language === 'id' ? 'Masuk' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontFamily: SANS, fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>
                {language === 'id' ? 'atau' : 'or'}
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '11px 16px', borderRadius: 7,
                border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                fontFamily: SANS, fontSize: 13, fontWeight: 500, color: '#374151',
                transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; }}>
              <img src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google" style={{ width: 16, height: 16, flexShrink: 0 }} />
              {language === 'id' ? 'Masuk dengan Google' : 'Continue with Google'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280', fontFamily: SANS }}>
              {language === 'id' ? 'Belum punya akun?' : "Don't have an account?"}{' '}
              <button onClick={() => onSwitch('signup')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c',
                  fontWeight: 600, fontSize: 13, fontFamily: SANS, textDecoration: 'underline' }}>
                {language === 'id' ? 'Daftar' : 'Sign up'}
              </button>
            </p>
          </>
        ) : (
          <>
            <InputField label={language === 'id' ? 'Nama Lengkap' : 'Full Name'} value={suName}
              onChange={setSuName} placeholder="Nama lengkap" error={suErrs.name} autoComplete="name" />
            <InputField label="Email" type="email" value={suEmail} onChange={setSuEmail}
              placeholder="nama@email.com" error={suErrs.email} autoComplete="email" />
            <InputField label="Password" type="password" value={suPass} onChange={setSuPass}
              placeholder="Min. 6 karakter" error={suErrs.pass} autoComplete="new-password" />
            {suApi && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 7,
              background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: 13, color: '#dc2626', fontFamily: SANS, margin: 0 }}>{suApi}</p>
            </div>}
            <button onClick={doSignUp} disabled={suLoad}
              style={{ ...primaryBtn, opacity: suLoad ? 0.65 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#9a3412')}
              onMouseLeave={e => (e.currentTarget.style.background = '#c2410c')}>
              {suLoad && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {language === 'id' ? 'Daftar Sekarang' : 'Create Account'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontFamily: SANS, fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>
                {language === 'id' ? 'atau' : 'or'}
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '11px 16px', borderRadius: 7,
                border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                fontFamily: SANS, fontSize: 13, fontWeight: 500, color: '#374151',
                transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; }}>
              <img src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google" style={{ width: 16, height: 16, flexShrink: 0 }} />
              {language === 'id' ? 'Daftar dengan Google' : 'Continue with Google'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280', fontFamily: SANS }}>
              {language === 'id' ? 'Sudah punya akun?' : 'Already have an account?'}{' '}
              <button onClick={() => onSwitch('signin')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c',
                  fontWeight: 600, fontSize: 13, fontFamily: SANS, textDecoration: 'underline' }}>
                {language === 'id' ? 'Masuk' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
      <style>{`
        @keyframes mfIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes mfScale { from { opacity:0; transform:scale(0.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
};

/* ── User Dropdown ── */
const UserDropdown: React.FC<{ user: AuthUser; onLogout: () => void; language: string }> = ({ user, onLogout, language }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const initials = user.full_name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
          borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
          transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <div style={{ width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg, #92400e, #c2410c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: SANS }}>
          {initials}
        </div>
        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: '#111827',
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.full_name.split(' ')[0]}
        </span>
        <ChevronDown size={13} style={{ color: '#6b7280',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, width: 220, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600,
              color: '#111827', marginBottom: 2 }}>{user.full_name}</p>
            <p style={{ fontFamily: SANS, fontSize: 12, color: '#9ca3af' }}>{user.email}</p>
          </div>
          <button onClick={() => { setOpen(false); onLogout(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontFamily: SANS, fontWeight: 500, color: '#dc2626', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <LogOut size={13} />
            {language === 'id' ? 'Keluar' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Success Toast ── */
const SuccessToast: React.FC<{ message: string; userName: string; onClose: () => void }> = ({ message, userName, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, animation: 'toastIn 0.38s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff',
        border: '1px solid #d1fae5', borderRadius: 12, padding: '12px 20px',
        boxShadow: '0 8px 32px rgba(22,163,74,0.14)', minWidth: 320, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={18} style={{ color: '#16a34a' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{message}</p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: '#9ca3af' }}>
            Halo, <span style={{ color: '#c2410c', fontWeight: 600 }}>{userName}</span>!
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}>
          <X size={13} />
        </button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3,
          background: '#16a34a', animation: 'shrinkBar 4s linear forwards', borderRadius: '0 0 0 12px' }} />
      </div>
      <style>{`
        @keyframes toastIn   { from { opacity:0; transform:translateX(-50%) translateY(-14px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes shrinkBar { from { width:100% } to { width:0 } }
      `}</style>
    </div>
  );
};

/* ══════════════════════
   NAVBAR
══════════════════════ */
interface NavbarProps { activePage: string; setActivePage: (p: string) => void; }

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { language, setLanguage } = useLanguage();
  const [modal, setModal]           = useState<ModalType>(null);
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try { const s = sessionStorage.getItem('searibu_user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [toast, setToast] = useState<{ message: string; userName: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSuccess = (user: AuthUser, msg: string) => {
    setCurrentUser(user);
    sessionStorage.setItem('searibu_user', JSON.stringify(user));
    setModal(null);
    setToast({ message: msg, userName: user.full_name });
  };

  const navItems  = language === 'id' ? NAV_ITEMS_ID : NAV_ITEMS_EN;
  const onHome    = activePage === 'home';
  const glass     = onHome && !scrolled;

  return (
    <>
      {toast && <SuccessToast message={toast.message} userName={toast.userName} onClose={() => setToast(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* Nav links — all Inter/sans */
        .nb-link {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.02em;
          border: none; background: none; cursor: pointer;
          padding: 6px 2px;
          position: relative;
          transition: color 0.18s ease;
          white-space: nowrap;
        }
        .nb-link::after {
          content: '';
          position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #e8600a;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
          border-radius: 1px;
        }
        .nb-link.active::after, .nb-link:hover::after { transform: scaleX(1); }

        .nb-signin {
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.02em;
          border: 1.5px solid; border-radius: 6px;
          padding: 7px 18px; cursor: pointer;
          display: flex; align-items: center; gap: 7px;
          transition: all 0.22s ease;
        }

        .nb-mobile-link {
          display: block; width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500;
          padding: 12px 24px; background: none; border: none;
          cursor: pointer; text-align: left; color: #374151;
          border-left: 3px solid transparent;
          transition: background 0.15s, color 0.15s;
        }
        .nb-mobile-link.active {
          color: #c2410c; border-left-color: #e8600a;
          background: rgba(232,96,10,0.05);
        }
        .nb-mobile-link:hover { background: #f9fafb; }

        .nb-mobile-drawer {
          position: fixed; top: 62px; left: 0; right: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #e5e7eb;
          z-index: 149; padding: 8px 0 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.09);
          animation: drawerIn 0.2s ease;
        }
        @keyframes drawerIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }

        @media (min-width: 769px) { .nb-mobile-drawer { display:none!important; } .nb-hamburger { display:none!important; } }
        @media (max-width: 768px) { .nb-desktop-nav { display:none!important; } }
        @media (max-width: 480px) { .nb-logo-img { height: 28px !important; } }
      `}</style>

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, height: 62,
        background: glass
          ? 'linear-gradient(to bottom, rgba(7,18,28,0.7) 0%, rgba(7,18,28,0) 100%)'
          : 'rgba(255,255,255,0.97)',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: glass ? 'none' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: scrolled && !glass ? '0 1px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'background 0.32s ease, border-color 0.32s ease, box-shadow 0.32s ease',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', height: '100%',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 0 }}>

          {/* Logo */}
          <button onClick={() => setActivePage('home')}
            style={{ display: 'flex', alignItems: 'center', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 0', marginRight: 40,
              flexShrink: 0, transition: 'opacity 0.2s ease' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <img
              src="/logo.svg"
              alt="Searibu"
              className="nb-logo-img"
              style={{
                height: 38, width: 'auto', display: 'block',
                filter: glass ? 'brightness(0) invert(1)' : 'none',
                transition: 'filter 0.32s ease',
              }}
            />
          </button>

          {/* Desktop nav */}
          <nav className="nb-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 30, flex: 1 }}>
            {navItems.map((label, i) => (
              <button key={NAV_KEYS[i]} onClick={() => setActivePage(NAV_KEYS[i])}
                className={`nb-link ${activePage === NAV_KEYS[i] ? 'active' : ''}`}
                style={{ color: glass
                  ? (activePage === NAV_KEYS[i] ? '#fff' : 'rgba(255,255,255,0.68)')
                  : (activePage === NAV_KEYS[i] ? '#0f172a' : '#64748b') }}>
                {label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 1,
              background: glass ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
              borderRadius: 7, padding: 3, transition: 'background 0.28s' }}>
              {(['en','id'] as const).map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', padding: '5px 10px', borderRadius: 5, border: 'none',
                    cursor: 'pointer', transition: 'all 0.18s',
                    background: language === l
                      ? (glass ? 'rgba(255,255,255,0.22)' : '#fff')
                      : 'transparent',
                    color: language === l
                      ? (glass ? '#fff' : '#0f172a')
                      : (glass ? 'rgba(255,255,255,0.48)' : '#94a3b8'),
                    boxShadow: language === l && !glass ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Auth */}
            {currentUser ? (
              <UserDropdown user={currentUser} onLogout={() => { setCurrentUser(null); sessionStorage.removeItem('searibu_user'); }} language={language} />
            ) : (
              <button onClick={() => setModal('signin')} className="nb-signin"
                style={{ borderColor: glass ? 'rgba(255,255,255,0.45)' : '#e8600a',
                  color: glass ? 'rgba(255,255,255,0.85)' : '#c2410c',
                  background: glass ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background='#e8600a'; b.style.borderColor='#e8600a'; b.style.color='#fff'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background=glass?'rgba(255,255,255,0.08)':'transparent'; b.style.borderColor=glass?'rgba(255,255,255,0.45)':'#e8600a'; b.style.color=glass?'rgba(255,255,255,0.85)':'#c2410c'; }}>
                <LogIn size={13} />
                {language === 'id' ? 'Masuk' : 'Sign In'}
              </button>
            )}

            {/* Hamburger */}
            <button className="nb-hamburger" onClick={() => setMobileOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                borderRadius: 6, color: glass ? '#fff' : '#374151' }}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="nb-mobile-drawer">
          {navItems.map((label, i) => (
            <button key={NAV_KEYS[i]}
              onClick={() => { setActivePage(NAV_KEYS[i]); setMobileOpen(false); }}
              className={`nb-mobile-link ${activePage === NAV_KEYS[i] ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <AuthModal mode={modal} onClose={() => setModal(null)} onSwitch={setModal}
        onSuccess={handleSuccess} language={language} />
    </>
  );
};