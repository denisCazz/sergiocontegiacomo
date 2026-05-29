/**
 * Client-side conversion / interaction tracking (GA4 + Umami).
 * Call only in browser context (inline scripts or client components).
 */
export type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    umami?: { track: (name: string, data?: Record<string, string>) => void };
  }
}

export function trackEvent(eventName: string, params?: TrackParams): void {
  if (typeof window === 'undefined') return;

  const gaId =
    typeof document !== 'undefined'
      ? document.querySelector('script[src*="googletagmanager.com/gtag/js"]')?.getAttribute('src')?.match(/id=([^&]+)/)?.[1]
      : undefined;

  if (typeof window.gtag === 'function' && gaId) {
    window.gtag('event', eventName, params ?? {});
  }

  if (typeof window.umami?.track === 'function') {
    const umamiData: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) umamiData[k] = String(v);
      }
    }
    window.umami.track(eventName, umamiData);
  }
}
