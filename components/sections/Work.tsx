"use client";

import { useEffect, useRef } from "react";
import SmartText from "../SmartText";

/* §9 — scattered, overlapping cards.

   Geometry and per-card parallax offsets are the measured values. The
   parallax rides a wrapper so `.card`'s own 1s transform transition is
   left free for the hover scale, and never lags the scroll.

   Suppression is blur + scale only — opacity NEVER changes — and the
   reset is bound to .cards, not .card, so moving between two cards
   never passes through a neutral frame. */

type Card = {
  n: string;
  client: string;
  descriptor: string;
  href: string;
  x: number;
  w: number;
  h: number;
  /** scroll parallax offset in design px */
  p: number;
  /** cursor parallax depth, 0 = pinned, 1 = full travel */
  d: number;
  services: string[];
};

const CARDS: Card[] = [
  { n: "01", client: "STARBUCKS", descriptor: "SEARCH RELEVANCE — RANKING", href: "/work/starbucks-search", x: 40, w: 510, h: 400, p: -120, d: 1, services: ["QUERY UNDERSTANDING", "RANKING MODEL", "OFFLINE EVALUATION", "ERROR TAXONOMY"] },
  { n: "02", client: "DOORDASH", descriptor: "CAUSAL INFERENCE — RDD", href: "/work/doordash-rdd", x: 800, w: 400, h: 314, p: 0, d: 0.45, services: ["IDENTIFICATION", "ROBUSTNESS SUITE", "DECISION MEMO"] },
  { n: "03", client: "MULTI-AGENT RAG", descriptor: "RETRIEVAL — ACTIVATION", href: "/work/multi-agent-rag", x: 120, w: 510, h: 401, p: 8, d: 0.8, services: ["AGENT PIPELINE", "VECTOR STORE", "TEST SUITE"] },
  { n: "04", client: "AI JOKE FACTORY", descriptor: "PRODUCT DESIGN — IDENTITY", href: "/work/ai-joke-factory", x: 830, w: 510, h: 401, p: 0, d: 0.6, services: ["USER FLOWS", "BACKEND SPEC", "V2 REDESIGN"] },
  { n: "05", client: "DELL", descriptor: "M&A STRATEGY — VALUATION", href: "/work/dell-ma", x: 300, w: 310, h: 227, p: 53, d: 0.3, services: ["VALUATION", "MARKET ANALYSIS"] }
];

export default function Work() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const posRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* parallax + entry */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-in");
      },
      { threshold: 0.15 }
    );
    posRefs.current.forEach((el) => el && io.observe(el));

    if (reduced) return () => io.disconnect();

    /* MAX_SHIFT is in design px, so it scales with the rem trick like
       everything else. It is the FULL travel of the deepest card (d = 1)
       from centre to either edge of the block; every other card gets
       MAX_SHIFT × its own d, so raising this spreads the whole scatter
       apart rather than sliding it as a sheet — the depth difference
       between cards grows with it, which is the point.

       42 is roughly 8% of the widest frame, up from 26 (~5%), which was
       too reticent to read as parallax at all until you went looking for
       it. Going much past this starts to detach the cards from the
       cursor and the scatter reads as unstable.

       LERP moved with it. It is the fraction of the remaining distance
       covered per frame, so at a fixed 0.08 a longer throw simply takes
       longer to arrive — the cards would have travelled further but felt
       heavier, which is the opposite of the intent. 0.10 keeps roughly
       the original settle time across the bigger distance. */
    const MAX_SHIFT = 42;
    const LERP = 0.1;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = wrap.getBoundingClientRect();
      /* -1 → 1 across the block in both axes */
      targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
      targetY = ((e.clientY - r.top) / r.height) * 2 - 1;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);

      curX += (targetX - curX) * LERP;
      curY += (targetY - curY) * LERP;

      const r = wrap.getBoundingClientRect();
      /* -1 → 1 as the block travels through the viewport */
      const progress =
        1 - (r.top + r.height / 2) / (window.innerHeight / 2 + r.height / 2);

      posRefs.current.forEach((el, i) => {
        if (!el) return;
        const c = CARDS[i];
        el.style.setProperty("--py", `${c.p * progress + curY * MAX_SHIFT * c.d}rem`);
        el.style.setProperty("--px", `${curX * MAX_SHIFT * c.d}rem`);
      });
    };

    raf = requestAnimationFrame(frame);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="work" id="work">
      <h2 className="work__title">
        {/* decodes slower than the other section headings on purpose —
            it is the title of the block the page is built around */}
        <SmartText as="span" className="h1" pace="slow">PROJECTS</SmartText>
        <span className="work__count" aria-hidden="true">({CARDS.length})</span>
      </h2>

      <div className="cards" ref={wrapRef}>
        {CARDS.map((c, i) => (
          <div
            key={c.n}
            className="card__pos"
            ref={(el) => {
              posRefs.current[i] = el;
            }}
            style={
              {
                "--x": `${c.x}rem`,
                "--w": `${c.w}rem`,
                "--h": `${c.h}rem`,
                "--ar": c.w / c.h
              } as React.CSSProperties
            }
          >
            {/* Routes don't exist yet — swap to next/link once they do. */}
            <a className="card" href={c.href}>
              <span className="card__media" aria-hidden="true" />
              <span className="bottom">
                <span className="card__title">
                  <span className="card__n">({c.n})</span>
                  <span className="card__client">{c.client}</span>
                </span>
                <span className="subtitle">{c.descriptor}</span>
                <span className="services">
                  {c.services.map((s, si) => (
                    <span key={s} style={{ "--i": si } as React.CSSProperties}>
                      {s}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
