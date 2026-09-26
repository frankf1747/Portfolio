import type { LiveState, LiveStatus } from "@/lib/progress/useLive";

/* Honest about the realtime connection: nothing to say about it until data
   has actually loaded (a fresh mount is "connecting", not "reconnecting"),
   and no badge at all while still "connecting" — only once it is confirmed
   live, or confirmed to have dropped after having been live. */
export default function LiveBadge<T>({ state, live }: { state: LiveState<T>; live: LiveStatus }) {
  return (
    <span className="small pg__live" aria-live="polite">
      {state.status === "ready" && live === "live" && (
        <>
          <i className="pg-pulse" role="img" aria-label="Connected" /> LIVE
        </>
      )}
      {state.status === "ready" && live === "offline" && "RECONNECTING…"}
    </span>
  );
}
