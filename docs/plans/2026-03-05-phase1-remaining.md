# Phase 1 Remaining — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining Phase 1 foundation items: landing page, dashboard shell, password reset, email verification, error/loading pages, toast notifications, and cookie consent.

**Architecture:** All pages follow the existing dark theme (bg-gray-950, text-white, blue-600 accents). Auth flows use Supabase's built-in email features. Dashboard uses a `(dashboard)` route group with its own layout containing a sidebar/nav. Toast notifications via `sonner`. Cookie consent stored in localStorage.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase Auth, sonner

---

### Task 1: Install sonner for toast notifications

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`

**Step 1: Install sonner**

Run:
```bash
cd /home/deck/Projects/plexease
npm install sonner
```

Expected: Package installs successfully.

**Step 2: Add Toaster to root layout**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plexease",
  description: "Complex integrations, made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
```

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add package.json package-lock.json app/layout.tsx
git commit -m "feat: add sonner toast notification system"
```

---

### Task 2: Add error pages

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`
- Create: `app/global-error.tsx`

**Step 1: Create 404 page**

Create `app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-gray-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
```

**Step 2: Create error boundary page**

Create `app/error.tsx`:

```tsx
"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold">500</h1>
      <p className="mt-4 text-xl text-gray-400">Something went wrong</p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
```

**Step 3: Create global error boundary**

Create `app/global-error.tsx`:

```tsx
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
```

**Step 4: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add app/not-found.tsx app/error.tsx app/global-error.tsx
git commit -m "feat: add error pages (404, 500, global error boundary)"
```

---

### Task 3: Add loading states

**Files:**
- Create: `app/loading.tsx`
- Create: `components/ui/spinner.tsx`

**Step 1: Create spinner component**

Create `components/ui/spinner.tsx`:

```tsx
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
```

**Step 2: Create root loading page**

Create `app/loading.tsx`:

```tsx
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <Spinner />
    </main>
  );
}
```

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/ui/spinner.tsx app/loading.tsx
git commit -m "feat: add loading spinner component and root loading page"
```

---

### Task 4: Password reset flow — forgot password page

**Files:**
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `components/auth/forgot-password-form.tsx`

**Step 1: Create forgot password form component**

Create `components/auth/forgot-password-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
      toast.error(error.message);
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

**Step 2: Create forgot password page**

Create `app/(auth)/forgot-password/page.tsx`:

```tsx
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
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

**Step 3: Add "Forgot password?" link to login form**

Modify `components/auth/login-form.tsx`. Add this link after the password input `<div>` and before the submit button:

```tsx
      <div className="text-right">
        <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
          Forgot password?
        </a>
      </div>
```

**Step 4: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add app/(auth)/forgot-password/ components/auth/forgot-password-form.tsx components/auth/login-form.tsx
git commit -m "feat: add forgot password page and reset email flow"
```

---

### Task 5: Password reset flow — update password page

**Files:**
- Create: `app/(auth)/reset-password/page.tsx`
- Create: `components/auth/reset-password-form.tsx`

**Step 1: Create reset password form component**

Create `components/auth/reset-password-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
      toast.error(error.message);
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

**Step 2: Create reset password page**

Create `app/(auth)/reset-password/page.tsx`:

```tsx
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-gray-400">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
```

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add app/(auth)/reset-password/ components/auth/reset-password-form.tsx
git commit -m "feat: add reset password page (completes password reset flow)"
```

---

### Task 6: Email verification — check email page

After signup, users should see a "check your email" message instead of being redirected to the dashboard immediately. The signup form currently does `router.push("/dashboard")` on success, but if email confirmation is enabled in Supabase, the user isn't actually logged in yet.

**Files:**
- Create: `app/(auth)/check-email/page.tsx`
- Modify: `components/auth/signup-form.tsx`

**Step 1: Create check email page**

Create `app/(auth)/check-email/page.tsx`:

```tsx
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
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
        <Link href="/login" className="inline-block text-sm text-blue-400 hover:text-blue-300">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
```

**Step 2: Update signup form to redirect to check-email**

Modify `components/auth/signup-form.tsx`. Change the success redirect from:

```tsx
router.push("/dashboard");
```

to:

```tsx
router.push("/check-email");
```

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add app/(auth)/check-email/ components/auth/signup-form.tsx
git commit -m "feat: add check-email page, redirect signup to email verification"
```

---

### Task 7: Update middleware for route protection

The current middleware only refreshes sessions. It needs to protect `/dashboard` routes by redirecting unauthenticated users to `/login`.

**Files:**
- Modify: `lib/supabase/middleware.ts`

**Step 1: Add route protection to middleware**

Replace the contents of `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Step 2: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: add route protection (redirect unauthed from dashboard, authed from auth pages)"
```

---

### Task 8: Dashboard shell — layout with sidebar and sign-out

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/(dashboard)/dashboard/loading.tsx`
- Create: `components/dashboard/sidebar.tsx`
- Create: `components/dashboard/sign-out-button.tsx`

**Step 1: Create sign-out button**

Create `components/dashboard/sign-out-button.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-400 hover:text-white transition-colors"
    >
      Sign out
    </button>
  );
}
```

**Step 2: Create sidebar component**

Create `components/dashboard/sidebar.tsx`:

```tsx
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950 px-4 py-6">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Plexease
      </Link>

      <nav className="mt-8 flex-1 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
```

**Step 3: Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

**Step 4: Create dashboard page**

Create `app/(dashboard)/dashboard/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Welcome{user?.email ? `, ${user.email}` : ""}
      </p>

      <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white">Your tools</h2>
        <p className="mt-2 text-sm text-gray-400">
          Tools will appear here as they become available.
        </p>
      </div>
    </div>
  );
}
```

**Step 5: Create dashboard loading state**

Create `app/(dashboard)/dashboard/loading.tsx`:

```tsx
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner />
    </div>
  );
}
```

**Step 6: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add app/(dashboard)/ components/dashboard/
git commit -m "feat: add dashboard shell with sidebar, sign-out, and loading state"
```

---

### Task 9: Landing page

Replace the "coming soon" placeholder with a proper landing page that explains what Plexease is and has CTA buttons.

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace landing page**

Replace the contents of `app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-xl font-bold">Plexease</span>
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

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
          Complex integrations,
          <br />
          <span className="text-blue-400">made easy</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          AI-powered tools for .NET developers, tech support staff, and small businesses.
          Navigate package management, code generation, and e-commerce integrations
          without deep technical expertise.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="#tools"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            See tools
          </Link>
        </div>
      </section>

      {/* Tools preview */}
      <section id="tools" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">Tools</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">NuGet Package Advisor</h3>
            <p className="mt-2 text-sm text-gray-400">
              Enter a .NET package name and get instant analysis: what it does,
              alternatives, compatibility notes, and version advice.
            </p>
            <span className="mt-4 inline-block rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-400">
              Coming soon
            </span>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">More tools on the way</h3>
            <p className="mt-2 text-sm text-gray-400">
              Unit test generation, API wrapper generation, migration assistance,
              shipping integrations, and more.
            </p>
            <span className="mt-4 inline-block rounded-full bg-gray-700/50 px-3 py-1 text-xs text-gray-400">
              Planned
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">Pricing</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-400">
              <li>5 tool uses per day</li>
              <li>All available tools</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-lg border border-gray-700 px-4 py-2 text-center text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-lg border border-blue-600 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-2 text-3xl font-bold">
              &pound;19<span className="text-sm font-normal text-gray-400">/month</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-400">
              <li>Unlimited tool uses</li>
              <li>Saved history</li>
              <li>Priority AI responses</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Plexease. All rights reserved.
      </footer>
    </main>
  );
}
```

**Step 2: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with hero, tools preview, and pricing"
```

---

### Task 10: Cookie consent banner

**Files:**
- Create: `components/ui/cookie-consent.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create cookie consent component**

Create `components/ui/cookie-consent.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
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
```

**Step 2: Add CookieConsent to root layout**

Modify `app/layout.tsx` to import and render the cookie consent banner. The full file should be:

```tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plexease",
  description: "Complex integrations, made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
```

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/ui/cookie-consent.tsx app/layout.tsx
git commit -m "feat: add GDPR cookie consent banner"
```

---

### Task 11: Add toast feedback to existing auth forms

Now that sonner is installed, add toast feedback to the login and signup forms for better UX.

**Files:**
- Modify: `components/auth/login-form.tsx`
- Modify: `components/auth/signup-form.tsx`

**Step 1: Update login form to use toast for errors**

In `components/auth/login-form.tsx`, add the import at the top:

```tsx
import { toast } from "sonner";
```

Replace the error handling in `handleSubmit` from:

```tsx
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
```

to:

```tsx
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
```

Remove the `error` state variable (`const [error, setError]...`) and the error display `<div>` from the JSX (the `{error && (...)}` block). Toast handles it now.

**Step 2: Update signup form similarly**

In `components/auth/signup-form.tsx`, add the import:

```tsx
import { toast } from "sonner";
```

Replace the error handling from:

```tsx
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
```

to:

```tsx
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      router.push("/check-email");
    }
```

Remove the `error` state variable and error display div, same as login form.

**Step 3: Verify it builds**

Run:
```bash
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/auth/login-form.tsx components/auth/signup-form.tsx
git commit -m "refactor: use toast notifications for auth form errors"
```

---

### Task 12: Final verification

**Step 1: Run full build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: No lint errors.

**Step 3: Verify all new routes exist in build output**

Check the build output includes these routes:
- `/` (landing page)
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/check-email`
- `/dashboard`
- 404 page

**Step 4: Commit any fix-ups if needed**

If lint or build revealed issues, fix and commit them.
