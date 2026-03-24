/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand tokens ──────────────────────────────────────────────
        brand: {
          50:  '#e6f4fb',
          100: '#cce9f7',
          200: '#99d3ef',
          300: '#66bde7',
          400: '#33a7df',
          500: '#0084c7',   // primary ocean blue
          600: '#006ba3',
          700: '#00527f',
          800: '#00385a',
          900: '#001f36',
        },
        tide: {
          high:    '#0284c7',  // high-tide indicator
          low:     '#d97706',  // low-tide indicator
          neutral: '#64748b',
        },
        surface: {
          base:   '#f8fafc',   // page background
          card:   '#ffffff',   // card background
          muted:  '#f1f5f9',   // subtle bg (table stripes, tags)
          border: '#e2e8f0',   // all borders
        },
        text: {
          primary:   '#0f172a',
          secondary: '#475569',
          muted:     '#94a3b8',
          inverse:   '#ffffff',
        },
        // ── Activity safety tokens ────────────────────────────────────
        safe:    { DEFAULT: '#16a34a', bg: '#dcfce7', border: '#86efac' },
        caution: { DEFAULT: '#d97706', bg: '#fef3c7', border: '#fde68a' },
        danger:  { DEFAULT: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
        // ── Weather / environmental ───────────────────────────────────
        sky:   '#f59e0b',   // sun / clear
        rain:  '#60a5fa',   // rain
        storm: '#a78bfa',   // thunderstorm
        fog:   '#94a3b8',   // fog / cloudy
      },
      fontFamily: {
        sans:  ['"DM Sans"',    'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'monospace'],
        serif: ['"Lora"', 'Georgia', 'serif'],
      },
      borderRadius: {
        panel: '20px',
        card:  '14px',
        tag:   '6px',
      },
      spacing: {
        panel: '420px',   // standard side-panel width
        sidebar: '80px',  // collapsed sidebar
        sidebarOpen: '256px',
        header: '64px',
      },
      boxShadow: {
        card:  '0 2px 12px rgba(0,0,0,0.06)',
        panel: '0 8px 32px rgba(0,0,0,0.10)',
        hero:  '0 4px 24px rgba(2,132,199,0.20)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' },   to: { backgroundPosition: '200% 0' } },
        spin:      { to:   { transform: 'rotate(360deg)' } },
        pulse:     { '0%,100%': { opacity: '1' },               '50%': { opacity: '0.5' } },
        ping:      { '0%':      { transform: 'scale(1)',   opacity: '1' },
                     '75%,100%':{ transform: 'scale(2)',   opacity: '0' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        fadeIn:     'fadeIn 0.25s ease',
        slideDown:  'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        slideRight: 'slideRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        shimmer:    'shimmer 1.6s linear infinite',
        spin:       'spin 0.75s linear infinite',
        pulse:      'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        ping:       'ping 1s cubic-bezier(0,0,0.2,1) infinite',
        scaleIn:    'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}