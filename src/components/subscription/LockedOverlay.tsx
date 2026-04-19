/**
 * LockedOverlay.tsx
 * Drop this over any element to gate it behind Pro.
 *
 * Usage:
 *   <LockedOverlay feature="s104_export" onUpgrade={() => setShowPricing(true)}>
 *     <S104Badge ... />
 *   </LockedOverlay>
 */

import React from "react";
import { Lock } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import type { ProFeature } from "../../hooks/useSubscription";

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const PRIMARY = "#0369a1";

interface Props {
  feature: ProFeature;
  onUpgrade: () => void;
  language?: "en" | "id";
  children: React.ReactNode;
  /** If true the children are still rendered (dimmed) instead of hidden */
  showPreview?: boolean;
}

const LABELS = {
  en: { badge: "Pro feature", hint: "Upgrade to unlock", cta: "Upgrade →" },
  id: { badge: "Fitur Pro",   hint: "Upgrade untuk membuka", cta: "Upgrade →" },
};

export const LockedOverlay: React.FC<Props> = ({
  feature,
  onUpgrade,
  language = "en",
  children,
  showPreview = true,
}) => {
  const { canAccess } = useSubContext();
  const l = LABELS[language];

  if (canAccess(feature)) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {showPreview && (
        <div style={{ opacity: 0.25, pointerEvents: "none", userSelect: "none" }}>
          {children}
        </div>
      )}

      <div
        style={{
          position: showPreview ? "absolute" : "relative",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: showPreview
            ? "rgba(255,255,255,0.70)"
            : "rgba(248,250,252,0.98)",
          backdropFilter: showPreview ? "blur(3px)" : "none",
          borderRadius: 10,
          padding: showPreview ? 0 : "14px 16px",
          border: showPreview ? "none" : "1px solid #dbeafe",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 99,
            padding: "4px 11px",
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          <Lock size={10} />
          {l.badge}
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: "#94a3b8",
            margin: 0,
          }}
        >
          {l.hint}
        </p>
        <button
          onClick={onUpgrade}
          style={{
            padding: "6px 16px",
            borderRadius: 7,
            border: "none",
            background: PRIMARY,
            color: "#fff",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 2,
          }}
        >
          {l.cta}
        </button>
      </div>
    </div>
  );
};

export default LockedOverlay;