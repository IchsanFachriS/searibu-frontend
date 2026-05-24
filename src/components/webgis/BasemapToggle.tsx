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
        top: 12,
        left: 12,
        zIndex: 1000,
        background: "rgba(255,255,255,0.98)",
        borderRadius: 10,
        boxShadow: "0 6px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.15)", // Bayangan diperkuat agar kontras pada basemap satelit
        padding: 3,
        display: "flex",
        gap: 2,
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
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
            gap: 5,
            padding: "6px 12px",
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: currentBasemap === type ? "#0284c7" : "transparent",
            color:      currentBasemap === type ? "#fff"    : "#1e293b",
            boxShadow:  currentBasemap === type ? "0 2px 8px rgba(2,132,199,0.4)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {type === "osm" ? <Map size={12.5} /> : <Satellite size={12.5} />}
          {LABELS[type][language as "en" | "id"]}
        </button>
      ))}
    </div>
  );
};