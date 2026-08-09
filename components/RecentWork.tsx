"use client";

/* RECENT WORK — scroll-pinned project showcase.

   Architecture, per spec: no position:sticky, no ScrollTrigger.pin.
   N empty 100vh spacers give the section its height; an absolutely
   positioned sticky layer is moved by transform every frame from the
   shared gsap ticker, reading scroll from Lenis.

   One master value per frame — progress / index / local — drives the
   filmstrip, the titles, the ruler and the background palette. Fully
   scrubbed: no snapping, no timers, exact reversal on scroll-up. */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { featured } from "@/data/projects";
import { gradient } from "@/lib/gradient";
import { filmstrip } from "@/lib/filmstrip";
import { lenis, prefersReduced } from "@/lib/motion";
import { slashChars, plainTitle } from "@/lib/slashText";
import TransitionLink from "./TransitionLink";

const N = featured.length;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* Fraction of each project's scroll range spent at rest before the strip
   moves on. 0 would be the old continuous roll; higher dwells longer. */
const HOLD = 0.62;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* Maps raw scroll progress to the strip position, so each project settles
   and holds, then transitions quickly into the next. */
function stripPosition(progress: number) {
  const s = progress * N;
  const index = Math.min(N - 1, Math.floor(s));
  const local = s - index;
  const t = clamp01((local - HOLD) / (1 - HOLD));
  const d = Math.min(index + easeInOutCubic(t), N - 1);
  return { index, d };
}

export default function RecentWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windowRef = useRef<HTMLAnchorElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    /* matchMedia rather than a one-shot innerWidth check: loading in a
       narrow window and then widening must bring the mechanism to life,
       and narrowing must tear it down cleanly. */
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
    setEnhanced(true);

    const container = containerRef.current!;
    const sticky = stickyRef.current!;
    const canvas = canvasRef.current!;

    filmstrip.mount(
      canvas,
      featured.map(p => p.palette as unknown as string[]),
      featured.map(p => p.image)
    );

    /* rects cached on resize — never read layout during scroll */
    let cTop = 0, cHeight = 0, vh = innerHeight, itemH = 0;
    const measure = () => {
      const r = container.getBoundingClientRect();
      const y = lenis ? lenis.scroll : window.scrollY;
      cTop = r.top + y;
      cHeight = container.offsetHeight;
      vh = innerHeight;
      const first = stripRef.current?.firstElementChild as HTMLElement | null;
      itemH = first ? first.offsetHeight : 0;
    };
    measure();
    addEventListener("resize", measure);

    let lastIndex = -1;
    let vel = 0;                       // smoothed, for the shader skew
    let frameScale = 1;                // the window's own scale, velocity-driven

    const update = () => {
      const y = lenis ? lenis.scroll : window.scrollY;
      const raw = (y - cTop) / Math.max(1, cHeight - vh);
      const progress = clamp01(raw);

      /* manual sticky: park above, travel with scroll inside, park below */
      let ty = 0;
      if (y < cTop) {
        ty = 0;
        sticky.classList.remove("is-sticky");
      } else if (y > cTop + cHeight - vh) {
        ty = cHeight - vh;
        sticky.classList.remove("is-sticky");
      } else {
        ty = y - cTop;
        sticky.classList.add("is-sticky");
      }
      sticky.style.transform = `translate3d(0, ${ty}px, 0)`;

      /* d holds steady through most of each project, then eases to the next */
      const { index, d } = stripPosition(progress);
      const dNorm = N > 1 ? d / (N - 1) : 0;

      /* Frame scale is driven by raw scroll velocity, not progress: it
         swells the moment you move and returns to exactly 1 when you stop.
         Fast attack / slow release gives the immediate "jump" on movement
         without a jolt on the way back. Transform only — no reflow — and
         the WebGL plane follows because it syncs to the live rect. */
      const rawVel = lenis ? (lenis as unknown as { velocity: number }).velocity ?? 0 : 0;
      const target = 1 + Math.min(0.075, Math.abs(rawVel) * 0.0016);
      frameScale += (target - frameScale) * (target > frameScale ? 0.4 : 0.075);
      if (Math.abs(target - frameScale) < 0.0004) frameScale = target;

      const wr = windowRef.current;
      if (wr) {
        wr.style.transform = `scale(${frameScale.toFixed(4)})`;
        const r = wr.getBoundingClientRect();
        const onScreen = r.bottom > 0 && r.top < vh && r.width > 0;
        filmstrip.rect = onScreen
          ? { x: r.left, y: r.top, w: r.width, h: r.height }
          : { x: 0, y: 0, w: 0, h: 0 };
      }
      filmstrip.progress = dNorm;
      vel += (rawVel - vel) * 0.15;
      filmstrip.velocity = gsap.utils.clamp(-3, 3, vel * 0.05);
      filmstrip.render();

      /* Titles are a vertical reel, not a crossfade, riding the same held
         value as the filmstrip — so type and image rest together on each
         project, then move to the next in one quick pass. */
      if (stripRef.current && itemH) {
        stripRef.current.style.transform = `translate3d(0, ${-d * itemH}px, 0)`;
      }

      /* ruler cursor — continuous, never stepped */
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translateY(${progress * 100}%)`;
      }

      /* background palette follows the active project */
      if (index !== lastIndex) {
        lastIndex = index;
        gradient.setPalette(featured[index].palette, 1.2);
      }
    };

    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
      removeEventListener("resize", measure);
      /* release the GL context so a later remount rebinds to a fresh canvas */
      filmstrip.unmount();
      setEnhanced(false);
      sticky.style.transform = "";
      sticky.classList.remove("is-sticky");
    };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="c-Work" aria-label="Recent work">
      {/* one fixed canvas for the whole filmstrip */}
      <canvas ref={canvasRef} className="c-Work-canvas" aria-hidden="true" />

      <div ref={containerRef} className="c-Work-content">
        {/* N empty spacers, 100vh each — these give the section its height */}
        {featured.map(p => (
          <div className="c-Work-project" key={`sp-${p.slug}`} aria-hidden="true" />
        ))}

        <div ref={stickyRef} className={"c-Work-sticky" + (enhanced ? " is-enhanced" : "")}>
          {/* LAYER A — images, behind */}
          <div className="c-Work-media" aria-hidden="true">
            <div className="row">
              <div className="col-13of24 offset-6of24 col-sm-12of12 offset-sm-0">
                <TransitionLink href={`/work/${featured[0].slug}`} className="c-Work-window-link">
                  <span ref={windowRef as never} className="c-Work-window" />
                </TransitionLink>
              </div>
            </div>
          </div>

          {/* LAYER B — text, on top, deliberately overlapping the image */}
          <div className="c-Work-layer">
            <div className="row">
              <div className="c-Work-ruler-container col-1of24 offset-2of24 col-sm-12of12 offset-sm-0">
                <div className="c-Work-ruler" aria-hidden="true">
                  {featured.map((p, i) => (
                    <div className="c-Work-ruler-cm" key={`cm-${p.slug}`}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <div className="c-Work-ruler-mm" key={`mm-${i}-${j}`} />
                      ))}
                    </div>
                  ))}
                  <span ref={cursorRef} className="c-Work-ruler-cursor" />
                </div>
              </div>

              <div className="c-Work-text col-9of24 col-sm-12of12 offset-sm-0">
                <div className="t-text--sm">Recent work</div>
                <div className="c-Work-titles">
                  <div ref={stripRef} className="c-Work-titles-strip">
                    {featured.map(p => (
                      <div className="c-Work-titles-item" key={p.slug}>
                        <h3 className="c-Work-title">
                          <span className="u-sr-only">{plainTitle(p.client, p.descriptor)}</span>
                          {slashChars(`${p.client} ▸ ${p.descriptor}`, p.slug)}
                        </h3>
                        <ul className="c-Work-categories">
                          {p.categories.map(c => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="c-Work-link col-7of24 offset-3of24 col-sm-12of12 offset-sm-0">
                {/* real links — every project reachable and crawlable without JS */}
                <ul className="c-Work-list">
                  {featured.map(p => (
                    <li key={p.slug}>
                      <TransitionLink href={`/work/${p.slug}`} cursor="View">
                        {plainTitle(p.client, p.descriptor)}
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <TransitionLink href="/work" className="c-Work-btn t-btn-primary" cursor="All work">
            <span>Discover all projects</span>
            <span className="arrow">→</span>
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
