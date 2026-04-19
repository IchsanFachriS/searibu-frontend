const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SNAP_JS = import.meta.env.VITE_MIDTRANS_ENV === 'production'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

// Load Snap.js once
let snapLoaded = false;
function loadSnap(): Promise<void> {
  if (snapLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SNAP_JS;
    s.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    s.onload = () => { snapLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export interface PaymentResult {
  status: 'success' | 'pending' | 'error' | 'closed';
}

export async function createPayment(
  plan: string,
  email: string,
  callbacks: {
    onSuccess: () => void;
    onPending: () => void;
    onError: () => void;
    onClose: () => void;
  }
): Promise<void> {
  await loadSnap();

  const r = await fetch(`${API}/api/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, email }),
  });

  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error || 'Payment creation failed');
  }

  const { snap_token } = await r.json();

  (window as any).snap.pay(snap_token, {
    onSuccess:  callbacks.onSuccess,
    onPending:  callbacks.onPending,
    onError:    callbacks.onError,
    onClose:    callbacks.onClose,
  });
}