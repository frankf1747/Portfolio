"use client";

import { useCallback, useRef } from "react";
import SmartText, { type SmartTextHandle } from "./SmartText";

/* §6 — the centrepiece interaction.

   Collapsed (scrolled, not hovered): the seven labels slide up out of
   frame and seven accent hairlines draw in, top-down. Expanding runs the
   reverse bottom-up, and REPLAYS THE SCRAMBLE on every label — that's the
   moment the site shows off. Lines draw in at 0.3s but retract at 1s;
   the asymmetry is deliberate.

   Item pitch 16rem, line pitch 11.55rem — the collapsed stack is tighter
   than the expanded list. */

const ITEMS = [
  { label: "WORK", href: "#work" },
  { label: "ABOUT", href: "#about" },
  { label: "CAPABILITIES", href: "#capabilities" },
  { label: "APPROACH", href: "#approach" },
  { label: "SUBJECTS", href: "#subjects" },
  { label: "WRITING", href: "#writing" },
  { label: "CONTACT", href: "#contact" }
];

export default function Nav() {
  const handles = useRef<(SmartTextHandle | null)[]>([]);

  /* every expansion re-decodes all seven labels */
  const replay = useCallback(() => {
    handles.current.forEach((h, i) => h?.play({ delay: i * 40, scrambleOnly: true }));
  }, []);

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__items" onMouseEnter={replay}>
        <div className="nav__lines" aria-hidden="true">
          {ITEMS.map((it) => (
            <span key={it.label} />
          ))}
        </div>

        {ITEMS.map((it, i) => (
          <a className="nav__item" key={it.label} href={it.href}>
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

      <a className="nav__logo" href="#top" aria-label="Frank Fu — home">
        <svg viewBox="0 0 156 54" aria-hidden="true">
          <text
            x="0"
            y="40"
            fontFamily="var(--font-mono)"
            fontSize="38"
            letterSpacing="-1.5"
            fill="currentColor"
          >
            FF
          </text>
          <circle cx="132" cy="27" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </a>

      <a className="nav__contact contact" href="#contact">
        <span className="buttonText">
          <span className="textMask">
            <span>GET IN TOUCH</span>
            <span aria-hidden="true" />
          </span>
        </span>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle className="ring" cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
          <path className="arrow" d="M14 26 L26 14 M17 14 H26 V23" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {/* collapsed state leaves exactly one short bar, mirroring the
            seven hairlines on the left */}
        <span className="nav__contactBar" aria-hidden="true" />
      </a>
    </nav>
  );
}
