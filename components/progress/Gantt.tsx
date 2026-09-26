import { Fragment } from "react";
import { STATUS_LABEL } from "@/lib/progress/derive";
import { barSpan, ganttDomain, monthTicks, parseDay, xPct } from "@/lib/progress/scale";
import type { MilestoneStatus, TrackedMilestone } from "@/lib/progress/types";

const LEGEND: MilestoneStatus[] = ["planned", "in_progress", "done", "blocked"];
const HALF_DAY = 86_400_000 / 2;

export default function Gantt({ milestones, today }: { milestones: TrackedMilestone[]; today: string }) {
  if (!milestones.length) return <p className="small pg__note">NO MILESTONES YET.</p>;

  const domain = ganttDomain(milestones, today);
  /* Bars span whole days, so today's marker sits at the middle of today's
     day rather than its start — a milestone due today then visibly
     contains the line instead of ending just before it. */
  const todayLeft = `${xPct(parseDay(today) + HALF_DAY, domain)}%`;

  return (
    <>
      <div className="pg-gantt">
        <div className="pg-gantt__grid">
          <div className="pg-gantt__corner" />
          <div className="small pg-gantt__axis">
            {monthTicks(domain).map((t) => (
              <span key={t.pct} className="pg-gantt__tick" style={{ left: `${t.pct}%` }}>
                {t.label}
              </span>
            ))}
            <span className="pg-gantt__today pg-gantt__today--label" style={{ left: todayLeft }}>
              TODAY
            </span>
          </div>

          {milestones.map((m) => {
            const span = barSpan(m, domain);
            const done = m.completed_at ? `${xPct(parseDay(m.completed_at), domain)}%` : null;
            const tip = `${m.title}\n${m.start_date} → ${m.due_date}\n${m.progress}% · ${STATUS_LABEL[m.status]}`;
            return (
              <Fragment key={m.id}>
                <div className="small pg-gantt__label" title={m.description || undefined}>
                  {m.title}
                  <span className="u-sr">
                    , {m.start_date} to {m.due_date}, {m.progress}%, {STATUS_LABEL[m.status]}
                    {m.completed_at ? `, completed ${m.completed_at.slice(0, 10)}` : ""}
                  </span>
                </div>
                <div className="pg-gantt__track" aria-hidden="true">
                  <span className="pg-gantt__today" style={{ left: todayLeft }} />
                  <div
                    className={`pg-bar pg-bar--${m.status}`}
                    style={{ left: `${span.left}%`, width: `${span.width}%` }}
                    title={tip}
                  >
                    <div className="pg-bar__fill" style={{ width: `${m.progress}%` }} />
                  </div>
                  {done && <span className="pg-gantt__done" style={{ left: done }} title={`Completed ${m.completed_at!.slice(0, 10)}`} />}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <ul className="small pg-legend">
        {LEGEND.map((s) => (
          <li key={s}>
            <span className={`pg-bar pg-bar--${s} pg-legend__swatch`}>
              <span className="pg-bar__fill" style={{ width: s === "in_progress" ? "50%" : 0 }} />
            </span>
            {STATUS_LABEL[s].toUpperCase()}
          </li>
        ))}
        <li>
          <span className="pg-gantt__done pg-legend__done" />
          COMPLETED ON
        </li>
      </ul>
    </>
  );
}
