import { relativeTime } from "@/lib/progress/derive";
import type { TrackedMilestone, TrackedUpdate } from "@/lib/progress/types";

export default function UpdateFeed({
  updates,
  milestones,
  now
}: {
  updates: TrackedUpdate[];
  milestones: TrackedMilestone[];
  now: Date;
}) {
  if (!updates.length) return <p className="small pg__note">NO UPDATES YET.</p>;
  const titles = new Map(milestones.map((m) => [m.id, m.title]));

  return (
    <ol className="pg-feed">
      {updates.map((u) => {
        const meta = [u.milestone_id && titles.get(u.milestone_id), u.commit_sha?.slice(0, 7)].filter(Boolean);
        return (
          <li key={u.id} className="pg-feed__item">
            <time className="small pg-feed__time" dateTime={u.created_at}>
              {relativeTime(u.created_at, now)}
            </time>
            <div>
              <p className="pg-feed__summary">{u.summary}</p>
              {meta.length > 0 && <p className="small pg-feed__meta">{meta.join(" · ")}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
