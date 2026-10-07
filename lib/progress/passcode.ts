"use client";

import { useCallback, useEffect, useState } from "react";
import { progressClient } from "./client";

/* The owner unlocks reordering at /progress?edit with a passcode. The site
   never knows the passcode: the database checks it (check_owner_passcode,
   reorder_projects) against a stored hash, and locks after repeated wrong
   tries. Once accepted it is kept for this tab only (sessionStorage), so
   each move can send it without asking again. */

const KEY = "pg-owner-passcode";

export function verdictMessage(verdict: string): string | null {
  switch (verdict) {
    case "ok":
      return null;
    case "wrong":
      return "Wrong passcode.";
    case "locked":
      return "Too many wrong tries. Wait 10 minutes, then try again.";
    case "bad order":
      return "That order didn't match the current projects. Reload and try again.";
    default:
      return verdict;
  }
}

export async function callVerdict(fn: string, args: Record<string, unknown>): Promise<string> {
  const db = progressClient();
  if (!db) return "Progress is not configured on this build.";
  const { data, error } = await db.rpc(fn, args);
  if (error) return error.message;
  return String(data);
}

export function usePasscode() {
  const [passcode, setPasscode] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPasscode(sessionStorage.getItem(KEY));
    } catch {
      /* storage blocked: the owner just types it again */
    }
  }, []);

  /* Resolves to null when accepted, or the message to show. */
  const unlock = useCallback(async (code: string): Promise<string | null> => {
    const verdict = await callVerdict("check_owner_passcode", { p_passcode: code });
    const message = verdictMessage(verdict);
    if (!message) {
      setPasscode(code);
      try {
        sessionStorage.setItem(KEY, code);
      } catch {
        /* kept in memory for this page instead */
      }
    }
    return message;
  }, []);

  const lock = useCallback(() => {
    setPasscode(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nothing stored */
    }
  }, []);

  return { passcode, unlock, lock };
}
