/**
 * useSubscription.ts
 *
 * Per-plan limits (Table 3):
 *   free         → tidal 3 days ahead, weather current+3
 *   pro_monthly  → tidal 14 days, weather ±14 days
 *   pro_annual   → tidal 14 days, weather ±14 days
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

/** Max tidal forecast days per plan (days AHEAD from today) */
export const MAX_FORECAST_DAYS: Record<Plan, number> = {
  free: 3,
  pro_monthly: 14,
  pro_annual: 14,
};

/** Max weather days per plan (days ahead; same symmetrically behind for Pro) */
export const MAX_WEATHER_DAYS: Record<Plan, number> = {
  free: 3,        // current day + 3
  pro_monthly: 14, // ±14 days from today
  pro_annual: 14,
};

/** Features gated behind Pro */
export type ProFeature = "s104_export" | "forecast_14d" | "activity_full" | "luwes_overlay";
const PRO_FEATURES: ProFeature[] = ["s104_export", "forecast_14d"];

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
    } catch {
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
  const maxWeatherDays  = MAX_WEATHER_DAYS[sub.plan] ?? 3;

  const canAccess = useCallback(
    (feature: ProFeature) => {
      if (!PRO_FEATURES.includes(feature)) return true;
      return isPro;
    },
    [isPro]
  );

  return { sub, isPro, maxForecastDays, maxWeatherDays, loading, error, refresh, canAccess };
}