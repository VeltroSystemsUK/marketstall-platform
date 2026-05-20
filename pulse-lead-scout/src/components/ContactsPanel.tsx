import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Mail,
  Copy,
  RefreshCw,
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
  return (
    <span title={label}>
      <Icon size={11} className={color} />
    </span>
  );
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
