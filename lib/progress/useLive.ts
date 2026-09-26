"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { progressClient } from "./client";
import { startLive, type LiveState, type LiveStatus } from "./live";

export type { LiveState, LiveStatus };

/* Gives every effect run its own topic, so a dropped-and-recreated channel
   from a previous run can never be confused with the current one. */
let runId = 0;

/* Loads once, then reloads whenever any progress table changes; see live.ts
   for the reload/reconnect behaviour. `live` reflects the realtime
   connection, separately from `state`, which never regresses once it has
   data: a failed reload or a dropped socket keeps showing what's on screen. */
export function useLive<T>(load: (db: SupabaseClient) => Promise<T>, key: string) {
  const [state, setState] = useState<LiveState<T>>({ status: "loading" });
  const [live, setLive] = useState<LiveStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    setState({ status: "loading" });
    setLive("connecting");

    const db = progressClient();
    if (!db) {
      setState({ status: "error", message: "Progress is not configured on this build." });
      return;
    }

    const topic = `progress:${key}:${++runId}`;
    return startLive(db, () => loadRef.current(db), setState, setLive, topic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry, live };
}

/* Re-renders every minute so "5m ago" keeps counting. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
