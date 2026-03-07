"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.error(error);
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-surface-950 text-white">
      <h1 className="font-heading text-6xl font-bold">500</h1>
      <p className="mt-4 text-xl text-muted-400">Something went wrong</p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 max-w-lg text-center text-sm text-red-400">{error.message}</p>
      )}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Try again
        </button>
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="rounded-lg border border-surface-700 px-6 py-3 text-sm font-medium text-muted-300 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
          >
            Go to dashboard
          </Link>
        )}
        <Link
          href="/"
          className="rounded-lg border border-surface-700 px-6 py-3 text-sm font-medium text-muted-300 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
