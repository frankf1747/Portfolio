"use client";

import { useEffect, useRef } from "react";
import { smartText, type SmartTextInstance } from "@/lib/smartText";

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
  instanceRef,
  style
}: {
  children: string;
  as?: "span" | "h1" | "h2" | "p" | "div";
  className?: string;
  mask?: boolean;
  isBody?: boolean;
  delay?: number;
  trigger?: "mount" | "view" | "manual";
  instanceRef?: React.MutableRefObject<SmartTextHandle | null>;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inst = useRef<SmartTextInstance | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = smartText(el, trigger === "view" ? "scroll" : "landing");
    inst.current = instance;
    if (instanceRef) instanceRef.current = instance;

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

    /* re-split only when the box actually changes width */
    ro = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - width) < 1) return;
      width = el.clientWidth;
      instance.resplit();
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      ro?.disconnect();
      io?.disconnect();
      instance.destroy();
      if (instanceRef) instanceRef.current = null;
    };
  }, [delay, trigger, instanceRef]);

  const cls = [
    "smart-text",
    mask ? "mask" : "",
    isBody ? "is-body" : "",
    trigger === "view" ? "is-scroll" : "",
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
