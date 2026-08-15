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
  services: string[];
};

const CARDS: Card[] = [
  { n: "01", client: "STARBUCKS", descriptor: "SEARCH RELEVANCE — RANKING", href: "/work/starbucks-search", x: 50, w: 510, h: 400, p: -120, services: ["QUERY UNDERSTANDING", "RANKING MODEL", "OFFLINE EVALUATION", "ERROR TAXONOMY"] },
  { n: "02", client: "DOORDASH", descriptor: "CAUSAL INFERENCE — RDD", href: "/work/doordash-rdd", x: 780, w: 400, h: 314, p: 0, services: ["IDENTIFICATION", "ROBUSTNESS SUITE", "DECISION MEMO"] },
  { n: "03", client: "MULTI-AGENT RAG", descriptor: "RETRIEVAL — ACTIVATION", href: "/work/multi-agent-rag", x: 170, w: 510, h: 401, p: 8, services: ["AGENT PIPELINE", "VECTOR STORE", "TEST SUITE"] },
  { n: "04", client: "AI JOKE FACTORY", descriptor: "PRODUCT DESIGN — IDENTITY", href: "/work/ai-joke-factory", x: 910, w: 510, h: 401, p: 0, services: ["USER FLOWS", "BACKEND SPEC", "V2 REDESIGN"] },
  { n: "05", client: "DELL", descriptor: "M&A STRATEGY — VALUATION", href: "/work/dell-ma", x: 750, w: 310, h: 227, p: 53, services: ["VALUATION", "MARKET ANALYSIS"] }
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

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = wrap.getBoundingClientRect();
        /* -1 → 1 as the block travels through the viewport */
        const progress = 1 - (r.top + r.height / 2) / (window.innerHeight / 2 + r.height / 2);
        posRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.setProperty("--py", `${CARDS[i].p * progress}rem`);
        });
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="work" id="work">
      <div className="work__head">
        <SmartText className="small">04 — SELECTED WORK</SmartText>
        <SmartText className="small">( 5 )</SmartText>
      </div>

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
              <span className="card__media" aria-hidden="true">
                <span className="card__n">{c.n}</span>
              </span>
              <span className="bottom">
                <span className="subtitle">{c.descriptor}</span>
                <span className="card__client">{c.client}</span>
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
