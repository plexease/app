# NuGet Advisor — Design Document

**Date:** 2026-03-06
**Phase:** 2 — First Tool

---

## Overview

NuGet Advisor is the first Plexease tool. A user inputs a .NET NuGet package name and receives a structured AI-powered advisory broken into four sections: what the package does, alternatives, compatibility, and version advice.

---

## Architecture

**Pattern:** API route + server component (Next.js)

### New files

```
app/(dashboard)/tools/nuget-advisor/page.tsx        # Tool page (server component)
app/api/tools/nuget-advisor/route.ts                # POST API route
components/tools/nuget-advisor/advisor-form.tsx     # Input form (client component)
components/tools/nuget-advisor/result-cards.tsx     # 4 result cards (client component)
lib/claude.ts                                       # Anthropic client + prompt helper
```

### Updated files

```
components/dashboard/sidebar.tsx                    # Add NuGet Advisor nav link
app/(dashboard)/dashboard/page.tsx                  # Add tool card linking to tool page
lib/supabase/schema.sql                             # Add unique constraint on usage table
```

---

## Data Flow

1. User submits package name via `advisor-form`
2. Client POSTs to `/api/tools/nuget-advisor`
3. API route fetches user session via Supabase server client
4. API route queries `usage` table for current month count
5. If free plan and count >= 20: return 429 with upgrade message
6. API route calls Claude with structured prompt, parses JSON response
7. API route upserts usage count (atomic increment)
8. API route returns structured result
9. Client renders `result-cards`

---

## Schema Change

Add a unique constraint to the `usage` table to support atomic monthly upserts:

```sql
-- Change date column to month (first day of month)
-- Add unique constraint
ALTER TABLE public.usage RENAME COLUMN date TO month;
ALTER TABLE public.usage ADD CONSTRAINT usage_user_tool_month_unique
  UNIQUE (user_id, tool_name, month);
```

The `month` column stores the first day of the current month (e.g., `2026-03-01`), derived via `date_trunc('month', current_date)`.

---

## Claude Integration

### Prompt

```
You are a .NET package advisor. The user has asked about the NuGet package: "{packageName}".
Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "whatItDoes": "Plain English description of what this package does.",
  "alternatives": ["Package1", "Package2", "Package3"],
  "compatibility": "Which .NET versions are supported, any known issues.",
  "versionAdvice": "Latest stable version, whether to upgrade, any deprecation notes."
}
```

### TypeScript type

```ts
type NuGetAdvisorResult = {
  whatItDoes: string;
  alternatives: string[];
  compatibility: string;
  versionAdvice: string;
}
```

If JSON parsing fails, the API returns a 500 with a user-friendly error message.

---

## Usage Tracking

- **Free plan:** 20 uses/month
- **Pro plan:** unlimited (skip limit check)
- **Reset:** automatic — the `month` column naturally resets each calendar month
- **Upsert pattern (atomic):**

```sql
INSERT INTO usage (user_id, tool_name, month, count)
VALUES ($1, 'nuget-advisor', date_trunc('month', current_date), 1)
ON CONFLICT (user_id, tool_name, month)
DO UPDATE SET count = usage.count + 1
```

- **Timezone note:** `current_date` uses Supabase database timezone (UTC). Minor edge case for UK users late at night — acceptable for v1.
- **Row accumulation:** old monthly rows are never deleted. A cleanup job is a future consideration.

---

## UI Components

### `page.tsx` (server component)
- Fetches user plan and current month usage count from Supabase
- Passes as props to `advisor-form`
- Renders page heading and description

### `advisor-form.tsx` (client component)
- Text input for package name
- Submit button with spinner during loading
- Input disabled while loading
- Error message displayed on failure
- Shows usage counter: `14 of 20 uses this month`
- Shows upgrade banner instead of form when limit reached

### `result-cards.tsx` (client component)
- Only renders when a result exists
- 2x2 grid on desktop, stacked on mobile
- Four cards:
  - **What it does** — paragraph text
  - **Alternatives** — bulleted list of package names
  - **Compatibility** — paragraph text
  - **Version advice** — paragraph text

### Upgrade banner
- Shown when free user has reached 20 uses
- Message: "You've reached your monthly limit. Upgrade to Pro for unlimited access."
- CTA button links to `/upgrade` (placeholder for Phase 3)

---

## Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Structured JSON from Claude | Reliable parsing, purpose-built feel vs chat wrapper |
| No streaming | Reduces complexity; loading spinner is sufficient for v1 |
| Monthly limit (20) over daily (3 or 5) | Better UX, creates clearer upgrade pressure for power users |
| No NuGet.org API enrichment | Avoid extra dependency; real metadata is a v2 enhancement |
| API route over server actions | Cleaner separation, easier to test, consistent with project patterns |
