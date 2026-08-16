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
     5.00  ONLY NOW does the subtitle start. At 3.9s it began while the
           overture was still 46% on screen, so the headline and the
           subtitle were painted over each other for 1.1s. The subtitle
           also starts 70rem low and rides up as it resolves, so it
           arrives into the space the overture just vacated instead of
           having been sitting there the whole time.
     6.50  subtitle settled                                        */

/* The landing timeline. T = 0 is the moment the curtain begins to fade.
   Two layers travel different distances on different curves and are never
   parented to each other — that difference IS the effect. The overture
   covers a full viewport height on a launch curve; the content covers
   ~60vh on a soft one, so the headline visibly outruns it. */
const EXIT_AT = 1900; //  overture launches   — 1.6s ease-launch, clears at 3.5
const CONTENT_AT = 2200; //  content rides up — 2.4s ease-content
const SUB_AT = 3400; //  subtitle decodes    — 1.5s rise
const NAV_AT = 3500; //  nav, wordmark, CTA  — 0.9s fade
const END_AT = 4600; //  timeline over, scroll unlocked

/* §5 hero copy constraint: three lines, two words, 11–13 chars,
   roughly equal — equal lengths are what make the dense scramble
   block read as one object. 13 / 13 / 12. */
const LINES = ["DENSE SIGNALS", "CLEAR CHOICES", "SHIPPED WORK"];

export default function Hero() {
  const [exiting, setExiting] = useState(false);
  const [contentIn, setContentIn] = useState(false);
  const [subIn, setSubIn] = useState(false);
  const heroRefs = useRef<(SmartTextHandle | null)[]>([]);
  const subRef = useRef<SmartTextHandle | null>(null);

  useEffect(() => {
    const timers: number[] = [];

    const start = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      heroRefs.current.forEach((h, i) => h?.play({ delay: i * 100 }));

      /* reduced motion: straight to the resting state. The curtain fade is
         the only thing that still plays. */
      if (reduced) {
        subRef.current?.resolve();
        setExiting(true);
        setContentIn(true);
        setSubIn(true);
        document.documentElement.dataset.nav = "in";
        window.dispatchEvent(new Event("site:intro-end"));
        return;
      }

      timers.push(window.setTimeout(() => setExiting(true), EXIT_AT));
      timers.push(window.setTimeout(() => setContentIn(true), CONTENT_AT));
      timers.push(
        window.setTimeout(() => {
          setSubIn(true);
          subRef.current?.play();
        }, SUB_AT)
      );
      timers.push(
        window.setTimeout(() => {
          document.documentElement.dataset.nav = "in";
        }, NAV_AT)
      );
      /* separate attribute from data-nav on purpose — one flips at 3.5s and
         must STAY flipped, the other at 4.6s. Reusing a single attribute
         would unset the nav's own selector when the second write lands. */
      timers.push(window.setTimeout(() => window.dispatchEvent(new Event("site:intro-end")), END_AT));
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

      {/* the second layer — travels ~60vh against the overture's 100vh, on a
          softer curve, so the headline outruns it rather than the two
          sliding as one sheet. Never parent these to each other. */}
      <div className={`hero__content${contentIn ? " is-in" : ""}`}>
        <div className={`hero__sub${subIn ? " is-in" : ""}`}>
          <SmartText trigger="manual" instanceRef={subRef} className="h1">
            — DATA-LED PRODUCT DESIGN
          </SmartText>
        </div>

        <div className="hero__meta">
          <span>SEARCH · CAUSAL INFERENCE · AGENTS</span>
          <span className="hero__cue">SCROLL TO VIEW MORE ↓</span>
          <span>©2026</span>
        </div>
      </div>
    </section>
  );
}
