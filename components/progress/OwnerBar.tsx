"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

/* Shown only at /progress?edit. Asks for the owner passcode, then says what
   reordering does. Nothing on the public page links here. */
export default function OwnerBar({
  unlocked,
  unlock,
  lock,
  saving,
  error
}: {
  unlocked: boolean;
  unlock: (code: string) => Promise<string | null>;
  lock: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!unlocked) {
    const submit = async (e: FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setMessage(await unlock(code.trim()));
      setBusy(false);
      setCode("");
    };
    return (
      <div className="small pg-owner" role="region" aria-label="Owner passcode">
        <form className="pg-owner__form" onSubmit={submit}>
          <label htmlFor="pg-owner-code">OWNER PASSCODE</label>
          <input
            id="pg-owner-code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="link-b" type="submit" disabled={busy}>
            {busy ? "CHECKING…" : "UNLOCK"}
          </button>
        </form>
        {message && <p className="pg-owner__error">{message.toUpperCase()}</p>}
      </div>
    );
  }

  return (
    <div className="small pg-owner" role="region" aria-label="Reorder projects">
      <p>
        REORDERING: DRAG A CARD BY ITS HANDLE, OR USE ↑ ↓.{" "}
        <span aria-live="polite">{saving ? "SAVING…" : error ? "" : "SAVED AS YOU GO."}</span>
      </p>
      {error && <p className="pg-owner__error">{error.toUpperCase()}</p>}
      <p className="pg-owner__actions">
        <Link className="link-b" href="/progress">
          DONE
        </Link>
        <button className="link-b" type="button" onClick={lock}>
          LOCK
        </button>
      </p>
    </div>
  );
}
