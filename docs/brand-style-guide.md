# Plexease Brand Style Guide

> Reusable reference for applying the Plexease brand across current and future apps.

---

## 1. Colour System

All colours registered as Tailwind v4 `@theme` tokens in `globals.css` using `--color-` prefix.

### Brand (purple)

| Token | Hex | Use |
|-------|-----|-----|
| `brand-50` | `#faf5ff` | Subtle tinted backgrounds |
| `brand-100` | `#f3e8ff` | Light hover states |
| `brand-300` | `#c4b5fd` | Light text accents, logo node, link hover |
| `brand-400` | `#a78bfa` | Links, secondary accents, wordmark "ease" |
| `brand-500` | `#8b5cf6` | Primary buttons, badges, focus rings, usage bar |
| `brand-600` | `#7c3aed` | Button hover, active states |
| `brand-700` | `#6d28d9` | Pressed states |

### Surfaces (purple-tinted dark backgrounds)

| Token | Hex | Use |
|-------|-----|-----|
| `surface-950` | `#0c0a14` | Body/shell background, sidebar |
| `surface-900` | `#131121` | Cards, main content area |
| `surface-800` | `#1e1a2e` | Inputs, secondary cards, active nav items |
| `surface-700` | `#2e2946` | ALL borders and dividers |

**Border rule:** `surface-700` is the universal border token. Both `border-gray-800` and `border-gray-700` map to `border-surface-700`.

### Muted text (purple-tinted grays)

| Token | Hex | Use | Min contrast on surface-950 |
|-------|-----|-----|-----------------------------|
| `muted-300` | `#b8b4cc` | Secondary text, input text, descriptions | 8.5:1 (AA) |
| `muted-400` | `#9490ad` | Body text, helper text | 6.1:1 (AA) |
| `muted-500` | `#6e6890` | Subtle labels, placeholders | 4.5:1 (AA) |

**Contrast rule:** `muted-500` only on `surface-950` or `surface-900` backgrounds (never on `surface-800`). Use `muted-400` minimum for text on `surface-800`.

### Semantic colours

Unchanged from defaults: green for success, amber for warnings, red for errors.

---

## 2. Typography

### Font loading (Next.js)

```tsx
import { Plus_Jakarta_Sans, Inter } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
});
```

**Body element:** `<body className={`${jakarta.variable} ${inter.variable} font-sans`}>`

### Tailwind config

```css
@theme {
  --font-sans: var(--font-body), system-ui, sans-serif;
  --font-heading: var(--font-heading), system-ui, sans-serif;
}
```

### Usage rules

| Element | Font | Weight | Classes |
|---------|------|--------|---------|
| Brand name "Plexease" | Jakarta | 800 | `font-heading font-extrabold` |
| Page headings (h1, h2) | Jakarta | 700 | `font-heading font-bold` |
| Card titles, section headers | Jakarta | 600 | `font-heading font-semibold` |
| Stat numbers | Jakarta | 700 | `font-heading font-bold` |
| Body text, descriptions | Inter | 400 | (default, inherited) |
| Form labels, nav items | Inter | 500 | `font-medium` |
| Buttons | Inter | 500 | `font-medium` |
| Badges, helper text | Inter | 600 | `font-semibold` |

---

## 3. Component Patterns

### Buttons

| Type | Classes |
|------|---------|
| Primary | `bg-brand-500 hover:bg-brand-600 text-white shadow-glow transition-colors` |
| Secondary | `border border-surface-700 text-muted-300 hover:bg-surface-800 transition-colors` |
| Focus (all) | `focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950` |

### Cards

| Type | Classes |
|------|---------|
| Default | `rounded-lg border border-surface-700 bg-surface-900 p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg` |
| Featured | `border-brand-500 bg-surface-900 shadow-glow-lg` |

### Inputs

```
bg-surface-800 border border-surface-700 text-muted-300 placeholder-muted-500
rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500
```

### Links

```
text-brand-400 hover:text-brand-300 transition-colors
```

### Badges

| Type | Classes |
|------|---------|
| Pro | `bg-brand-500 text-white px-2.5 py-0.5 text-xs font-semibold rounded-full` |
| Free | `bg-surface-700 text-muted-300 px-2.5 py-0.5 text-xs font-semibold rounded-full` |

---

## 4. Visual Polish

### Button glow

```
shadow-glow  →  0 0 16px rgba(139, 92, 246, 0.25)
```

### Featured card glow

```
shadow-glow-lg  →  0 0 24px rgba(139, 92, 246, 0.15)
```

### Card hover lift

```
transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg
```

### Hero gradient

```
bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]
```

### Shimmer animation (tagline)

```css
@theme {
  --animate-shimmer: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

Usage:
```
animate-shimmer bg-[linear-gradient(110deg,#c4b5fd_35%,#e9d5ff_50%,#c4b5fd_65%)]
bg-[length:200%_100%] bg-clip-text text-transparent
motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-brand-300
```

---

## 5. Accessibility

### Skip-to-content link

First focusable element in root layout:
```tsx
<a href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
  focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white">
  Skip to content
</a>
```

### Focus indicators

All interactive elements:
```
focus:outline-none focus:ring-2 focus:ring-brand-500
focus:ring-offset-2 focus:ring-offset-surface-950
```

### Reduced motion

All animations wrapped in `motion-safe:` or `@media (prefers-reduced-motion: no-preference)`.
Shimmer fallback: static `text-brand-300`.

### Touch targets

Minimum 44x44px. Nav items use `py-2.5` for compliance.

---

## 6. Logo

### Icon — Organic Cluster

4 nodes in asymmetric ring layout (viewBox 0 0 48 48):
- Top-left (12, 14) — `brand-500`
- Top-right (30, 10) — `brand-300`
- Bottom-right (38, 28) — `brand-400`
- Bottom-left (18, 36) — `brand-600`

Lines between adjacent nodes: `stroke: surface-700`, width 2.5.

Hover: nodes shift 2px outward, 300ms ease, `motion-safe:` only.

### Wordmark

"Plex" white + "ease" `brand-400`, Plus Jakarta Sans weight 800.

### Sizes

| Location | Icon | Text |
|----------|------|------|
| Landing nav | 28px | 22px |
| Sidebar | 24px | 18px |
| Auth header | 32px | 24px |

---

## 7. Toasts (Sonner)

```tsx
<Toaster theme="dark" position="top-right"
  toastOptions={{
    style: { background: "#131121", border: "1px solid #2e2946", color: "#b8b4cc" },
    actionButtonStyle: { background: "#8b5cf6", color: "#ffffff" },
  }}
/>
```

---

## 8. Colour Migration Quick Reference

| Old class | New class |
|-----------|-----------|
| `bg-gray-950` | `bg-surface-950` |
| `bg-gray-900` | `bg-surface-900` |
| `bg-gray-800` | `bg-surface-800` |
| `border-gray-800` / `border-gray-700` | `border-surface-700` |
| `text-gray-300` | `text-muted-300` |
| `text-gray-400` | `text-muted-400` |
| `text-gray-500` | `text-muted-500` |
| `bg-blue-600` | `bg-brand-500` |
| `hover:bg-blue-500` | `hover:bg-brand-600` |
| `text-blue-400` | `text-brand-400` |
| `hover:text-blue-300` | `hover:text-brand-300` |
| `focus:ring-blue-500` | `focus:ring-brand-500` |
