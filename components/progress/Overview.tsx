"use client";

import { fetchOverview } from "@/lib/progress/load";
import { useLive, useNow } from "@/lib/progress/useLive";
import Crumb from "./Crumb";
import LoadGate from "./LoadGate";
import ProjectCard from "./ProjectCard";

export default function Overview() {
  const { state, retry, live } = useLive(fetchOverview, "overview");
  const now = useNow();

  return (
    <>
      <header className="pg__head">
        <Crumb state={state} live={live} backHref="/" backLabel="← FRANK FU" />
        <h1 className="h2 pg__title">What I&apos;m building, live.</h1>
      </header>

      <LoadGate state={state} retry={retry}>
        {(projects) =>
          projects.length ? (
            <div className="pg-grid">
              {projects.map((s) => (
                <ProjectCard key={s.project.slug} summary={s} now={now} />
              ))}
            </div>
          ) : (
            <p className="small pg__note">NO TRACKED PROJECTS YET. THEY APPEAR HERE AS WORK STARTS.</p>
          )
        }
      </LoadGate>
    </>
  );
}
