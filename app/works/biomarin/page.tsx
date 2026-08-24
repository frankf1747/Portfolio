import type { Metadata } from "next";
import WorkPage from "@/components/works/WorkPage";
import { getWork } from "@/data/works";

const work = getWork("biomarin")!;

export const metadata: Metadata = {
  title: `Frank Fu — ${work.client}`,
  description: work.thesis
};

export default function BioMarinWork() {
  return <WorkPage work={work} />;
}
