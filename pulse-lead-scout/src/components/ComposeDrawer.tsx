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
