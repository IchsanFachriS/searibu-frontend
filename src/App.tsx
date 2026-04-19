/**
 * App.tsx — Updated with SubscriptionProvider
 * Only change from original: wrap everything in <SubscriptionProvider>
 * and pass setUser/user through to Navbar via context.
 */

import React, { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Navbar }    from "./components/layout/Navbar";
import { HomePage }  from "./components/pages/HomePage";
import { WebGISPage } from "./components/pages/WebGISPage";
import { AboutPage }  from "./components/pages/AboutPage";
import { GuidePage }  from "./components/pages/GuidePage";
import { LanguageProvider } from "./context/LanguageContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

const GOOGLE_CLIENT_ID =
  "856223677891-1idptdhjrlf28vjrtedjka4sl1if74cd.apps.googleusercontent.com";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState("home");

  const renderPage = () => {
    switch (activePage) {
      case "home":   return <HomePage onNavigate={setActivePage} />;
      case "webgis": return <WebGISPage />;
      case "about":  return <AboutPage />;
      case "guide":  return <GuidePage />;
      default:       return <HomePage onNavigate={setActivePage} />;
    }
  };

  const pageBg: Record<string, string> = {
    home:   "#0f1e2e",
    webgis: "#0a1628",
    about:  "#f8fafc",
    guide:  "#f8fafc",
  };
  const bg = pageBg[activePage] ?? "#f8fafc";
  const isWebGIS = activePage === "webgis";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        {/* SubscriptionProvider must wrap Navbar and all pages so
            useSubContext() works everywhere */}
        <SubscriptionProvider>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              margin: 0; padding: 0;
              overscroll-behavior: none !important;
              font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif !important;
              -webkit-font-smoothing: antialiased;
            }
            html { height: 100%; }
            body { height: 100%; overflow: hidden; }
            #root { height: 100%; overflow: hidden; }
          `}</style>

          <div
            style={{
              position: "fixed", inset: 0, background: bg,
              fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
              overflowY: isWebGIS ? "hidden" : "auto",
              overflowX: "hidden",
              overscrollBehavior: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Navbar activePage={activePage} setActivePage={setActivePage} />
            <main>{renderPage()}</main>
          </div>
        </SubscriptionProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};

export default App;