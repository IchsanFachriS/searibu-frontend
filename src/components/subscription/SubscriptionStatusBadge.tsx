/**
 * SubscriptionStatusBadge.tsx
 * Compact badge for the Navbar showing Free / Pro + opens PricingModal.
 */

import React, { useState } from "react";
import { Zap } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal } from "./PricingModal";

const SANS = '"Plus Jakarta Sans","Inter",system-ui,sans-serif';
const PRIMARY = "#0369a1";

interface Props {
  language?: "en" | "id";
}

export const SubscriptionStatusBadge: React.FC<Props> = ({ language = "en" }) => {
  const { isPro, sub } = useSubContext();
  const [open, setOpen] = useState(false);

  const label = isPro
    ? language === "en" ? "Pro" : "Pro"
    : language === "en" ? "Free" : "Gratis";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={isPro ? "Pro plan active" : "Upgrade to Pro"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 99,
          border: isPro
            ? "1px solid rgba(74,222,128,0.35)"
            : "1px solid rgba(255,255,255,0.22)",
          background: isPro
            ? "rgba(74,222,128,0.15)"
            : "rgba(255,255,255,0.08)",
          cursor: "pointer",
          transition: "all .18s",
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          color: isPro ? "#4ade80" : "rgba(255,255,255,0.65)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isPro
            ? "rgba(74,222,128,0.22)"
            : "rgba(255,255,255,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isPro
            ? "rgba(74,222,128,0.15)"
            : "rgba(255,255,255,0.08)";
        }}
      >
        <Zap size={10} fill={isPro ? "#4ade80" : "none"} />
        {label}
      </button>

      <PricingModal
        open={open}
        onClose={() => setOpen(false)}
        language={language}
        initialTab={isPro ? "status" : "pricing"}
      />
    </>
  );
};

export default SubscriptionStatusBadge;