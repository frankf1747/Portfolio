"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GraffitiWall from "./GraffitiWall";
import GraffitiPiece, { PIECES } from "./GraffitiPiece";
import SprayCanvas, { type SprayHandle } from "./SprayCanvas";

export type Focus = "data" | "product" | "design";

/* Rotation dwell, jittered per step so the cycle never feels metronomic. */
const DWELL_MIN = 3800;
const DWELL_MAX = 4800;

const NAV = [
  { href: "/about", label: "ABOUT" },
  { href: "/work", label: "WORK" },
  { href: "/experiments", label: "EXPERIMENTS" },
  { href: "/contact", label: "CONTACT" }
];

/* Spray-cap colours for the interactive layer. */
const CAPS = [
  { id: "acid", label: "Acid green paint", value: "#c6f53c" },
  { id: "pink", label: "Hot pink paint", value: "#ff4fae" },
  { id: "cyan", label: "Cyan paint", value: "#2fd8f5" }
];

export default function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [focus, setFocusState] = useState<Focus>("data");
  const [leaving, setLeaving] = useState<Focus | null>(null);
  const [reduced, setReduced] = useState(false);
  const [cap, setCap] = useState(0);
  const [hinted, setHinted] = useState(false);

  const sprayRef = useRef<SprayHandle | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const focusRef = useRef<Focus>(focus);
  focusRef.current = focus;

  /* --- focus rotation ------------------------------------------------ */
  const setFocus = useCallback((next: Focus) => {
    const current = focusRef.current;
    if (next === current) return;
    setLeaving(current);
    setFocusState(next);
    window.setTimeout(() => setLeaving((l) => (l === current ? null : l)), 1200);
  }, []);

  const startFocusRotation = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (reduced) return; // reduced motion: the visitor drives the wall manually
    const dwell = DWELL_MIN + Math.random() * (DWELL_MAX - DWELL_MIN);
    timerRef.current = window.setTimeout(() => {
      if (!pausedRef.current && !document.hidden) {
        const i = PIECES.findIndex((p) => p.id === focusRef.current);
        setFocus(PIECES[(i + 1) % PIECES.length].id);
      }
      startFocusRotation();
    }, dwell);
  }, [reduced, setFocus]);

  useEffect(() => {
    startFocusRotation();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [startFocusRotation]);

  /* --- entrance ------------------------------------------------------ */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.classList.add("is-ready"));
    return () => cancelAnimationFrame(id);
  }, []);

  /* --- reduced motion ------------------------------------------------ */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const wordState = (id: Focus) =>
    id === focus ? "active" : id === leaving ? "leaving" : "idle";

  return (
    <section
      ref={rootRef}
      className="g-hero"
      data-focus={focus}
      data-reduced={reduced ? "true" : "false"}
      aria-labelledby="hero-title"
    >
      <GraffitiWall />

      <div className="g-stage">
        <GraffitiPiece focus={focus} leaving={leaving} wordState={wordState} />

        {/* the artist's signature under the piece */}
        <p className="g-sig" aria-hidden="true">
          — frank fu <span className="g-sig__year">’26</span>
        </p>
      </div>

      {/* visitors' paint lands above the artwork, below the furniture */}
      <SprayCanvas
        color={CAPS[cap].value}
        onFirstSpray={() => setHinted(true)}
        handleRef={sprayRef}
      />

      <p className="g-hint" data-done={hinted ? "true" : "false"} aria-hidden="true">
        psst — press &amp; drag to spray
      </p>

      {/* ---------- furniture ---------- */}
      <div className="g-ui">
        <div className="g-ui__tl">
          <a className="g-name" href="/">
            {/* the crown every king gets */}
            <svg className="g-name__crown" viewBox="0 0 80 44" aria-hidden="true">
              <path
                d="M8 38 L 12 12 L 26 26 L 40 6 L 54 26 L 68 12 L 72 38 Z"
                fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round"
              />
            </svg>
            FRANK FU
          </a>
          <p className="g-kicker">data · product · design — los angeles</p>
        </div>

        <nav className="g-ui__tr g-nav" aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                {/* Routes don't exist yet — swap to next/link once they do. */}
                <a className="g-nav__link" href={n.href}>
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* wheat-pasted poster carrying the statement */}
        <div className="g-ui__bl g-poster">
          <p className="g-poster__head">FRANK FU — PORTFOLIO</p>
          <p className="g-poster__body">
            I explore complex systems and turn them into clearer decisions,
            products, and experiences.
          </p>
          <p className="g-poster__foot">
            EST. LOS ANGELES · SEARCH RELEVANCE · CAUSAL INFERENCE · AI AGENTS
          </p>
        </div>

        {/* title selector, styled as stencilled crate labels */}
        <div className="g-ui__br g-focus">
          <p className="g-focus__legend" id="focus-legend">
            NOW SHOWING
          </p>
          <ul aria-describedby="focus-legend">
            {PIECES.map((p) => {
              const active = p.id === focus;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="g-focus__btn"
                    aria-pressed={active}
                    onClick={() => {
                      setFocus(p.id);
                      startFocusRotation();
                    }}
                    onFocus={() => (pausedRef.current = true)}
                    onBlur={() => (pausedRef.current = false)}
                    onMouseEnter={() => (pausedRef.current = true)}
                    onMouseLeave={() => (pausedRef.current = false)}
                  >
                    <span className="g-focus__idx">{p.index}</span>
                    <span className="g-focus__label">{p.label}</span>
                    {/* non-colour state cue: the splat behind the active row */}
                    <svg
                      className="g-focus__splat"
                      viewBox="0 0 120 44"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M12 24 C 8 12, 24 4, 44 6 C 60 2, 84 2, 100 8 C 116 14, 116 30, 102 36 C 84 44, 58 42, 40 40 C 22 42, 14 34, 12 24 Z" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* the visitor's spray kit */}
          <div className="g-kit" role="group" aria-label="Spray paint controls">
            {CAPS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className="g-kit__cap"
                style={{ "--cap": c.value } as React.CSSProperties}
                aria-label={c.label}
                aria-pressed={cap === i}
                onClick={() => setCap(i)}
              />
            ))}
            <button
              type="button"
              className="g-kit__buff"
              onClick={() => sprayRef.current?.clear()}
            >
              BUFF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
