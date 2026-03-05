# Phase 1 Foundation Scaffold — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Plexease Next.js project and push to github.com/plexease/app (private).

**Architecture:** Use `create-next-app` to generate the project, then restructure to match the Plexease project layout. Minimal placeholder landing page. Empty directories for future components, lib, and types.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, npm, GitHub

---

### Task 1: Scaffold Next.js project

**Step 1: Create the Projects directory if needed**

Run: `mkdir -p /home/deck/Projects`

**Step 2: Scaffold with create-next-app**

Run from `/home/deck/Projects`:
```bash
npx create-next-app@latest plexease \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm
```

Expected: Project created at `/home/deck/Projects/plexease/` with `app/` directory at root.

**Step 3: Verify it runs**

Run from `/home/deck/Projects/plexease`:
```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
cd /home/deck/Projects/plexease
git add -A
git commit -m "chore: scaffold Next.js project with TypeScript + Tailwind"
```

---

### Task 2: Clean up boilerplate and restructure

**Files:**
- Modify: `app/page.tsx` (replace boilerplate with placeholder landing page)
- Modify: `app/layout.tsx` (simplify metadata)
- Modify: `app/globals.css` (keep only Tailwind directives)
- Delete: any boilerplate SVGs/images in `public/` (e.g. `vercel.svg`, `next.svg`)
- Create: `components/.gitkeep`
- Create: `lib/.gitkeep`
- Create: `types/.gitkeep`

**Step 1: Remove boilerplate assets from public/**

Run:
```bash
cd /home/deck/Projects/plexease
rm -f public/*.svg public/*.ico
```

Note: Check what files exist first with `ls public/` — only delete Next.js boilerplate, keep the directory.

**Step 2: Create empty directories with .gitkeep**

Run:
```bash
mkdir -p components lib types
touch components/.gitkeep lib/.gitkeep types/.gitkeep
```

**Step 3: Replace app/globals.css**

Keep only the Tailwind directives:

```css
@import "tailwindcss";
```

Note: Next.js 15+ with Tailwind v4 uses `@import "tailwindcss"` instead of the old `@tailwind` directives. Check the generated file first and match the pattern used by `create-next-app`.

**Step 4: Simplify app/layout.tsx**

```tsx
import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
```

**Step 5: Replace app/page.tsx with minimal placeholder**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-5xl font-bold tracking-tight">Plexease</h1>
      <p className="mt-4 text-xl text-gray-400">
        complex integrations, made easy
      </p>
      <p className="mt-8 text-sm text-gray-500">Coming soon</p>
    </main>
  );
}
```

**Step 6: Verify it builds**

Run:
```bash
cd /home/deck/Projects/plexease
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: clean up boilerplate, add project structure, add placeholder landing page"
```

---

### Task 3: Add project files

**Files:**
- Create: `.env.local.example`
- Copy: `PLEXEASE.md` from Downloads

**Step 1: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=
```

**Step 2: Copy PLEXEASE.md**

Run:
```bash
cp /home/deck/Downloads/PLEXEASE.md /home/deck/Projects/plexease/PLEXEASE.md
```

**Step 3: Verify .gitignore includes .env.local**

Read `.gitignore` and confirm `.env.local` is listed (create-next-app should include it by default).

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add env example template and project context file"
```

---

### Task 4: Create GitHub repo and push

**Step 1: Create private repo on GitHub**

Run:
```bash
cd /home/deck/Projects/plexease
gh repo create plexease/app --private --source=. --remote=origin
```

**Step 2: Push to remote**

Run:
```bash
git push -u origin main
```

Expected: Code pushed to `github.com/plexease/app`.

**Step 3: Verify**

Run:
```bash
gh repo view plexease/app --web
```

Expected: Opens browser showing the repo with all commits.
