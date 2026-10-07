"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* The way in to /progress from anywhere on the page: a small pulsing
   pink dot, fixed to the right edge at mid-height. At rest it is a signal,
   not a button — it should read like a recording light. Hover (or focus)
   and it grows into a pill: "LIVE · what I'm building ↗".

   The PROJECTS heading also links to /progress, but only once you have
   scrolled to it; this one is there from the first screen.

   Touch has no hover, so the first tap opens the pill and the second
   follows the link — nobody is sent off the page by an accidental brush.
   A tap anywhere else closes it again.

   It also unfolds by itself while the Projects section (#work) holds the
   middle of the screen: that is where "what I'm building" is the natural
   next click, so the pill offers itself there: it opens in full, then
   after a beat tucks half of itself behind the edge so it stops claiming
   the space beside the cards. Hover brings it back out. It folds away
   entirely once the section is left.
   A scroll check rather than an IntersectionObserver, which does not fire
   reliably under Lenis in every host this has been tested in.

   Mounted in Landing only, so it never appears on /progress itself. */

export default function LiveDot() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLAnchorElement | null>(null);
  const lastPointer = useRef<string>("mouse");
  const [cued, setCued] = useState(false);
  const [tucked, setTucked] = useState(false);

  useEffect(() => {
    setTucked(false);
    if (!cued) return;
    const t = window.setTimeout(() => setTucked(true), 2600);
    return () => window.clearTimeout(t);
  }, [cued]);

  useEffect(() => {
    const work = document.getElementById("work");
    if (!work) return;
    /* One rect read per scroll event is cheap, and React drops the
       setState when the value has not changed. */
    const check = () => {
      const r = work.getBoundingClientRect();
      const vh = window.innerHeight;
      setCued(r.top < vh * 0.55 && r.bottom > vh * 0.45);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <Link
      ref={ref}
      href="/progress"
      className={`live-dot${open ? " is-open" : ""}${cued ? " is-cued" : ""}${tucked ? " is-tucked" : ""}`}
      aria-label="Live: see what I'm building right now"
      onPointerDown={(e) => {
        lastPointer.current = e.pointerType;
      }}
      onClick={(e) => {
        if (lastPointer.current !== "mouse" && !open) {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      <span className="live-dot__dot" aria-hidden="true" />
      <span className="live-dot__label" aria-hidden="true">
        <b>LIVE</b> · what I&apos;m building ↗
      </span>
    </Link>
  );
}
