import "./board.scss";

import type { Metadata } from "next";
import Cursor from "@/components/Cursor";
import BioMarinBoard from "@/components/works/board/BioMarinBoard";

export const metadata: Metadata = {
  title: "Frank Fu — BioMarin",
  description:
    "From processing to adaptive learning: an automated operations scorecard with a root-cause agent team and proactive signals to owners."
};

/* The BioMarin card on the homepage opens this. The parked supply-chain
   page (components/works/parked/SupplyChainWorkPage.tsx) needs a different
   slug when it is restored. */
export default function BioMarinWork() {
  return (
    <>
      <Cursor />
      <BioMarinBoard />
    </>
  );
}
