import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar }    from './components/layout/Navbar';
import { HomePage }  from './components/pages/HomePage';
import { WebGISPage } from './components/pages/WebGISPage';
import { AboutPage }  from './components/pages/AboutPage';
import { GuidePage }  from './components/pages/GuidePage';
import { LanguageProvider } from './context/LanguageContext';

const GOOGLE_CLIENT_ID = '856223677891-1idptdhjrlf28vjrtedjka4sl1if74cd.apps.googleusercontent.com';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':   return <HomePage onNavigate={setActivePage} />;
      case 'webgis': return <WebGISPage />;
      case 'about':  return <AboutPage />;
      case 'guide':  return <GuidePage />;
      default:       return <HomePage onNavigate={setActivePage} />;
    }
  };

  const pageBg: Record<string, string> = {
    home:   '#0f1e2e',
    webgis: '#0a1628',
    about:  '#f8fafc',
    guide:  '#f8fafc',
  };

  const bg = pageBg[activePage] ?? '#f8fafc';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

          *, *::before, *::after { box-sizing: border-box; }

          html, body, #root {
            background: ${bg} !important;
            overscroll-behavior: none !important;
            font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          p, span, div, a, button, input, label, h1, h2, h3, h4, h5, h6, li, td, th {
            font-family: inherit;
          }
        `}</style>

        <div style={{
          minHeight: '100vh',
          background: bg,
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        }}>
          <Navbar activePage={activePage} setActivePage={setActivePage} />
          <main>
            {renderPage()}
          </main>
        </div>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};

export default App;