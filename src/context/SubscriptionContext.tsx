/**
 * SubscriptionContext.tsx
 * Wraps the app so any component can call useSubContext()
 * instead of re-fetching on every mount.
 *
 * NOTE: canAccess() currently returns true for ALL features
 * so no content is gated. To re-enable gating, change the
 * GATE_FEATURES constant to true.
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
 * Set to true to enforce Pro-only feature gates.
 * Set to false (default) to allow all users access to everything.
 */
const GATE_FEATURES = false;

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
  maxForecastDays: number;
  loading: boolean;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  refresh: () => void;
  canAccess: (f: ProFeature) => boolean;
}

const DEFAULT_SUB: Subscription = { plan: "free", status: "active", expires_at: null };

const SubContext = createContext<SubContextValue>({
  sub: DEFAULT_SUB,
  isPro: false,
  maxForecastDays: 14,
  loading: false,
  user: null,
  setUser: () => {},
  refresh: () => {},
  canAccess: () => true,
});

export const useSubContext = () => useContext(SubContext);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read initial user from sessionStorage
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

  // Sync user changes to sessionStorage
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

  // When GATE_FEATURES is false, always give the full 14-day range
  const maxForecastDays = GATE_FEATURES
    ? (MAX_FORECAST_DAYS[sub.plan] ?? 3)
    : 14;

  const canAccess = useCallback(
    (_feature: ProFeature): boolean => {
      // If gating is disabled, always allow
      if (!GATE_FEATURES) return true;

      const proOnly: ProFeature[] = [
        "s104_export",
        "forecast_14d",
        "activity_full",
        "luwes_overlay",
      ];
      if (!proOnly.includes(_feature)) return true;
      return isPro;
    },
    [isPro]
  );

  return (
    <SubContext.Provider
      value={{
        sub,
        isPro,
        maxForecastDays,
        loading,
        user,
        setUser,
        refresh,
        canAccess,
      }}
    >
      {children}
    </SubContext.Provider>
  );
};