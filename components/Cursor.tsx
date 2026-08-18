"use client";

import { useEffect, useRef } from "react";

/* A small --blue disc that replaces the pointer.

   It trails the real cursor on a lerp rather than being pinned to it.
   The lag is the whole character of the thing, but it is also why the
   native arrow has to go: two markers a few pixels apart, moving at
   different rates, read as a rendering fault rather than as an effect.

   Position is written as a transform on its own rAF loop and never from
   the pointer event, so a flood of pointermove events cannot cause more
   than one paint per frame.

   ⚠ Desktop only. The hide of the native cursor is gated on
   html[data-touch="false"] in CSS, and this component refuses to mount
   its listeners on a coarse pointer at all — a touch device would get an
   invisible pointer and a disc parked wherever the last tap landed. */

/* px per frame, at 60fps. Low enough to read as a trail, high enough
   that the disc is never more than a few frames behind a fast flick. */
const LERP = 0.18;
/* below this the disc is close enough that further interpolation is
   sub-pixel — parking the loop keeps an idle page off the CPU */
const SETTLED = 0.01;

export default function Cursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) return;

    /* The ONLY thing that hides the native pointer — see _cursor.scss.
       It is set here, from the effect, rather than being inferred from a
       server-rendered attribute: if this bundle fails to load or throws,
       nothing sets it, and the visitor keeps a working system cursor
       instead of a page with no pointer at all. */
    document.documentElement.dataset.cursor = "custom";

    /* Reduced motion keeps the disc but drops the trail — the smoothing
       is the moving part, not the cursor itself. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let placed = false;

    const draw = () => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const frame = () => {
      const dx = targetX - x;
      const dy = targetY - y;

      if (Math.abs(dx) < SETTLED && Math.abs(dy) < SETTLED) {
        x = targetX;
        y = targetY;
        draw();
        raf = 0; //  parked; the next pointermove restarts the loop
        return;
      }

      x += dx * LERP;
      y += dy * LERP;
      draw();
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;

      /* First sighting: drop the disc straight onto the pointer. Lerping
         in from 0,0 would fling it across the page on page load. */
      if (!placed) {
        placed = true;
        x = targetX;
        y = targetY;
        el.dataset.on = "true";
        draw();
        return;
      }

      if (reduced) {
        x = targetX;
        y = targetY;
        draw();
        return;
      }
      wake();
    };

    /* The disc is meaningless once the pointer is off the document, and
       leaving it stranded at the edge looks like a stuck element. */
    const onLeave = () => {
      el.dataset.on = "false";
    };
    const onEnter = () => {
      if (placed) el.dataset.on = "true";
    };

    /* With the native cursor hidden there is no arrow or hand left to
       signal a hit area, so the disc has to carry that itself — this is
       affordance, not decoration.

       Two levels of it. The nav and the project cards are the things the
       site actually wants clicked, and they become a CROSSHAIR: a plus
       reads as "target this" far more specifically than a bigger dot,
       and it puts a visible point of aim on cards that are otherwise a
       large soft area with no obvious centre. Everything else clickable
       just grows the disc. PLUS is tested first and the two are mutually
       exclusive, so a nav link never tries to be both at once. */
    const PLUS = ".nav a, .card";
    const HIT = "a, button, [role='button'], input, textarea, select, summary";
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const plus = t?.closest?.(PLUS) ?? null;
      el.dataset.shape = plus ? "plus" : "dot";
      el.dataset.hit = !plus && t?.closest?.(HIT) ? "true" : "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div
      className="cursor"
      ref={ref}
      data-on="false"
      data-hit="false"
      data-shape="dot"
      aria-hidden="true"
    />
  );
}
