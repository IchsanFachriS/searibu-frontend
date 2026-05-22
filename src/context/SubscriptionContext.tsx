/**
 * SubscriptionContext — global subscription + role + admin state.
 *
 * Access matrix:
 *
 *   Feature          | Free | Pro  | Researcher+Pro | Admin
 *   ─────────────────┼──────┼──────┼────────────────┼──────
 *   S-104 HDF5       |  No  |  No  |      Yes       |  Yes
 *   Forecast 14d     |  No  | Yes  |      Yes       |  Yes
 *   Technical UI     |  No  |  No  |      Yes       |  Yes
 *   Unlimited history|  No  |  No  |       No       |  Yes
 *
 * Admin overrides everything — no subscription or role check needed.
 */

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from "react";
import type { AuthUser, Subscription, ProFeature, UserRole } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GATE_FEATURES = true;

export const FREE_TIDE_DAYS = 3;
export const FREE_WX_DAYS   = 3;

const DEFAULT_SUB: Subscription = { plan: "free", status: "active", expires_at: null };

interface SubContextValue {
  sub:               Subscription;
  isPro:             boolean;
  isResearcher:      boolean;
  isAdmin:           boolean;
  maxTideDays:       number;
  maxWxDays:         number;
  maxForecastDays:   number;
  loading:           boolean;
  user:              AuthUser | null;
  setUser:           (u: AuthUser | null) => void;
  updateRole:        (role: UserRole) => Promise<void>;
  refresh:           () => void;
  canAccess:         (feature: ProFeature) => boolean;
  clampForecastDate: (d: Date) => Date;
}

const SubContext = createContext<SubContextValue>({
  sub:               DEFAULT_SUB,
  isPro:             false,
  isResearcher:      false,
  isAdmin:           false,
  maxTideDays:       FREE_TIDE_DAYS,
  maxWxDays:         FREE_WX_DAYS,
  maxForecastDays:   FREE_TIDE_DAYS,
  loading:           false,
  user:              null,
  setUser:           () => {},
  updateRole:        async () => {},
  refresh:           () => {},
  canAccess:         () => false,
  clampForecastDate: (d) => d,
});

export const useSubContext = () => useContext(SubContext);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const s = sessionStorage.getItem("searibu_user");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const [sub,     setSub]     = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) sessionStorage.setItem("searibu_user", JSON.stringify(u));
    else   sessionStorage.removeItem("searibu_user");
  }, []);

  const updateRole = useCallback(async (role: UserRole) => {
    if (!user?.email) return;
    const res = await fetch(`${API}/api/profile/role`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: user.email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Failed to update role");
    }
    const data  = await res.json();
    setUser({ ...user, role: data.user.role });
  }, [user, setUser]);

  const refresh = useCallback(async () => {
    if (!user?.email) { setSub(DEFAULT_SUB); return; }
    setLoading(true);
    try {
      const [subRes, profileRes] = await Promise.all([
        fetch(`${API}/api/subscription?email=${encodeURIComponent(user.email)}`),
        fetch(`${API}/api/profile?email=${encodeURIComponent(user.email)}`),
      ]);

      if (subRes.ok) setSub(await subRes.json());
      else           setSub(DEFAULT_SUB);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        const updated: Partial<AuthUser> = {};
        if (profile.role     !== undefined && profile.role     !== user.role)     updated.role     = profile.role;
        if (profile.is_admin !== undefined && profile.is_admin !== user.is_admin) updated.is_admin = profile.is_admin;
        if (Object.keys(updated).length) setUser({ ...user, ...updated });
      }
    } catch {
      setSub(DEFAULT_SUB);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.role, user?.is_admin]);

  useEffect(() => { refresh(); }, [refresh]);

  const isAdmin      = user?.is_admin === true;
  const isPro        = isAdmin || ((sub.plan === "pro_monthly" || sub.plan === "pro_annual") && sub.status === "active");
  const isResearcher = isAdmin || user?.role === "researcher";

  // Admin gets unlimited history; Pro gets 14 days; Free gets 3 days
  const maxTideDays = GATE_FEATURES
    ? (isAdmin ? 9999 : isPro ? 14 : FREE_TIDE_DAYS)
    : 14;
  const maxWxDays = GATE_FEATURES
    ? (isAdmin ? 9999 : isPro ? 14 : FREE_WX_DAYS)
    : 14;

  /**
   * canAccess:
   *   Admin           → always true
   *   s104_export     → researcher AND Pro
   *   forecast_14d    → Pro (or admin)
   *   others          → always true
   */
  const canAccess = useCallback(
    (feature: ProFeature): boolean => {
      if (!GATE_FEATURES || isAdmin) return true;
      if (feature === "s104_export")  return isResearcher && isPro;
      if (feature === "forecast_14d") return isPro;
      return true;
    },
    [isAdmin, isPro, isResearcher],
  );

  const clampForecastDate = useCallback(
    (d: Date): Date => {
      if (isAdmin) return d;                     // no clamp for admin
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const max = new Date(today);
      max.setDate(today.getDate() + maxTideDays - 1);
      if (d > max) return max;
      if (!isPro && GATE_FEATURES && d < today) return today;
      return d;
    },
    [isAdmin, isPro, maxTideDays],
  );

  return (
    <SubContext.Provider value={{
      sub, isPro, isResearcher, isAdmin,
      maxTideDays, maxWxDays,
      maxForecastDays: maxTideDays,
      loading, user, setUser, updateRole, refresh,
      canAccess, clampForecastDate,
    }}>
      {children}
    </SubContext.Provider>
  );
};