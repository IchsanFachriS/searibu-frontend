import React, { useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import { useSubContext } from "../../context/SubscriptionContext";
import { PricingModal }  from "./PricingModal";

const FONT  = "'Inter', system-ui, -apple-system, sans-serif";
const AMBER = "#f5c518";
const DARK1 = "#2b2b2b";
const GREEN = "#9de05a";
const BLUE_D= "#1a3bbf";

interface Props { language?: "en" | "id"; }

export const SubscriptionStatusBadge: React.FC<Props> = ({ language = "en" }) => {
  const { isPro, isAdmin } = useSubContext();
  const [open, setOpen] = useState(false);

  if (isAdmin) {
    return (
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 99,
          border: `1px solid rgba(245,193,24,0.45)`,
          background: "rgba(245,193,24,0.12)",
          fontFamily: FONT, fontSize: 11, fontWeight: 700, color: AMBER,
          userSelect: "none", cursor: "default", letterSpacing: "0.03em",
        }}
        title="Admin — full access"
      >
        <ShieldCheck size={10} fill={AMBER} />
        Admin
      </div>
    );
  }

  const label = isPro ? "Pro" : (language === "en" ? "Free" : "Gratis");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={isPro ? "Pro plan active" : "Upgrade to Pro"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 99,
          border: isPro ? `1px solid rgba(157,224,90,0.35)` : "1px solid rgba(255,255,255,0.20)",
          background: isPro ? "rgba(157,224,90,0.12)" : "rgba(255,255,255,0.07)",
          cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 700,
          color: isPro ? GREEN : "rgba(245,240,232,0.60)",
          transition: "all 0.18s", letterSpacing: "0.03em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isPro ? "rgba(157,224,90,0.18)" : "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isPro ? "rgba(157,224,90,0.12)" : "rgba(255,255,255,0.07)";
        }}
      >
        <Zap size={10} fill={isPro ? GREEN : "none"} />
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