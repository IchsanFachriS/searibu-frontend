/**
 * useSubscription.ts
 * Fetches and caches the current user's subscription from
 *   GET /api/subscription?email=<email>
 * Also exposes feature-gate helpers used throughout the app.
 */

import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type Plan = "free" | "pro_monthly" | "pro_annual";
export type SubStatus = "active" | "expired" | "cancelled";

export interface Subscription {
  plan: Plan;
  status: SubStatus;
  expires_at: string | null;
  starts_at?: string | null;
  user_id?: number;
}

const DEFAULT_SUB: Subscription = {
  plan: "free",
  status: "active",
  expires_at: null,
};

/** Max forecast days per plan */
export const MAX_FORECAST_DAYS: Record<Plan, number> = {
  free: 3,
  pro_monthly: 14,
  pro_annual: 14,
};

/** Features gated behind Pro */
export type ProFeature = "s104_export" | "forecast_14d" | "activity_full" | "luwes_overlay";
const PRO_FEATURES: ProFeature[] = ["s104_export", "forecast_14d", "activity_full", "luwes_overlay"];

export function useSubscription(email: string | null) {
  const [sub, setSub] = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!email) { setSub(DEFAULT_SUB); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/subscription?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSub(data);
      } else {
        setSub(DEFAULT_SUB);
      }
    } catch (e) {
      setError("Failed to load subscription");
      setSub(DEFAULT_SUB);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { refresh(); }, [refresh]);

  const isPro =
    (sub.plan === "pro_monthly" || sub.plan === "pro_annual") &&
    sub.status === "active";

  const maxForecastDays = MAX_FORECAST_DAYS[sub.plan] ?? 3;

  const canAccess = useCallback(
    (feature: ProFeature) => {
      if (!PRO_FEATURES.includes(feature)) return true;
      return isPro;
    },
    [isPro]
  );

  return { sub, isPro, maxForecastDays, loading, error, refresh, canAccess };
}