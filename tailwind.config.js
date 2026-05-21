/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"Inter"', 'system-ui', 'sans-serif'],
        serif:   ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* New palette from screenshot */
        dark:    { 1: "#2b2b2b", 2: "#3a3a3a" },
        offwhite:"#f5f0e8",
        amber:   { DEFAULT: "#f5c518", 2: "#f0b429", 3: "#ffe033" },
        green:   "#9de05a",
        orange:  "#e8401c",
        peach:   "#f4bfad",
        blue:    { DEFAULT: "#1a3bbf", dark: "#142d99", light: "#ddf0fb" },
        cyan:    { DEFAULT: "#4fd4e8" },

        /* Semantic */
        brand: {
          50:  "#ddf0fb", 100: "#b8e0f7", 200: "#7bbeed",
          300: "#4d9fe0", 400: "#2872ce", 500: "#1a3bbf",
          600: "#142d99", 700: "#0f2178", 800: "#0a1558", 900: "#060c38",
        },
        tide: { high:"#1a3bbf", low:"#f0b429", neutral:"#6b7280" },
        surface: { base:"#f7f4ef", card:"#ffffff", muted:"#f0ece4", border:"#e8e2d8" },
        text:    { primary:"#2b2b2b", secondary:"#4a4a5a", muted:"#9ca3af", inverse:"#f5f0e8" },
        safe:    { DEFAULT:"#16a34a", bg:"#dcfce7", border:"#86efac" },
        caution: { DEFAULT:"#d97706", bg:"#fef3c7", border:"#fde68a" },
        danger:  { DEFAULT:"#dc2626", bg:"#fee2e2", border:"#fca5a5" },
      },
      borderRadius: {
        panel: "16px", card: "12px", tag: "6px",
      },
      boxShadow: {
        card:  "0 2px 12px rgba(0,0,0,0.06)",
        panel: "0 8px 32px rgba(26,59,191,0.10)",
        hero:  "0 4px 24px rgba(26,59,191,0.20)",
        blue:  "0 0 0 3px rgba(26,59,191,0.10)",
      },
      keyframes: {
        fadeIn:    { from:{ opacity:"0" },                               to:{ opacity:"1" } },
        fadeUp:    { from:{ opacity:"0", transform:"translateY(18px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        slideDown: { from:{ opacity:"0", transform:"translateY(-8px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        shimmer:   { from:{ backgroundPosition:"-200% 0" },             to:{ backgroundPosition:"200% 0" } },
        spin:      { to:{ transform:"rotate(360deg)" } },
        scaleIn:   { from:{ opacity:"0", transform:"scale(.96)" },       to:{ opacity:"1", transform:"scale(1)" } },
      },
      animation: {
        fadeIn:    "fadeIn 0.25s ease",
        fadeUp:    "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)",
        slideDown: "slideDown 0.3s cubic-bezier(0.16,1,0.3,1)",
        shimmer:   "shimmer 1.6s linear infinite",
        spin:      "spin 0.75s linear infinite",
        scaleIn:   "scaleIn 0.22s ease",
      },
    },
  },
  plugins: [],
};