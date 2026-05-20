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
