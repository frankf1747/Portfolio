"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { progressClient } from "./client";

export type LiveState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

const TABLES = ["projects", "milestones", "updates"] as const;

/* Loads once, then reloads whenever any progress table changes. One tool call
   fires several events (the row, then the trigger touching the project), so
   reloads are debounced into one. A failed reload keeps the data on screen. */
export function useLive<T>(load: (db: SupabaseClient) => Promise<T>, key: string) {
  const [state, setState] = useState<LiveState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const db = progressClient();
    if (!db) {
      setState({ status: "error", message: "Progress is not configured on this build." });
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () =>
      loadRef.current(db).then(
        (data) => alive && setState({ status: "ready", data }),
        (e: unknown) =>
          alive &&
          setState((prev) =>
            prev.status === "ready" ? prev : { status: "error", message: e instanceof Error ? e.message : String(e) }
          )
      );
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };

    refresh();
    const channel = db.channel(`progress:${key}:${attempt}`);
    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, soon);
    }
    channel.subscribe();

    return () => {
      alive = false;
      clearTimeout(timer);
      db.removeChannel(channel);
    };
  }, [key, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  };
  return { state, retry };
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
