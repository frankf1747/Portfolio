"use client";

/* Selected Work — pinned deck, ~100vh per project, scrubbed.
   Titles mask out/in; cards stack-wipe vertically; the background gradient
   crossfades to each project's palette as it becomes active.
   Left edge: dotted ruler with a ▸ progress marker.
   Below 1024px this unpins into a plain vertical stack (CSS + no pin). */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gradient } from "@/lib/gradient";
import { projects } from "@/data/projects";
import TransitionLink from "./TransitionLink";

gsap.registerPlugin(ScrollTrigger);

const FEATURED = projects.slice(0, 4);

export default function SelectedWork() {
  const rootRef = useRef<HTMLElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
    const root = rootRef.current!;
    const slides = [...root.querySelectorAll<HTMLElement>(".c-Work-slide")];
    const N = slides.length;
    let active = -1;

    gsap.set(slides, { autoAlpha: 0 });

    const activate = (idx: number, prev: number) => {
      gradient.setPalette(FEATURED[idx].palette);
      if (prev >= 0) {
        gsap.to(slides[prev], { autoAlpha: 0, y: -40, duration: 0.45, ease: "expo.out", overwrite: true });
      }
      gsap.fromTo(slides[idx],
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out", overwrite: true });
      gsap.fromTo(slides[idx].querySelectorAll(".u-line-inner"),
        { yPercent: 112 }, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 });
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: `+=${N * 100}%`,
      pin: root.querySelector(".c-Work-stage"),
      scrub: 0.6,
      onToggle(self) {
        /* entering the section from either direction shows the right slide */
        if (self.isActive && active === -1) { active = 0; activate(0, -1); }
      },
      onUpdate(self) {
        const idx = Math.min(N - 1, Math.floor(self.progress * N));
        if (markerRef.current)
          markerRef.current.style.top = `${8 + self.progress * 84}%`;
        gradient.setScroll(self.progress * 0.6 + 0.2);
        if (idx !== active) {
          const prev = active;
          active = idx;
          activate(idx, prev);
        }
      }
    });
    return () => st.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="c-Work" aria-label="Selected work">
      <div className="c-Work-stage">
        <div className="c-Work-ruler" aria-hidden="true">
          {FEATURED.map((_, i) => <i key={i} />)}
          <span ref={markerRef} className="c-Work-marker">▸</span>
        </div>

        {FEATURED.map((p, i) => (
          <article className="c-Work-slide" key={p.slug}>
            <div className="c-Work-text">
              <p className="u-eyebrow">Selected work — {p.index}</p>
              <h2 className="c-Work-title">
                <span className="u-line"><span className="u-line-inner">{p.title}</span></span>
              </h2>
              <p className="c-Work-tags u-muted">{p.tags.join(" · ").toUpperCase()}</p>
              <TransitionLink href={`/work/${p.slug}`} className="c-Work-open" cursor="Open project">
                Open project →
              </TransitionLink>
            </div>
            <TransitionLink href={`/work/${p.slug}`} className="c-Work-card" cursor="View">
              <div
                className="c-Work-cardArt"
                style={{ background: `linear-gradient(135deg, ${p.palette[1]}, ${p.palette[2]} 60%, ${p.palette[3]})` }}
              />
            </TransitionLink>
          </article>
        ))}
      </div>

      <div className="c-Work-cta">
        <TransitionLink href="/work" className="u-pill" cursor="All work">
          View all work →
        </TransitionLink>
      </div>
    </section>
  );
}
