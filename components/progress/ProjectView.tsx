"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { localDay, percentComplete, relativeTime } from "@/lib/progress/derive";
import { fetchProject } from "@/lib/progress/load";
import type { ProjectDetail } from "@/lib/progress/types";
import { useLive, useNow } from "@/lib/progress/useLive";
import Crumb from "./Crumb";
import Gantt from "./Gantt";
import LoadGate from "./LoadGate";
import UpdateFeed from "./UpdateFeed";

/* The same shape the MCP server validates a slug against before writing it
   (see progress-mcp/src/schemas.ts). ?p= is free text anyone can put on
   frankfu.me, so a value that doesn't match a real slug is never echoed
   back into the page verbatim. */
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

export default function ProjectView({ slug }: { slug: string }) {
  const load = useCallback((db: SupabaseClient) => fetchProject(db, slug), [slug]);
  const { state, retry, live } = useLive(load, `project:${slug}`);
  const now = useNow();

  return (
    <>
      <Crumb
        state={state}
        live={live}
        trail={[
          { label: "FRANK FU", href: "/" },
          { label: "LIVE PROJECTS", href: "/progress" },
          /* the project's own name once loaded; a quiet placeholder until then */
          {
            label:
              state.status === "ready" && state.data
                ? state.data.project.name.toUpperCase()
                : "…"
          }
        ]}
      />

      <LoadGate state={state} retry={retry}>
        {(detail) =>
          detail ? (
            <Detail detail={detail} now={now} />
          ) : (
            <p className="small pg__note">
              {SAFE_SLUG.test(slug) ? <>NO PROJECT CALLED “{slug}”. </> : "NO SUCH PROJECT. "}
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

  useEffect(() => {
    const previous = document.title;
    document.title = `${project.name} — Progress`;
    return () => {
      document.title = previous;
    };
  }, [project.name]);

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
