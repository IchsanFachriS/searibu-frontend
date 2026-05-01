/**
 * SubscriptionContext — global subscription state and feature gates.
 *
 * Feature boundaries per billing tier:
 *
 *   Feature                  | Free          | Pro
 *   ─────────────────────────────────────────────────
 *   Tidal prediction horizon | 3 days ahead  | 14 days ahead
 *   Weather coverage         | today +3 days | ±14 days
 *   S-104 HDF5 export        | unlocked      | unlocked
 *   Luwes overlay            | unlocked      | unlocked
 *   Activity safety guide    | unlocked      | unlocked
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { AuthUser, Subscription, ProFeature } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GATE_FEATURES = true;

export const FREE_TIDE_DAYS = 3;
export const FREE_WX_DAYS = 3;

const DEFAULT_SUB: Subscription = { plan: "free", status: "active", expires_at: null };

interface SubContextValue {
  sub: Subscription;
  isPro: boolean;
  maxTideDays: number;
  maxWxDays: number;
  /** Alias for maxTideDays — kept for PricingModal compatibility. */
  maxForecastDays: number;
  loading: boolean;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  refresh: () => void;
  canAccess: (feature: ProFeature) => boolean;
  clampForecastDate: (d: Date) => Date;
}

const SubContext = createContext<SubContextValue>({
  sub: DEFAULT_SUB,
  isPro: false,
  maxTideDays: FREE_TIDE_DAYS,
  maxWxDays: FREE_WX_DAYS,
  maxForecastDays: FREE_TIDE_DAYS,
  loading: false,
  user: null,
  setUser: () => {},
  refresh: () => {},
  canAccess: () => true,
  clampForecastDate: (d) => d,
});

export const useSubContext = () => useContext(SubContext);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const s = sessionStorage.getItem("searibu_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [sub, setSub] = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) sessionStorage.setItem("searibu_user", JSON.stringify(u));
    else sessionStorage.removeItem("searibu_user");
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.email) { setSub(DEFAULT_SUB); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/subscription?email=${encodeURIComponent(user.email)}`);
      setSub(res.ok ? await res.json() : DEFAULT_SUB);
    } catch {
      setSub(DEFAULT_SUB);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { refresh(); }, [refresh]);

  const isPro =
    (sub.plan === "pro_monthly" || sub.plan === "pro_annual") &&
    sub.status === "active";

  const maxTideDays = GATE_FEATURES ? (isPro ? 14 : FREE_TIDE_DAYS) : 14;
  const maxWxDays   = GATE_FEATURES ? (isPro ? 14 : FREE_WX_DAYS)   : 14;

  const canAccess = useCallback(
    (feature: ProFeature): boolean => {
      if (!GATE_FEATURES) return true;
      const proOnly: ProFeature[] = ["forecast_14d"];
      return proOnly.includes(feature) ? isPro : true;
    },
    [isPro],
  );

  const clampForecastDate = useCallback(
    (d: Date): Date => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const max = new Date(today);
      max.setDate(today.getDate() + maxTideDays - 1);
      if (d > max) return max;
      if (!isPro && GATE_FEATURES && d < today) return today;
      return d;
    },
    [isPro, maxTideDays],
  );

  return (
    <SubContext.Provider
      value={{
        sub, isPro, maxTideDays, maxWxDays,
        maxForecastDays: maxTideDays,
        loading, user, setUser, refresh, canAccess, clampForecastDate,
      }}
    >
      {children}
    </SubContext.Provider>
  );
};