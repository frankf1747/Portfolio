import type { Metadata } from "next";
import Cursor from "@/components/Cursor";
import ClinicalBoard from "@/components/works/board/ClinicalBoard";

export const metadata: Metadata = {
  title: "Clinical Trial Risk",
  description:
    "A two-cloud pipeline that joins the trial registry to 20.7M FDA adverse-event reports and ranks every active drug trial by its risk of stopping early."
};

export default function ClinicalTrialRiskWork() {
  return (
    <>
      <Cursor />
      <ClinicalBoard />
    </>
  );
}
