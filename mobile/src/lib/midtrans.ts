declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: SnapResult) => void;
          onPending?: (result: SnapResult) => void;
          onError?: (result: SnapResult) => void;
          onClose?: () => void;
        }
      ) => void;
      embed?: (token: string, options: { embedId: string }) => void;
    };
  }
}

export type SnapResult = {
  status_code: string;
  status_message: string[];
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  fraud_status?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
};

export type SnapCallbacks = {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
};

let scriptLoadedPromise: Promise<boolean> | null = null;

export function loadSnapScript(clientKey?: string, isProduction = false): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.snap) return Promise.resolve(true);
  if (scriptLoadedPromise) return scriptLoadedPromise;

  const snapScriptUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  const resolvedClientKey =
    clientKey ||
    (import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string | undefined) ||
    'SB-Mid-client-test';

  scriptLoadedPromise = new Promise((resolve) => {
    // Check if script element already exists
    const existing = document.querySelector(`script[src*="snap/snap.js"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = snapScriptUrl;
    script.setAttribute('data-client-key', resolvedClientKey);
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Gagal memuat script Midtrans Snap.js');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return scriptLoadedPromise;
}

export async function openSnapPayment(
  snapToken: string,
  callbacks?: SnapCallbacks,
  clientKey?: string,
  isProduction = false
): Promise<void> {
  await loadSnapScript(clientKey, isProduction);

  if (window.snap && typeof window.snap.pay === 'function') {
    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        callbacks?.onSuccess?.(result);
      },
      onPending: (result) => {
        callbacks?.onPending?.(result);
      },
      onError: (result) => {
        callbacks?.onError?.(result);
      },
      onClose: () => {
        callbacks?.onClose?.();
      },
    });
  } else {
    // Fallback if Snap popup is blocked or unavailable
    const fallbackUrl = isProduction
      ? `https://app.midtrans.com/snap/v2/vtweb/${snapToken}`
      : `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
    window.open(fallbackUrl, '_blank');
  }
}
