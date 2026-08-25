"use client";

import { useEffect, useRef, useState } from "react";
import SmartText, { type SmartTextHandle } from "../SmartText";
import { introSeen, markIntroSeen } from "../introSeen";

/* §5 — the landing sequence, to the measured timeline.

   ★ The 245rem headline is an OVERTURE ONLY. It plays once, exits
   upward, and never comes back. The resting hero is the subtitle, the
   bottom meta row, and the reel. It is not scroll-linked — which is
   exactly why the page reads as a title card.

   t=0 is the moment the loader begins to fade.
     0.00  lines rise (CSS delay 0.10s + 2.0s travel) and scramble, the
           three decodes staggered +0/+100/+200ms and running 2.2s each
     2.10  lines have finished travelling
     2.40  the last character of the last line locks — SETTLED
     2.40  ↓ THE HOLD. Nothing moves for 0.3s. Short on purpose: it is a
           BEAT, not a stop — just enough that the headline registers as
           finished before it is carried off, without the page reading as
           though it has stalled. It was 1.1s and that was too long.
           Whatever the length, nothing else may animate inside this
           window; one moving element anywhere on screen destroys it.
     2.70  title container begins exiting upward, 2.0s
     4.70  container has reached translateY(-100%) and stays
     4.70  ONLY NOW does the subtitle arrive, into the space the overture
           just vacated. Starting it while the overture is still on
           screen paints the two over each other.
     5.00  timeline over, scroll unlocked

   The exit curve changed with the hold. It used to be --ease-launch, an
   ease-in-expo that is imperceptible for most of its travel — which was
   fine when it started at 0.5s UNDER a running decode, because the
   creep was covered. Started cold after a deliberate pause, that same
   creep reads as the page having frozen. --ease-lift breaks away from
   rest cleanly, so the hold ends on a visible departure. */

/* The landing timeline. T = 0 is the moment the curtain begins to fade.
   Two layers travel different distances on different curves and are never
   parented to each other — that difference IS the effect. The overture
   covers a full viewport height; the content covers ~60vh on a softer
   curve, so the headline visibly outruns it. */
/* SETTLED_AT is DERIVED, not chosen: it is the overture pace's scrambleMs
   in lib/smartText.ts (2200) plus the 200ms stagger the third line starts
   on. Everything below is measured from it, so the whole landing re-times
   itself off one number when the decode speed changes. */
const SETTLED_AT = 2400; //  last overture character locks
const HOLD_MS = 300; //      the beat on the finished headline
const EXIT_AT = SETTLED_AT + HOLD_MS; //  2.7s — overture launches, 2.0s
const EXIT_MS = 2000; //     matches the transition on .hero__overture
const CONTENT_AT = EXIT_AT + 500; //  4.0s — content rides up, 2.4s
const SUB_AT = EXIT_AT + EXIT_MS; //  5.5s — as the overture clears
const NAV_AT = SUB_AT + 100; //       nav, wordmark, CTA — 0.9s fade
const END_AT = SUB_AT + 300; //       timeline over, scroll unlocked

/* §5 hero copy constraint: three lines, two words, 11–13 chars,
   roughly equal — equal lengths are what make the dense scramble
   block read as one object. 13 / 13 / 13. */
const LINES = ["GOAL ORIENTED", "TOTAL CLARITY", "REAL ADOPTION"];

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
      /* One overture per session (see introSeen.ts). A return visit —
         browser back from a project, the ALL PROJECTS link — lands on the
         same settled state the reduced-motion path uses, and intro-end
         fires immediately so ScrollProvider never holds the page. The
         flag is written when the full overture STARTS, so bailing out
         mid-launch doesn't re-arm it for the next page. */
      const skip = reduced || introSeen();
      markIntroSeen();

      /* reduced motion / return visit: straight to the resting state. The
         curtain fade is the only thing that still plays. */
      if (skip) {
        heroRefs.current.forEach((h) => h?.resolve());
        subRef.current?.resolve();
        setExiting(true);
        setContentIn(true);
        setSubIn(true);
        document.documentElement.dataset.nav = "in";
        window.dispatchEvent(new Event("site:intro-end"));
        return;
      }

      heroRefs.current.forEach((h, i) => h?.play({ delay: i * 100 }));

      timers.push(window.setTimeout(() => setExiting(true), EXIT_AT));
      timers.push(window.setTimeout(() => setContentIn(true), CONTENT_AT));
      timers.push(
        window.setTimeout(() => {
          setSubIn(true);
          /* rises and fades in, but does NOT decode. The overture has just
             spent three lines of scramble making its point; repeating the
             effect on the line that follows it dilutes it, and this one
             is the first plain statement of what the site is. */
          subRef.current?.play({ riseOnly: true });
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

  /* Built ONCE. These are handed to SmartText as `instanceRef`, and a
     binder rebuilt on every render used to remount the engine on every
     state flip of this component — the first of which lands at +0.5s,
     half a second into a 2.6s overture. That is what made the headline
     stop dead and jump to its resting position instead of decoding and
     travelling all the way in. */
  const binders = useRef(
    LINES.map((_, i) => ({
      get current() {
        return heroRefs.current[i] ?? null;
      },
      set current(v: SmartTextHandle | null) {
        heroRefs.current[i] = v;
      }
    }))
  );
  const bind = (i: number) => binders.current[i];

  return (
    <section className="hero" id="top">
      <div className={`hero__overture${exiting ? " is-exiting" : ""}`} aria-hidden="true">
        <h1 className="hero__title">
          {LINES.map((l, i) => (
            <SmartText key={l} trigger="manual" pace="overture" instanceRef={bind(i)} className="super">
              {l}
            </SmartText>
          ))}
        </h1>
      </div>

      {/* the accessible heading — the overture above is decorative */}
      <h1 className="u-sr">
        Frank Fu, data-centric product dreamer. Goal oriented, total clarity,
        real adoption.
      </h1>

      {/* the second layer — travels ~60vh against the overture's 100vh, on a
          softer curve, so the headline outruns it rather than the two
          sliding as one sheet. Never parent these to each other. */}
      <div className={`hero__content${contentIn ? " is-in" : ""}`}>
        <div className={`hero__sub${subIn ? " is-in" : ""}`}>
          <SmartText trigger="manual" instanceRef={subRef} className="h1">
            — DATA-CENTRIC PRODUCT DREAMER
          </SmartText>
        </div>

        <div className="hero__meta">
          <span className="hero__disciplines">SCOPE · EVIDENCE · ADOPTION</span>
          <span className="hero__cue">SCROLL TO VIEW MORE ↓</span>
          {/* Availability sits with the copyright rather than in its own
              slot: the row is a three-column space-between, and a fourth
              child would pull the scroll cue off centre. */}
          <span className="hero__right">
            <span className="hero__open">OPEN TO WORK</span>
            <span>©2026</span>
          </span>
        </div>
      </div>
    </section>
  );
}
