"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(friendlyAuthError(error.message));
      setLoading(false);
    } else {
      toast.success("Password updated successfully");
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-muted-300">
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-300">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Repeat your new password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
