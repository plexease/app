"use client";

import { useState, useSyncExternalStore } from "react";

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getConsentSnapshot() {
  return localStorage.getItem("cookie-consent");
}

function getConsentServerSnapshot() {
  return "pending";
}

export function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeToStorage,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = !consent && !dismissed;

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setDismissed(true);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950 px-6 py-4">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-400">
          We use essential cookies to make this site work. We&apos;d also like to use analytics
          cookies to improve your experience.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
