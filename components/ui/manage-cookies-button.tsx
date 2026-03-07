"use client";

import { resetCookieConsent } from "@/components/ui/cookie-consent";

export function ManageCookiesButton() {
  return (
    <button
      onClick={() => resetCookieConsent()}
      className="text-sm text-muted-500 hover:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1 transition-colors"
    >
      Manage cookies
    </button>
  );
}
