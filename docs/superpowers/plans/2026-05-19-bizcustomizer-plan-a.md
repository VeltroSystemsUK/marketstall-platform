# bizcustomizer — Plan A: Scaffold + TRADES

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `bizcustomizer` Next.js app and `biztemplate-trades` template repo, wired end-to-end so a sales rep can scrape a UK trades business URL and deploy a customised single-page demo site.

**Architecture:** `bizcustomizer` is a standalone Next.js app (cloned from `marketstall-customizer` pattern) with a sector dropdown. `biztemplate-trades` is a separate Next.js repo that acts as the deploy target — the customizer commits `site.config.ts`, `app/globals.css`, and images to it, triggering a Vercel auto-deploy.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Anthropic SDK, Firecrawl, Gemini, Octokit, Lucide React

---

## File Map

### bizcustomizer (new repo at `/home/shauntuhey/bizcustomizer`)

```
bizcustomizer/
  app/
    page.tsx                         UI: auth, form, streaming log, review, deploy
    layout.tsx                       Root layout
    globals.css                      App styles
    api/customize/
      route.ts                       POST: scrape → generate → images → review stream
      deploy/
        route.ts                     POST: commit files + images → Vercel auto-deploy
  lib/
    sectors.ts                       SECTORS config
    github.ts                        Octokit helpers (copy from marketstall-customizer)
    unsplash.ts                      Unsplash keyword → base64 image
    agent.ts                         scrapeUrl, generateBizImage, sourceImage, buildGlobalsCss
    trades.ts                        TradesOutput, generateTradesCustomization, buildTradesSiteConfig
```

### biztemplate-trades (new repo at `/home/shauntuhey/biztemplate-trades`)

```
biztemplate-trades/
  app/
    layout.tsx                       Font loading, root HTML
    page.tsx                         Renders all sections in order
    globals.css                      Committed by deploy (color palette)
  components/
    Hero.tsx
    TrustBar.tsx
    ServicesGrid.tsx
    BeforeAfterGallery.tsx
    ReviewsSlider.tsx
    SiteFooter.tsx
  lib/
    site-config.types.ts             TradesSiteConfig interface
  site.config.ts                     Committed by deploy (brand + content data)
  public/images/
    hero.jpg                         Placeholder (overwritten by deploy)
```

---

## Task 1: Scaffold bizcustomizer

**Files:**

- Create: `/home/shauntuhey/bizcustomizer/` (new Next.js app)

- [ ] **Step 1: Create the Next.js app**

```bash
cd /home/shauntuhey
npx create-next-app@latest bizcustomizer \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
cd /home/shauntuhey/bizcustomizer
npm install @anthropic-ai/sdk @octokit/rest
```

- [ ] **Step 3: Verify it starts**

```bash
npm run dev
```

Expected: Next.js dev server running on http://localhost:3000

- [ ] **Step 4: Stop the dev server, update next.config.ts**

Replace the entire contents of `next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: __dirname },
};

export default config;
```

- [ ] **Step 5: Create .env.local**

```bash
cat > .env.local << 'EOF'
ADMIN_TOKEN=dev-token
ANTHROPIC_API_KEY=
FIRECRAWL_API_KEY=
GEMINI_API_KEY=
GITHUB_TOKEN=
UNSPLASH_ACCESS_KEY=
EOF
```

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold bizcustomizer"
```

---

## Task 2: Add lib/sectors.ts and lib/github.ts

**Files:**

- Create: `lib/sectors.ts`
- Create: `lib/github.ts`

- [ ] **Step 1: Create lib/sectors.ts**

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

- [ ] **Step 2: Create lib/github.ts**

Copy verbatim from `/home/shauntuhey/marketstall-customizer/lib/github.ts` — it is identical.

- [ ] **Step 3: Create lib/unsplash.ts**

```ts
export async function searchUnsplash(
  keywords: string,
): Promise<{ base64: string; ext: string } | null> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const url: string | undefined = data.results?.[0]?.urls?.regular;
    if (!url) return null;

    const imgRes = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();
    const ct = imgRes.headers.get("content-type") ?? "image/jpeg";
    const ext =
      { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
        ct.split(";")[0].trim()
      ] ?? "jpg";
    return { base64: Buffer.from(buffer).toString("base64"), ext };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/ && git commit -m "feat: add sectors config, github helpers, unsplash client"
```

---

## Task 3: Add lib/agent.ts (shared pipeline)

**Files:**

- Create: `lib/agent.ts`

- [ ] **Step 1: Create lib/agent.ts**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { searchUnsplash } from "./unsplash";

const client = new Anthropic();

export interface ColorScale {
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

export interface BizReview {
  author: string;
  rating: number;
  text: string;
}

export interface ScrapeResult {
  title: string;
  description: string;
  content: string;
  imageUrls: string[];
}

export interface ImageData {
  base64: string;
  ext: string;
}

// ── Scraping ────────────────────────────────────────────────────────────────

function extractImageUrls(markdown: string, ogImage?: string): string[] {
  const urls = new Set<string>();
  if (ogImage) urls.add(ogImage);
  const mdRe = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  const htmlRe = /src="(https?:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi;
  let m;
  while ((m = mdRe.exec(markdown)) !== null) urls.add(m[1]);
  while ((m = htmlRe.exec(markdown)) !== null) urls.add(m[1]);
  return Array.from(urls).filter(
    (u) =>
      !["favicon", "logo", "icon", "badge", "sprite", "1x1"].some((p) =>
        u.toLowerCase().includes(p),
      ),
  );
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  let res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "images"],
      waitFor: 2000,
    }),
  });
  if (res.status === 400) {
    res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"], waitFor: 2000 }),
    });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Firecrawl failed: ${res.status} — ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const markdown: string = data.data?.markdown ?? "";
  const firecrawlImages: string[] = Array.isArray(data.data?.images)
    ? data.data.images.filter(
        (u: unknown) => typeof u === "string" && u.startsWith("http"),
      )
    : [];
  const combined = Array.from(
    new Set([
      ...firecrawlImages,
      ...extractImageUrls(markdown, data.data?.metadata?.ogImage),
    ]),
  ).slice(0, 20);
  return {
    title: data.data?.metadata?.title ?? "",
    description: data.data?.metadata?.description ?? "",
    content: markdown.slice(0, 8000),
    imageUrls: combined,
  };
}

// ── Image utilities ─────────────────────────────────────────────────────────

export async function downloadImage(url: string): Promise<ImageData | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    const ext =
      { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
        mime.split(";")[0].trim()
      ] ?? "jpg";
    return {
      base64: Buffer.from(await res.arrayBuffer()).toString("base64"),
      ext,
    };
  } catch {
    return null;
  }
}

export async function isImageRelevantToBiz(
  base64: string,
  mimeType: string,
  keywords: string,
  sector: string,
): Promise<boolean> {
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Is this image relevant to a UK ${sector} business, specifically for: "${keywords}"? Reply YES or NO only.`,
            },
          ],
        },
      ],
    });
    return (msg.content[0].type === "text" ? msg.content[0].text.trim() : "")
      .toUpperCase()
      .startsWith("Y");
  } catch {
    return true;
  }
}

export async function generateBizImage(
  keywords: string,
  businessName: string,
  sector: string,
): Promise<ImageData | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  const styleMap: Record<string, string> = {
    trades:
      "authentic professional trade photography, shows quality workmanship, clean background, natural light",
    wellness:
      "elegant spa/salon photography, soft natural light, minimalist luxury aesthetic, serene atmosphere",
    hospitality:
      "professional food photography, shallow depth of field, natural window light, food magazine quality",
  };
  const prompt = `Photograph for "${businessName}", a UK ${sector} business. Subject: ${keywords}. Style: ${styleMap[sector] ?? "professional photography, clean background"}. No text overlays, no watermarks.`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const part of data.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime: string = part.inlineData.mimeType ?? "image/jpeg";
        const ext =
          { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
            mime
          ] ?? "jpg";
        return { base64: part.inlineData.data, ext };
      }
    }
  } catch {
    // Gemini unavailable
  }
  return null;
}

/**
 * Source an image for a slot: Gemini → scraped fallback → Unsplash fallback.
 * usedUrls tracks which scraped URLs have already been assigned to prevent duplicates.
 */
export async function sourceImage(
  keywords: string,
  businessName: string,
  sector: string,
  scrapedImageUrls: string[],
  usedUrls: Set<string>,
): Promise<ImageData | null> {
  const gemini = await generateBizImage(keywords, businessName, sector);
  if (gemini) return gemini;

  for (const url of scrapedImageUrls) {
    if (usedUrls.has(url)) continue;
    const img = await downloadImage(url);
    if (!img) continue;
    const mime =
      img.ext === "png"
        ? "image/png"
        : img.ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    const ok = await isImageRelevantToBiz(img.base64, mime, keywords, sector);
    if (ok) {
      usedUrls.add(url);
      return img;
    }
  }

  return searchUnsplash(keywords);
}

// ── CSS builder (shared across all sectors) ─────────────────────────────────

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(", ");
}

export function buildGlobalsCss(data: {
  primaryScale: ColorScale;
  accentScale: ColorScale;
  cream: string;
  creamDark: string;
}): string {
  const { primaryScale: p, accentScale: a, cream, creamDark } = data;
  return `@import "tailwindcss";

@theme {
  --font-display: var(--font-display-loaded), Georgia, serif;
  --font-sans: var(--font-sans-loaded), system-ui, sans-serif;

${(
  [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ] as const
)
  .map((s) => `  --color-primary-${s}: ${p[s]};`)
  .join("\n")}

${(
  [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ] as const
)
  .map((s) => `  --color-accent-${s}: ${a[s]};`)
  .join("\n")}

  --color-cream: ${cream};
  --color-cream-dark: ${creamDark};

  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background-color: ${cream};
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
.font-display { font-family: var(--font-display); }

.gradient-hero {
  background: linear-gradient(
    160deg,
    rgba(${hexToRgb(p["800"])}, 0.92) 0%,
    rgba(${hexToRgb(p["700"])}, 0.74) 50%,
    rgba(${hexToRgb(a["500"])}, 0.38) 100%
  );
}
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px -8px rgba(${hexToRgb(p["700"])}, 0.18);
}
:focus-visible { outline: 2px solid ${p["700"]}; outline-offset: 2px; }
.section-pad { padding-top: 5rem; padding-bottom: 5rem; }
@media (max-width: 768px) { .section-pad { padding-top: 3rem; padding-bottom: 3rem; } }
`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/agent.ts && git commit -m "feat: add shared scraping and image pipeline"
```

---

## Task 4: Add lib/trades.ts

**Files:**

- Create: `lib/trades.ts`

- [ ] **Step 1: Create lib/trades.ts**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { ColorScale, BizReview, ScrapeResult } from "./agent";

const client = new Anthropic();

export interface TradesOutput {
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
  stats: Array<{ value: string; label: string }>;
  services: Array<{
    name: string;
    description: string;
    icon: string;
    imageKeywords: string;
  }>;
  trustBadges: Array<{ name: string }>;
  reviews: BizReview[];
  heroImageKeywords: string;
}

export async function generateTradesCustomization(
  clientName: string,
  providedLogoUrl: string | null,
  scraped: ScrapeResult,
): Promise<TradesOutput> {
  const prompt = `You are a specialist web designer customising a demo website to win a sales pitch. The client is a real UK trades business. Make the demo feel like a premium, professionally designed version of THEIR business — not a generic template.

CLIENT: ${clientName}
SECTOR: Trades (plumber / electrician / builder / roofer / heating engineer / etc.)
${providedLogoUrl ? `LOGO URL: ${providedLogoUrl}` : ""}

THEIR WEBSITE CONTENT:
Title: ${scraped.title}
Meta description: ${scraped.description}
---
${scraped.content || "(scrape returned no content — infer from business name and type)"}
---

IMAGES FOUND ON THEIR WEBSITE:
${scraped.imageUrls.length > 0 ? scraped.imageUrls.map((u, i) => `${i + 1}. ${u}`).join("\n") : "(none found)"}

CRITICAL INSTRUCTIONS:
- Study their content carefully. What trade do they do? What area? What makes them trustworthy?
- Write copy that IMPROVES on their website — more specific, more credible, more urgent.
- Services should sound premium and specific (e.g. "Emergency Boiler Repair & Gas Safety Checks" not "Boiler repairs").
- Generate 4–6 services covering their actual trade range.
- Trust badges should be plausible for their specific trade (Gas Safe for gas work, NICEIC for electrical, NHBC for builders, etc.).
- Reviews should feel authentic — specific jobs, real problems solved, specific locations.
- Stats should be believable: years in business, job count, rating, area coverage.
- Phone and email: extract exact values from scraped content. If missing, use "[Insert Phone]" / "[Insert Email]".
- Address: extract from scraped content. If missing, use "[Insert Address]".
- Colours: derive from their branding if visible; otherwise use trade-appropriate colours (deep navy, slate, rust orange, etc.).
- heroImageKeywords: describe the ideal hero photograph for their specific trade (e.g. "professional plumber fixing copper pipes under kitchen sink").
- imageKeywords per service: describe a specific photograph for that service (e.g. "electrician installing consumer unit fuse board").
- For icon: use a lucide-react icon name. Valid options: Wrench, Zap, Flame, Droplets, HardHat, Hammer, Settings, Shield, Star, Phone, Clock, MapPin, CheckCircle.

Return ONLY a valid JSON object — no markdown fences, no preamble:

{
  "brand": {
    "name": "exact business name",
    "tagline": "punchy tagline — max 10 words, hyper-local",
    "phone": "01234 567890 or [Insert Phone]",
    "email": "hello@domain.co.uk or [Insert Email]",
    "address": "Street, Town, County, Postcode or [Insert Address]",
    "hours": "Mon–Fri 8am–6pm, Emergency 24/7",
    "logoUrl": "https://... or omit",
    "socialInstagram": "https://instagram.com/... or omit",
    "socialFacebook": "https://facebook.com/... or omit"
  },
  "primaryScale": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex", "950": "#hex" },
  "accentScale": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex", "950": "#hex" },
  "cream": "#fafaf8",
  "creamDark": "#f0ede6",
  "stats": [
    { "value": "20+", "label": "Years Experience" },
    { "value": "4.9★", "label": "Google Rating" },
    { "value": "24/7", "label": "Emergency Cover" },
    { "value": "500+", "label": "Jobs Completed" }
  ],
  "services": [
    {
      "name": "Emergency Boiler Repair",
      "description": "2 sentences. Specific. What problem it solves, what they get.",
      "icon": "Flame",
      "imageKeywords": "plumber fixing boiler in utility room"
    }
  ],
  "trustBadges": [
    { "name": "Gas Safe Registered" },
    { "name": "Which? Trusted Trader" }
  ],
  "reviews": [
    { "author": "James T., Leicester", "rating": 5, "text": "Specific review mentioning the job done and outcome. 2–3 sentences." }
  ],
  "heroImageKeywords": "professional plumber in uniform fixing pipes"
}

COLOUR GUIDELINES:
- primaryScale: dominant brand colour. For trades: deep navy (#1e3a5f), slate blue (#334155), or charcoal (#2d3748) work well. Derive from their brand first.
- accentScale: high-contrast CTA colour. For trades: rust orange (#c45c2a), signal red (#c0392b), or amber (#d97706) work well.
- cream / creamDark: warm off-white derived from the primary hue's lightest shade.
- All 11 shades (50→950). Tailwind convention: 50 ≈ near white, 500 = core colour, 950 ≈ near black. All hex values lowercase 6-digit.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error(`No JSON in Claude response: ${raw.slice(0, 200)}`);
  const parsed = JSON.parse(raw.slice(start, end + 1)) as TradesOutput;
  if (!parsed.brand.logoUrl && providedLogoUrl)
    parsed.brand.logoUrl = providedLogoUrl;
  return parsed;
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildTradesSiteConfig(
  data: TradesOutput,
  paths: { hero: string; services: string[] },
): string {
  const { brand, stats, services, trustBadges, reviews } = data;

  const servicesCode = services
    .map(
      (s, i) => `  {
    name: ${JSON.stringify(s.name)},
    description: ${JSON.stringify(s.description)},
    icon: ${JSON.stringify(s.icon)},
    imageUrl: ${JSON.stringify(paths.services[i] ?? "/images/hero.jpg")},
  }`,
    )
    .join(",\n");

  const reviewsCode = reviews
    .map(
      (r) =>
        `  { author: ${JSON.stringify(r.author)}, rating: ${r.rating}, text: ${JSON.stringify(r.text)} }`,
    )
    .join(",\n");

  return `import type { TradesSiteConfig } from "@/lib/site-config.types";

const config: TradesSiteConfig = {
  brand: {
    name: ${JSON.stringify(brand.name)},
    tagline: ${JSON.stringify(brand.tagline)},
    phone: ${JSON.stringify(brand.phone)},
    email: ${JSON.stringify(brand.email)},
    address: ${JSON.stringify(brand.address)},
    hours: ${JSON.stringify(brand.hours)},
    ${brand.logoUrl ? `logoUrl: ${JSON.stringify(brand.logoUrl)},` : ""}
    ${brand.socialInstagram ? `socialInstagram: ${JSON.stringify(brand.socialInstagram)},` : ""}
    ${brand.socialFacebook ? `socialFacebook: ${JSON.stringify(brand.socialFacebook)},` : ""}
  },
  stats: [
${stats.map((s) => `    { value: ${JSON.stringify(s.value)}, label: ${JSON.stringify(s.label)} }`).join(",\n")}
  ],
  services: [
${servicesCode}
  ],
  trustBadges: [
${trustBadges.map((b) => `    { name: ${JSON.stringify(b.name)} }`).join(",\n")}
  ],
  reviews: [
${reviewsCode}
  ],
  heroImageUrl: ${JSON.stringify(paths.hero)},
};

export default config;
`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/trades.ts && git commit -m "feat: add trades schema, LLM prompt, and site config builder"
```

---

## Task 5: Build app/page.tsx (customizer UI)

**Files:**

- Replace: `app/page.tsx`
- Replace: `app/globals.css`
- Replace: `app/layout.tsx`

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Biz Customizer" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace app/globals.css**

```css
@import "tailwindcss";

body {
  background: #030712;
  color: white;
  font-family: system-ui, sans-serif;
}
.input {
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  background: rgb(31 41 55);
  color: white;
  font-size: 0.875rem;
  border: 1px solid rgb(55 65 81);
  outline: none;
}
.input:focus {
  border-color: rgb(99 102 241);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.input:disabled {
  opacity: 0.5;
}
select.input option {
  background: rgb(31 41 55);
}
```

- [ ] **Step 3: Replace app/page.tsx**

```tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { SECTORS, SectorKey } from "@/lib/sectors";

interface ImageData {
  base64: string;
  ext: string;
}

interface StreamEvent {
  step:
    | "scraping"
    | "generating"
    | "images"
    | "image_ready"
    | "committing"
    | "complete"
    | "error"
    | "review";
  message?: string;
  index?: number;
  label?: string;
  imageData?: ImageData | null;
  reviewPayload?: {
    brandName: string;
    brandTagline: string;
    sector: SectorKey;
    clientName: string;
    agentOutput: unknown;
  };
  repoUrl?: string;
  previewUrl?: string;
  brand?: string;
}

interface LogLine {
  step: StreamEvent["step"];
  message: string;
}

const STEP_ICONS: Record<StreamEvent["step"], string> = {
  scraping: "⟳",
  generating: "⟳",
  images: "⟳",
  image_ready: "⟳",
  committing: "⟳",
  complete: "✓",
  error: "✗",
  review: "✓",
};

export default function Page() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({
    sector: "trades" as SectorKey,
    clientName: "",
    websiteUrl: "",
    logoUrl: "",
  });
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [reviewPayload, setReviewPayload] = useState<
    StreamEvent["reviewPayload"] | null
  >(null);
  const [completeEvent, setCompleteEvent] = useState<StreamEvent | null>(null);
  const imagesRef = useRef<
    Array<{ label: string; imageData: ImageData | null }>
  >([]);
  const [images, setImages] = useState<typeof imagesRef.current>([]);

  useEffect(() => {
    setAuthed(!!sessionStorage.getItem("biz_admin_token"));
  }, []);

  function reset() {
    setReviewPayload(null);
    setCompleteEvent(null);
    setLog([]);
    setRunning(false);
    imagesRef.current = [];
    setImages([]);
  }

  function addLog(step: StreamEvent["step"], message: string) {
    if (!message) return;
    setLog((prev) => [...prev, { step, message }]);
  }

  async function readStream(res: Response, onDone: () => void) {
    if (!res.body) {
      addLog("error", `Request failed (${res.status})`);
      onDone();
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as StreamEvent;
            if (ev.step === "image_ready") {
              const idx = ev.index ?? 0;
              imagesRef.current[idx] = {
                label: ev.label ?? "",
                imageData: ev.imageData ?? null,
              };
              setImages([...imagesRef.current]);
              addLog("image_ready", `Image ${idx + 1}: ${ev.label ?? ""}`);
            } else if (ev.step === "review" && ev.reviewPayload) {
              setReviewPayload(ev.reviewPayload);
            } else if (ev.step === "complete") {
              setCompleteEvent(ev);
              if (ev.message) addLog(ev.step, ev.message);
            } else if (ev.message) {
              addLog(ev.step, ev.message);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      addLog("error", "Connection lost — please try again.");
    }
    onDone();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    reset();
    setRunning(true);
    try {
      const savedToken = sessionStorage.getItem("biz_admin_token") ?? "";
      const res = await fetch("/api/customize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        addLog("error", `Request failed (${res.status})`);
        setRunning(false);
        return;
      }
      await readStream(res, () => setRunning(false));
    } catch {
      addLog("error", "Request failed — please try again.");
      setRunning(false);
    }
  }

  async function handleDeploy() {
    if (!reviewPayload) return;
    setReviewPayload(null);
    setLog([]);
    setRunning(true);
    try {
      const savedToken = sessionStorage.getItem("biz_admin_token") ?? "";
      const res = await fetch("/api/customize/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({
          agentOutput: reviewPayload.agentOutput,
          sector: reviewPayload.sector,
          clientName: reviewPayload.clientName,
        }),
      });
      if (!res.ok) {
        addLog("error", `Request failed (${res.status})`);
        setRunning(false);
        return;
      }
      await readStream(res, () => setRunning(false));
    } catch {
      addLog("error", "Request failed — please try again.");
      setRunning(false);
    }
  }

  const lastLog = log[log.length - 1];
  const isDone = lastLog?.step === "complete" || lastLog?.step === "error";

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("biz_admin_token", token);
            setAuthed(true);
          }}
          className="bg-gray-900 border border-gray-800 p-8 rounded-2xl space-y-4 w-80"
        >
          <div>
            <p className="text-white font-semibold text-lg">Biz Customizer</p>
            <p className="text-gray-500 text-sm mt-0.5">Veltro admin only</p>
          </div>
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">Biz Customizer</h1>
          <p className="text-gray-500 text-sm">
            Generate a live demo site for any local business.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Sector">
            <select
              value={form.sector}
              onChange={(e) =>
                setForm({ ...form, sector: e.target.value as SectorKey })
              }
              disabled={running || !!reviewPayload}
              className="input"
            >
              {Object.entries(SECTORS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Client name">
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="e.g. Smith's Plumbing Ltd"
              required
              disabled={running || !!reviewPayload}
              className="input"
            />
          </Field>
          <Field label="Client website URL">
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://example.com"
              required
              disabled={running || !!reviewPayload}
              className="input"
            />
          </Field>
          <Field label="Logo URL" optional>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              disabled={running || !!reviewPayload}
              className="input"
            />
          </Field>
          <button
            type="submit"
            disabled={running || !!reviewPayload}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
          >
            {running ? "Working…" : "Customise →"}
          </button>
        </form>

        {log.length > 0 && (
          <div className="border border-gray-800 rounded-xl p-5 space-y-3">
            {log.map((line, i) => (
              <div
                key={i}
                className={`flex gap-3 text-sm items-start ${line.step === "error" ? "text-red-400" : line.step === "complete" ? "text-green-400" : "text-gray-400"}`}
              >
                <span className="shrink-0 w-4 text-center font-mono">
                  {STEP_ICONS[line.step]}
                </span>
                <span>{line.message}</span>
              </div>
            ))}
            {isDone && lastLog?.step === "complete" && completeEvent && (
              <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
                {completeEvent.brand && (
                  <p className="text-xs text-gray-500">
                    Customised as{" "}
                    <span className="text-white font-medium">
                      {completeEvent.brand}
                    </span>
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {completeEvent.previewUrl && (
                    <>
                      <a
                        href={completeEvent.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                      >
                        Preview →
                      </a>
                      <a
                        href={`${completeEvent.previewUrl}?dm=veltrodemo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                      >
                        Editable demo →
                      </a>
                    </>
                  )}
                  {completeEvent.repoUrl && (
                    <a
                      href={completeEvent.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-gray-400 underline underline-offset-2"
                    >
                      GitHub →
                    </a>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="mt-1 text-xs text-gray-600 hover:text-gray-400 text-left transition-colors"
                >
                  Customise another →
                </button>
              </div>
            )}
          </div>
        )}

        {reviewPayload && !running && (
          <div className="border border-gray-700 rounded-xl p-5 space-y-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                Ready to review
              </p>
              <h2 className="text-white font-semibold text-lg">
                {reviewPayload.brandName}
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {reviewPayload.brandTagline}
              </p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((img, i) => {
                  const mime =
                    img.imageData?.ext === "png"
                      ? "png"
                      : img.imageData?.ext === "webp"
                        ? "webp"
                        : "jpeg";
                  const src = img.imageData
                    ? `data:image/${mime};base64,${img.imageData.base64}`
                    : null;
                  return (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden bg-gray-800 aspect-video"
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={img.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                          {img.label || "No image"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleDeploy}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                Looks good — deploy →
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-gray-400">
        {label}
        {optional && <span className="ml-1.5 text-gray-600">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/ && git commit -m "feat: add customizer UI"
```

---

## Task 6: Build app/api/customize/route.ts

**Files:**

- Create: `app/api/customize/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest } from "next/server";
import { SECTORS, SectorKey } from "@/lib/sectors";
import { scrapeUrl, sourceImage } from "@/lib/agent";
import { generateTradesCustomization } from "@/lib/trades";

export const maxDuration = 120;

function encode(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + "\n"));
}

export async function POST(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.ADMIN_TOKEN}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sector, clientName, websiteUrl, logoUrl } = (await req.json()) as {
    sector: string;
    clientName: string;
    websiteUrl: string;
    logoUrl?: string;
  };

  if (!SECTORS[sector as SectorKey])
    return new Response("Invalid sector", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        encode(controller, {
          step: "scraping",
          message: `Scraping ${websiteUrl}…`,
        });
        const scraped = await scrapeUrl(websiteUrl);

        encode(controller, {
          step: "generating",
          message: `Scraped ${scraped.imageUrls.length} images — generating config with Claude…`,
        });

        let agentOutput;
        if (sector === "trades") {
          agentOutput = await generateTradesCustomization(
            clientName,
            logoUrl ?? null,
            scraped,
          );
        } else {
          throw new Error(`Sector "${sector}" not yet implemented`);
        }

        // Collect image slots
        const imageSlots: Array<{ label: string; keywords: string }> = [
          { label: "Hero", keywords: agentOutput.heroImageKeywords },
          ...agentOutput.services.map((s, i) => ({
            label: `Service ${i + 1}: ${s.name}`,
            keywords: s.imageKeywords,
          })),
        ];

        encode(controller, {
          step: "images",
          message: `Generating ${imageSlots.length} images…`,
        });

        const usedUrls = new Set<string>();
        await Promise.all(
          imageSlots.map(async (slot, index) => {
            const result = await sourceImage(
              slot.keywords,
              agentOutput.brand.name,
              sector,
              scraped.imageUrls,
              usedUrls,
            );
            encode(controller, {
              step: "image_ready",
              index,
              label: slot.label,
              imageData: result,
            });
          }),
        );

        encode(controller, {
          step: "review",
          message: "Review your customisation before deploying.",
          reviewPayload: {
            brandName: agentOutput.brand.name,
            brandTagline: agentOutput.brand.tagline,
            sector,
            clientName,
            agentOutput,
          },
        });
      } catch (err) {
        encode(controller, {
          step: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/ && git commit -m "feat: add customize API route (trades)"
```

---

## Task 7: Build app/api/customize/deploy/route.ts

**Files:**

- Create: `app/api/customize/deploy/route.ts`

- [ ] **Step 1: Create the deploy route**

```ts
import { NextRequest } from "next/server";
import { SECTORS, SectorKey } from "@/lib/sectors";
import { sourceImage, buildGlobalsCss } from "@/lib/agent";
import { buildTradesSiteConfig, type TradesOutput } from "@/lib/trades";
import { commitFile, commitBinaryFile, readFile } from "@/lib/github";

export const maxDuration = 120;

function encode(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + "\n"));
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.ADMIN_TOKEN}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { agentOutput, sector, clientName } = (await req.json()) as {
    agentOutput: TradesOutput;
    sector: string;
    clientName: string;
  };

  if (!SECTORS[sector as SectorKey])
    return new Response("Invalid sector", { status: 400 });

  const sectorInfo = SECTORS[sector as SectorKey];
  const repo = sectorInfo.repo;
  const commitMsg = `chore: customise demo for ${clientName}`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        encode(controller, {
          step: "committing",
          message: "Deploy started — generating images…",
        });

        // Re-generate all images (same slots as generate phase)
        const usedUrls = new Set<string>();
        let heroImage: { base64: string; ext: string } | null = null;
        const serviceImages: Array<{ base64: string; ext: string } | null> = [];

        if (sector === "trades") {
          const output = agentOutput as TradesOutput;
          heroImage = await sourceImage(
            output.heroImageKeywords,
            output.brand.name,
            sector,
            [],
            usedUrls,
          );
          for (const service of output.services) {
            const img = await sourceImage(
              service.imageKeywords,
              output.brand.name,
              sector,
              [],
              usedUrls,
            );
            serviceImages.push(img);
          }
        }

        encode(controller, {
          step: "committing",
          message: "Committing images…",
        });

        // Commit hero image
        const heroPaths = {
          hero: "/images/hero.jpg",
          services: [] as string[],
        };
        if (heroImage) {
          await commitBinaryFile(
            repo,
            `public/images/hero.${heroImage.ext}`,
            heroImage.base64,
            commitMsg,
          );
          heroPaths.hero = `/images/hero.${heroImage.ext}`;
        }

        // Commit service images
        if (sector === "trades") {
          const output = agentOutput as TradesOutput;
          for (let i = 0; i < output.services.length; i++) {
            const img = serviceImages[i];
            const slug = toSlug(output.services[i].name);
            if (img) {
              await commitBinaryFile(
                repo,
                `public/images/${slug}.${img.ext}`,
                img.base64,
                commitMsg,
              );
              heroPaths.services.push(`/images/${slug}.${img.ext}`);
            } else {
              heroPaths.services.push("/images/hero.jpg");
            }
            encode(controller, {
              step: "committing",
              message: `Image ${i + 1}/${output.services.length}: ${output.services[i].name}`,
            });
          }
        }

        encode(controller, {
          step: "committing",
          message: "Updating site config…",
        });

        let siteConfig: string;
        let globalsCss: string;

        if (sector === "trades") {
          siteConfig = buildTradesSiteConfig(
            agentOutput as TradesOutput,
            heroPaths,
          );
          globalsCss = buildGlobalsCss(agentOutput as TradesOutput);
        } else {
          throw new Error(`Sector "${sector}" not yet implemented`);
        }

        await commitFile(repo, "site.config.ts", siteConfig, commitMsg);
        await commitFile(repo, "app/globals.css", globalsCss, commitMsg);

        encode(controller, {
          step: "complete",
          message: "Done! Vercel will deploy in ~60 seconds.",
          repoUrl: `https://github.com/${repo}`,
          previewUrl: sectorInfo.previewUrl,
          brand: agentOutput.brand.name,
        });
      } catch (err) {
        encode(controller, {
          step: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/customize/deploy/ && git commit -m "feat: add deploy route (trades)"
```

---

## Task 8: Scaffold biztemplate-trades

**Files:**

- Create: `/home/shauntuhey/biztemplate-trades/` (new Next.js app)

- [ ] **Step 1: Create the Next.js app**

```bash
cd /home/shauntuhey
npx create-next-app@latest biztemplate-trades \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --yes
cd biztemplate-trades
npm install lucide-react
```

- [ ] **Step 2: Update next.config.ts**

```ts
import type { NextConfig } from "next";
const config: NextConfig = { turbopack: { root: __dirname } };
export default config;
```

- [ ] **Step 3: Add a placeholder hero image**

```bash
mkdir -p public/images
curl -o public/images/hero.jpg "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80"
```

(This is a plumber-at-work photo — placeholder until deploy overwrites it.)

- [ ] **Step 4: Commit scaffold**

```bash
git init && git add -A && git commit -m "chore: scaffold biztemplate-trades"
```

---

## Task 9: Add lib/site-config.types.ts to biztemplate-trades

**Files:**

- Create: `lib/site-config.types.ts`
- Create: `site.config.ts` (initial placeholder)

- [ ] **Step 1: Create lib/site-config.types.ts**

```ts
export interface TradesSiteConfig {
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
  stats: Array<{ value: string; label: string }>;
  services: Array<{
    name: string;
    description: string;
    icon: string;
    imageUrl: string;
  }>;
  trustBadges: Array<{ name: string }>;
  reviews: Array<{ author: string; rating: number; text: string }>;
  heroImageUrl: string;
}
```

- [ ] **Step 2: Create initial site.config.ts (placeholder — deploy overwrites this)**

```ts
import type { TradesSiteConfig } from "@/lib/site-config.types";

const config: TradesSiteConfig = {
  brand: {
    name: "Smith's Plumbing",
    tagline: "Leicester's Trusted Emergency Plumbers",
    phone: "0116 123 4567",
    email: "hello@smithsplumbing.co.uk",
    address: "Leicester, Leicestershire",
    hours: "Mon–Fri 8am–6pm, Emergency 24/7",
  },
  stats: [
    { value: "20+", label: "Years Experience" },
    { value: "4.9★", label: "Google Rating" },
    { value: "24/7", label: "Emergency Cover" },
    { value: "500+", label: "Jobs Completed" },
  ],
  services: [
    {
      name: "Emergency Plumbing",
      description: "Fast response to burst pipes and leaks.",
      icon: "Wrench",
      imageUrl: "/images/hero.jpg",
    },
    {
      name: "Boiler Installation",
      description: "New boiler supply and installation.",
      icon: "Flame",
      imageUrl: "/images/hero.jpg",
    },
    {
      name: "Bathroom Fitting",
      description: "Full bathroom design and installation.",
      icon: "Droplets",
      imageUrl: "/images/hero.jpg",
    },
  ],
  trustBadges: [
    { name: "Gas Safe Registered" },
    { name: "Which? Trusted Trader" },
  ],
  reviews: [
    {
      author: "Sarah M., Leicester",
      rating: 5,
      text: "Brilliant service. Fixed our burst pipe within the hour. Highly recommended.",
    },
    {
      author: "James T., Loughborough",
      rating: 5,
      text: "Professional and fairly priced. Would not hesitate to call again.",
    },
  ],
  heroImageUrl: "/images/hero.jpg",
};

export default config;
```

- [ ] **Step 3: Commit**

```bash
git add lib/ site.config.ts && git commit -m "feat: add site config types and placeholder config"
```

---

## Task 10: Build app/layout.tsx and app/globals.css for trades template

**Files:**

- Replace: `app/layout.tsx`
- Replace: `app/globals.css`

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import config from "@/site.config";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display-loaded",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-loaded",
});

export const metadata: Metadata = { title: config.brand.name };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace app/globals.css with a working starter**

The deploy pipeline will overwrite this file with `buildGlobalsCss()` output. For development, add a functional placeholder:

```css
@import "tailwindcss";

@theme {
  --font-display: var(--font-display-loaded), Georgia, serif;
  --font-sans: var(--font-sans-loaded), system-ui, sans-serif;

  --color-primary-50: #f0f4ff;
  --color-primary-100: #e0eaff;
  --color-primary-200: #c7d7fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

  --color-accent-50: #fff7ed;
  --color-accent-100: #ffedd5;
  --color-accent-200: #fed7aa;
  --color-accent-300: #fdba74;
  --color-accent-400: #fb923c;
  --color-accent-500: #f97316;
  --color-accent-600: #ea580c;
  --color-accent-700: #c2410c;
  --color-accent-800: #9a3412;
  --color-accent-900: #7c2d12;
  --color-accent-950: #431407;

  --color-cream: #fafaf8;
  --color-cream-dark: #f0ede6;
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

* {
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
body {
  font-family: var(--font-sans);
  background-color: var(--color-cream);
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
.font-display {
  font-family: var(--font-display);
}
.gradient-hero {
  background: linear-gradient(
    160deg,
    rgba(67, 56, 202, 0.92) 0%,
    rgba(79, 70, 229, 0.74) 50%,
    rgba(249, 115, 22, 0.38) 100%
  );
}
.card-hover {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px -8px rgba(67, 56, 202, 0.18);
}
:focus-visible {
  outline: 2px solid #4338ca;
  outline-offset: 2px;
}
.section-pad {
  padding-top: 5rem;
  padding-bottom: 5rem;
}
@media (max-width: 768px) {
  .section-pad {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css && git commit -m "feat: add layout with Montserrat/Inter fonts"
```

---

## Task 11: Build trades template components

**Files:**

- Create: `components/Hero.tsx`
- Create: `components/TrustBar.tsx`
- Create: `components/ServicesGrid.tsx`
- Create: `components/BeforeAfterGallery.tsx`
- Create: `components/ReviewsSlider.tsx`
- Create: `components/SiteFooter.tsx`

- [ ] **Step 1: Create components/Hero.tsx**

```tsx
import config from "@/site.config";
import { Phone } from "lucide-react";

export default function Hero() {
  const { brand, heroImageUrl } = config;
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImageUrl}
          alt={brand.name}
          className="w-full h-full object-cover"
        />
        <div className="gradient-hero absolute inset-0" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-white">
        {brand.logoUrl && (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-14 w-auto mb-8 object-contain brightness-0 invert"
          />
        )}
        <p className="text-accent-400 font-display font-bold text-sm uppercase tracking-widest mb-4">
          {brand.address.split(",").slice(-2).join(",").trim()}
        </p>
        <h1 className="font-display font-black text-5xl md:text-7xl leading-none mb-6 text-balance">
          {brand.tagline}
        </h1>
        <p className="text-white/80 text-xl max-w-xl mb-10">{brand.hours}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`tel:${brand.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
            {brand.phone}
          </a>
          <a
            href="#contact"
            className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors border border-white/20"
          >
            Get a Free Quote
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create components/TrustBar.tsx**

```tsx
import config from "@/site.config";
import { ShieldCheck } from "lucide-react";

export default function TrustBar() {
  const { stats, trustBadges } = config;
  return (
    <section className="bg-primary-900 text-white py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display font-black text-2xl text-accent-400">
                  {s.value}
                </p>
                <p className="text-white/60 text-xs uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {trustBadges.map((b) => (
              <span
                key={b.name}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium"
              >
                <ShieldCheck className="w-4 h-4 text-accent-400" />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create components/ServicesGrid.tsx**

```tsx
import config from "@/site.config";
import {
  Wrench,
  Zap,
  Flame,
  Droplets,
  HardHat,
  Hammer,
  Settings,
  Shield,
  Star,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  Flame,
  Droplets,
  HardHat,
  Hammer,
  Settings,
  Shield,
  Star,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
};

export default function ServicesGrid() {
  const { services } = config;
  return (
    <section className="section-pad bg-cream-dark">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-accent-600 font-semibold text-sm uppercase tracking-widest mb-3">
            What We Do
          </p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-primary-900">
            Our Services
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = ICON_MAP[s.icon] ?? Wrench;
            return (
              <div
                key={s.name}
                className="card-hover bg-white rounded-2xl overflow-hidden shadow-sm border border-primary-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500 text-white">
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg text-primary-900 mb-2">
                    {s.name}
                  </h3>
                  <p className="text-primary-700/80 text-sm leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create components/BeforeAfterGallery.tsx**

```tsx
export default function BeforeAfterGallery() {
  const pairs = [1, 2, 3, 4];
  return (
    <section className="section-pad bg-cream">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-accent-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Our Work
          </p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-primary-900">
            Before & After
          </h2>
          <p className="text-primary-700/70 mt-4 max-w-lg mx-auto">
            Real jobs. Real results. See the difference a professional makes.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pairs.map((i) => (
            <div key={i} className="space-y-2">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-primary-100 flex items-center justify-center">
                <span className="text-primary-400 text-xs font-medium">
                  Before {i}
                </span>
                <span className="absolute top-2 left-2 bg-primary-900/80 text-white text-xs px-2 py-0.5 rounded-full">
                  Before
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-accent-50 flex items-center justify-center">
                <span className="text-accent-400 text-xs font-medium">
                  After {i}
                </span>
                <span className="absolute top-2 left-2 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                  After
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-primary-400 text-sm mt-8">
          Photos of completed work — updated regularly
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create components/ReviewsSlider.tsx**

```tsx
"use client";
import { useState, useEffect } from "react";
import config from "@/site.config";
import { Star } from "lucide-react";

export default function ReviewsSlider() {
  const { reviews, brand } = config;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % reviews.length),
      5000,
    );
    return () => clearInterval(t);
  }, [reviews.length]);

  return (
    <section className="section-pad bg-primary-900 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="text-accent-400 font-semibold text-sm uppercase tracking-widest mb-3">
          Testimonials
        </p>
        <h2 className="font-display font-black text-4xl md:text-5xl mb-14">
          What Customers Say
        </h2>
        <div className="relative min-h-[180px]">
          {reviews.map((r, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-5 h-5 fill-accent-400 text-accent-400"
                  />
                ))}
              </div>
              <p className="text-white/90 text-xl leading-relaxed italic mb-6">
                "{r.text}"
              </p>
              <p className="text-white/50 text-sm font-medium">— {r.author}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-accent-400" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create components/SiteFooter.tsx**

```tsx
import config from "@/site.config";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function SiteFooter() {
  const { brand } = config;
  return (
    <footer id="contact" className="bg-primary-950 text-white py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
            ) : (
              <h3 className="font-display font-black text-2xl mb-4">
                {brand.name}
              </h3>
            )}
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {brand.tagline}
            </p>
          </div>
          <div className="space-y-4">
            <a
              href={`tel:${brand.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-accent-400 shrink-0" />
              <span>{brand.phone}</span>
            </a>
            <a
              href={`mailto:${brand.email}`}
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 text-accent-400 shrink-0" />
              <span>{brand.email}</span>
            </a>
            <div className="flex items-start gap-3 text-white/80">
              <MapPin className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
              <span>{brand.address}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Clock className="w-4 h-4 text-accent-400 shrink-0" />
              <span>{brand.hours}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/ && git commit -m "feat: add all trades template components"
```

---

## Task 12: Wire app/page.tsx for trades template

**Files:**

- Replace: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx**

```tsx
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ServicesGrid from "@/components/ServicesGrid";
import BeforeAfterGallery from "@/components/BeforeAfterGallery";
import ReviewsSlider from "@/components/ReviewsSlider";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesGrid />
      <BeforeAfterGallery />
      <ReviewsSlider />
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Start the dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:3000. Expected:

- Hero section with background image, business name, phone button
- Dark trust bar with stats and badges
- Services grid with 3 cards
- Before/After placeholder grid
- Rotating review slider
- Footer with contact details

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx && git commit -m "feat: wire trades template home page"
```

---

## Task 13: Create GitHub repos and Vercel projects (manual prerequisite)

This task is done in the GitHub/Vercel dashboards, not in code.

- [ ] **Step 1: Push biztemplate-trades to GitHub**

In GitHub, create a new repo `VeltroSystemsUK/biztemplate-trades` (public, no README).

```bash
cd /home/shauntuhey/biztemplate-trades
git remote add origin git@github.com:VeltroSystemsUK/biztemplate-trades.git
git push -u origin main
```

- [ ] **Step 2: Link to Vercel**

In Vercel dashboard: New Project → Import `VeltroSystemsUK/biztemplate-trades` → deploy. Note the deployed URL. If it's not `biztemplate-trades.vercel.app`, update `SECTORS.trades.previewUrl` in `bizcustomizer/lib/sectors.ts`.

- [ ] **Step 3: Push bizcustomizer to GitHub**

In GitHub, create `VeltroSystemsUK/bizcustomizer` (private).

```bash
cd /home/shauntuhey/bizcustomizer
git remote add origin git@github.com:VeltroSystemsUK/bizcustomizer.git
git push -u origin main
```

- [ ] **Step 4: Link bizcustomizer to Vercel and add env vars**

Import `VeltroSystemsUK/bizcustomizer` into Vercel. Add all env vars from `.env.local`:
`ADMIN_TOKEN`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, `UNSPLASH_ACCESS_KEY`

---

## Task 14: End-to-end test — trades pipeline

- [ ] **Step 1: Start bizcustomizer locally**

```bash
cd /home/shauntuhey/bizcustomizer
npm run dev
```

- [ ] **Step 2: Open the customizer and log in**

Open http://localhost:3000. Enter `dev-token` (the ADMIN_TOKEN from .env.local).

- [ ] **Step 3: Submit a real UK trades business**

Use a real plumber, electrician, or builder URL. Example:

```
Sector: Trades
Client name: [any UK trades business name]
Website URL: [their existing website URL]
Logo URL: (optional)
```

Click "Customise →"

Expected log output (in order):

```
⟳ Scraping https://...
⟳ Scraped N images — generating config with Claude…
⟳ Generating N images…
⟳ Image 1: Hero
⟳ Image 2: Service 1: ...
✓ Review your customisation before deploying.
```

- [ ] **Step 4: Review the generated output**

The review screen should show: business name, tagline, and a grid of up to 6 images.

Check: does the brand name match the scraped site? Are the service names relevant to their trade?

- [ ] **Step 5: Deploy**

Click "Looks good — deploy →"

Expected log:

```
⟳ Deploy started — generating images…
⟳ Committing images…
⟳ Image 1/N: ...
⟳ Updating site config…
✓ Done! Vercel will deploy in ~60 seconds.
```

- [ ] **Step 6: Verify the deployed template**

Open the preview URL (from `SECTORS.trades.previewUrl`). After ~60s Vercel build:

- Hero shows the business name and trade-specific imagery
- Trust bar shows the correct badges and stats
- Services grid shows relevant trade services
- Footer shows real contact details from their site

---

## Notes for Plan B

Plan B covers:

- `lib/wellness.ts` — WellnessOutput schema, generateWellnessCustomization(), buildWellnessSiteConfig()
- `lib/hospitality.ts` — HospitalityOutput schema, generateHospitalityCustomization(), buildHospitalitySiteConfig()
- Wiring wellness and hospitality into `api/customize/route.ts` and `api/customize/deploy/route.ts` (replacing the `throw new Error("not yet implemented")` stubs)
- `biztemplate-wellness` — multi-page Next.js app (/, /services, /team, /book)
- `biztemplate-hospitality` — multi-page Next.js app (/, /menu, /book)

The pattern is identical to trades. Plan B will be written once Plan A is tested end-to-end.
