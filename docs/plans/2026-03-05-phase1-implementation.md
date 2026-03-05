# Phase 1 Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Supabase integration, authentication (email + Google), database tables, dashboard shell with sidebar, and marketing landing page.

**Architecture:** Next.js App Router with Supabase SSR for auth. Middleware protects dashboard routes. Database tables with RLS. Custom auth forms with Tailwind. Sidebar dashboard layout.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, @supabase/supabase-js, @supabase/ssr, Playwright

---

### Task 1: Install Supabase dependencies and create client utilities

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Delete: `lib/.gitkeep`

**Step 1: Install Supabase packages**

Run:
```bash
cd /home/deck/Projects/plexease
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Create browser client**

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 3: Create server client**

Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
```

**Step 4: Create middleware helper**

Create `lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

**Step 5: Remove lib/.gitkeep**

Run:
```bash
rm lib/.gitkeep
```

**Step 6: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client utilities (browser, server, middleware)"
```

---

### Task 2: Create middleware for route protection

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware**

Create `middleware.ts` at project root:
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for session refresh and route protection"
```

---

### Task 3: Create database tables in Supabase

**Files:**
- Create: `lib/supabase/schema.sql` (for reference, executed in Supabase SQL editor)

**Step 1: Create schema file**

Create `lib/supabase/schema.sql`:
```sql
-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null,
  stripe_customer_id text
);

alter table public.users enable row level security;

create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plan text default 'free' not null check (plan in ('free', 'pro')),
  status text default 'active' not null check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text,
  created_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Usage table
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tool_name text not null,
  date date default current_date not null,
  count integer default 0 not null
);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);

-- Trigger: auto-create user row + free subscription on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Step 2: Execute in Supabase**

The user must run this SQL in the Supabase dashboard:
1. Go to Supabase dashboard → SQL Editor
2. Paste the contents of `lib/supabase/schema.sql`
3. Click "Run"

Expected: All tables, policies, and trigger created successfully.

**Step 3: Commit**

```bash
git add lib/supabase/schema.sql
git commit -m "feat: add database schema (users, subscriptions, usage with RLS)"
```

---

### Task 4: Build auth pages (signup + login)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/signup-form.tsx`
- Create: `components/auth/oauth-button.tsx`
- Delete: `components/.gitkeep`

**Step 1: Create OAuth callback handler**

Create `app/auth/callback/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**Step 2: Create OAuth button component**

Create `components/auth/oauth-button.tsx`:
```tsx
"use client";

import { createClient } from "@/lib/supabase/client";

export function OAuthButton() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
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
      Continue with Google
    </button>
  );
}
```

**Step 3: Create signup form component**

Create `components/auth/signup-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
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

**Step 4: Create login form component**

Create `components/auth/login-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
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
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Your password"
        />
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

**Step 5: Create signup page**

Create `app/(auth)/signup/page.tsx`:
```tsx
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { OAuthButton } from "@/components/auth/oauth-button";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
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

**Step 6: Create login page**

Create `app/(auth)/login/page.tsx`:
```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButton } from "@/components/auth/oauth-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
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

**Step 7: Remove components/.gitkeep**

Run:
```bash
rm components/.gitkeep
```

**Step 8: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add auth pages (login, signup, OAuth callback, Google button)"
```

---

### Task 5: Add route protection to middleware

**Files:**
- Modify: `middleware.ts`

**Step 1: Update middleware to protect dashboard routes**

Replace `middleware.ts` with:
```ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection (dashboard requires auth, auth pages redirect if logged in)"
```

---

### Task 6: Build dashboard layout with sidebar

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `components/dashboard/sidebar.tsx`
- Create: `components/dashboard/sidebar-link.tsx`

**Step 1: Create sidebar link component**

Create `components/dashboard/sidebar-link.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  href: string;
  label: string;
  indent?: boolean;
}

export function SidebarLink({ href, label, indent = false }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        indent ? "ml-4" : ""
      } ${
        isActive
          ? "bg-gray-800 text-white"
          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
```

**Step 2: Create sidebar component**

Create `components/dashboard/sidebar.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SidebarLink } from "./sidebar-link";

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const nav = (
    <>
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold text-white">Plexease</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <SidebarLink href="/dashboard" label="Dashboard" />
        <button
          onClick={() => setToolsOpen(!toolsOpen)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors"
        >
          Tools
          <svg
            className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {toolsOpen && (
          <SidebarLink href="/dashboard/tools/nuget-advisor" label="NuGet Advisor" indent />
        )}
        <div className="pt-4">
          <SidebarLink href="/dashboard/account" label="Account" />
          <SidebarLink href="/dashboard/billing" label="Billing" />
        </div>
      </nav>
      <div className="border-t border-gray-800 px-4 py-4">
        <p className="truncate text-sm text-gray-400">{userEmail}</p>
        <button
          onClick={handleLogout}
          className="mt-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-gray-800 p-2 text-white md:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900 border-r border-gray-800 transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
```

**Step 3: Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar userEmail={user.email ?? ""} />
      <main className="md:ml-64 min-h-screen p-6 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
```

**Step 4: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

### Task 7: Build dashboard pages (home, tools, account, billing)

**Files:**
- Create: `app/(dashboard)/page.tsx`
- Create: `app/(dashboard)/tools/page.tsx`
- Create: `app/(dashboard)/tools/nuget-advisor/page.tsx`
- Create: `app/(dashboard)/account/page.tsx`
- Create: `app/(dashboard)/billing/page.tsx`
- Delete: `types/.gitkeep`
- Create: `types/index.ts`

**Step 1: Create types**

Create `types/index.ts`:
```ts
export interface Tool {
  name: string;
  slug: string;
  description: string;
}

export const TOOLS: Tool[] = [
  {
    name: "NuGet Advisor",
    slug: "nuget-advisor",
    description: "Get AI-powered advice on .NET NuGet packages — what they do, alternatives, compatibility, and version guidance.",
  },
];
```

**Step 2: Create dashboard home page**

Create `app/(dashboard)/page.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOOLS } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TODO: Fetch recently used tools from usage table once Phase 2 is built
  const recentTools: string[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">
        Welcome{user?.email ? `, ${user.email}` : ""}
      </h1>
      <p className="mt-2 text-gray-400">
        What would you like to work on today?
      </p>

      {recentTools.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Recently Used</h2>
          {/* TODO: Render recently used tools */}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">All Tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/dashboard/tools/${tool.slug}`}
              className="rounded-lg border border-gray-800 bg-gray-900 p-6 hover:border-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-white">{tool.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Step 3: Create tools list page**

Create `app/(dashboard)/tools/page.tsx`:
```tsx
import Link from "next/link";
import { TOOLS } from "@/types";

export default function ToolsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Tools</h1>
      <p className="mt-2 text-gray-400">
        AI-powered tools to simplify your integrations.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/dashboard/tools/${tool.slug}`}
            className="rounded-lg border border-gray-800 bg-gray-900 p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-white">{tool.name}</h3>
            <p className="mt-2 text-sm text-gray-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Create NuGet Advisor placeholder (chat-style)**

Create `app/(dashboard)/tools/nuget-advisor/page.tsx`:
```tsx
"use client";

import { useState } from "react";

export default function NuGetAdvisorPage() {
  const [input, setInput] = useState("");

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">NuGet Advisor</h1>
          <p className="text-sm text-gray-400">
            Ask about any .NET NuGet package
          </p>
        </div>
        {/* Layout toggle placeholder */}
        <div className="flex gap-1">
          <button className="rounded px-2 py-1 text-xs bg-gray-800 text-white">Chat</button>
          <button className="rounded px-2 py-1 text-xs text-gray-500" disabled title="Coming soon">Split</button>
          <button className="rounded px-2 py-1 text-xs text-gray-500" disabled title="Coming soon">Single</button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">Ask about a NuGet package</p>
          <p className="text-sm mt-2">
            e.g. &quot;Tell me about Newtonsoft.Json&quot; or &quot;What are alternatives to Dapper?&quot;
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: Phase 2 — send to Claude API
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a NuGet package name or question..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 5: Create account page**

Create `app/(dashboard)/account/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your new email for a confirmation link.");
      setNewEmail("");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully.");
      setNewPassword("");
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white">Account</h1>
      <p className="mt-2 text-gray-400">Manage your account settings.</p>

      {message && (
        <div className="mt-4 rounded-lg bg-green-900/50 p-3 text-sm text-green-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleUpdateEmail} className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">Update Email</h2>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          required
          className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Update email
        </button>
      </form>

      <form onSubmit={handleUpdatePassword} className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">Update Password</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          required
          minLength={6}
          className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
```

**Step 6: Create billing page**

Create `app/(dashboard)/billing/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TODO: Fetch subscription from database once Phase 3 is built
  const plan = "free";

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white">Billing</h1>
      <p className="mt-2 text-gray-400">Manage your subscription.</p>

      <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Current Plan</h2>
        <p className="mt-2 text-3xl font-bold text-white capitalize">{plan}</p>
        <p className="mt-1 text-sm text-gray-400">
          {plan === "free"
            ? "5 tool uses per day"
            : "Unlimited tool uses, saved history, priority AI"}
        </p>

        {plan === "free" && (
          <button
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            // TODO: Phase 3 — link to Stripe checkout
          >
            Upgrade to Pro — £19/mo
          </button>
        )}

        {plan === "pro" && (
          <button
            className="mt-6 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            // TODO: Phase 3 — link to Stripe customer portal
          >
            Manage subscription
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 7: Remove types/.gitkeep**

Run:
```bash
rm types/.gitkeep
```

**Step 8: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add dashboard pages (home, tools, NuGet advisor, account, billing)"
```

---

### Task 8: Build marketing landing page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

**Step 1: Update root layout to include inter font (optional but clean)**

Modify `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plexease — Complex Integrations, Made Easy",
  description:
    "AI-powered tools for .NET developers and small businesses. Package advice, code generation, integration helpers — all under one membership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 2: Replace landing page**

Replace `app/page.tsx` with:
```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Plexease</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Complex integrations,
          <br />
          <span className="text-blue-400">made easy</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          AI-powered tools for .NET developers and small businesses. Get package
          advice, generate integration code, and simplify your workflow — all
          under one membership.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold">
          Tools that work for you
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">NuGet Package Advisor</h3>
            <p className="mt-2 text-sm text-gray-400">
              Get AI-powered advice on any .NET package — what it does,
              alternatives, compatibility notes, and version guidance.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">Integration Code Generator</h3>
            <p className="mt-2 text-sm text-gray-400">
              Generate boilerplate code for common integrations — shipping,
              payments, CRM, and more. Coming soon.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">Error Log Explainer</h3>
            <p className="mt-2 text-sm text-gray-400">
              Paste an error log and get a plain-English explanation with
              suggested fixes. Coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-center text-3xl font-bold">
          Simple, transparent pricing
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-4xl font-bold">£0</p>
            <p className="mt-1 text-sm text-gray-400">forever</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li>5 tool uses per day</li>
              <li>All tools included</li>
              <li>Community support</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-lg border border-gray-700 px-4 py-2 text-center text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-lg border border-blue-600 bg-gray-900 p-8">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-2 text-4xl font-bold">£19</p>
            <p className="mt-1 text-sm text-gray-400">per month</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li>Unlimited tool uses</li>
              <li>Saved history</li>
              <li>Priority AI processing</li>
              <li>Email support</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Start free, upgrade anytime
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Ready to simplify your integrations?
        </h2>
        <p className="mt-4 text-gray-400">
          Join Plexease today — no credit card required.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Plexease. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

**Step 3: Verify build**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add marketing landing page (hero, features, pricing, CTA)"
```

---

### Task 9: Push to GitHub

**Step 1: Push all new commits**

Run:
```bash
cd /home/deck/Projects/plexease
git push origin main
```

**Step 2: Verify**

Run:
```bash
gh repo view plexease/app --web
```
