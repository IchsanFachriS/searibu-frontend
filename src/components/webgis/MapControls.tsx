import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Locate } from 'lucide-react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitBounds?: () => void;
  onLocate?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitBounds,
  onLocate,
}) => {
  return (
    <div className="absolute top-32 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom In */}
      {onZoomIn && (
        <button
          onClick={onZoomIn}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Zoom Out */}
      {onZoomOut && (
        <button
          onClick={onZoomOut}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Fit Bounds */}
      {onFitBounds && (
        <button
          onClick={onFitBounds}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          title="Fit to Bounds"
        >
          <Maximize className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Locate User */}
      {onLocate && (
        <button
          onClick={onLocate}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          title="My Location"
        >
          <Locate className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
};