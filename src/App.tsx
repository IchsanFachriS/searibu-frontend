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

  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </LanguageProvider>
  );
};

export default App;