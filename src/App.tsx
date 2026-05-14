import React, { useState } from "react";
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

type Page = "home" | "webgis" | "about" | "guide";

const PAGE_BG: Record<Page, string> = {
  home:   "#0f1e2e",
  webgis: "#0a1628",
  about:  "#f8fafc",
  guide:  "#f8fafc",
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>("home");

  const navigate = (page: string) => setActivePage(page as Page);

  const renderPage = () => {
    switch (activePage) {
      case "home":   return <HomePage onNavigate={navigate} />;
      case "webgis": return <WebGISPage />;
      case "about":  return <AboutPage />;
      case "guide":  return <GuidePage />;
    }
  };

  const isWebGIS = activePage === "webgis";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <SubscriptionProvider>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');
            *, *::before, *::after { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; overscroll-behavior: none !important; }
            html { height: 100%; }
            body { height: 100%; overflow: hidden; }
            #root { height: 100%; overflow: hidden; }
          `}</style>

          <div
            style={{
              position: "fixed",
              inset: 0,
              background: PAGE_BG[activePage],
              fontFamily: "'Montserrat', system-ui, sans-serif",
              overflowY: isWebGIS ? "hidden" : "auto",
              overflowX: "hidden",
              overscrollBehavior: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Navbar activePage={activePage} setActivePage={navigate} />
            <main>{renderPage()}</main>
          </div>
        </SubscriptionProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
