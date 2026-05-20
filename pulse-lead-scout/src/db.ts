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
