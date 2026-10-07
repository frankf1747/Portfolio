"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { useOwner } from "@/lib/progress/useOwner";

type Owner = ReturnType<typeof useOwner>;

/* Shown only at /progress?edit. Signs the owner in by emailed link, then
   says what reordering does. Visitors never reach this view by accident:
   nothing on the public page links to it. */
export default function OwnerBar({ owner, saving, error }: { owner: Owner; saving: boolean; error: string | null }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!owner.ready) return null;

  if (!owner.email) {
    const submit = async (e: FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setSendError(null);
      try {
        await owner.sendLink(email.trim());
        setSent(true);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    };
    return (
      <div className="small pg-owner" role="region" aria-label="Owner sign-in">
        {sent ? (
          <p>CHECK YOUR EMAIL FOR THE LOGIN LINK. IT BRINGS YOU BACK HERE, READY TO REORDER.</p>
        ) : (
          <form className="pg-owner__form" onSubmit={submit}>
            <label htmlFor="pg-owner-email">OWNER SIGN-IN</label>
            <input
              id="pg-owner-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
            <button className="link-b" type="submit" disabled={busy}>
              {busy ? "SENDING…" : "SEND LOGIN LINK"}
            </button>
          </form>
        )}
        {sendError && <p className="pg-owner__error">{sendError.toUpperCase()}</p>}
      </div>
    );
  }

  return (
    <div className="small pg-owner" role="region" aria-label="Reorder projects">
      {owner.isOwner ? (
        <p>
          REORDERING: DRAG A CARD BY ITS HANDLE, OR USE ↑ ↓.{" "}
          <span aria-live="polite">{saving ? "SAVING…" : error ? "" : "SAVED AS YOU GO."}</span>
        </p>
      ) : (
        <p>SIGNED IN AS {owner.email.toUpperCase()}, WHICH IS NOT THE OWNER ACCOUNT.</p>
      )}
      {error && <p className="pg-owner__error">{error.toUpperCase()}</p>}
      <p className="pg-owner__actions">
        <Link className="link-b" href="/progress">
          DONE
        </Link>
        <button className="link-b" type="button" onClick={owner.signOut}>
          SIGN OUT
        </button>
      </p>
    </div>
  );
}
