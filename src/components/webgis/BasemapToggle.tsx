import React from 'react';
import { Map, Satellite } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type BasemapType = 'osm' | 'satellite';

interface BasemapToggleProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
}

const SANS = '"Inter", "DM Sans", system-ui, sans-serif';

export const BasemapToggle: React.FC<BasemapToggleProps> = ({ currentBasemap, onBasemapChange }) => {
  const { language } = useLanguage();
  const labels = {
    osm:       { en: 'Map',       id: 'Peta' },
    satellite: { en: 'Satellite', id: 'Satelit' },
  };

  return (
    <div style={{ position: 'absolute', bottom: 24, left: 20, zIndex: 1000,
      background: 'rgba(255,255,255,0.97)', borderRadius: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.14)', padding: 5,
      display: 'flex', gap: 4, border: '1px solid rgba(0,0,0,0.08)',
      backdropFilter: 'blur(8px)' }}>
      {(['osm', 'satellite'] as BasemapType[]).map(type => (
        <button key={type} onClick={() => onBasemapChange(type)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            letterSpacing: '0.01em', transition: 'background 0.2s ease, color 0.2s ease',
            background: currentBasemap === type ? '#0284c7' : 'transparent',
            color: currentBasemap === type ? '#fff' : '#374151',
            boxShadow: currentBasemap === type ? '0 2px 8px rgba(2,132,199,0.3)' : 'none' }}>
          {type === 'osm' ? <Map size={14} /> : <Satellite size={14} />}
          {labels[type][language]}
        </button>
      ))}
    </div>
  );
};