"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import SmartText from "../SmartText";
import type { Piece } from "@/data/works";

/* Dynamic and ssr:false: three.js is ~150kb gz and only the desktop branch
   ever renders it — a phone must not download a renderer it will never
   mount. The SVG below stays as both the mobile shape and the no-WebGL
   fallback. */
const Pyramid3D = dynamic(() => import("./Pyramid3D"), { ssr: false });

/* §13 — the triangle.

   The shape IS the argument. Three pieces where each is the precondition for
   the next, drawn as base / middle / apex: the apex is the smallest area and
   the most value, and it only stands because of what is under it. A list
   would state that; a triangle makes the reader see it before they read a
   word.

   LEFT, not right. The eye starts there on an F-scan, so the shape is the
   first thing met and the copy is read against it.

   Pinned while the copy passes. The segments light bottom-up as each piece
   reaches the middle of the viewport, and clicking one scrolls to it — the
   scroll drives the shape, but the shape can also drive the scroll.

   Ordered bottom-up in the data, so index 0 is the base. The polygons below
   are listed in the same order and the geometry is shared with nothing. */

/* ONE triangle, sliced. Every slice is cut from the same two edges — apex at
   (100,8), base half-width 96 — so the shape reads as a single triangle
   pulled apart, not three trapezoids stacked to look like one.

   The heights are deliberately uneven. The apex is the TALLEST band and the
   base the shortest: equal thirds made the three look interchangeable, which
   is the opposite of the argument. Value concentrates upward.

   The middle is four thin slices rather than one band, because that piece is
   about ADDING LAYERS. They carry the same index and light together. */
const APEX = "100,8.0 136.8,84.0 63.2,84.0";
const MIDS = [
  "59.8,91.0 140.2,91.0 147.3,105.5 52.7,105.5",
  "51.3,108.5 148.7,108.5 155.8,123.0 44.2,123.0",
  "42.8,126.0 157.2,126.0 164.2,140.5 35.8,140.5",
  "34.3,143.5 165.7,143.5 172.7,158.0 27.3,158.0",
];
const BASE = "23.4,166.0 176.6,166.0 196.0,206.0 4.0,206.0";

export default function LayerStack({ pieces }: { pieces: Piece[] }) {
  const [active, setActive] = useState(0);
  /* false until proven: SSR and first client paint agree on the SVG, then
     the capability check upgrades. Hover+fine pointer is the same gate the
     site uses for desktop-only effects; reduced-motion keeps the static
     shape — a pyramid that cannot turn is worse than a diagram. */
  const [use3d, setUse3d] = useState(false);
  const copyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    /* An embedded or prerendering viewport can report width 0 at first
       paint — the same failure --start-vh guards against in ScrollProvider.
       A decision made against a zero viewport is a coin flip, so wait for
       a real measurement instead of deciding once. */
    const decide = () => {
      if (!window.innerWidth) return false;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const wide = window.matchMedia("(min-width: 721px)").matches;
      setUse3d(fine && wide && !reduced);
      return true;
    };
    if (decide()) return;
    const poll = window.setInterval(() => {
      if (decide()) window.clearInterval(poll);
    }, 200);
    return () => window.clearInterval(poll);
  }, []);

  /* A piece owns the shape while it is crossing the middle of the viewport.

     IntersectionObserver, and specifically NOT a scroll handler or a poll of
     scrollY. Lenis runs with smoothWheel: it suppresses native scroll events
     entirely (measured: scrollY moved 0 to 1847 while a window scroll
     listener fired zero times). IO is driven by the compositor rather than
     by the scroll layer, so it cannot be starved by it.

     The elements are read out of the DOM rather than from an array of
     per-item refs. Ref callbacks and effects do not have a guaranteed order
     across a StrictMode double-mount, and an effect that runs while the
     array is still empty attaches nothing and then never retries — which is
     exactly the failure this went through.

     rootMargin collapses the viewport to a band at its centre, so
     "intersecting" means "this piece is under the middle of the screen",
     without measuring anything.

     The band must have HEIGHT. -50%/-50% is the obvious way to express
     "the centre line" and it silently never fires: the root rect resolves
     to zero height, so the intersection area is always 0, the ratio never
     exceeds threshold 0, and isIntersecting stays false forever. -45%
     leaves a 10% band, which is thin enough to behave like a line and tall
     enough to exist. */
  useEffect(() => {
    const root = copyRef.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>(".piece"));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = els.indexOf(e.target as HTMLElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goTo = (i: number) =>
    copyRef.current
      ?.querySelectorAll<HTMLElement>(".piece")
      [i]?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="stack">
      <div className="stack__shape">
        {use3d ? (
          <Pyramid3D active={active} onFallback={() => setUse3d(false)} />
        ) : (
        <svg viewBox="0 0 200 214" aria-hidden="true">
          <polygon
            points={BASE}
            className={`stack__seg${active === 0 ? " is-active" : ""}`}
            onClick={() => goTo(0)}
          />

          {MIDS.map((m, i) => (
            <polygon
              key={i}
              points={m}
              className={`stack__seg${active === 1 ? " is-active" : ""}`}
              onClick={() => goTo(1)}
            />
          ))}

          <polygon
            points={APEX}
            className={`stack__seg stack__seg--apex${
              active === 2 ? " is-active" : ""
            }`}
            onClick={() => goTo(2)}
          />
        </svg>
        )}

        <ol className="stack__legend">
          {pieces.map((p, i) => (
            <li key={p.n}>
              <button
                className={`stack__key${active === i ? " is-active" : ""}`}
                onClick={() => goTo(i)}
              >
                <span className="stack__keyN">{p.n}</span>
                <span className="stack__keyT">{p.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="stack__copy" ref={copyRef}>
        {pieces.map((p, i) => (
          <article
            key={p.n}
            className={`piece${active === i ? " is-active" : ""}`}
          >
            <SmartText className="small piece__n">
              {`${p.n} / 0${pieces.length}`}
            </SmartText>
            <SmartText as="h2" className="piece__t">
              {p.title}
            </SmartText>
            <SmartText as="p" className="piece__b" isBody>
              {p.body}
            </SmartText>
            <ul className="piece__tools">
              {p.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
