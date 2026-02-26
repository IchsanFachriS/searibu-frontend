import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomePage } from './components/pages/HomePage';
import { WebGISPage } from './components/pages/WebGISPage';
import { AboutPage } from './components/pages/AboutPage';
import { GuidePage } from './components/pages/GuidePage';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const renderPage = () => {
    switch (activeMenu) {
      case 'home':
        return <HomePage />;
      case 'webgis':
        return <WebGISPage />;
      case 'about':
        return <AboutPage />;
      case 'guide':
        return <GuidePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Header />
          <main className="pt-20">{renderPage()}</main>
        </div>
      </div>
    </LanguageProvider>
  );
};

export default App;