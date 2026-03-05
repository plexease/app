"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
        <h1 className="text-6xl font-bold">500</h1>
        <p className="mt-4 text-xl text-gray-400">Something went wrong</p>
        <button
          onClick={reset}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
