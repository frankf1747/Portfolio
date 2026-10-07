import Link from "next/link";
import { currentMilestone, isFresh, percentComplete, relativeTime } from "@/lib/progress/derive";
import type { ProjectSummary } from "@/lib/progress/types";
import Ring from "./Ring";

export default function ProjectCard({ summary, now }: { summary: ProjectSummary; now: Date }) {
  const { project, milestones, latest } = summary;
  const current = currentMilestone(milestones);
  const nowLine = !milestones.length ? "No milestones yet" : current ? current.title : "All milestones done";
  const pct = percentComplete(milestones);

  /* Finished projects drop to ink; the mark is kept for work still moving. */
  return (
    <Link className={`pg-card${pct === 100 ? " is-done" : ""}`} href={`/progress?p=${project.slug}`}>
      <div className="small pg-card__top">
        <span className="pg-chip">{project.status}</span>
        <span className="pg-card__time">
          {isFresh(project.updated_at, now) && (
            <i className="pg-pulse" role="img" aria-label="Updated in the last hour" />
          )}
          {relativeTime(project.updated_at, now)}
        </span>
      </div>

      <div className="pg-card__body">
        <Ring pct={pct} />
        <div>
          <h2 className="pg-card__name">{project.name}</h2>
          <p className="small pg-card__desc">{project.description}</p>
        </div>
      </div>

      <dl className="small pg-card__facts">
        <dt>NOW</dt>
        <dd>{nowLine}</dd>
        <dt>LATEST</dt>
        <dd>{latest ? latest.summary : "No updates yet"}</dd>
      </dl>
    </Link>
  );
}
