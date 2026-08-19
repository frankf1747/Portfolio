"use client";

import { useEffect, useRef } from "react";
import SmartText from "../SmartText";

/* §7 — the statement, with the credentials that back it.

   The paragraph claims both halves of one job. The two rows underneath are
   the receipt for that claim, and the Toronto line is the load-bearing one:
   Applied Statistics AND UX design, taken together, is why "both halves"
   reads as a fact rather than as a story.

   The paragraph decodes ONCE, on scroll-in, through SmartText's default view
   trigger. A per-letter hover SCRAMBLE was built here and removed: this text
   already has its scramble, and giving it a second one meant the same
   gesture-of-the-site fired twice on one block, which diluted both.

   What hover does instead is REPEL. Letters near the cursor are pushed along
   the vector away from it, strongest under the pointer and falling to
   nothing at the radius, then drifting back when it leaves. It is a
   different gesture from the decode rather than a second helping of it, and
   it leaves the text readable throughout.

   Transform only. The scramble had to pin every glyph's width because .h2 is
   the one proportional class on the site and swapping an i for an M reflowed
   the paragraph; transforms do not participate in layout, so displacement
   cannot change the line count no matter how far a letter travels.

   The education rows are set as a spec table, not as prose. Three columns on
   a fixed grid so the dates and the institutions align down the block rather
   than tracking each degree's length, and hairlines top and bottom so it
   reads as a record rather than as more paragraph. */

const EDU = [
  {
    degree: "MASTER OF BUSINESS ANALYTICS",
    dates: "2509-2612",
    school: "UCLA ANDERSON SCHOOL OF MANAGEMENT"
  },
  {
    degree: "APPLIED STATISTICS & UX DESIGN",
    dates: "2109-2505",
    school: "UNIVERSITY OF TORONTO"
  }
];

/* Falloff radius and travel, both in px. Radius roughly a word wide, so the
   effect reads as local to the cursor rather than as the paragraph breathing.
   LERP is the fraction of remaining distance covered per frame: high enough
   to feel attached to the pointer, low enough that letters settle rather
   than snap. */
const RADIUS = 130;
const PUSH = 22;
const LERP = 0.18;

export default function About() {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const para = root.querySelector<HTMLElement>(".h2");
    if (!para) return;

    type Cell = { el: HTMLElement; x: number; y: number; cx: number; cy: number };
    let cells: Cell[] = [];
    let px = -9999;
    let py = -9999;
    let raf = 0;

    /* Positions are cached because reading 340 rects per frame is the one
       thing that would make this expensive. They are stored RELATIVE to the
       container, so scrolling does not invalidate them — only a reflow does.

       Rebuilt on every enter rather than once on mount: the engine rewrites
       these nodes on resplit and on its reveal, and an enter is both rare
       and the exact moment the cache needs to be right. */
    const measure = () => {
      const box = para.getBoundingClientRect();
      cells = Array.from(
        para.querySelectorAll<HTMLElement>(".letter-inner")
      ).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          x: 0,
          y: 0,
          cx: r.left - box.left + r.width / 2,
          cy: r.top - box.top + r.height / 2
        };
      });
    };

    const onEnter = () => measure();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = para.getBoundingClientRect();
      px = e.clientX - box.left;
      py = e.clientY - box.top;
    };

    const onLeave = () => {
      px = -9999;
      py = -9999;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);

      for (const c of cells) {
        const dx = c.cx - px;
        const dy = c.cy - py;
        const dist = Math.hypot(dx, dy);

        let tx = 0;
        let ty = 0;
        if (dist < RADIUS && dist > 0.01) {
          /* Squared falloff rather than linear: linear makes the whole
             radius feel equally active and the edge of the field visible as
             a ring. */
          const f = (1 - dist / RADIUS) ** 2;
          tx = (dx / dist) * f * PUSH;
          ty = (dy / dist) * f * PUSH;
        }

        c.x += (tx - c.x) * LERP;
        c.y += (ty - c.y) * LERP;

        /* Skip the write once a letter is home. Most of the paragraph is at
           rest at any moment, and this keeps the per-frame cost proportional
           to what is actually moving. */
        if (Math.abs(c.x) < 0.01 && Math.abs(c.y) < 0.01) {
          if (c.el.style.transform) c.el.style.transform = "";
          continue;
        }
        c.el.style.transform = `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px)`;
      }
    };

    measure();
    raf = requestAnimationFrame(frame);
    para.addEventListener("pointerenter", onEnter);
    para.addEventListener("pointermove", onMove);
    para.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      para.removeEventListener("pointerenter", onEnter);
      para.removeEventListener("pointermove", onMove);
      para.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      cells.forEach((c) => (c.el.style.transform = ""));
    };
  }, []);

  return (
    <section className="about" id="about">
      <div className="about__head">
        <SmartText className="small index">01 — ABOUT</SmartText>
        <SmartText className="small">LOS ANGELES, CA</SmartText>
      </div>
      <div className="about__body" ref={bodyRef}>
        <SmartText as="h2" className="h2" isBody>
          I build the thing the analysis points to. Finding the cause is half
          the job. The other half is deciding what&apos;s worth fixing and
          shipping something people will actually use: a model, a dashboard, an
          agent, an app. The best ones stop being tools and become how the work
          runs.
        </SmartText>

        <ul className="about__edu" role="list">
          {EDU.map((e) => (
            <li className="about__eduRow" key={e.school}>
              <SmartText as="span" className="small about__eduDegree">
                {e.degree}
              </SmartText>
              <SmartText as="span" className="small about__eduDates">
                {e.dates}
              </SmartText>
              <SmartText as="span" className="small about__eduSchool">
                {e.school}
              </SmartText>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
