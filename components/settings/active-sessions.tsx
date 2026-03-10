"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type SessionData = {
  id: string;
  deviceInfo: string;
  rawUserAgent: string | null;
  ipHash: string | null;
  lastActive: string;
  createdAt: string;
};

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function ActiveSessions({
  currentSessionId,
}: {
  currentSessionId: string;
}) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleSignOut(sessionId: string) {
    setSigningOut(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Device signed out");
      }
    } catch {
      toast.error("Failed to sign out device");
    } finally {
      setSigningOut(null);
    }
  }

  async function handleSignOutAll() {
    setSigningOut("all");
    try {
      const res = await fetch("/api/sessions?all_others=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.filter((s) => s.id === currentSessionId)
        );
        toast.success("All other devices signed out");
      }
    } catch {
      toast.error("Failed to sign out other devices");
    } finally {
      setSigningOut(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <p className="text-sm text-muted-400">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <p className="text-sm text-muted-400">No active sessions found.</p>
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-surface-700 bg-surface-900 divide-y divide-surface-700">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          return (
            <div
              key={session.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {session.deviceInfo}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-brand-400">
                      (this device)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-400">
                  Active {relativeTime(session.lastActive)}
                </p>
              </div>
              {!isCurrent && (
                <button
                  onClick={() => handleSignOut(session.id)}
                  disabled={signingOut === session.id}
                  className="text-sm text-muted-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {signingOut === session.id ? "..." : "Sign out"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {otherSessions.length > 0 && (
        <button
          onClick={handleSignOutAll}
          disabled={signingOut === "all"}
          className="w-full rounded-lg border border-surface-700 bg-surface-900 px-4 py-2.5 text-sm text-muted-400 hover:bg-surface-800 hover:text-white disabled:opacity-50 transition-colors"
        >
          {signingOut === "all"
            ? "Signing out..."
            : "Sign out all other devices"}
        </button>
      )}
    </div>
  );
}
