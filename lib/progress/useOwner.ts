"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { progressClient } from "./client";

/* The one account that may reorder projects. The database enforces the same
   email in its row policy; this copy only decides which UI to show. */
export const OWNER_EMAIL = "frankfu1747@gmail.com";

export function useOwner() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = progressClient();
    if (!db) {
      setReady(true);
      return;
    }
    let alive = true;
    db.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });
    const { data } = db.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  /* shouldCreateUser: false — sign-ups are off; only the existing owner
     account can receive a link. The link brings the browser back to the
     edit view, on whichever host (live or local dev) asked for it. */
  const sendLink = useCallback(async (email: string) => {
    const db = progressClient();
    if (!db) throw new Error("Progress is not configured on this build.");
    const { error } = await db.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/progress?edit` }
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await progressClient()?.auth.signOut();
  }, []);

  return {
    ready,
    email: session?.user.email ?? null,
    isOwner: session?.user.email === OWNER_EMAIL,
    sendLink,
    signOut
  };
}
