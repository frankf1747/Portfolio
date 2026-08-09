import type { Metadata } from "next";
import WorkIndex from "@/components/WorkIndex";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Work — Frank Fu" };

export default function WorkPage() {
  return (
    <>
      <WorkIndex />
      <Footer />
    </>
  );
}
