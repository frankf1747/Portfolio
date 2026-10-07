"use client";

import { useState } from "react";
import { fetchOverview } from "@/lib/progress/load";
import { useLive, useNow } from "@/lib/progress/useLive";
import { usePasscode } from "@/lib/progress/passcode";
import Crumb from "./Crumb";
import LoadGate from "./LoadGate";
import OwnerBar from "./OwnerBar";
import ProjectCard from "./ProjectCard";
import ReorderGrid from "./ReorderGrid";

/* `editing` is /progress?edit: the owner's passcode and reorder mode. Every
   other visitor gets the plain grid, in the owner's saved order. */
export default function Overview({ editing = false }: { editing?: boolean }) {
  const { state, retry, live } = useLive(fetchOverview, "overview");
  const now = useNow();

  return (
    <>
      <header className="pg__head">
        <Crumb
          state={state}
          live={live}
          trail={[{ label: "FRANK FU", href: "/" }, { label: "LIVE PROJECTS" }]}
        />
        <h1 className="h2 pg__title">What I&apos;m building, live.</h1>
      </header>

      {editing ? (
        <EditMode state={state} retry={retry} now={now} />
      ) : (
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
      )}
    </>
  );
}

function EditMode({
  state,
  retry,
  now
}: {
  state: ReturnType<typeof useLive<Awaited<ReturnType<typeof fetchOverview>>>>["state"];
  retry: () => void;
  now: Date;
}) {
  const { passcode, unlock, lock } = usePasscode();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <OwnerBar unlocked={!!passcode} unlock={unlock} lock={lock} saving={saving} error={error} />
      <LoadGate state={state} retry={retry}>
        {(projects) =>
          passcode ? (
            <ReorderGrid projects={projects} now={now} passcode={passcode} onSaving={setSaving} onError={setError} />
          ) : (
            <div className="pg-grid">
              {projects.map((s) => (
                <ProjectCard key={s.project.slug} summary={s} now={now} />
              ))}
            </div>
          )
        }
      </LoadGate>
    </>
  );
}
