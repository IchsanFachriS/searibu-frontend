/**
 * SubscriptionContext.tsx
 *
 * Feature gates per Table 3 — Subscription Tier Feature Boundaries:
 *
 *   Feature                   | Free            | Pro Monthly/Annual
 *   ─────────────────────────────────────────────────────────────────
 *   Tidal prediction horizon  | 3 days ahead    | 14 days ahead
 *   Marine weather coverage   | current day +3  | ±14 days from today
 *   IHO S-104 HDF5 export     | NOT available   | Available
 *   Luwes observation overlay | Available       | Available
 *   Activity safety assess.   | Available       | Available
 *   WebGIS map access         | Full access     | Full access
 *   Price                     | IDR 0           | IDR 39,000/mo | IDR 139,000/yr
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Subscription, Plan, ProFeature } from "../hooks/useSubscription";
import { MAX_FORECAST_DAYS } from "../hooks/useSubscription";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * GATE_FEATURES = true  → enforce Pro-only gates (production behaviour)
 * GATE_FEATURES = false → open access for development / demo
 */
const GATE_FEATURES = true;

/** Free tier: date picker limited to today .. today+FREE_TIDE_DAYS */
export const FREE_TIDE_DAYS = 3;
/** Free tier: weather table / hourly data limited to today .. today+FREE_WX_DAYS */
export const FREE_WX_DAYS = 3;

interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  last_login?: string;
  avatar?: string;
}

interface SubContextValue {
  sub: Subscription;
  isPro: boolean;
  /** Max days ahead the date-picker may go for tidal data */
  maxTideDays: number;
  /** Max days ahead/behind the date-picker may go for weather data */
  maxWxDays: number;
  /** Legacy alias kept for PricingModal compatibility */
  maxForecastDays: number;
  loading: boolean;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  refresh: () => void;
  /** Returns true when the user may access a given Pro feature */
  canAccess: (f: ProFeature) => boolean;
  /**
   * Returns a Date clamped to the furthest allowed forecast date.
   * Pass a JS Date; receive a Date (possibly the same).
   */
  clampForecastDate: (d: Date) => Date;
}

const DEFAULT_SUB: Subscription = { plan: "free", status: "active", expires_at: null };

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
    if (u) {
      sessionStorage.setItem("searibu_user", JSON.stringify(u));
    } else {
      sessionStorage.removeItem("searibu_user");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.email) {
      setSub(DEFAULT_SUB);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/subscription?email=${encodeURIComponent(user.email)}`
      );
      if (res.ok) {
        setSub(await res.json());
      } else {
        setSub(DEFAULT_SUB);
      }
    } catch {
      setSub(DEFAULT_SUB);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro =
    (sub.plan === "pro_monthly" || sub.plan === "pro_annual") &&
    sub.status === "active";

  /* ── Per-feature day limits ─────────────────────────────────── */
  const maxTideDays = GATE_FEATURES
    ? isPro ? 14 : FREE_TIDE_DAYS
    : 14;

  const maxWxDays = GATE_FEATURES
    ? isPro ? 14 : FREE_WX_DAYS
    : 14;

  /* Legacy alias */
  const maxForecastDays = maxTideDays;

  /* ── Feature gate ───────────────────────────────────────────── */
  const canAccess = useCallback(
    (feature: ProFeature): boolean => {
      if (!GATE_FEATURES) return true;
      // Only S-104 export is Pro-only per the table
      const proOnly: ProFeature[] = ["s104_export", "forecast_14d"];
      if (!proOnly.includes(feature)) return true;
      return isPro;
    },
    [isPro]
  );

  /* ── Clamp a JS Date to the furthest allowed forecast date ──── */
  const clampForecastDate = useCallback(
    (d: Date): Date => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + maxTideDays - 1);
      if (d > maxDate) return maxDate;
      // Free also can't go more than 0 days into the past (today only baseline)
      if (!isPro && GATE_FEATURES && d < today) return today;
      return d;
    },
    [isPro, maxTideDays]
  );

  return (
    <SubContext.Provider
      value={{
        sub,
        isPro,
        maxTideDays,
        maxWxDays,
        maxForecastDays,
        loading,
        user,
        setUser,
        refresh,
        canAccess,
        clampForecastDate,
      }}
    >
      {children}
    </SubContext.Provider>
  );
};