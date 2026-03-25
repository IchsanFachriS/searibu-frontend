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
    osm:       { en: 'Map',    id: 'Peta'    },
    satellite: { en: 'Sat.',   id: 'Sat.'    },
  };

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 16, zIndex: 1000,
      background: 'rgba(255,255,255,0.97)', borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4,
      display: 'flex', gap: 3,
      border: '1px solid rgba(0,0,0,0.07)',
      backdropFilter: 'blur(8px)',
    }}>
      {(['osm', 'satellite'] as BasemapType[]).map(type => (
        <button
          key={type}
          onClick={() => onBasemapChange(type)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            letterSpacing: '0.01em', transition: 'background 0.2s ease, color 0.2s ease',
            background: currentBasemap === type ? '#0284c7' : 'transparent',
            color: currentBasemap === type ? '#fff' : '#374151',
            boxShadow: currentBasemap === type ? '0 2px 7px rgba(2,132,199,0.28)' : 'none',
          }}
        >
          {type === 'osm' ? <Map size={13} /> : <Satellite size={13} />}
          {labels[type][language]}
        </button>
      ))}
    </div>
  );
};