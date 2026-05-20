# Data Enrichment — Design Spec

**Project:** Pulse Lead Scout  
**Sub-project:** 1 of 6 (Data Enrichment)  
**Date:** 2026-05-20  
**Status:** Approved

---

## Overview

When a user clicks a lead in the sidebar, the app fires a background enrichment pipeline that scrapes the prospect's website via Firecrawl and passes the content to Gemini for structured contact extraction. Results are cached locally in IndexedDB so the same domain is never re-fetched. Contacts appear in the right column of the lead detail view alongside the existing AI Projection panel.

This is intentionally scoped to contact extraction only. Pipeline stage, notes, and activity logging belong to the CRM Core sub-project (sub-project 2).

---

## Architecture

```
User clicks lead
      │
      ▼
Check Dexie enrichments table (by domain)
      │
      ├── Cache hit ──────────────────────────────► Render contacts immediately
      │
      └── Cache miss
            │
            ▼
      Show loading skeleton in contacts slot
            │
            ▼
      POST /api/enrich-lead  { domain, leadId }
            │
            ▼
      Firecrawl scrapes in parallel:
        • https://{domain}
        • https://{domain}/contact
        • https://{domain}/about
      (404s silently dropped)
            │
            ▼
      Concatenate markdown, trim to ~8000 chars
            │
            ▼
      Gemini structured extraction
      (name, email, title, sourcePage per contact)
            │
            ▼
      Store result in Dexie enrichments table
            │
            ▼
      Render contacts in right column
```

**One new environment variable:** `FIRECRAWL_API_KEY` — already configured in your Claude MCP settings (`fc-b8bd...`), just needs copying into `.env`. The existing `GEMINI_API_KEY` is reused as-is. Firecrawl is called via `@mendable/firecrawl-js` SDK (one new server-side dependency).

---

## Data Model

### Dexie version bump: 1 → 2

New table added alongside existing `leads` table. No migration required — Dexie handles additive version bumps automatically.

```typescript
// src/db.ts additions

interface Contact {
  name?: string; // person's name if found on site
  email?: string; // email address
  title?: string; // job title or role if stated
  sourcePage: string; // 'homepage' | 'contact' | 'about'
  isGeneric: boolean; // true for info@, enquiries@, etc.
}

interface Enrichment {
  domain: string; // primary key — e.g. "smithsonsplumbing.co.uk"
  leadId: string; // lead_id this was first fetched for
  contacts: Contact[]; // empty array if none found
  enrichedAt: number; // timestamp
  status: "done" | "failed" | "no_website";
}

// Dexie version 2 stores:
// leads: 'lead_id, savedAt, business_name, lead_score'   (unchanged)
// enrichments: 'domain, leadId, enrichedAt'              (new)
```

**`isGeneric` flag:** Contacts with generic/role-based emails (info@, admin@, sales@, enquiries@, hello@) are stored with `isGeneric: true` and rendered dimmed in the UI. Named contacts render at full opacity.

---

## Server Endpoint

### `POST /api/enrich-lead`

Added to `server.ts` following the same pattern as `/api/analyze-leads`.

**Request:**

```json
{ "domain": "smithsonsplumbing.co.uk", "leadId": "plmb-a1b2" }
```

**Response (success):**

```json
{
  "status": "done",
  "contacts": [
    {
      "name": "James Smith",
      "email": "james@smithsonsplumbing.co.uk",
      "title": "Director",
      "sourcePage": "about",
      "isGeneric": false
    },
    {
      "name": null,
      "email": "info@smithsonsplumbing.co.uk",
      "title": null,
      "sourcePage": "contact",
      "isGeneric": true
    }
  ]
}
```

**Response (no website / failed):**

```json
{ "status": "no_website", "contacts": [] }
{ "status": "failed", "contacts": [] }
```

**Gemini prompt (structured output):**

```
You are extracting contact information from scraped website content.
Return a JSON array of contacts. For each contact include:
  - name (string or null)
  - email (string or null)
  - title (string or null)
  - sourcePage (one of: "homepage", "contact", "about")
  - isGeneric (true if email is role-based: info@, admin@, sales@, enquiries@, hello@, support@)

Return only contacts explicitly stated on the page. Do not infer or guess.
If no contacts are found, return an empty array [].
```

**Error handling:**

- Domain missing from request → 400
- Firecrawl returns no pages (dead site, all 404) → `status: 'failed'`, empty contacts, still cached
- Gemini returns no contacts → `status: 'done'`, empty array (not an error — cached normally)
- Gemini or Firecrawl throws → `status: 'failed'`, not cached (frontend shows retry)

---

## UI Changes

### Lead header

The `website_url` field is already present on leads but unused in the UI. It will now appear in the header below the business name:

```
Smith & Sons Plumbing
🌐 smithsonsplumbing.co.uk          ← new, links to the site
```

Styled as a small indigo link. Only shown when `website_url` is present.

### Right column — contacts slot

Contacts slot sits at the top of the right column. AI Projection moves below it. Three states:

**Loading:** Two skeleton rows with a "Scanning site…" pulse indicator appear immediately on lead click.

**Contacts found:**

- Named contacts: full opacity, name + title + source page + email, Copy and Email buttons
- Generic contacts: 70% opacity, email only (no name), Copy button only (Email button greyed)
- "Email" button opens a compose drawer (see Email Compose section below)
- Each contact shows a verification badge (see Contact Verification section below)

**None found / failed:**

- Clean empty state with "None found publicly" label
- Manual email entry input (stored directly in the enrichment record)
- "↺ Retry scan" link — clears the cached failed result and re-fires the endpoint

### No changes to:

- Lead search / Gemini analysis pipeline
- Sidebar / LeadRow component
- Settings modal

---

## Email Compose

When the "Email" button is clicked on a contact, a compose drawer slides in from the right (over the lead detail view, not a modal). It pre-fills:

- **To:** contact email address
- **Subject:** blank (user fills in)
- **Body:** blank, with the lead's `pitch_hook_angle` available as a one-click insert

Sending uses `nodemailer` on the server via a new `POST /api/send-email` endpoint. The user's outbound SMTP credentials (host, port, user, pass) are stored in `.env` and configured once. Sent emails are stored in a new Dexie `sent_emails` table (see Data Model addition below).

The compose drawer is the foundation for the full Email Client in sub-project 3 — same component, same endpoint, same sent log.

**New Dexie table — `sent_emails`:**

```typescript
interface SentEmail {
  id: string; // uuid
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  leadId: string; // which lead this was sent for
  sentAt: number;
}
// Indexed on: id, sentAt, leadId
```

**New env vars for SMTP:**

```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=   # e.g. shaun@veltro.co.uk
```

---

## Manual Contacts

When no contacts are found (or alongside found ones), the user can manually enter a contact. Manual entries are saved to a dedicated Dexie `contacts` table — not just in the enrichment record — making them persistent and searchable across leads.

**New Dexie table — `contacts`:**

```typescript
interface ContactRecord {
  id: string; // uuid
  email: string;
  name?: string;
  title?: string;
  phone?: string;
  leadId: string; // which lead this contact belongs to
  domain: string; // prospect's domain
  source: "enriched" | "manual";
  verificationStatus: "unverified" | "valid" | "risky" | "invalid";
  createdAt: number;
}
// Indexed on: id, leadId, domain, email
```

Enrichment results are also written here (in addition to the `enrichments` cache), giving one unified contacts store. This table becomes the foundation for CRM Core (sub-project 2).

The Saved Leads view gains a contact count badge on each saved lead card, pulling from this table.

---

## Bulk Enrichment

A **"Enrich All Saved"** button appears in the Saved Leads view header. It:

1. Fetches all saved leads from Dexie that do not yet have a cached enrichment result
2. Runs enrichment sequentially (one at a time, 1.5s delay between requests to avoid rate-limiting Firecrawl)
3. Shows a progress indicator: "Enriching 3 / 12 leads…"
4. Can be cancelled mid-run

Results are stored in the same `enrichments` and `contacts` tables as on-demand enrichment. Already-enriched leads are skipped.

---

## Contact Verification

After enrichment (both on-demand and bulk), each contact email is automatically verified via a new `POST /api/verify-email` endpoint. Verification runs in the background after contacts are rendered — the badge updates in place when the result comes back.

**Verification checks (server-side):**

1. Syntax validation (RFC 5322)
2. DNS MX record lookup — confirms the domain accepts email
3. Role-based detection (info@, admin@, sales@, etc.) — already flagged by `isGeneric`

No SMTP handshake in v1 (avoids being flagged as a scanner). Verification result cached in the `contacts` table as `verificationStatus`.

**Badge display:**

- `valid` → green dot ✓
- `risky` → amber dot (role-based, or MX found but uncertain)
- `invalid` → red dot ✗ (bad syntax or no MX record)
- `unverified` → grey dot (pending)

**New server endpoint:** `POST /api/verify-email` — `{ email: string }` → `{ status: 'valid' | 'risky' | 'invalid' }`

---

## New Dependencies

```
@mendable/firecrawl-js   — website scraping (server-side only)
nodemailer               — SMTP email sending (server-side only)
uuid                     — generating contact and email IDs
```

All server-side only. No frontend bundle impact.

---

## Dexie Version Summary

| Version       | Tables added                             |
| ------------- | ---------------------------------------- |
| 1 (existing)  | `leads`                                  |
| 2 (this spec) | `enrichments`, `contacts`, `sent_emails` |
