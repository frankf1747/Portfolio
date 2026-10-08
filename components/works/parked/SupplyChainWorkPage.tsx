/* PARKED — the supply-chain work page (the pyramid / layer stack), which
   lived at app/works/biomarin/page.tsx. It is waiting for its own project;
   the BioMarin card now tells the scorecard-pipeline story instead and no
   longer links here. Content is still in data/works.ts under "biomarin".

   To restore: move this file back to app/works/<slug>/page.tsx (a route
   needs that exact path and name) and give a card `href: "/works/<slug>"`.
   Not "biomarin": /works/biomarin is now the scorecard whiteboard. */

import type { Metadata } from "next";
import WorkPage from "@/components/works/WorkPage";
import { getWork } from "@/data/works";

const work = getWork("biomarin")!;

export const metadata: Metadata = {
  title: work.client,
  description: work.thesis
};

export default function BioMarinWork() {
  return <WorkPage work={work} />;
}
