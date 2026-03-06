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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold">500</h1>
      <p className="mt-4 text-xl text-gray-400">Something went wrong</p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 max-w-lg text-center text-sm text-red-400">{error.message}</p>
      )}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Try again
        </button>
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </Link>
        )}
        <Link
          href="/"
          className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
