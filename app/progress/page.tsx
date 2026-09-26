import "./progress.scss";

import type { Metadata } from "next";
import { Suspense } from "react";
import ProgressPage from "@/components/progress/ProgressPage";

export const metadata: Metadata = {
  title: "Frank Fu — Progress",
  description: "Live progress on what Frank Fu is building, updated as the work happens."
};

/* useSearchParams needs a Suspense boundary under a static export. */
export default function Progress() {
  return (
    <Suspense fallback={null}>
      <ProgressPage />
    </Suspense>
  );
}
