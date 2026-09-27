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

   Mounted in Landing only, so it never appears on /progress itself. */

export default function LiveDot() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLAnchorElement | null>(null);
  const lastPointer = useRef<string>("mouse");

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
      className={`live-dot${open ? " is-open" : ""}`}
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
