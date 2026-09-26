"use client";

import { useSearchParams } from "next/navigation";
import Cursor from "@/components/Cursor";
import Overview from "./Overview";
import ProjectView from "./ProjectView";

/* One static route for both views: projects are created after the site is
   built, so the detail view reads its slug from ?p= in the browser. */
export default function ProgressPage() {
  const slug = useSearchParams().get("p");
  return (
    <>
      <Cursor />
      <main className="pg">{slug ? <ProjectView key={slug} slug={slug} /> : <Overview />}</main>
    </>
  );
}
