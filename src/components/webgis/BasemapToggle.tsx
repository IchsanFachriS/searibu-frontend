import React from 'react';
import { Map, Satellite } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BasemapType } from '../pages/WebGISPage';

interface BasemapToggleProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
}

export const BasemapToggle: React.FC<BasemapToggleProps> = ({
  currentBasemap,
  onBasemapChange,
}) => {
  const { language } = useLanguage();

  const labels = {
    osm: {
      en: 'Map',
      id: 'Peta',
    },
    satellite: {
      en: 'Satellite',
      id: 'Satelit',
    },
  };

  return (
    <div className="fixed bottom-6 left-24 z-[2000] bg-white rounded-lg shadow-xl p-1.5 flex gap-1 border border-gray-200">
      {/* OSM Button */}
      <button
        onClick={() => onBasemapChange('osm')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
          currentBasemap === 'osm'
            ? 'bg-indigo-500 text-white shadow-md'
            : 'bg-transparent text-gray-700 hover:bg-gray-100'
        }`}
        title={labels.osm[language]}
      >
        <Map className="w-5 h-5" />
        <span className="font-medium text-sm">{labels.osm[language]}</span>
      </button>

      {/* Satellite Button */}
      <button
        onClick={() => onBasemapChange('satellite')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
          currentBasemap === 'satellite'
            ? 'bg-indigo-500 text-white shadow-md'
            : 'bg-transparent text-gray-700 hover:bg-gray-100'
        }`}
        title={labels.satellite[language]}
      >
        <Satellite className="w-5 h-5" />
        <span className="font-medium text-sm">{labels.satellite[language]}</span>
      </button>
    </div>
  );
};