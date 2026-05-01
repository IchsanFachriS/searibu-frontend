import React from "react";
import { Map, Satellite } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { BasemapType } from "../../types";

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

interface Props {
  currentBasemap:   BasemapType;
  onBasemapChange:  (b: BasemapType) => void;
}

const LABELS: Record<BasemapType, { en: string; id: string }> = {
  osm:       { en: "Map",  id: "Peta" },
  satellite: { en: "Sat.", id: "Sat." },
};

export const BasemapToggle: React.FC<Props> = ({ currentBasemap, onBasemapChange }) => {
  const { language } = useLanguage();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 12,
        zIndex: 1000,
        background: "rgba(255,255,255,0.97)",
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        padding: 3,
        display: "flex",
        gap: 2,
        border: "1px solid rgba(0,0,0,0.07)",
        backdropFilter: "blur(8px)",
        overscrollBehavior: "contain" as const,
        touchAction: "manipulation" as const,
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {(["osm", "satellite"] as BasemapType[]).map((type) => (
        <button
          key={type}
          onClick={() => onBasemapChange(type)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            transition: "background 0.18s ease, color 0.18s ease",
            background: currentBasemap === type ? "#0284c7" : "transparent",
            color:      currentBasemap === type ? "#fff"    : "#374151",
            boxShadow:  currentBasemap === type ? "0 2px 7px rgba(2,132,199,0.28)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {type === "osm" ? <Map size={12} /> : <Satellite size={12} />}
          {LABELS[type][language as "en" | "id"]}
        </button>
      ))}
    </div>
  );
};