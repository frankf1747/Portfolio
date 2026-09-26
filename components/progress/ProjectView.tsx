"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback } from "react";
import { localDay, percentComplete, relativeTime } from "@/lib/progress/derive";
import { fetchProject } from "@/lib/progress/load";
import type { ProjectDetail } from "@/lib/progress/types";
import { useLive, useNow } from "@/lib/progress/useLive";
import Gantt from "./Gantt";
import LoadGate from "./LoadGate";
import UpdateFeed from "./UpdateFeed";

export default function ProjectView({ slug }: { slug: string }) {
  const load = useCallback((db: SupabaseClient) => fetchProject(db, slug), [slug]);
  const { state, retry, live } = useLive(load, `project:${slug}`);
  const now = useNow();

  return (
    <>
      <div className="pg__crumb">
        <span className="small index">PROGRESS</span>
        {state.status !== "loading" && (
          <span className="small pg__live" aria-live="polite">
            {live ? (
              <>
                <i className="pg-pulse" aria-hidden="true" /> LIVE
              </>
            ) : (
              "RECONNECTING…"
            )}
          </span>
        )}
        <Link className="small link-a" href="/progress">
          ← ALL PROJECTS
        </Link>
      </div>

      <LoadGate state={state} retry={retry}>
        {(detail) =>
          detail ? (
            <Detail detail={detail} now={now} />
          ) : (
            <p className="small pg__note">
              NO PROJECT CALLED “{slug}”.{" "}
              <Link className="link-b" href="/progress">
                SEE ALL PROJECTS
              </Link>
            </p>
          )
        }
      </LoadGate>
    </>
  );
}

function Detail({ detail, now }: { detail: ProjectDetail; now: Date }) {
  const { project, milestones, updates } = detail;
  return (
    <>
      <header className="pg-detail__head">
        <div>
          <h1 className="h2 pg__title">{project.name}</h1>
          <p className="pg-detail__desc">{project.description}</p>
          <p className="small pg-detail__facts">
            <span className="pg-chip">{project.status}</span>
            <span>UPDATED {relativeTime(project.updated_at, now).toUpperCase()}</span>
            {project.target_date && <span>TARGET {project.target_date}</span>}
            {project.repo_url && (
              <a className="link-b" href={project.repo_url} target="_blank" rel="noreferrer">
                REPO ↗
              </a>
            )}
          </p>
        </div>
        <p className="pg-detail__pct">{percentComplete(milestones)}%</p>
      </header>

      <h2 className="small index pg-section-title">MILESTONES</h2>
      <Gantt milestones={milestones} today={localDay(now)} />

      <h2 className="small index pg-section-title">LATEST</h2>
      <UpdateFeed updates={updates} milestones={milestones} now={now} />
    </>
  );
}
