"use client";

import Link from "next/link";
import { useRef } from "react";
import SmartText, { type SmartTextHandle } from "../SmartText";
import { scrambleText } from "@/lib/smartText";
import LiveSignal from "./LiveSignal";

/* The §9 PROJECTS heading, as the way in to /progress.

   Hover (or keyboard focus) turns it pink and re-decodes it, the same
   gesture the nav labels answer with. The title keeps its own slow pace
   — the engine fixes pace when it splits the line — and a hover that lands
   while the scroll-in decode is still running leaves that decode alone
   rather than restarting it. LIVE decodes at the nav's hover speed. */
export default function ProjectsHeading() {
  const title = useRef<SmartTextHandle | null>(null);
  const live = useRef<HTMLSpanElement | null>(null);

  const decode = () => {
    if (title.current && !title.current.isPlaying()) title.current.play({ scrambleOnly: true });
    if (live.current) scrambleText(live.current, { duration: 520 });
  };

  return (
    <Link className="work__title-link" href="/progress" onMouseEnter={decode} onFocus={decode}>
      {/* decodes slower than the other section headings on purpose —
          it is the title of the block the page is built around */}
      <SmartText as="span" className="h1" pace="slow" instanceRef={title}>
        PROJECTS
      </SmartText>
      {/* The SECTION number, not the card count. Projects is §3 in the
          rail; binding this to CARDS.length made it read as inventory. */}
      <span className="work__count" aria-hidden="true">
        (3)
      </span>
      <LiveSignal textRef={live} />
    </Link>
  );
}
