"use client";

import { useEffect, useRef, useState } from "react";
import SmartText, { type SmartTextHandle } from "../SmartText";

/* §5 — the landing sequence, to the measured timeline.

   ★ The 245rem headline is an OVERTURE ONLY. It plays once, exits
   upward, and never comes back. The resting hero is the subtitle, the
   bottom meta row, and the reel. It is not scroll-linked — which is
   exactly why the page reads as a title card.

   t=0 is the moment the loader begins to fade.
     0.00  lines rise (CSS delay 0.10s + 1.4s travel) and scramble,
           the three scrambles staggered +0/+100/+200ms
     1.50  headline is fully risen AND fully resolved
     2.60  title container begins exiting upward — a 1.1s HOLD on the
           settled headline, which is the whole point of an overture.
           This used to fire at 1.28s, i.e. 0.22s BEFORE the lines had
           finished rising: the page lifted away mid-animation, so there
           was never a moment where the headline simply sat there.
     5.00  container has reached translateY(-100%) and stays
     5.40  subtitle settles                                        */

const EXIT_AT = 2600;
const SUB_AT = 3900;

/* §5 hero copy constraint: three lines, two words, 11–13 chars,
   roughly equal — equal lengths are what make the dense scramble
   block read as one object. 13 / 13 / 12. */
const LINES = ["DENSE SIGNALS", "CLEAR CHOICES", "SHIPPED WORK"];

export default function Hero() {
  const [exiting, setExiting] = useState(false);
  const heroRefs = useRef<(SmartTextHandle | null)[]>([]);
  const subRef = useRef<SmartTextHandle | null>(null);

  useEffect(() => {
    const timers: number[] = [];

    const start = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      heroRefs.current.forEach((h, i) => h?.play({ delay: i * 100 }));

      if (reduced) {
        subRef.current?.resolve();
        setExiting(true);
        return;
      }

      timers.push(window.setTimeout(() => setExiting(true), EXIT_AT));
      timers.push(window.setTimeout(() => subRef.current?.play(), SUB_AT));
    };

    window.addEventListener("site:reveal", start, { once: true });
    return () => {
      window.removeEventListener("site:reveal", start);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const bind = (i: number) => ({
    get current() {
      return heroRefs.current[i] ?? null;
    },
    set current(v: SmartTextHandle | null) {
      heroRefs.current[i] = v;
    }
  });

  return (
    <section className="hero" id="top">
      <div className={`hero__overture${exiting ? " is-exiting" : ""}`} aria-hidden="true">
        <h1 className="hero__title">
          {LINES.map((l, i) => (
            <SmartText key={l} trigger="manual" instanceRef={bind(i)} className="super">
              {l}
            </SmartText>
          ))}
        </h1>
      </div>

      {/* the accessible heading — the overture above is decorative */}
      <h1 className="u-sr">
        Frank Fu — data-led product design. Dense signals, clear choices, shipped work.
      </h1>

      <div className="hero__sub">
        <SmartText trigger="manual" instanceRef={subRef} className="h1">
          — DATA-LED PRODUCT DESIGN
        </SmartText>
      </div>

      <div className="hero__meta">
        <span>SEARCH · CAUSAL INFERENCE · AGENTS</span>
        <span className="hero__cue">SCROLL</span>
        <span>©2026</span>
      </div>
    </section>
  );
}
