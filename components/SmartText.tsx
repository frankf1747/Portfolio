"use client";

import { useEffect, useRef } from "react";
import { smartText, type ScramblePace, type SmartTextInstance } from "@/lib/smartText";

/* React wrapper around the §4 engine.

   `trigger`:
     "mount"  — play immediately (hero, driven by the landing timeline)
     "view"   — play when it scrolls into view, once
     "manual" — parent drives it via `instanceRef` (nav scramble replay) */

export type SmartTextHandle = SmartTextInstance;

export default function SmartText({
  children,
  as: Tag = "span",
  className = "",
  mask = false,
  isBody = false,
  delay = 0,
  trigger = "view",
  pace,
  instanceRef,
  style
}: {
  children: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  mask?: boolean;
  isBody?: boolean;
  delay?: number;
  trigger?: "mount" | "view" | "manual";
  /** overrides the pace implied by `trigger` — see PACE in lib/smartText */
  pace?: ScramblePace;
  instanceRef?: React.MutableRefObject<SmartTextHandle | null>;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inst = useRef<SmartTextInstance | null>(null);

  /* `instanceRef` must NOT be an effect dependency.
     Callers hand us a ref object, and one built inline in the parent's
     render — Hero's per-line binder, for one — is a NEW object on every
     render. As a dependency that tore the engine down and rebuilt it on
     every parent state change: the landing flipped state at +0.5s, so the
     overture was destroyed and force-resolved 500ms into a 2.6s decode,
     and the rebuilt lines were inserted under an already-revealed root —
     which is what made the headline snap to its final position instead of
     finishing its travel. Hold it in a ref and keep the engine alive. */
  const instanceRefHolder = useRef(instanceRef);
  instanceRefHolder.current = instanceRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const resolvedPace: ScramblePace = pace ?? (trigger === "view" ? "scroll" : "landing");
    const instance = smartText(el, resolvedPace);
    inst.current = instance;
    if (instanceRefHolder.current) instanceRefHolder.current.current = instance;

    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    let width = el.clientWidth;

    /* The slab is measured in the display face. Split before the webfont
       lands and every line break is wrong, so re-split once fonts settle.
       The ResizeObserver below only fires on WIDTH change and would never
       catch this. */
    document.fonts?.ready.then(() => {
      if (!cancelled) instance.resplit();
    });

    if (trigger === "mount") {
      instance.play({ delay });
    } else if (trigger === "view") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              instance.play({ delay });
              io?.disconnect();
              io = null;
            }
          }
        },
        /* threshold 0, no rootMargin: fires the instant the top edge crosses
           the viewport bottom — BEFORE a single pixel is visible. That early
           start is the whole trick. At 0.25 the block was already a quarter
           on screen when it began, so you watched it sit still and then
           perform. Once only; never reverse, never replay on scroll-up. */
        { threshold: 0 }
      );
      io.observe(el);
    } else {
      instance.resolve();
    }

    /* Re-split only when the box actually changes width — and never while
       a decode is in flight. resplit() rebuilds the DOM and force-resolves,
       so a resize observed mid-play cancels the animation outright. The
       decode is layout-neutral now, so this should not fire on our own
       frames; it stays as a guard because it is cheap and the failure it
       prevents is total. A width change that lands during a play is
       re-checked on the next real resize. */
    ro = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - width) < 1) return;
      if (instance.isPlaying()) return;
      width = el.clientWidth;
      instance.resplit();
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      ro?.disconnect();
      io?.disconnect();
      instance.destroy();
      if (instanceRefHolder.current) instanceRefHolder.current.current = null;
    };
  }, [delay, trigger, pace]);

  const cls = [
    "smart-text",
    mask ? "mask" : "",
    isBody ? "is-body" : "",
    trigger === "view" ? "is-scroll" : "",
    pace === "overture" ? "is-overture" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref as never}
      className={cls}
      style={style}
      suppressHydrationWarning
    >
      {children}
    </Tag>
  );
}
