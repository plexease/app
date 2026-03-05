# Phase 1 Foundation Scaffold — Design

## Summary

Scaffold the Plexease Next.js project using `create-next-app`, restructure to match the project layout, and push to `github.com/plexease/app` (private).

## Decisions

- **Framework:** Next.js with App Router, TypeScript, Tailwind CSS, ESLint
- **Package manager:** npm
- **Local path:** `/home/deck/Projects/plexease/`
- **Repo:** `plexease/app` (private) on GitHub
- **No `src/` directory** — `app/` lives at the project root per PLEXEASE.md

## Project Structure

```
plexease/
├── app/
│   ├── layout.tsx          # root layout
│   ├── page.tsx            # minimal landing page
│   └── globals.css         # Tailwind imports
├── components/             # empty, ready for Phase 1 work
├── lib/                    # empty, ready for supabase/stripe/claude clients
├── types/                  # empty, ready for TypeScript interfaces
├── public/                 # static assets
├── PLEXEASE.md             # project context file
├── .env.local.example      # template showing required env vars (no secrets)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Landing Page (Minimal Placeholder)

- Plexease name
- Tagline: "complex integrations, made easy"
- "Coming soon" message
- Clean, centered layout with Tailwind

## Approach

Use `npx create-next-app@latest` with all options specified via flags, then:
1. Remove boilerplate files/content
2. Add empty `components/`, `lib/`, `types/` directories
3. Replace landing page with minimal placeholder
4. Add `.env.local.example` with required env var names
5. Copy `PLEXEASE.md` into the project root
6. Init git, create private repo at `plexease/app`, push
