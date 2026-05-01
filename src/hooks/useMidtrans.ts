/**
 * useMidtrans — loads Snap.js once and exposes openPayment().
 *
 * Flow:
 *   1. POST /api/create-payment → receives snap_token
 *   2. Opens Midtrans Snap popup
 *   3. Calls the appropriate callback on result
 */

import { useCallback, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";
const SNAP_URL =
  import.meta.env.VITE_MIDTRANS_ENV === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

let _snapLoaded = false;

function loadSnap(): Promise<void> {
  if (_snapLoaded || (window as any).snap) {
    _snapLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SNAP_URL;
    s.setAttribute("data-client-key", CLIENT_KEY);
    s.onload = () => { _snapLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("Failed to load Snap.js"));
    document.head.appendChild(s);
  });
}

export interface PaymentCallbacks {
  onSuccess: (result: any) => void;
  onPending: (result: any) => void;
  onError:   (result: any) => void;
  onClose:   ()            => void;
}

export function useMidtrans() {
  const busy = useRef(false);

  const openPayment = useCallback(
    async (plan: "pro_monthly" | "pro_annual", email: string, cb: PaymentCallbacks) => {
      if (busy.current) return;
      busy.current = true;
      try {
        await loadSnap();

        const res = await fetch(`${API}/api/create-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, email }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).error || `HTTP ${res.status}`);
        }

        const { snap_token } = await res.json();
        (window as any).snap.pay(snap_token, {
          onSuccess: (r: any) => { busy.current = false; cb.onSuccess(r); },
          onPending: (r: any) => { busy.current = false; cb.onPending(r); },
          onError:   (r: any) => { busy.current = false; cb.onError(r); },
          onClose:   ()       => { busy.current = false; cb.onClose(); },
        });
      } catch (e) {
        busy.current = false;
        throw e;
      }
    },
    [],
  );

  return { openPayment };
}