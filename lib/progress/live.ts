import type { SupabaseClient } from "@supabase/supabase-js";

export type LiveState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

const TABLES = ["projects", "milestones", "updates"] as const;

/* The plain, testable core of useLive: opens a realtime channel on the
   progress tables and refetches on change, debounced (one tool call fires
   several events: the row, then the trigger touching the project). Only the
   most recently started refresh may write state, so a slow older request
   can't clobber a newer result. If the socket drops and reconnects, the
   re-SUBSCRIBED kicks off a refresh to cover whatever happened in the gap;
   the first SUBSCRIBED (the normal startup case, already covered by the
   initial load) does not. */
export function startLive<T>(
  db: SupabaseClient,
  load: () => Promise<T>,
  onState: (update: (prev: LiveState<T>) => LiveState<T>) => void,
  onLive: (live: boolean) => void,
  topic: string
): () => void {
  let stopped = false;
  let seq = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let everSubscribed = false;

  const refresh = () => {
    const mine = ++seq;
    load().then(
      (data) => {
        if (stopped || mine !== seq) return;
        onState(() => ({ status: "ready", data }));
      },
      (e: unknown) => {
        if (stopped || mine !== seq) return;
        onState((prev) =>
          prev.status === "ready" ? prev : { status: "error", message: e instanceof Error ? e.message : String(e) }
        );
      }
    );
  };

  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 250);
  };

  refresh();

  const channel = db.channel(topic);
  for (const table of TABLES) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, soon);
  }
  channel.subscribe((status: string) => {
    if (status === "SUBSCRIBED") {
      if (everSubscribed) soon();
      everSubscribed = true;
      onLive(true);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      onLive(false);
    }
  });

  return () => {
    stopped = true;
    clearTimeout(timer);
    db.removeChannel(channel);
  };
}
