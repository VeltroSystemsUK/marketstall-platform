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
- "Email" button is a stub in this sub-project — it wires to the Email Client in sub-project 3

**None found / failed:**

- Clean empty state with "None found publicly" label
- Manual email entry input (stored directly in the enrichment record)
- "↺ Retry scan" link — clears the cached failed result and re-fires the endpoint

### No changes to:

- Lead search / Gemini analysis pipeline
- Sidebar / LeadRow component
- Saved Leads view
- Settings modal

---

## New Dependency

```
@mendable/firecrawl-js
```

Added to `package.json` dependencies. Used server-side only. No frontend bundle impact.

---

## Out of Scope (future sub-projects)

- Sending emails from the contacts slot → Email Client (sub-project 3)
- Manually adding contacts to a persistent contact record → CRM Core (sub-project 2)
- Bulk enrichment across all saved leads → Agent System (sub-project 6)
- Contact verification / bounce checking → Email Marketing (sub-project 4)
