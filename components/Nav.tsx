"use client";

import { useCallback, useEffect, useRef } from "react";
import SmartText, { type SmartTextHandle } from "./SmartText";
import { scrambleText } from "@/lib/smartText";

/* §6 — the centrepiece interaction.

   Collapsed (last scroll was DOWNWARD, and the stack is not hovered or
   focused): the labels slide up out of frame top-down, and one hairline
   per label draws in bottom-up behind them. Expanding reverses it and
   REPLAYS THE SCRAMBLE on every label — that's the moment the site shows
   off.

   The pairing is deliberately asymmetric in both axes: leaving is quick
   and top-down, arriving is slow and bottom-up. Rules retract in 0.3s but
   draw in over 1s, trailing the departing words by half a second, so the
   corner is never blank-then-populated — always mid-transformation.

   State is DIRECTION, not depth: scrolling up re-expands the nav wherever
   you are on the page. Item pitch 16rem, line pitch 11.55rem — the folded
   stack is tighter than the expanded list. */

/* One entry per section, in scroll order. Contact is deliberately absent —
   it has its own GET IN TOUCH control on the right of the bar.

   Labels are one word each and 5–9 characters, so the folded hairlines
   read as a set rather than a ragged column. The earlier mix ran WORK (4)
   against CASE SUBJECTS (13), which made the stack look accidental. */
const ITEMS = [
  { label: "ABOUT", href: "#about" },
  { label: "EXPERTISE", href: "#capabilities" },
  { label: "PROJECTS", href: "#work" },
  { label: "APPROACH", href: "#approach" },
  { label: "STUDIES", href: "#studies" }
];

export default function Nav() {
  const handles = useRef<(SmartTextHandle | null)[]>([]);
  const ctaA = useRef<HTMLSpanElement | null>(null);
  const ctaB = useRef<HTMLSpanElement | null>(null);

  /* Re-decode every label — but ONLY when the whole stack is expanding.

     Hovering a single link must not scramble its five neighbours; that
     reads as the nav malfunctioning rather than responding. Individual
     hover is the underline in _nav.scss and nothing else. The scramble
     belongs to the expansion event: hovering the folded stack, or
     scrolling back up.

     Delays mirror the CSS ladder in _nav.scss (0.30s → 0.12s, bottom-up)
     so each label decodes as it arrives. Fired at t=0 the scramble would
     finish before the words were back on screen. */
  const replay = useCallback(() => {
    handles.current.forEach((h, i) =>
      h?.play({ delay: 300 - i * 30, scrambleOnly: true })
    );
  }, []);

  /* Expansion has two triggers and they must behave identically. Hover is
     handled below; this catches the scroll-up case by watching the class
     the scroll layer toggles. */
  useEffect(() => {
    const html = document.documentElement;
    let wasCollapsed = html.classList.contains("is-down");
    const mo = new MutationObserver(() => {
      const collapsed = html.classList.contains("is-down");
      if (wasCollapsed && !collapsed) replay();
      wasCollapsed = collapsed;
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [replay]);

  /* Only replay the whole stack if the hover is what is doing the expanding. */
  const onEnter = useCallback(() => {
    if (document.documentElement.classList.contains("is-down")) replay();
  }, [replay]);

  /* Hovering one link decodes THAT link and nothing else, on top of the
     underline wipe. Suppressed while collapsed, where the group replay
     above already owns the scramble — running both would decode the same
     label twice from different start times. */
  const onItemEnter = useCallback((i: number) => {
    if (document.documentElement.classList.contains("is-down")) return;
    handles.current[i]?.play({ scrambleOnly: true });
  }, []);

  /* The CTA decodes on hover too. It uses scrambleText, not the full
     engine: the label is a rotated two-column run, and the engine's
     .line/.text boxes resolve to zero size in that context. Same pool and
     duration, no DOM rewrite. Both columns fire together so they read as
     one word resolving, not two labels. */
  const onContactEnter = useCallback(() => {
    if (ctaA.current) scrambleText(ctaA.current);
    if (ctaB.current) scrambleText(ctaB.current);
  }, []);

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__items" onMouseEnter={onEnter}>
        <div className="nav__lines" aria-hidden="true">
          {ITEMS.map((it) => (
            <span key={it.label} />
          ))}
        </div>

        {ITEMS.map((it, i) => (
          <a
            className="nav__item"
            key={it.label}
            href={it.href}
            onMouseEnter={() => onItemEnter(i)}
          >
            <SmartText
              trigger="manual"
              instanceRef={{
                get current() {
                  return handles.current[i] ?? null;
                },
                set current(v) {
                  handles.current[i] = v;
                }
              }}
            >
              {it.label}
            </SmartText>
          </a>
        ))}
      </div>

      <a className="nav__logo" href="#top">
        <span className="nav__logoText">Frank Fu</span>
      </a>

      {/* Two masks, not one: the reference sets the label as two vertical
          columns, and each needs its own sweep bar. */}
      <a className="nav__contact contact" href="#contact" onMouseEnter={onContactEnter}>
        <span className="buttonText">
          <span className="textMask">
            <span ref={ctaA}>GET IN</span>
            <span aria-hidden="true" />
          </span>
          <span className="textMask">
            <span ref={ctaB}>TOUCH</span>
            <span aria-hidden="true" />
          </span>
        </span>
        {/* arrow points ↘ at rest; the fold's rotate(-90deg) turns it ↗ */}
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle className="ring" cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
          <path className="arrow" d="M14 14 L26 26 M26 17 V26 H17" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </a>
    </nav>
  );
}
