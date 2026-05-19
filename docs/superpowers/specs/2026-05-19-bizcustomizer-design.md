# bizcustomizer — Design Spec

**Date:** 2026-05-19
**Status:** Approved

---

## Overview

A new standalone Next.js app (`bizcustomizer`) that extends the marketstall-customizer pattern to serve non-food service businesses. Sales reps enter a client URL, the system scrapes it, Claude generates a fully customised site config, images are sourced and committed, and a live Vercel preview URL is returned.

Three sectors: **TRADES**, **WELLNESS**, **HOSPITALITY** — each backed by its own GitHub template repo and Vercel deployment.

---

## Repos

| Repo                                      | Sector      | Type            | Vercel URL                                   |
| ----------------------------------------- | ----------- | --------------- | -------------------------------------------- |
| `VeltroSystemsUK/bizcustomizer`           | App         | Next.js app     | Internal tool                                |
| `VeltroSystemsUK/biztemplate-trades`      | TRADES      | Single-page SPA | `https://biztemplate-trades.vercel.app`      |
| `VeltroSystemsUK/biztemplate-wellness`    | WELLNESS    | Multi-page      | `https://biztemplate-wellness.vercel.app`    |
| `VeltroSystemsUK/biztemplate-hospitality` | HOSPITALITY | Multi-page      | `https://biztemplate-hospitality.vercel.app` |

---

## bizcustomizer App

### Stack

Identical to `marketstall-customizer`: Next.js App Router, TypeScript, Tailwind CSS, Octokit, Anthropic SDK, Firecrawl, Gemini.

### File structure

```
bizcustomizer/
  app/
    page.tsx                  ← UI (auth, form, log, review, deploy)
    globals.css
    layout.tsx
    api/customize/
      route.ts                ← scrape → generate → images → review stream
      deploy/
        route.ts              ← commit files + images → Vercel auto-deploy
  lib/
    sectors.ts                ← SECTORS config (replaces stalls.ts)
    agent.ts                  ← scrapeUrl, generateCustomization, image pipeline
    github.ts                 ← identical to marketstall-customizer
    unsplash.ts               ← new: keyword search → base64 image
```

### UI differences from marketstall-customizer

- "Target stall" dropdown → "Sector" dropdown: `TRADES | WELLNESS | HOSPITALITY`
- Review screen shows hero image + up to 6 contextual images (services / team / dishes depending on sector)
- All other UI identical: auth gate, streaming log, review → deploy button, preview link

### sectors.ts

```ts
export const SECTORS = {
  trades: {
    repo: "VeltroSystemsUK/biztemplate-trades",
    name: "Trades",
    previewUrl: "https://biztemplate-trades.vercel.app",
  },
  wellness: {
    repo: "VeltroSystemsUK/biztemplate-wellness",
    name: "Wellness",
    previewUrl: "https://biztemplate-wellness.vercel.app",
  },
  hospitality: {
    repo: "VeltroSystemsUK/biztemplate-hospitality",
    name: "Hospitality",
    previewUrl: "https://biztemplate-hospitality.vercel.app",
  },
} as const;

export type SectorKey = keyof typeof SECTORS;
```

---

## Pipeline

Identical flow to marketstall-customizer:

1. **Scrape** — Firecrawl fetches client URL (markdown + images)
2. **Generate** — Claude produces sector-specific JSON (brand, content, colors, imageKeywords)
3. **Images** — per slot: Gemini generate → Firecrawl scraped fallback → Unsplash keyword fallback → template placeholder
4. **Review** — stream `review` event with `reviewPayload`; rep approves before deploy
5. **Deploy** — commit `site.config.ts`, `app/globals.css`, `public/images/*` to template repo → Vercel auto-deploys

---

## Agent Output Schemas

### Shared across all sectors

```ts
interface ColorScale {
  "50": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
  "950": string;
}

interface BizReview {
  author: string;
  rating: number; // 1–5
  text: string;
}
```

### TradesOutput

```ts
interface TradesOutput {
  brand: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    hours: string;
    logoUrl?: string;
    socialInstagram?: string;
    socialFacebook?: string;
  };
  primaryScale: ColorScale;
  accentScale: ColorScale;
  cream: string;
  creamDark: string;
  stats: Array<{ value: string; label: string }>; // e.g. "20+ Years", "4.9★ Google"
  services: Array<{
    name: string;
    description: string;
    icon: string; // lucide-react icon name
    imageKeywords: string; // for Gemini/Unsplash
  }>;
  trustBadges: Array<{ name: string }>; // e.g. "Gas Safe", "Checkatrade"
  reviews: BizReview[];
  heroImageKeywords: string;
}
```

### WellnessOutput

```ts
interface WellnessOutput {
  brand: {
    name: string;
    tagline: string;
    story: string; // 3–4 sentences, first person
    phone: string;
    email: string;
    address: string;
    hours: string;
    logoUrl?: string;
    socialInstagram?: string;
    socialFacebook?: string;
  };
  primaryScale: ColorScale;
  accentScale: ColorScale;
  cream: string;
  creamDark: string;
  serviceCategories: Array<{
    name: string; // e.g. "Hair Styling", "Colour Treatments"
    services: Array<{
      name: string;
      description: string;
      price: number; // pence
      duration: string; // e.g. "60 min"
    }>;
  }>;
  team: Array<{
    name: string;
    role: string;
    bio: string;
    imageKeywords: string;
  }>;
  reviews: BizReview[];
  heroImageKeywords: string;
  vibeImageKeywords: string[]; // 3 items — interior/atmosphere shots
}
```

### HospitalityOutput

```ts
interface HospitalityOutput {
  brand: {
    name: string;
    tagline: string;
    story: string; // 3–4 sentences, first person
    phone: string;
    email: string;
    address: string;
    hours: string;
    logoUrl?: string;
    socialInstagram?: string;
    socialFacebook?: string;
  };
  primaryScale: ColorScale;
  accentScale: ColorScale;
  cream: string;
  creamDark: string;
  essentials: {
    todayHours: string;
    phone: string;
    address: string;
  };
  menuCategories: Array<{
    name: string; // Starters, Mains, Desserts, Drinks
    items: Array<{
      name: string;
      description: string;
      price: number; // pence
      dietary: string[]; // e.g. ["v", "vg", "gf"]
      imageKeywords?: string;
    }>;
  }>;
  reviews: BizReview[];
  heroImageKeywords: string;
  instagramImageKeywords: string[]; // 6 items — food/ambience shots
}
```

---

## Image Pipeline

For each image slot (`heroImageKeywords`, `services[].imageKeywords`, `vibeImageKeywords`, `team[].imageKeywords`, `instagramImageKeywords[]`, etc.):

1. **Gemini** — generate with a context-aware prompt (sector + business name + keywords)
2. **Firecrawl scraped** — check relevance via `isImageRelevantToBiz()` (Claude Haiku vision check, same pattern as stalls)
3. **Unsplash** — `searchUnsplash(keywords)` in `lib/unsplash.ts`, returns first result as base64
4. **Template placeholder** — `/images/hero.jpg` already in each template repo

### unsplash.ts

```ts
export async function searchUnsplash(
  keywords: string,
): Promise<{ base64: string; ext: string } | null>;
```

Uses `https://api.unsplash.com/search/photos` with `UNSPLASH_ACCESS_KEY`. Downloads first result, returns base64.

---

## Files Committed on Deploy

Same pattern as stall deploy for all sectors:

| File                         | Content                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `site.config.ts`             | Brand + sector-specific data (services / serviceCategories / menuCategories) |
| `app/globals.css`            | Derived color palette (same `hexToRgb` approach)                             |
| `public/images/hero.{ext}`   | Hero image                                                                   |
| `public/images/{slug}.{ext}` | Per-item images (services / team / dishes)                                   |

---

## Template Repos — Page Structures

### biztemplate-trades (single-page SPA)

All content on `/`. Sections render in order:

1. **Hero** — hyper-local headline, sub-headline, "Get a Free Quote" CTA + click-to-call
2. **Trust Bar** — `trustBadges` + Google rating from `stats`
3. **Services Grid** — 3–6 cards from `services[]`
4. **Before/After Gallery** — static placeholder grid (client fills in real photos)
5. **Reviews** — slider from `reviews[]`
6. **Footer** — address, hours, contact, social links

### biztemplate-wellness (multi-page)

- `/` — Hero + Experience/Vibe (`brand.story`) + Book CTA
- `/services` — Luxury Service Menu grouped by `serviceCategories[]`, priced in £
- `/team` — Team profiles from `team[]`
- `/book` — Booking CTA page (no booking logic — prominent CTA + contact info)
- Shared nav linking all pages

### biztemplate-hospitality (multi-page)

- `/` — Hero + Essentials Ribbon (`essentials`) + About teaser + Instagram placeholder grid
- `/menu` — Full menu from `menuCategories[]`, interactive category tabs
- `/book` — Reservation page (no booking logic — prominent CTA + contact info)
- Shared nav linking all pages

---

## Environment Variables

| Variable              | Source                   | New?    |
| --------------------- | ------------------------ | ------- |
| `ADMIN_TOKEN`         | Same as stall customizer | No      |
| `ANTHROPIC_API_KEY`   | Same                     | No      |
| `FIRECRAWL_API_KEY`   | Same                     | No      |
| `GEMINI_API_KEY`      | Same                     | No      |
| `GITHUB_TOKEN`        | Same                     | No      |
| `UNSPLASH_ACCESS_KEY` | Unsplash free tier       | **Yes** |

---

## Prerequisites

Before the deploy pipeline works, each template repo must be created on GitHub and linked to its own Vercel project. This is a one-time manual step per repo:

1. Create the GitHub repo under `VeltroSystemsUK/biztemplate-{sector}`
2. Add an initial commit (Next.js scaffold) so Vercel can link to it
3. Create a Vercel project connected to that repo
4. Confirm the Vercel project auto-deploys on push to `main`

These steps are not automated by the customizer — they're setup steps done once before any client customisation.

---

## Build Order

1. **bizcustomizer scaffold** — create Next.js app, copy auth/UI/streaming shell from marketstall-customizer, add `sectors.ts`, set up env vars
2. **biztemplate-trades** — build single-page template, `TradesOutput` schema, LLM prompt, builder functions (`buildSiteConfig`, `buildGlobalsCss`), wire into customizer, end-to-end test
3. **biztemplate-wellness** — multi-page template (4 routes), `WellnessOutput` schema, prompt, builders
4. **biztemplate-hospitality** — multi-page template (3 routes), `HospitalityOutput` schema, prompt, builders
5. **unsplash.ts** — add Unsplash fallback to image pipeline (can be done alongside step 2)
