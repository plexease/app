"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "cookie-consent";
const CONSENT_TIMESTAMP_KEY = "cookie-consent-at";
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cookie-consent-reset", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cookie-consent-reset", callback);
  };
}

function getConsentSnapshot(): string | null {
  const consent = localStorage.getItem(CONSENT_KEY);
  const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);

  // Check if consent has expired (12 months)
  if (consent && timestamp) {
    const consentAge = Date.now() - parseInt(timestamp, 10);
    if (consentAge > CONSENT_MAX_AGE_MS) {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
      return null;
    }
  }

  return consent;
}

function getConsentServerSnapshot(): string | null {
  return "pending";
}

/**
 * Check cookie consent state from anywhere in the app.
 * Returns "accepted", "rejected", or null (not yet chosen / expired).
 */
export function getCookieConsent(): string | null {
  if (typeof window === "undefined") return null;
  return getConsentSnapshot();
}

/**
 * Reset cookie consent, triggering the banner to re-appear.
 * Call this from a "Manage cookies" link.
 */
export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
  window.dispatchEvent(new CustomEvent("cookie-consent-reset"));
}

export function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeToStorage,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Hide on privacy policy page
  const isPrivacyPage = pathname === "/privacy";
  const visible = !consent && !dismissed && !isPrivacyPage;

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
    setDismissed(true);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
    setDismissed(true);
  }, []);

  // Reset dismissed state when consent is cleared (manage cookies)
  useEffect(() => {
    if (!consent) setDismissed(false);
  }, [consent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-700 bg-surface-950 px-6 py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-400">
          We use essential cookies for authentication and site functionality.
          We&apos;d also like to use analytics cookies to understand how you use Plexease
          and improve your experience.{" "}
          <a href="/privacy" className="text-brand-400 hover:text-brand-300">
            Privacy policy
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="rounded-lg border border-surface-700 px-4 py-2 text-sm text-muted-300 hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
