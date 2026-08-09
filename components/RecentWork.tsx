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

export default function RecentWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windowRef = useRef<HTMLAnchorElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    if (prefersReduced() || innerWidth < 1024) return;
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
    let cTop = 0, cHeight = 0, vh = innerHeight;
    const measure = () => {
      const r = container.getBoundingClientRect();
      const y = lenis ? lenis.scroll : window.scrollY;
      cTop = r.top + y;
      cHeight = container.offsetHeight;
      vh = innerHeight;
    };
    measure();
    addEventListener("resize", measure);

    let lastIndex = -1;
    let vel = 0;

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

      const scaled = progress * (N - 1);
      const index = Math.min(N - 1, Math.floor(progress * N));
      const local = progress * N - Math.floor(progress * N);

      /* filmstrip: rect in CSS px, top-left origin */
      const wr = windowRef.current;
      if (wr) {
        const r = wr.getBoundingClientRect();
        const onScreen = r.bottom > 0 && r.top < vh && r.width > 0;
        filmstrip.rect = onScreen
          ? { x: r.left, y: r.top, w: r.width, h: r.height }
          : { x: 0, y: 0, w: 0, h: 0 };
      }
      filmstrip.progress = progress;
      vel += ((lenis ? (lenis as unknown as { velocity: number }).velocity ?? 0 : 0) - vel) * 0.15;
      filmstrip.velocity = gsap.utils.clamp(-3, 3, vel * 0.05);
      filmstrip.render();

      /* titles: outgoing fades in place, incoming rises 40px, last ~20% */
      const t = clamp01((local - 0.8) / 0.2);
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        let o = 0, ty2 = 40;
        if (i === index) { o = 1 - t; ty2 = 0; }
        else if (i === index + 1) { o = t; ty2 = 40 * (1 - t); }
        el.style.opacity = String(o);
        el.style.transform = `translateY(${ty2}px)`;
        el.classList.toggle("is-active", i === index);
        el.classList.toggle("is-next", i === index + 1);
      });

      /* ruler cursor — continuous, never stepped */
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translateY(${progress * 100}%)`;
      }

      /* background palette follows the active project */
      if (index !== lastIndex) {
        lastIndex = index;
        gradient.setPalette(featured[index].palette, 1.2);
      }
      void scaled;
    };

    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
      removeEventListener("resize", measure);
    };
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
                  {featured.map((p, i) => (
                    <div
                      className={"c-Work-titles-item" + (i === 0 ? " is-active" : " is-next")}
                      key={p.slug}
                      ref={el => { itemsRef.current[i] = el; }}
                    >
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
