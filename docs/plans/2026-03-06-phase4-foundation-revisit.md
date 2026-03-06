# Phase 4 — Foundation Revisit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix UX gaps, accessibility issues, and security vulnerabilities across the application foundation before proceeding to branding and launch phases.

**Architecture:** Four independent groups of changes — auth page UX, error pages, cookie consent, and security hardening. Each group produces a self-contained commit. No new database tables or API routes required.

**Tech Stack:** Next.js 16, React, Tailwind CSS, Supabase Auth, TypeScript, sonner (toasts)

---

## Group 1: Auth Page UX

### Task 1: Create auth error message helper

Create a utility that maps Supabase error messages to user-friendly text, preventing user enumeration.

**Files:**
- Create: `lib/auth-errors.ts`

**Step 1: Create the helper**

```typescript
// lib/auth-errors.ts

const friendlyMessages: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please check your email and confirm your account.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters":
    "Password must be at least 6 characters.",
  "Email rate limit exceeded": "Too many attempts. Please try again later.",
  "For security purposes, you can only request this after 60 seconds":
    "Please wait 60 seconds before trying again.",
};

export function friendlyAuthError(message: string): string {
  return friendlyMessages[message] ?? "Something went wrong. Please try again.";
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 2: Add branded header component for auth pages

Create a small reusable header that shows "Plexease" linking to `/`, used on all auth pages.

**Files:**
- Create: `components/auth/auth-header.tsx`

**Step 1: Create the component**

```typescript
// components/auth/auth-header.tsx
import Link from "next/link";

export function AuthHeader() {
  return (
    <div className="text-center">
      <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
        Plexease
      </Link>
    </div>
  );
}
```

---

### Task 3: Update login page — branding, error param, autoComplete

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `components/auth/login-form.tsx`

**Step 1: Update `app/(auth)/login/page.tsx`**

Replace the entire file:

```typescript
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthHeader } from "@/components/auth/auth-header";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-gray-400">Sign in to your Plexease account</p>
        </div>
        <OAuthButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-950 px-2 text-gray-500">or</span>
          </div>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Update `components/auth/login-form.tsx`**

Replace the entire file. Changes: import `friendlyAuthError`, read `?error` query param, add `autoComplete` to inputs.

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      toast.error("Authentication failed. Please sign in again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(friendlyAuthError(error.message));
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Your password"
        />
      </div>
      <div className="text-right">
        <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
          Forgot password?
        </a>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 4: Update signup page — branding, autoComplete, error sanitization

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `components/auth/signup-form.tsx`

**Step 1: Update `app/(auth)/signup/page.tsx`**

Replace the entire file:

```typescript
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthHeader } from "@/components/auth/auth-header";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-gray-400">Start using Plexease for free</p>
        </div>
        <OAuthButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-950 px-2 text-gray-500">or</span>
          </div>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Update `components/auth/signup-form.tsx`**

Replace the entire file. Changes: import `friendlyAuthError`, add `autoComplete` to inputs.

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(friendlyAuthError(error.message));
      setLoading(false);
    } else {
      router.push("/check-email");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="At least 6 characters"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 5: Update forgot-password page — branding, autoComplete, error sanitization

**Files:**
- Modify: `app/(auth)/forgot-password/page.tsx`
- Modify: `components/auth/forgot-password-form.tsx`

**Step 1: Update `app/(auth)/forgot-password/page.tsx`**

Replace the entire file:

```typescript
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthHeader } from "@/components/auth/auth-header";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Reset your password</h1>
          <p className="mt-2 text-gray-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Update `components/auth/forgot-password-form.tsx`**

Replace the entire file. Changes: import `friendlyAuthError`, add `autoComplete`.

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(friendlyAuthError(error.message));
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-gray-300">
          Check your email for a password reset link.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          If you don&apos;t see it, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 6: Update reset-password page — branding, navigation, autoComplete, error sanitization

**Files:**
- Modify: `app/(auth)/reset-password/page.tsx`
- Modify: `components/auth/reset-password-form.tsx`

**Step 1: Update `app/(auth)/reset-password/page.tsx`**

Replace the entire file. Changes: add `AuthHeader`, add "Back to login" link.

```typescript
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthHeader } from "@/components/auth/auth-header";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-gray-400">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
        <p className="text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Update `components/auth/reset-password-form.tsx`**

Replace the entire file. Changes: import `friendlyAuthError`, add `autoComplete="new-password"`.

```typescript
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
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
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
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Repeat your new password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 7: Update check-email page — branding, home link

**Files:**
- Modify: `app/(auth)/check-email/page.tsx`

**Step 1: Update the file**

Replace the entire file. Changes: add `AuthHeader`, add "Back to home" link.

```typescript
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <AuthHeader />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
          <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Check your email</h1>
        <p className="text-gray-400">
          We&apos;ve sent you a confirmation link. Click the link in your email to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
            Back to sign in
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-400">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 8: Add error handling to OAuth button

**Files:**
- Modify: `components/auth/oauth-button.tsx`

**Step 1: Update the file**

Replace the entire file. Changes: add try/catch with toast, add loading state.

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function OAuthButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error("Failed to connect to Google. Please try again.");
        setLoading(false);
      }
    } catch {
      toast.error("Failed to connect to Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 9: Mobile-responsive landing page nav

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update the nav section only**

In `app/page.tsx`, replace the `<nav>` block (lines 15-31) with a responsive version. The nav items stack vertically on small screens. We use a simple approach — show items in a row on `sm:` and up, wrap naturally on mobile:

```typescript
      {/* Nav */}
      <nav className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 lg:px-12">
        <Link href="/" className="text-xl font-bold hover:text-blue-400 transition-colors">
          Plexease
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>
```

Key changes: "Plexease" is now a clickable `Link` to `/`, added `flex-wrap` and `gap-2` for small screens.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 10: Audit and fix external links

**Step 1: Search for external links**

Run: `grep -rn 'target="_blank"' app/ components/`

Any results should have `rel="noopener noreferrer"` added. If no results, no action needed.

**Step 2: Search for `<a>` tags that should be `<Link>`**

Run: `grep -rn '<a ' app/ components/`

The `forgot-password` link in `login-form.tsx` uses an `<a>` tag — this was already addressed in Task 3 (kept as `<a>` since it's fine for internal nav, but could be changed to `Link` for consistency). Verify all `<a>` tags either use `Link` or have proper attributes.

---

### Task 11: Commit Group 1

Run:
```bash
git add lib/auth-errors.ts components/auth/auth-header.tsx app/(auth)/ components/auth/ app/page.tsx
git commit -m "feat: improve auth page UX — branding, navigation, error handling, accessibility"
```

---

## Group 2: Error Pages

### Task 12: Update `app/error.tsx` — home link, dashboard link, dev error details

**Files:**
- Modify: `app/error.tsx`

**Step 1: Replace the file**

```typescript
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 13: Update `app/global-error.tsx` — head element, home link, dashboard link, error logging, dev details

**Files:**
- Modify: `app/global-error.tsx`

**Step 1: Replace the file**

Note: `global-error.tsx` replaces the entire root layout, so we cannot use `<Link>` (it requires a router context). Use `<a>` tags instead. We also cannot easily check auth state since the app context is gone.

```typescript
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 14: Verify `app/not-found.tsx` consistency

**Files:**
- Modify: `app/not-found.tsx`

**Step 1: Update for consistency with the other error pages**

Add a dashboard link option. Since `not-found.tsx` is a server component by default, we cannot check auth state. Keep it simple with both links always visible.

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-gray-400">Page not found</p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Go to dashboard
        </Link>
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 15: Commit Group 2

Run:
```bash
git add app/error.tsx app/global-error.tsx app/not-found.tsx
git commit -m "feat: improve error pages — navigation links, dev error details, consistent styling"
```

---

## Group 3: Cookie Consent

### Task 16: Refactor cookie consent with expiry, utility export, and GDPR improvements

**Files:**
- Modify: `components/ui/cookie-consent.tsx`

**Step 1: Replace the file**

Major changes: consent expiry (12 months), exported `getCookieConsent()` utility, GDPR-compliant copy, accessibility attributes, "manage cookies" support via custom event, hide on `/privacy`.

```typescript
"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "cookie-consent";
const CONSENT_TIMESTAMP_KEY = "cookie-consent-at";
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cookie-consent-reset", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cookie-consent-reset", callback);
  };
}

function getConsentSnapshot(): string | null {
  const consent = localStorage.getItem(CONSENT_KEY);
  const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);

  // Check if consent has expired (12 months)
  if (consent && timestamp) {
    const consentAge = Date.now() - parseInt(timestamp, 10);
    if (consentAge > CONSENT_MAX_AGE_MS) {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
      return null;
    }
  }

  return consent;
}

function getConsentServerSnapshot(): string | null {
  return "pending";
}

/**
 * Check cookie consent state from anywhere in the app.
 * Returns "accepted", "rejected", or null (not yet chosen / expired).
 */
export function getCookieConsent(): string | null {
  if (typeof window === "undefined") return null;
  return getConsentSnapshot();
}

/**
 * Reset cookie consent, triggering the banner to re-appear.
 * Call this from a "Manage cookies" link.
 */
export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
  window.dispatchEvent(new CustomEvent("cookie-consent-reset"));
}

export function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeToStorage,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Hide on privacy policy page
  const isPrivacyPage = pathname === "/privacy";
  const visible = !consent && !dismissed && !isPrivacyPage;

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
    setDismissed(true);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
    setDismissed(true);
  }, []);

  // Reset dismissed state when consent is cleared (manage cookies)
  useEffect(() => {
    if (!consent) setDismissed(false);
  }, [consent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950 px-6 py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-400">
          We use essential cookies for authentication and site functionality.
          We&apos;d also like to use analytics cookies to understand how you use Plexease
          and improve your experience.{" "}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">
            Privacy policy
          </a>
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 17: Add "Manage cookies" link to sidebar and landing page footer

**Files:**
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `app/page.tsx`

**Step 1: Update sidebar**

Add a "Manage cookies" button above the sign-out button. In `components/dashboard/sidebar.tsx`, add the import and button.

At the top, add import:
```typescript
import { resetCookieConsent } from "@/components/ui/cookie-consent";
```

Replace the bottom section (the `<div className="border-t ...">` block before closing `</aside>`) with:

```typescript
      <div className="border-t border-gray-800 pt-4 space-y-1">
        <button
          onClick={() => resetCookieConsent()}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          Manage cookies
        </button>
        <SignOutButton />
      </div>
```

**Step 2: Update landing page footer**

In `app/page.tsx`, replace the footer:

```typescript
      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Plexease. All rights reserved.</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href="/privacy" className="hover:text-gray-400 transition-colors">
            Privacy policy
          </a>
        </div>
      </footer>
```

Note: The "Manage cookies" link in the footer is trickier since the landing page is a server component. We'll add it as a client component in Task 18.

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 18: Add "Manage cookies" button for landing page footer

**Files:**
- Create: `components/ui/manage-cookies-button.tsx`
- Modify: `app/page.tsx`

**Step 1: Create the client component**

```typescript
// components/ui/manage-cookies-button.tsx
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
```

**Step 2: Update landing page footer**

In `app/page.tsx`, add import at top:
```typescript
import { ManageCookiesButton } from "@/components/ui/manage-cookies-button";
```

Update the footer to:
```typescript
      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Plexease. All rights reserved.</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href="/privacy" className="hover:text-gray-400 transition-colors">
            Privacy policy
          </a>
          <ManageCookiesButton />
        </div>
      </footer>
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 19: Commit Group 3

Run:
```bash
git add components/ui/cookie-consent.tsx components/ui/manage-cookies-button.tsx components/dashboard/sidebar.tsx app/page.tsx
git commit -m "feat: improve cookie consent — GDPR compliance, expiry, manage cookies, accessibility"
```

---

## Group 4: Security Hardening

### Task 20: Fix cookie security flag in dashboard layout

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Step 1: Change the secure flag**

In `app/(dashboard)/layout.tsx`, find line 52:
```typescript
      secure: process.env.NODE_ENV === "production",
```

Replace with:
```typescript
      secure: process.env.VERCEL_ENV === "production",
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 21: Add `'use server'` to service client

**Files:**
- Modify: `lib/supabase/service.ts`

**Step 1: Add the directive**

Add `"use server";` as the very first line of `lib/supabase/service.ts`:

```typescript
"use server";

import { createClient } from "@supabase/supabase-js";

// Service role client for server-side operations that bypass RLS
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 22: Add auth routes to middleware

**Files:**
- Modify: `lib/supabase/middleware.ts`

**Step 1: Update the authRoutes array**

Change line 5 from:
```typescript
const authRoutes = ["/login", "/signup", "/forgot-password"];
```

To:
```typescript
const authRoutes = ["/login", "/signup", "/forgot-password", "/check-email", "/reset-password"];
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 23: Sanitize error logging in API routes

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Modify: `app/api/tools/nuget-advisor/route.ts`

**Step 1: Audit and fix each file**

For each `console.error` call that logs a raw error object, change it to log only the message.

In `app/api/stripe/checkout/route.ts`, find:
```typescript
    console.error("Failed to create Stripe customer:", err);
```
Replace with:
```typescript
    console.error("Failed to create Stripe customer:", err instanceof Error ? err.message : "Unknown error");
```

And find:
```typescript
    console.error("Failed to create checkout session:", err);
```
Replace with:
```typescript
    console.error("Failed to create checkout session:", err instanceof Error ? err.message : "Unknown error");
```

In `app/api/stripe/webhook/route.ts`, find any `console.error` calls that log raw `err` objects and apply the same pattern:
```typescript
console.error(`Webhook handler error for ${event.type}:`, err instanceof Error ? err.message : "Unknown error");
```

In `app/api/tools/nuget-advisor/route.ts`, apply the same pattern to any `console.error` calls.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 24: Add email validation to checkout route

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`

**Step 1: Replace the non-null assertion**

Find the line (around line 50):
```typescript
    customerId = await getOrCreateStripeCustomer(user.id, user.email!, supabase);
```

Replace with:
```typescript
    if (!user.email) {
      return NextResponse.json({ error: "Email is required for billing" }, { status: 400 });
    }
    customerId = await getOrCreateStripeCustomer(user.id, user.email, supabase);
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 25: Update `.env.local.example`

**Files:**
- Modify: `.env.local.example`

**Step 1: Add missing variables**

Replace the file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=

# Anthropic
ANTHROPIC_API_KEY=
```

---

### Task 26: Add security headers to `next.config.ts`

**Files:**
- Modify: `next.config.ts`

**Step 1: Replace the file**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 27: Stricter CSRF check on checkout route

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`

**Step 1: Update the CSRF check**

Find (around lines 9-13):
```typescript
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
```

Replace with:
```typescript
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

---

### Task 28: Commit Group 4

Run:
```bash
git add app/(dashboard)/layout.tsx lib/supabase/service.ts lib/supabase/middleware.ts app/api/ .env.local.example next.config.ts
git commit -m "feat: security hardening — headers, CSRF, error sanitization, cookie flags"
```

---

## Final Verification

### Task 29: Full build check

Run: `npm run build`

Expected: Build succeeds with no errors. Fix any issues that arise.

### Task 30: Manual smoke test

Start dev server: `npm run dev`

Verify:
1. Landing page — nav is responsive, "Plexease" links to `/`, footer has privacy and manage cookies links
2. `/login` — shows "Plexease" header linking home, "Forgot password?" link works, error toast shows friendly messages
3. `/signup` — shows "Plexease" header, error messages are sanitized
4. `/forgot-password` — shows "Plexease" header, "Sign in" link works
5. `/reset-password` — shows "Plexease" header, "Sign in" link visible
6. `/check-email` — shows "Plexease" header, both "Back to sign in" and "Back to home" links
7. Error pages — navigate to `/nonexistent`, verify 404 shows both "Go to dashboard" and "Go home"
8. Cookie consent — clear localStorage, reload, verify banner appears with GDPR text and privacy link
9. Manage cookies — click "Manage cookies" in sidebar, verify banner re-appears
10. Response headers — check `X-Frame-Options: DENY` etc. in dev tools Network tab

### Task 31: Update PLEXEASE.md

Update the Phase 4 section to mark all items complete, and update the "Current Status" section.
