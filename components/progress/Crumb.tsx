import Breadcrumbs, { type Crumb as Step } from "../Breadcrumbs";
import type { LiveState, LiveStatus } from "@/lib/progress/useLive";
import LiveBadge from "./LiveBadge";

/* The row every /progress view opens with: the breadcrumb trail back up
   the site, then the honest live/reconnecting badge. Shared so the two
   views can't drift apart on structure. The trail replaces the single
   "← back" link this row used to carry — every level is one click away. */
export default function Crumb<T>({
  state,
  live,
  trail
}: {
  state: LiveState<T>;
  live: LiveStatus;
  trail: Step[];
}) {
  return (
    <div className="pg__crumb">
      <Breadcrumbs trail={trail} after={<LiveBadge state={state} live={live} />} />
    </div>
  );
}
