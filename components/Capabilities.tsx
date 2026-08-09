"use client";

/* Capabilities: sticky eyebrow left; service rows right. On hover the row
   shifts, its hairline draws, and a palette thumbnail follows the cursor. */

import { useEffect, useRef } from "react";
import { isTouch, prefersReduced } from "@/lib/motion";

const SERVICES = [
  { t: "Analytics & causal inference", d: "Experiments, RDD, honest uncertainty", g: ["#23418a", "#aadfd9"] },
  { t: "Search & relevance", d: "Query understanding, ranking, evaluation", g: ["#16254b", "#e64f0f"] },
  { t: "Product management", d: "Specs people build from, scope people thank you for", g: ["#8f0d1c", "#ffd9c2"] },
  { t: "UX & prototyping", d: "Flows, wireframes, working prototypes", g: ["#4f5a1e", "#b7c46a"] },
  { t: "AI systems", d: "RAG pipelines, agents, tests that keep them honest", g: ["#1a1c0d", "#c25a20"] }
];

export default function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTouch() || prefersReduced()) return;
    const root = rootRef.current!, thumb = thumbRef.current!;
    let x = 0, y = 0, rx = 0, ry = 0, raf = 0, on = false;

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
    };
    root.addEventListener("pointermove", move, { passive: true });
    const loop = () => {
      rx += (x - rx) * 0.1; ry += (y - ry) * 0.1;
      thumb.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -110%) scale(${on ? 1 : 0.6})`;
      thumb.style.opacity = on ? "1" : "0";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    root.querySelectorAll<HTMLElement>(".c-Caps-row").forEach((row, i) => {
      row.addEventListener("pointerenter", () => {
        on = true;
        thumb.style.background = `linear-gradient(135deg, ${SERVICES[i].g[0]}, ${SERVICES[i].g[1]})`;
      });
      row.addEventListener("pointerleave", () => { on = false; });
    });

    return () => { root.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={rootRef} className="c-Caps" aria-label="What I do">
      <div className="c-Caps-side">
        <p className="u-eyebrow">What I do</p>
      </div>
      <ul className="c-Caps-list">
        {SERVICES.map((s) => (
          <li className="c-Caps-row" key={s.t}>
            <h3 className="c-Caps-name">{s.t}</h3>
            <p className="c-Caps-desc u-muted">{s.d}</p>
          </li>
        ))}
      </ul>
      <div ref={thumbRef} className="c-Caps-thumb" aria-hidden="true" />
    </section>
  );
}
