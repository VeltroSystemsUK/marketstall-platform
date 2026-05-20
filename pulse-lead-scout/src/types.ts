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
