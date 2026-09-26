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
        const milestoneTitle = u.milestone_id ? titles.get(u.milestone_id) : undefined;
        const sha = u.commit_sha?.slice(0, 7);
        return (
          <li key={u.id} className="pg-feed__item">
            <time className="small pg-feed__time" dateTime={u.created_at}>
              {relativeTime(u.created_at, now)}
            </time>
            <div>
              <p className="pg-feed__summary">{u.summary}</p>
              {(milestoneTitle || sha) && (
                <p className="small pg-feed__meta">
                  {milestoneTitle}
                  {milestoneTitle && sha && " · "}
                  {sha && <span className="pg-feed__sha">{sha}</span>}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
