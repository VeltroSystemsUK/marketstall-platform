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
