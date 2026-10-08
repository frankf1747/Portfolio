import "./progress.scss";

import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Suspense } from "react";
import ProgressPage from "@/components/progress/ProgressPage";

const description = "Live progress on what Frank Fu is building, updated as the work happens.";

/* openGraph replaces the layout's rather than merging with it, so the whole
   object is restated here. */
export const metadata: Metadata = {
  title: "Live projects",
  description,
  openGraph: {
    type: "website",
    siteName: "Frank Fu",
    url: "/progress",
    title: "Live projects · Frank Fu",
    description,
    images: [{ url: "/og/progress.png", width: 1200, height: 630, alt: "Live projects · Frank Fu" }]
  }
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
