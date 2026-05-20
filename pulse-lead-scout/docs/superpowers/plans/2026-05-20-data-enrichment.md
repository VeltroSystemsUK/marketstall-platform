# Data Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add on-demand contact enrichment (Firecrawl + Gemini), email verification badges, an email compose drawer, manual contact entry, and bulk enrichment across all saved leads.

**Architecture:** When a lead is selected, `useEnrichment` checks Dexie for a cached result and fires `POST /api/enrich-lead` on a miss. The server scrapes the prospect's site via Firecrawl, passes scraped content to Gemini for structured contact extraction, stores the result in Dexie (`enrichments` + `contacts` tables), and the `ContactsPanel` renders it reactively. `useVerification` runs silently in the background to add MX-validated badges. A `ComposeDrawer` handles outbound email via nodemailer. Bulk enrichment iterates all saved leads sequentially.

**Tech Stack:** React 19 + TypeScript, Dexie 4 (IndexedDB), Express + Node 24, `@google/genai` (existing), `@mendable/firecrawl-js`, `nodemailer`, `dns.promises` (built-in), `crypto.randomUUID()` (built-in).

---

## File Map

| Action | Path                               | Purpose                                                        |
| ------ | ---------------------------------- | -------------------------------------------------------------- |
| Modify | `src/types.ts`                     | Add `Contact`, `Enrichment`, `ContactRecord`, `SentEmail`      |
| Modify | `src/db.ts`                        | Version 2: add `enrichments`, `contacts`, `sent_emails` tables |
| Modify | `server.ts`                        | Add 3 new endpoints before `startServer()`                     |
| Modify | `.env`                             | Add `FIRECRAWL_API_KEY` + SMTP vars                            |
| Modify | `.env.example`                     | Mirror `.env` additions                                        |
| Create | `src/hooks/useEnrichment.ts`       | Cache check + API call + Dexie write                           |
| Create | `src/hooks/useVerification.ts`     | Background MX verification per contact                         |
| Create | `src/components/ContactsPanel.tsx` | Loading / found / empty states                                 |
| Create | `src/components/ComposeDrawer.tsx` | Email compose + send                                           |
| Modify | `src/App.tsx`                      | Wire everything into `MainView` + `SavedLeadsView`             |

---

## Task 1: Install Dependencies and Configure Environment

**Files:**

- Modify: `package.json` (via npm)
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Install server-side packages**

```bash
cd /home/shauntuhey/MarketStall/pulse-lead-scout
npm install @mendable/firecrawl-js nodemailer
npm install --save-dev @types/nodemailer
```

Expected: no errors, packages appear in `node_modules/`.

- [ ] **Step 2: Add environment variables to `.env`**

Open `.env` and append:

```
FIRECRAWL_API_KEY="fc-b8bd384c322040ec9b260fb0f0d94d50"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=shaun@veltro.co.uk
```

> `FIRECRAWL_API_KEY` is already in your Claude MCP settings — copy it in. SMTP fields are filled in when you set up outbound email; leave blank for now (the endpoint will return a clear error if unconfigured).

- [ ] **Step 3: Mirror in `.env.example`**

Open `.env.example` and append:

```
FIRECRAWL_API_KEY="your_firecrawl_api_key"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM=you@example.com
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: install firecrawl-js and nodemailer dependencies"
```

---

## Task 2: Update Types

**Files:**

- Modify: `src/types.ts`

- [ ] **Step 1: Replace `src/types.ts` with the expanded version**

```typescript
export interface Lead {
  lead_id: string;
  business_name: string;
  website_url?: string;
  contact_details: { phone: string; address: string };
  current_digital_status:
    | "NO_WEBSITE"
    | "OUTDATED_UNSECURE"
    | "OUTDATED_STATIC"
    | "MODERN_RETAIN";
  lead_score: number;
  pitch_hook_angle: string;
  ai_demo_generation_parameters: {
    framework_type: string;
    suggested_primary_keyword: string;
    recommended_placeholders: string[];
  };
}

export interface Contact {
  name?: string | null;
  email?: string | null;
  title?: string | null;
  sourcePage: "homepage" | "contact" | "about";
  isGeneric: boolean;
}

export interface Enrichment {
  domain: string;
  leadId: string;
  contacts: Contact[];
  enrichedAt: number;
  status: "done" | "failed" | "no_website";
}

export interface ContactRecord {
  id: string;
  email: string;
  name?: string;
  title?: string;
  phone?: string;
  leadId: string;
  domain: string;
  source: "enriched" | "manual";
  verificationStatus: "unverified" | "valid" | "risky" | "invalid";
  createdAt: number;
}

export interface SentEmail {
  id: string;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  leadId: string;
  sentAt: number;
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add Contact, Enrichment, ContactRecord, SentEmail types"
```

---

## Task 3: Update Database (Dexie v2)

**Files:**

- Modify: `src/db.ts`

- [ ] **Step 1: Replace `src/db.ts` with the version-2 schema**

```typescript
import Dexie, { type Table } from "dexie";
import type { Lead, Enrichment, ContactRecord, SentEmail } from "./types";

export interface SavedLead extends Lead {
  savedAt: number;
}

export type { Enrichment, ContactRecord, SentEmail };

class LeadsDb extends Dexie {
  leads!: Table<SavedLead>;
  enrichments!: Table<Enrichment>;
  contacts!: Table<ContactRecord>;
  sent_emails!: Table<SentEmail>;

  constructor() {
    super("pulse-lead-scout");
    this.version(1).stores({
      leads: "lead_id, savedAt, business_name, lead_score",
    });
    this.version(2).stores({
      leads: "lead_id, savedAt, business_name, lead_score",
      enrichments: "domain, leadId, enrichedAt",
      contacts: "id, leadId, domain, email",
      sent_emails: "id, sentAt, leadId",
    });
  }
}

export const db = new LeadsDb();
```

> Dexie requires all tables to be re-declared when bumping version. The `leads` table definition is unchanged but must be included.

- [ ] **Step 2: Verify TypeScript**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/db.ts
git commit -m "feat: bump Dexie to v2, add enrichments/contacts/sent_emails tables"
```

---

## Task 4: Server — `/api/enrich-lead`

**Files:**

- Modify: `server.ts` (add import + endpoint before `startServer()`)

- [ ] **Step 1: Add Firecrawl import at the top of `server.ts`** (after existing imports)

```typescript
import FirecrawlApp from "@mendable/firecrawl-js";
```

- [ ] **Step 2: Initialise Firecrawl after the `ai` initialisation block**

```typescript
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

const GENERIC_EMAIL_PREFIXES = [
  "info",
  "admin",
  "sales",
  "enquiries",
  "hello",
  "support",
  "contact",
  "office",
  "reception",
  "accounts",
  "noreply",
  "no-reply",
  "mail",
  "post",
];

function isGenericEmail(email: string): boolean {
  const local = email.split("@")[0].toLowerCase();
  return GENERIC_EMAIL_PREFIXES.some(
    (p) => local === p || local.startsWith(p + "."),
  );
}

function extractDomain(url: string): string | null {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Add the `/api/enrich-lead` endpoint** — paste this before the `startServer()` call at the bottom of `server.ts`

````typescript
app.post("/api/enrich-lead", async (req, res) => {
  try {
    const { domain, leadId } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "domain is required" });
    }

    const urls = [
      `https://${domain}`,
      `https://${domain}/contact`,
      `https://${domain}/about`,
    ];

    const pageLabels = ["homepage", "contact", "about"] as const;

    const scrapeResults = await Promise.allSettled(
      urls.map((url) => firecrawl.scrapeUrl(url, { formats: ["markdown"] })),
    );

    const pages = scrapeResults
      .map((result, i) => {
        if (result.status === "rejected") return null;
        const val = result.value as any;
        if (!val?.success || !val?.markdown) return null;
        return {
          markdown: (val.markdown as string).slice(0, 3000),
          sourcePage: pageLabels[i],
        };
      })
      .filter(
        (
          p,
        ): p is {
          markdown: string;
          sourcePage: "homepage" | "contact" | "about";
        } => p !== null,
      );

    if (pages.length === 0) {
      return res.json({ status: "failed", contacts: [] });
    }

    const combinedContent = pages
      .map((p) => `[${p.sourcePage}]\n${p.markdown}`)
      .join("\n\n---\n\n")
      .slice(0, 8000);

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: combinedContent,
      config: {
        systemInstruction: `You are extracting contact information from scraped website content.
Return a JSON array of contacts. For each contact include:
  - name (string or null)
  - email (string or null)
  - title (string or null)
  - sourcePage (exactly one of: "homepage", "contact", "about" — match which section the contact appeared in)
  - isGeneric (true if the email is role-based: info@, admin@, sales@, enquiries@, hello@, support@, contact@, office@, reception@, accounts@, noreply@)

Return ONLY contacts explicitly stated on the page. Do not infer or guess.
If no contacts are found, return an empty array [].`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              title: { type: Type.STRING },
              sourcePage: { type: Type.STRING },
              isGeneric: { type: Type.BOOLEAN },
            },
          },
        },
      },
    });

    let contacts: any[] = [];
    try {
      const raw =
        geminiResponse.text?.replace(/```json\n?|```/g, "").trim() || "[]";
      contacts = JSON.parse(raw);
    } catch {
      contacts = [];
    }

    // Normalise and enforce isGeneric
    contacts = contacts
      .filter((c: any) => c.email || c.name)
      .map((c: any) => ({
        name: c.name || null,
        email: c.email || null,
        title: c.title || null,
        sourcePage: pageLabels.includes(c.sourcePage)
          ? c.sourcePage
          : "homepage",
        isGeneric: c.email ? isGenericEmail(c.email) : false,
      }));

    return res.json({ status: "done", contacts });
  } catch (err: any) {
    console.error("[enrich-lead]", err.message);
    return res.json({ status: "failed", contacts: [] });
  }
});
````

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server.ts
git commit -m "feat: add /api/enrich-lead endpoint (Firecrawl + Gemini)"
```

---

## Task 5: Server — `/api/verify-email`

**Files:**

- Modify: `server.ts`

- [ ] **Step 1: Add `dns` import** at the top of `server.ts`

```typescript
import { promises as dns } from "dns";
```

- [ ] **Step 2: Add the endpoint** before `startServer()`

```typescript
app.post("/api/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    // Syntax check
    const syntaxOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!syntaxOk) {
      return res.json({ status: "invalid" });
    }

    const domain = email.split("@")[1];

    // MX record check
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.json({ status: "invalid" });
      }
    } catch {
      return res.json({ status: "invalid" });
    }

    // Role-based check
    const local = email.split("@")[0].toLowerCase();
    const generic = GENERIC_EMAIL_PREFIXES.some(
      (p) => local === p || local.startsWith(p + "."),
    );

    return res.json({ status: generic ? "risky" : "valid" });
  } catch (err: any) {
    console.error("[verify-email]", err.message);
    return res.status(500).json({ error: "Verification failed" });
  }
});
```

> `GENERIC_EMAIL_PREFIXES` is defined in Task 4. Both endpoints share it.

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: add /api/verify-email endpoint (syntax + MX check)"
```

---

## Task 6: Server — `/api/send-email`

**Files:**

- Modify: `server.ts`

- [ ] **Step 1: Add nodemailer import** at the top of `server.ts`

```typescript
import nodemailer from "nodemailer";
```

- [ ] **Step 2: Add the endpoint** before `startServer()`

```typescript
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, toName, subject, body, leadId } = req.body;

    if (!to || !subject || !body) {
      return res
        .status(400)
        .json({ error: "to, subject, and body are required" });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
      process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(503).json({
        error:
          "SMTP not configured — add SMTP_HOST, SMTP_USER, SMTP_PASS to .env and restart the server",
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587"),
      secure: parseInt(SMTP_PORT || "587") === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      text: body,
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[send-email]", err.message);
    return res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server.ts
git commit -m "feat: add /api/send-email endpoint (nodemailer SMTP)"
```

---

## Task 7: `useEnrichment` Hook

**Files:**

- Create: `src/hooks/useEnrichment.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useState, useEffect } from "react";
import { db } from "../db";
import type { Contact, Enrichment, ContactRecord } from "../types";

export type EnrichmentState =
  | { status: "loading" }
  | { status: "done"; contacts: Contact[] }
  | { status: "failed" }
  | { status: "no_website" };

export function useEnrichment(domain: string | undefined, leadId: string) {
  const [state, setState] = useState<EnrichmentState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  const retry = async () => {
    if (domain) {
      const cached = await db.enrichments.get(domain);
      if (cached?.status === "failed") {
        await db.enrichments.delete(domain);
      }
    }
    setState({ status: "loading" });
    setRetryToken((t) => t + 1);
  };

  useEffect(() => {
    if (!domain) {
      setState({ status: "no_website" });
      return;
    }

    let cancelled = false;

    async function run() {
      setState({ status: "loading" });

      // Cache check
      const cached = await db.enrichments.get(domain!);
      if (cached) {
        if (!cancelled) {
          setState(
            cached.status === "done"
              ? { status: "done", contacts: cached.contacts }
              : { status: cached.status as "failed" | "no_website" },
          );
        }
        return;
      }

      // Fetch from server
      try {
        const res = await fetch("/api/enrich-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, leadId }),
        });
        const data = await res.json();

        if (cancelled) return;

        const enrichment: Enrichment = {
          domain: domain!,
          leadId,
          contacts: data.contacts || [],
          enrichedAt: Date.now(),
          status: data.status,
        };

        // Only cache non-transient failures so retry is possible
        if (data.status !== "failed") {
          await db.enrichments.put(enrichment);
        }

        // Write valid contacts to the unified contacts table
        const contactsToAdd: ContactRecord[] = (data.contacts || [])
          .filter((c: Contact) => c.email)
          .map((c: Contact) => ({
            id: crypto.randomUUID(),
            email: c.email!,
            name: c.name || undefined,
            title: c.title || undefined,
            leadId,
            domain: domain!,
            source: "enriched" as const,
            verificationStatus: "unverified" as const,
            createdAt: Date.now(),
          }));

        for (const record of contactsToAdd) {
          const exists = await db.contacts
            .where("email")
            .equals(record.email)
            .and((r) => r.domain === domain)
            .first();
          if (!exists) {
            await db.contacts.add(record);
          }
        }

        if (!cancelled) {
          setState(
            data.status === "done"
              ? { status: "done", contacts: data.contacts }
              : { status: data.status },
          );
        }
      } catch {
        if (!cancelled) setState({ status: "failed" });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [domain, leadId, retryToken]);

  return { state, retry };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEnrichment.ts
git commit -m "feat: add useEnrichment hook (cache-first, writes to Dexie contacts table)"
```

---

## Task 8: `useVerification` Hook

**Files:**

- Create: `src/hooks/useVerification.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect } from "react";
import { db } from "../db";

export function useVerification(leadId: string) {
  useEffect(() => {
    let cancelled = false;

    async function verifyPending() {
      const unverified = await db.contacts
        .where("leadId")
        .equals(leadId)
        .filter(
          (c) => c.verificationStatus === "unverified" && Boolean(c.email),
        )
        .toArray();

      for (const contact of unverified) {
        if (cancelled) break;
        try {
          const res = await fetch("/api/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: contact.email }),
          });
          const { status } = await res.json();
          if (!cancelled) {
            await db.contacts.update(contact.id, {
              verificationStatus: status,
            });
          }
        } catch {
          // Silently skip — contact stays "unverified"
        }
      }
    }

    verifyPending();
    return () => {
      cancelled = true;
    };
  }, [leadId]);
}
```

> `db.contacts.update()` triggers Dexie's reactivity. Any `useLiveQuery` reading from `contacts` for this lead will re-render with the updated badge status automatically.

- [ ] **Step 2: Verify TypeScript**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useVerification.ts
git commit -m "feat: add useVerification hook (background MX validation, updates Dexie)"
```

---

## Task 9: `ContactsPanel` Component

**Files:**

- Create: `src/components/ContactsPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Mail,
  Copy,
  RefreshCw,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
} from "lucide-react";
import { db } from "../db";
import type { EnrichmentState } from "../hooks/useEnrichment";
import type { ContactRecord } from "../types";

const BADGE = {
  valid: { icon: CheckCircle2, color: "text-emerald-400", label: "Verified" },
  risky: { icon: AlertCircle, color: "text-amber-400", label: "Risky" },
  invalid: { icon: XCircle, color: "text-rose-400", label: "Invalid" },
  unverified: { icon: Circle, color: "text-zinc-600", label: "Unverified" },
} as const;

function VerificationBadge({
  status,
}: {
  status: ContactRecord["verificationStatus"];
}) {
  const { icon: Icon, color, label } = BADGE[status];
  return <Icon size={11} className={color} title={label} />;
}

interface ContactsPanelProps {
  enrichmentState: EnrichmentState;
  leadId: string;
  onRetry: () => void;
  onEmailClick: (contact: ContactRecord) => void;
}

export function ContactsPanel({
  enrichmentState,
  leadId,
  onRetry,
  onEmailClick,
}: ContactsPanelProps) {
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [adding, setAdding] = useState(false);

  const contacts =
    useLiveQuery(
      () => db.contacts.where("leadId").equals(leadId).sortBy("createdAt"),
      [leadId],
    ) ?? [];

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email).catch(() => {});
  };

  const handleManualAdd = async () => {
    if (
      !manualEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualEmail.trim())
    )
      return;
    setAdding(true);
    const domain = manualEmail.split("@")[1] ?? "unknown";
    await db.contacts.add({
      id: crypto.randomUUID(),
      email: manualEmail.trim(),
      name: manualName.trim() || undefined,
      leadId,
      domain,
      source: "manual",
      verificationStatus: "unverified",
      createdAt: Date.now(),
    });
    setManualEmail("");
    setManualName("");
    setAdding(false);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
          Contacts
        </h4>
        {enrichmentState.status === "loading" && (
          <div className="flex items-center gap-1 text-zinc-500">
            <Loader2 size={10} className="animate-spin" />
            <span className="text-[9px] uppercase tracking-widest">
              Scanning site
            </span>
          </div>
        )}
        {enrichmentState.status === "done" && contacts.length > 0 && (
          <span className="text-[9px] text-emerald-400 uppercase tracking-widest">
            {contacts.length} found
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Loading skeleton */}
        {enrichmentState.status === "loading" && contacts.length === 0 && (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 animate-pulse"
              >
                <div className="h-2.5 bg-white/10 rounded w-2/5" />
                <div className="h-2 bg-white/5 rounded w-3/5" />
              </div>
            ))}
          </div>
        )}

        {/* Contact rows — sourced from Dexie (reactively updated) */}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-3 bg-white/5 rounded-xl border border-white/5 space-y-1 ${
              contact.source === "manual" ? "border-indigo-500/20" : ""
            } ${!contact.name ? "opacity-70" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {contact.name && (
                  <p className="text-xs font-semibold text-white truncate">
                    {contact.name}
                  </p>
                )}
                {contact.title && (
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                    {contact.title}
                    {contact.source === "manual" && " · manual"}
                  </p>
                )}
                {contact.email && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <VerificationBadge status={contact.verificationStatus} />
                    <p className="text-[10px] text-indigo-300 truncate">
                      {contact.email}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {contact.email && (
                  <>
                    <button
                      onClick={() => handleCopy(contact.email)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                      title="Copy email"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      onClick={() => onEmailClick(contact)}
                      className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-zinc-500 hover:text-indigo-300 transition-colors"
                      title="Compose email"
                    >
                      <Mail size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty / failed state — show manual entry */}
        {(enrichmentState.status === "done" ||
          enrichmentState.status === "failed" ||
          enrichmentState.status === "no_website") && (
          <div className="space-y-2">
            {contacts.length === 0 && (
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center py-2">
                {enrichmentState.status === "no_website"
                  ? "No website to scan"
                  : "None found publicly"}
              </p>
            )}
            {/* Manual entry */}
            <div className="p-2 bg-white/3 border border-white/5 rounded-xl space-y-1.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
                Add manually
              </p>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full bg-white/5 text-white text-xs px-2 py-1.5 rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-700"
              />
              <div className="flex gap-1.5">
                <input
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                  placeholder="email@example.com"
                  className="flex-1 bg-white/5 text-white text-xs px-2 py-1.5 rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-700"
                />
                <button
                  onClick={handleManualAdd}
                  disabled={adding}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
            {/* Retry link — only shown on failure */}
            {enrichmentState.status === "failed" && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors mx-auto"
              >
                <RefreshCw size={9} />
                Retry scan
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactsPanel.tsx
git commit -m "feat: add ContactsPanel component (3 states, manual entry, verification badges)"
```

---

## Task 10: `ComposeDrawer` Component

**Files:**

- Create: `src/components/ComposeDrawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "../db";
import type { ContactRecord } from "../types";

interface ComposeDrawerProps {
  isOpen: boolean;
  contact: ContactRecord | null;
  leadId: string;
  pitchHook: string;
  onClose: () => void;
}

export function ComposeDrawer({
  isOpen,
  contact,
  leadId,
  pitchHook,
  onClose,
}: ComposeDrawerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!contact?.email || !subject.trim() || !body.trim()) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.email,
          toName: contact.name,
          subject: subject.trim(),
          body: body.trim(),
          leadId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Send failed");
        return;
      }

      await db.sent_emails.add({
        id: crypto.randomUUID(),
        toEmail: contact.email,
        toName: contact.name,
        subject: subject.trim(),
        body: body.trim(),
        leadId,
        sentAt: Date.now(),
      });

      setStatus("sent");
      setSubject("");
      setBody("");
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Network error");
    }
  };

  const insertPitchHook = () => {
    setBody((prev) => (prev ? `${prev}\n\n${pitchHook}` : pitchHook));
  };

  if (!isOpen || !contact) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-zinc-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Compose Email</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
              To: {contact.name ? `${contact.name} — ` : ""}
              {contact.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your subject line..."
              className="w-full bg-white/5 text-white text-sm px-3 py-2 rounded-xl border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                Body
              </label>
              <button
                onClick={insertPitchHook}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
              >
                + Insert pitch hook
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your email..."
              className="w-full bg-white/5 text-white text-sm px-3 py-2 rounded-xl border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600 resize-none"
            />
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          {status === "sent" && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 size={14} />
              Email sent and logged.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSend}
            disabled={status === "sending" || !subject.trim() || !body.trim()}
            className="w-full accent-gradient py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {status === "sending" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {status === "sending" ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ComposeDrawer.tsx
git commit -m "feat: add ComposeDrawer component (nodemailer send, logs to sent_emails)"
```

---

## Task 11: Wire Enrichment into `MainView` (`App.tsx`)

**Files:**

- Modify: `src/App.tsx`

This task makes four changes to `App.tsx`:

1. Add new imports
2. Add website URL link in the lead header
3. Replace the right column with `ContactsPanel` on top + AI Projection below
4. Add `ComposeDrawer` at the component level

- [ ] **Step 1: Add imports** near the top of `App.tsx` (after existing imports)

```tsx
import { useEnrichment } from "./hooks/useEnrichment";
import { useVerification } from "./hooks/useVerification";
import { ContactsPanel } from "./components/ContactsPanel";
import { ComposeDrawer } from "./components/ComposeDrawer";
import type { ContactRecord } from "./types";
```

- [ ] **Step 2: Update `MainView` function signature and body**

Find the `function MainView` definition. Replace it entirely with the version below. The key changes are:

- `domain` derived from `lead.website_url`
- `useEnrichment` and `useVerification` called at the top
- `composeContact` state for the drawer
- Website URL link added to the header
- Right column reordered: `ContactsPanel` first, then AI Projection, then map

```tsx
function MainView({
  lead,
  location,
}: {
  lead: Lead | null;
  location?: google.maps.LatLngLiteral;
}) {
  const domain = lead?.website_url
    ? (() => {
        try {
          const u = lead.website_url.startsWith("http")
            ? lead.website_url
            : `https://${lead.website_url}`;
          return new URL(u).hostname.replace(/^www\./, "");
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const { state: enrichmentState, retry } = useEnrichment(
    domain,
    lead?.lead_id ?? "",
  );
  useVerification(lead?.lead_id ?? "");

  const [composeContact, setComposeContact] = useState<ContactRecord | null>(
    null,
  );

  const saved = useLiveQuery(
    () => (lead ? db.leads.get(lead.lead_id) : undefined),
    [lead?.lead_id],
  );

  const handleSave = async () => {
    if (!lead) return;
    if (saved) {
      await db.leads.delete(lead.lead_id);
    } else {
      await db.leads.add({ ...lead, savedAt: Date.now() });
    }
  };

  if (!lead) {
    return (
      <div className="flex-1 glass rounded-2xl flex items-center justify-center p-8 text-center">
        <div>
          <Sparkles size={28} className="mx-auto mb-3 opacity-10" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Select a lead to view details
          </p>
        </div>
      </div>
    );
  }

  const hasUrl = Boolean(lead.website_url);

  return (
    <>
      <ComposeDrawer
        isOpen={Boolean(composeContact)}
        contact={composeContact}
        leadId={lead.lead_id}
        pitchHook={lead.pitch_hook_angle}
        onClose={() => setComposeContact(null)}
      />

      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-w-0">
        <div className="bg-white/5 border-b border-white/5 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="accent-gradient text-[10px] font-black uppercase px-2 py-0.5 rounded text-white">
                  Score: {lead.lead_score}
                </span>
                <span className="text-zinc-600 text-[10px] font-mono uppercase">
                  {lead.lead_id}
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white truncate">
                {lead.business_name}
              </h1>
              <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                <MapPin size={12} className="text-indigo-400 shrink-0" />
                {lead.contact_details.address}
              </p>
              {lead.website_url && (
                <a
                  href={
                    lead.website_url.startsWith("http")
                      ? lead.website_url
                      : `https://${lead.website_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Globe size={10} />
                  {domain}
                </a>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
                  saved
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {saved ? "Saved" : "Save"}
              </button>
              {hasUrl ? (
                <button
                  onClick={() => openInCustomizer(lead)}
                  className="accent-gradient px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:opacity-90 active:scale-95"
                >
                  Generate Demo <Sparkles size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider border border-zinc-700 px-3 py-2 rounded-lg">
                  <ShieldAlert size={12} />
                  No URL — manual entry
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column — Pitch Intel + Digital Status */}
            <div className="space-y-4">
              <section>
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2">
                  Pitch Intel
                </h4>
                <div className="bg-white/5 border-l-2 border-indigo-500 p-3 rounded-r-xl">
                  <p className="text-zinc-300 text-sm leading-relaxed italic">
                    "{lead.pitch_hook_angle}"
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                  Digital Status
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1 tracking-wider">
                      Status
                    </span>
                    <span className="font-semibold text-zinc-200 uppercase text-xs">
                      {lead.current_digital_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1 tracking-wider">
                      SEO Gap
                    </span>
                    <span className="font-semibold text-zinc-200 text-xs underline underline-offset-4 decoration-indigo-500/50">
                      {
                        lead.ai_demo_generation_parameters
                          .suggested_primary_keyword
                      }
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column — Contacts (top) + AI Projection + Map */}
            <div className="space-y-4">
              <ContactsPanel
                enrichmentState={enrichmentState}
                leadId={lead.lead_id}
                onRetry={retry}
                onEmailClick={setComposeContact}
              />

              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                  AI Projection
                </h4>
                <div className="bg-white/5 p-3 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Framework
                    </span>
                    <span className="mono text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                      {lead.ai_demo_generation_parameters.framework_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.ai_demo_generation_parameters.recommended_placeholders.map(
                      (p, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-400"
                        >
                          {p}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </section>

              <section className="h-36 bg-white/5 rounded-xl border border-white/5 overflow-hidden relative">
                {location ? (
                  <Map
                    defaultCenter={location}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    disableDefaultUI
                    gestureHandling="none"
                    internalUsageAttributionIds={[
                      "gmp_mcp_codeassist_v1_aistudio",
                    ]}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <AdvancedMarker position={location}>
                      <Pin
                        background="#6366f1"
                        glyphColor="#fff"
                        borderColor="#6366f1"
                      />
                    </AdvancedMarker>
                  </Map>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    Satellite Link Offline
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Remove the old `MainView` implementation** — delete everything between the old `function MainView` opening brace and its closing `}` before the `SavedLeadCard` function. The new version above replaces it completely.

- [ ] **Step 4: Verify TypeScript**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire ContactsPanel, ComposeDrawer, and useVerification into MainView"
```

---

## Task 12: Bulk Enrichment + Contact Count Badge (`App.tsx`)

**Files:**

- Modify: `src/App.tsx`

This task adds two things to `SavedLeadsView` and `SavedLeadCard`:

1. A contact count badge on each `SavedLeadCard`
2. "Enrich All Saved" button with progress + cancel in `SavedLeadsView`

- [ ] **Step 1: Add contact count to `SavedLeadCard`**

Find the `SavedLeadCard` function. Add a `useLiveQuery` for the contact count and render a badge in the card header. Insert this after the opening of the function body, before the `dotColor` constant:

```tsx
const contactCount =
  useLiveQuery(
    () => db.contacts.where("leadId").equals(lead.lead_id).count(),
    [lead.lead_id],
  ) ?? 0;
```

Then add the badge inside the card, next to the lead score (after the `{lead.lead_score}` span):

```tsx
{
  contactCount > 0 && (
    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5 font-mono">
      {contactCount}c
    </span>
  );
}
```

- [ ] **Step 2: Add bulk enrichment state and logic to `SavedLeadsView`**

Replace the entire `SavedLeadsView` function with this version:

```tsx
function SavedLeadsView() {
  const leads =
    useLiveQuery(() => db.leads.orderBy("savedAt").reverse().toArray()) ?? [];

  const [bulkProgress, setBulkProgress] = useState<{
    running: boolean;
    done: number;
    total: number;
  } | null>(null);
  const cancelRef = useRef(false);

  const handleDelete = async (id: string) => {
    await db.leads.delete(id);
  };

  const runBulkEnrichment = async () => {
    const withUrl = leads.filter((l) => l.website_url);
    const pending: typeof withUrl = [];

    for (const lead of withUrl) {
      try {
        const u = lead.website_url!.startsWith("http")
          ? lead.website_url!
          : `https://${lead.website_url}`;
        const domain = new URL(u).hostname.replace(/^www\./, "");
        const cached = await db.enrichments.get(domain);
        if (!cached || cached.status === "failed") {
          pending.push(lead);
        }
      } catch {
        // skip malformed URLs
      }
    }

    if (pending.length === 0) return;

    cancelRef.current = false;
    setBulkProgress({ running: true, done: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      if (cancelRef.current) break;

      const lead = pending[i];
      try {
        const u = lead.website_url!.startsWith("http")
          ? lead.website_url!
          : `https://${lead.website_url}`;
        const domain = new URL(u).hostname.replace(/^www\./, "");

        const res = await fetch("/api/enrich-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, leadId: lead.lead_id }),
        });
        const data = await res.json();

        if (data.status !== "failed") {
          await db.enrichments.put({
            domain,
            leadId: lead.lead_id,
            contacts: data.contacts || [],
            enrichedAt: Date.now(),
            status: data.status,
          });

          for (const c of data.contacts || []) {
            if (!c.email) continue;
            const exists = await db.contacts
              .where("email")
              .equals(c.email)
              .and((r: { domain: string }) => r.domain === domain)
              .first();
            if (!exists) {
              await db.contacts.add({
                id: crypto.randomUUID(),
                email: c.email,
                name: c.name || undefined,
                title: c.title || undefined,
                leadId: lead.lead_id,
                domain,
                source: "enriched",
                verificationStatus: "unverified",
                createdAt: Date.now(),
              });
            }
          }
        }
      } catch {
        // Continue to next lead on error
      }

      setBulkProgress({ running: true, done: i + 1, total: pending.length });

      if (i < pending.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setBulkProgress((prev) => (prev ? { ...prev, running: false } : null));
  };

  const cancelBulk = () => {
    cancelRef.current = true;
  };

  const unenrichedCount = leads.filter((l) => l.website_url).length;

  return (
    <div className="flex-1 space-y-3">
      {/* Bulk enrichment header */}
      {unenrichedCount > 0 && (
        <div className="glass rounded-xl px-4 py-3 flex items-center justify-between">
          {bulkProgress ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                {bulkProgress.running && (
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                )}
                <span>
                  {bulkProgress.running
                    ? `Enriching ${bulkProgress.done} / ${bulkProgress.total} leads…`
                    : `Enriched ${bulkProgress.done} leads`}
                </span>
              </div>
              {bulkProgress.running && (
                <button
                  onClick={cancelBulk}
                  className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {unenrichedCount} saved leads with websites
            </p>
          )}
          {!bulkProgress?.running && (
            <button
              onClick={runBulkEnrichment}
              className="px-3 py-1.5 accent-gradient rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles size={10} />
              Enrich All Saved
            </button>
          )}
        </div>
      )}

      {/* Lead cards */}
      {leads.length === 0 ? (
        <div className="flex-1 glass rounded-2xl flex items-center justify-center p-8 text-center">
          <div>
            <Database size={28} className="mx-auto mb-3 opacity-10" />
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              No saved leads yet
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Hit "Save Lead" on any result to store it here
            </p>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {leads.map((lead) => (
              <SavedLeadCard
                key={lead.lead_id}
                lead={lead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

> This replaces the entire previous `SavedLeadsView`. The `useRef` import must be present in the file — it's already imported in `App.tsx` from the initial setup. If not, add `useRef` to the React import at the top.

- [ ] **Step 3: Add `useRef` to React imports** if not already present

Find: `import { useState, useEffect, useRef, ReactNode } from "react";`
Verify `useRef` is included. It was present in the original file — no change needed.

- [ ] **Step 4: Add `Loader2` to the imports** if not already imported from lucide-react — it is already imported.

- [ ] **Step 5: Verify TypeScript**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add bulk enrichment with progress/cancel and contact count badge on saved leads"
```

---

## Task 13: Build and Smoke Test

- [ ] **Step 1: Build for production**

```bash
npm run build
```

Expected: no TypeScript errors, Vite build succeeds.

- [ ] **Step 2: Restart the service**

```bash
systemctl --user restart pulse-lead-scout.service
sleep 2
systemctl --user status pulse-lead-scout.service --no-pager
```

Expected: `Active: active (running)`.

- [ ] **Step 3: Open the app**

Open `http://localhost:3001` in Chromium (or click the desktop launcher).

- [ ] **Step 4: Test on-demand enrichment**

1. Run a search (e.g. "Plumbers in Leicester")
2. Click a lead that has a website URL
3. Verify: website URL link appears in the header
4. Verify: right column shows "Scanning site…" skeleton
5. Wait for enrichment to complete
6. Verify: contacts appear (or "None found publicly" empty state)
7. Verify: verification badges appear and update (grey → green/amber)

- [ ] **Step 5: Test compose drawer**

1. Click the mail icon on any contact with an email
2. Verify: drawer slides in from the right
3. Click "Insert pitch hook" — verify it inserts into the body
4. (If SMTP is configured) send an email and verify it saves to sent_emails

- [ ] **Step 6: Test manual contact entry**

1. Go to a `NO_WEBSITE` lead (no URL)
2. Verify: contacts slot shows "No website to scan" and the manual entry form
3. Add a contact manually
4. Verify: it appears in the contacts list immediately

- [ ] **Step 7: Test Saved Leads view**

1. Save 2-3 leads
2. Switch to Saved Leads tab
3. Verify: contact count badges show on saved lead cards
4. Click "Enrich All Saved"
5. Verify: progress counter increments, enrichment runs

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: data enrichment — Firecrawl+Gemini pipeline, contacts, compose, bulk enrich

- On-demand enrichment fires on lead click, cached in Dexie
- Contacts panel with loading/found/empty states and verification badges
- Email compose drawer with pitch hook insert and nodemailer send
- Manual contact entry saved to unified contacts table
- Bulk enrichment for all saved leads with progress + cancel
- Contact count badge on saved lead cards"
```
