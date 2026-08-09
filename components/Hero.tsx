"use client";

/* Hero: three-line display headline on a soft diagonal, revealed line-by-
   line after preload. Cursor lens: a circular mask following the pointer
   reveals a hidden layer — the same statement in Chinese — with a
   refractive-looking rim. Below: three two-line statements, divided. */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { DUR, easeExpo, isTouch, prefersReduced } from "@/lib/motion";

const LINES = ["Data, product", "and design —", "one point of view."];
const LINES_ALT = ["数据、产品", "与设计 —", "同一种眼光。"];

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const reveal = () => {
      gsap.fromTo(root.querySelectorAll(".u-line-inner"),
        { yPercent: 112 },
        { yPercent: 0, duration: DUR.slow, ease: easeExpo, stagger: 0.09, delay: 0.15 });
      gsap.fromTo(root.querySelectorAll(".c-Hero-col, .c-Hero-arrow"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: DUR.base, ease: easeExpo, stagger: 0.06, delay: 0.7 });
    };
    if (prefersReduced()) {
      gsap.set(root.querySelectorAll(".u-line-inner, .c-Hero-col, .c-Hero-arrow"), { clearProps: "all" });
    } else {
      addEventListener("preload:done", reveal, { once: true });
    }

    /* lens follows pointer — vars live on the stage, and are measured
       against the stage's own rect: both the hole in the English layer and
       the window onto the Chinese layer read the same coordinates */
    if (!isTouch() && !prefersReduced() && stageRef.current) {
      const stage = stageRef.current;
      let x = -300, y = -300, rx = -300, ry = -300, raf = 0;
      const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
      addEventListener("pointermove", move, { passive: true });
      const loop = () => {
        rx += (x - rx) * 0.12;
        ry += (y - ry) * 0.12;
        const r = stage.getBoundingClientRect();
        stage.style.setProperty("--lx", `${rx - r.left}px`);
        stage.style.setProperty("--ly", `${ry - r.top}px`);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
    }
  }, []);

  return (
    <section ref={rootRef} className="c-Hero" aria-label="Introduction">
      <div ref={stageRef} className="c-Hero-stage">
        <h1 className="c-Hero-title">
          {LINES.map((l, i) => (
            <span className={`u-line c-Hero-line-${i}`} key={i}>
              <span className="u-line-inner">{l}</span>
            </span>
          ))}
        </h1>
        {/* hidden layer, revealed by the lens */}
        <div className="c-Hero-lens" aria-hidden="true">
          <p className="c-Hero-titleAlt">
            {LINES_ALT.map((l, i) => (
              <span className={`u-line c-Hero-line-${i}`} key={i}>
                <span className="u-line-inner">{l}</span>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="c-Hero-foot">
        <div className="c-Hero-col">
          <span>Analyst by training</span>
          <span className="u-muted">UCLA MSBA, Los Angeles</span>
        </div>
        <div className="c-Hero-col">
          <span>PM by habit</span>
          <span className="u-muted">specs, scope, shipped prototypes</span>
        </div>
        <div className="c-Hero-col">
          <span>Designer by taste</span>
          <span className="u-muted">usability first, then delight</span>
        </div>
        <span className="c-Hero-arrow" aria-hidden="true">↓</span>
      </div>
    </section>
  );
}
