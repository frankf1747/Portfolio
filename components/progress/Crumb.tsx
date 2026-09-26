import Link from "next/link";
import type { LiveState, LiveStatus } from "@/lib/progress/useLive";
import LiveBadge from "./LiveBadge";

/* The row every /progress view opens with: the section index, the honest
   live/reconnecting badge, and one way back. Shared so the two views can't
   drift apart on structure. */
export default function Crumb<T>({
  state,
  live,
  backHref,
  backLabel
}: {
  state: LiveState<T>;
  live: LiveStatus;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="pg__crumb">
      <span className="small index">PROGRESS</span>
      <LiveBadge state={state} live={live} />
      <Link className="small link-a" href={backHref}>
        {backLabel}
      </Link>
    </div>
  );
}
