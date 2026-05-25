import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Navbar }    from "./components/layout/Navbar";
import { HomePage }  from "./components/pages/HomePage";
import { WebGISPage } from "./components/pages/WebGISPage";
import { AboutPage }  from "./components/pages/AboutPage";
import { GuidePage }  from "./components/pages/GuidePage";
import { LanguageProvider }     from "./context/LanguageContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

const GOOGLE_CLIENT_ID =
  "856223677891-1idptdhjrlf28vjrtedjka4sl1if74cd.apps.googleusercontent.com";

const PAGE_BG: Record<string, string> = {
  "/":       "#f7f4ef",
  "/webgis": "#1a1e2e",
  "/about":  "#f7f4ef",
  "/guide":  "#f7f4ef",
};

/* ── Inner layout (needs useLocation, so must be inside BrowserRouter) ── */
const AppLayout: React.FC = () => {
  const location = useLocation();
  const isWebGIS = location.pathname === "/webgis";
  const bg = PAGE_BG[location.pathname] ?? "#f7f4ef";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overscroll-behavior: none !important; }
        html { height: 100%; }
        body { height: 100%; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }
        #root { height: 100%; overflow: hidden; }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: bg,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          overflowY: isWebGIS ? "hidden" : "auto",
          overflowX: "hidden",
          overscrollBehavior: "none",
          WebkitOverflowScrolling: "touch",
          transition: "background 0.25s ease",
        }}
      >
        <Navbar />
        <main>
          <Routes>
            <Route path="/"       element={<HomePage />} />
            <Route path="/webgis" element={<WebGISPage />} />
            <Route path="/about"  element={<AboutPage />} />
            <Route path="/guide"  element={<GuidePage />} />
            {/* Catch-all → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

/* ── Root App ─────────────────────────────────────────────────────────── */
const App: React.FC = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <LanguageProvider>
      <SubscriptionProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </SubscriptionProvider>
    </LanguageProvider>
  </GoogleOAuthProvider>
);

export default App;