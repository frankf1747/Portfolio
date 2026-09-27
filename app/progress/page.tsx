import "./progress.scss";

import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Suspense } from "react";
import ProgressPage from "@/components/progress/ProgressPage";

export const metadata: Metadata = {
  title: "Frank Fu — Progress",
  description: "Live progress on what Frank Fu is building, updated as the work happens."
};

/* Everything below needs the ?p= search param, which under a static export
   only resolves in the browser — so the prerendered HTML would otherwise be
   an empty <main>. This fallback holds only what never depends on data: the
   same crumb shell every view opens with. */
function ProgressFallback() {
  return (
    <main className="pg">
      <div className="pg__crumb">
        <Breadcrumbs trail={[{ label: "FRANK FU", href: "/" }, { label: "LIVE PROJECTS" }]} />
      </div>
    </main>
  );
}

/* useSearchParams needs a Suspense boundary under a static export. */
export default function Progress() {
  return (
    <Suspense fallback={<ProgressFallback />}>
      <ProgressPage />
    </Suspense>
  );
}
