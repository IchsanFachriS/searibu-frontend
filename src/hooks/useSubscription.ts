import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type Plan = 'free' | 'pro_monthly' | 'pro_annual';

export interface Subscription {
  plan: Plan;
  status: 'active' | 'expired' | 'cancelled';
  expires_at: string | null;
}

export function useSubscription(email: string | null) {
  const [sub, setSub] = useState<Subscription>({
    plan: 'free', status: 'active', expires_at: null
  });
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/subscription?email=${encodeURIComponent(email)}`);
      if (r.ok) setSub(await r.json());
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const isPro = sub.plan !== 'free' && sub.status === 'active';

  // Max forecast days allowed
  const maxForecastDays = isPro ? 14 : 3;

  return { sub, isPro, maxForecastDays, loading, refresh: fetch_ };
}