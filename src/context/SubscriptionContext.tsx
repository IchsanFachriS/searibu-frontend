/**
 * SubscriptionContext.tsx
 * Wraps the app so any component can call useSubContext()
 * instead of re-fetching on every mount.
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
  maxForecastDays: 3,
  loading: false,
  user: null,
  setUser: () => {},
  refresh: () => {},
  canAccess: () => false,
});

export const useSubContext = () => useContext(SubContext);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const s = sessionStorage.getItem("searibu_user");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
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
      const res = await fetch(
        `${API}/api/subscription?email=${encodeURIComponent(user.email)}`
      );
      if (res.ok) setSub(await res.json());
      else setSub(DEFAULT_SUB);
    } catch { setSub(DEFAULT_SUB); }
    finally { setLoading(false); }
  }, [user?.email]);

  useEffect(() => { refresh(); }, [refresh]);

  const isPro =
    (sub.plan === "pro_monthly" || sub.plan === "pro_annual") &&
    sub.status === "active";

  const maxForecastDays = MAX_FORECAST_DAYS[sub.plan] ?? 3;

  const canAccess = useCallback(
    (feature: ProFeature) => {
      const proOnly: ProFeature[] = ["s104_export", "forecast_14d", "activity_full", "luwes_overlay"];
      if (!proOnly.includes(feature)) return true;
      return isPro;
    },
    [isPro]
  );

  return (
    <SubContext.Provider
      value={{ sub, isPro, maxForecastDays, loading, user, setUser, refresh, canAccess }}
    >
      {children}
    </SubContext.Provider>
  );
};