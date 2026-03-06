"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — Plexease</title>
      </head>
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
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
          <a
            href="/dashboard"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </a>
          <a
            href="/"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
