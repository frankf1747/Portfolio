"use client";

import { useEffect, useRef } from "react";
import { isTouch, prefersReduced } from "@/lib/motion";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isTouch() || prefersReduced()) return;
    const dot = dotRef.current!, label = labelRef.current!;
    document.documentElement.classList.add("has-customCursor");

    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    addEventListener("pointermove", move, { passive: true });

    const loop = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      dot.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const over = (e: Event) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (t) {
        label.textContent = t.dataset.cursor ?? "View";
        dot.classList.add("is-view");
      } else {
        dot.classList.remove("is-view");
      }
    };
    document.addEventListener("pointerover", over);

    return () => {
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-customCursor");
    };
  }, []);

  return (
    <div ref={dotRef} className="c-Cursor" aria-hidden="true">
      <span ref={labelRef} className="c-Cursor-label" />
    </div>
  );
}
