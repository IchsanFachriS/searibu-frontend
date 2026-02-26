import React, { useState } from 'react';
import { X, Eye, EyeOff, Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

interface LayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'grid', name: 'Grid Layer', visible: true, color: '#3b82f6' },
  ]);

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        JSON.parse(e.target?.result as string);
        const newLayer: Layer = {
          id: `layer_${Date.now()}`,
          name: file.name.replace('.geojson', ''),
          visible: true,
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
        };
        setLayers(prev => [...prev, newLayer]);
      } catch (error) {
        console.error('Error parsing GeoJSON:', error);
        alert('Invalid GeoJSON file');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-[999]"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-24 right-6 w-80 bg-white rounded-lg shadow-2xl z-[1001] max-h-[calc(100vh-200px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">
            {language === 'en' ? 'Map Layers' : 'Layer Peta'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Upload Button */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="font-medium text-sm">
              {language === 'en' ? 'Upload GeoJSON' : 'Unggah GeoJSON'}
            </span>
            <input
              type="file"
              accept=".geojson,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Layers List */}
        <div className="flex-1 overflow-y-auto p-4">
          {layers.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">
              {language === 'en' ? 'No layers available' : 'Tidak ada layer tersedia'}
            </p>
          ) : (
            <div className="space-y-2">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {layer.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="p-1 hover:bg-white rounded-md transition-colors"
                  >
                    {layer.visible ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};