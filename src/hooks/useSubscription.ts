/**
 * useSubscription — standalone hook for fetching subscription state.
 *
 * Used by components that need subscription data outside of SubscriptionContext,
 * e.g. billing-related utilities.
 */

import { useState, useEffect, useCallback } from "react";
import type { Subscription, ProFeature } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const MAX_FORECAST_DAYS: Record<string, number> = {
  free:        3,
  pro_monthly: 14,
  pro_annual:  14,
};

const DEFAULT_SUB: Subscription = { plan: "free", status: "active", expires_at: null };
const PRO_ONLY: ProFeature[] = ["s104_export", "forecast_14d"];

export function useSubscription(email: string | null) {
  const [sub,     setSub]     = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!email) { setSub(DEFAULT_SUB); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/subscription?email=${encodeURIComponent(email)}`);
      setSub(res.ok ? await res.json() : DEFAULT_SUB);
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

  const canAccess = useCallback(
    (feature: ProFeature) => (PRO_ONLY.includes(feature) ? isPro : true),
    [isPro],
  );

  return {
    sub,
    isPro,
    maxForecastDays: MAX_FORECAST_DAYS[sub.plan] ?? 3,
    loading,
    error,
    refresh,
    canAccess,
  };
}