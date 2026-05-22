import React, { useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal }  from "./PricingModal";

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

interface Props {
  language?: "en" | "id";
}

export const SubscriptionStatusBadge: React.FC<Props> = ({ language = "en" }) => {
  const { isPro, isAdmin } = useSubContext();
  const [open, setOpen] = useState(false);

  // Admin badge — does not open PricingModal
  if (isAdmin) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 99,
          border: "1px solid rgba(251,191,36,0.50)",
          background: "rgba(251,191,36,0.15)",
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          color: "#fbbf24",
          userSelect: "none",
          cursor: "default",
        }}
        title="Admin — full access"
      >
        <ShieldCheck size={10} fill="#fbbf24" />
        Admin
      </div>
    );
  }

  // Normal Pro / Free badge
  const label = isPro
    ? "Pro"
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
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          color: isPro ? "#4ade80" : "rgba(255,255,255,0.65)",
          transition: "all .18s",
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