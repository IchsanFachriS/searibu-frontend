import React, { useState } from 'react';
import { Navbar }    from './components/layout/Navbar';
import { HomePage }  from './components/pages/HomePage';
import { WebGISPage } from './components/pages/WebGISPage';
import { AboutPage }  from './components/pages/AboutPage';
import { GuidePage }  from './components/pages/GuidePage';
import { LanguageProvider } from './context/LanguageContext';

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

  /* Page-level background — matches each section so no white ever shows */
  const pageBg: Record<string, string> = {
    home:   '#08121e',   /* hero dark — HomePage own sections override this */
    webgis: '#f8fafc',
    about:  '#f5f0e8',
    guide:  '#f5f0e8',
  };

  return (
    <LanguageProvider>
      {/* Global overscroll / background kill-switch */}
      <style>{`
        html, body, #root {
          background: ${pageBg[activePage] ?? '#f8fafc'} !important;
          overscroll-behavior: none !important;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: pageBg[activePage] ?? '#f8fafc' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </LanguageProvider>
  );
};

export default App;