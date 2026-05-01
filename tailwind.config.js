/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e6f4fb", 100: "#cce9f7", 200: "#99d3ef",
          300: "#66bde7", 400: "#33a7df", 500: "#0084c7",
          600: "#006ba3", 700: "#00527f", 800: "#00385a", 900: "#001f36",
        },
        tide: {
          high:    "#0284c7",
          low:     "#d97706",
          neutral: "#64748b",
        },
        surface: {
          base:   "#f8fafc",
          card:   "#ffffff",
          muted:  "#f1f5f9",
          border: "#e2e8f0",
        },
        text: {
          primary:   "#0f172a",
          secondary: "#475569",
          muted:     "#94a3b8",
          inverse:   "#ffffff",
        },
        safe:    { DEFAULT: "#16a34a", bg: "#dcfce7", border: "#86efac" },
        caution: { DEFAULT: "#d97706", bg: "#fef3c7", border: "#fde68a" },
        danger:  { DEFAULT: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
      },
      fontFamily: {
        sans:  ['"Plus Jakarta Sans"', '"Inter"', "system-ui", "sans-serif"],
        mono:  ['"JetBrains Mono"', "monospace"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: {
        panel: "20px",
        card:  "14px",
        tag:   "6px",
      },
      boxShadow: {
        card:  "0 2px 12px rgba(0,0,0,0.06)",
        panel: "0 8px 32px rgba(0,0,0,0.10)",
        hero:  "0 4px 24px rgba(2,132,199,0.20)",
      },
      keyframes: {
        fadeIn:     { from: { opacity: "0" },                               to: { opacity: "1" } },
        slideDown:  { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:    { from: { backgroundPosition: "-200% 0" },              to: { backgroundPosition: "200% 0" } },
        spin:       { to:   { transform: "rotate(360deg)" } },
      },
      animation: {
        fadeIn:    "fadeIn 0.25s ease",
        slideDown: "slideDown 0.3s cubic-bezier(0.16,1,0.3,1)",
        shimmer:   "shimmer 1.6s linear infinite",
        spin:      "spin 0.75s linear infinite",
      },
    },
  },
  plugins: [],
};