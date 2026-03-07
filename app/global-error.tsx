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
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a14",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "3.75rem", fontWeight: "bold", margin: 0 }}>500</h1>
        <p style={{ marginTop: "1rem", fontSize: "1.25rem", color: "#9490ad" }}>
          Something went wrong
        </p>
        {process.env.NODE_ENV === "development" && (
          <p
            style={{
              marginTop: "1rem",
              maxWidth: "32rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#f87171",
            }}
          >
            {error.message}
          </p>
        )}
        <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={reset}
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "#8b5cf6",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{
              borderRadius: "0.5rem",
              border: "1px solid #2e2946",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#b8b4cc",
              textDecoration: "none",
            }}
          >
            Go to dashboard
          </a>
          <a
            href="/"
            style={{
              borderRadius: "0.5rem",
              border: "1px solid #2e2946",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#b8b4cc",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
