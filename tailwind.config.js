/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"Inter"', 'system-ui', 'sans-serif'],
        serif:   ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Extracted palette */
        dark:    { 1: "#2b2b2b", 2: "#3a3a3a" },
        offwhite: "#f5f0e8",
        amber:   { DEFAULT: "#f5c518", 2: "#f0b429", 3: "#ffe033" },
        green:   "#9de05a",
        orange:  "#e8401c",
        peach:   "#f4bfad",
        blue:    { DEFAULT: "#1a3bbf", dark: "#142d99", mid: "#4fd4e8", light: "#ddf0fb" },

        /* Semantic */
        brand: {
          50:  "#ddf0fb", 100: "#b8e0f7", 200: "#7bbeed",
          300: "#4d9fe0", 400: "#2872ce", 500: "#1a3bbf",
          600: "#142d99", 700: "#0f2178", 800: "#0a1558", 900: "#060c38",
        },
        bg:      "#f7f4ef",
        surface: "#ffffff",
        border:  "#e4ddd4",
        text: {
          primary:   "#1a1a1a",
          secondary: "#3d3d3d",
          muted:     "#6b6b6b",
          faint:     "#9a9a9a",
          inverse:   "#f5f0e8",
        },
        safe:    { DEFAULT: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
        caution: { DEFAULT: "#d97706", bg: "#fef9c3", border: "#fde68a" },
        danger:  { DEFAULT: "#dc2626", bg: "#fee2e2", border: "#fecdd3" },
      },
      borderRadius: {
        panel: "14px", card: "10px", tag: "6px",
      },
      boxShadow: {
        sm:    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md:    "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        lg:    "0 10px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)",
        xl:    "0 20px 50px rgba(0,0,0,0.14), 0 8px 20px rgba(0,0,0,0.08)",
        blue:  "0 4px 14px rgba(26,59,191,0.28)",
        amber: "0 4px 16px rgba(245,193,24,0.40)",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" },                               to: { opacity: "1" } },
        fadeUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:   { from: { backgroundPosition: "-200% 0" },              to: { backgroundPosition: "200% 0" } },
        spin:      { to: { transform: "rotate(360deg)" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(.97)" },       to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        fadeIn:    "fadeIn 0.22s ease",
        fadeUp:    "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1)",
        slideDown: "slideDown 0.28s cubic-bezier(0.16,1,0.3,1)",
        shimmer:   "shimmer 1.6s linear infinite",
        spin:      "spin 0.75s linear infinite",
        scaleIn:   "scaleIn 0.20s ease",
      },
    },
  },
  plugins: [],
};