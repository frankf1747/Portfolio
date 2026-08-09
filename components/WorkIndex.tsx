"use client";

/* Work index: one project per row. Hover fades in a palette plane that
   skews with scroll velocity (Lenis velocity → CSS var). Filter chips. */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { projects, disciplines } from "@/data/projects";
import { lenis, prefersReduced } from "@/lib/motion";
import TransitionLink from "./TransitionLink";

export default function WorkIndex() {
  const [filter, setFilter] = useState<(typeof disciplines)[number]>("all");
  const rootRef = useRef<HTMLElement>(null);

  /* scroll velocity → skew on the hover planes */
  useEffect(() => {
    if (prefersReduced() || !lenis) return;
    const root = rootRef.current!;
    const onScroll = (e: { velocity: number }) => {
      root.style.setProperty("--vskew", `${gsap.utils.clamp(-6, 6, e.velocity * 0.35)}deg`);
    };
    lenis.on("scroll", onScroll);
    return () => { lenis?.off("scroll", onScroll); };
  }, []);

  const visible = projects.filter(p => filter === "all" || p.discipline === filter);

  return (
    <section ref={rootRef} className="c-Index" aria-label="All work">
      <p className="u-eyebrow c-Index-eyebrow">Work index</p>

      <div className="c-Index-filters" role="group" aria-label="Filter by discipline">
        {disciplines.map(d => (
          <button
            key={d}
            className={"u-pill u-pill--small" + (filter === d ? " is-active" : "")}
            onClick={() => setFilter(d)}
            data-cursor="Filter"
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      <ul className="c-Index-list">
        {visible.map(p => (
          <li className="c-Index-row" key={p.slug}>
            <TransitionLink href={`/work/${p.slug}`} className="c-Index-link" cursor="Open">
              <span className="c-Index-num u-muted">{p.index}</span>
              <span className="c-Index-title">{p.title}</span>
              <span className="c-Index-year u-muted">{p.year}</span>
              <span className="c-Index-tags u-muted">{p.tags.join(" · ")}</span>
              <span
                className="c-Index-plane"
                aria-hidden="true"
                style={{ background: `linear-gradient(120deg, ${p.palette[1]}, ${p.palette[2]} 55%, ${p.palette[3]})` }}
              />
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
