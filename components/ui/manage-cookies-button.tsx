"use client";

import { resetCookieConsent } from "@/components/ui/cookie-consent";

export function ManageCookiesButton() {
  return (
    <button
      onClick={() => resetCookieConsent()}
      className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
    >
      Manage cookies
    </button>
  );
}
