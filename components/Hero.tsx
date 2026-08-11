"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrushField from "./BrushField";
import CenterFigure from "./CenterFigure";
import FocusMotifs from "./FocusMotifs";

export type Focus = "data" | "product" | "design";

const FOCUSES: { id: Focus; label: string; index: string }[] = [
  { id: "data", label: "DATA", index: "01" },
  { id: "product", label: "PRODUCT", index: "02" },
  { id: "design", label: "DESIGN", index: "03" }
];

/* Rotation dwell, jittered per step so the cycle never feels metronomic. */
const DWELL_MIN = 3500;
const DWELL_MAX = 4500;

const NAV = [
  { href: "/about", label: "ABOUT" },
  { href: "/work", label: "WORK" },
  { href: "/experiments", label: "EXPERIMENTS" },
  { href: "/contact", label: "CONTACT" }
];

export default function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [focus, setFocusState] = useState<Focus>("data");
  const [leaving, setLeaving] = useState<Focus | null>(null);
  const [reduced, setReduced] = useState(false);

  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const focusRef = useRef<Focus>(focus);
  focusRef.current = focus;

  /* --- burst -------------------------------------------------------- */
  /* Restarts the stroke-burst animation. The class has to be removed and
     re-added across a forced reflow, otherwise the animation won't replay. */
  const animateBrushBurst = useCallback(() => {
    const el = rootRef.current;
    if (!el || reduced) return;
    el.classList.remove("is-bursting");
    void el.offsetWidth;
    el.classList.add("is-bursting");
  }, [reduced]);

  /* --- focus -------------------------------------------------------- */
  const setFocus = useCallback(
    (next: Focus) => {
      const current = focusRef.current;
      if (next === current) return;
      setLeaving(current);
      setFocusState(next);
      animateBrushBurst();
      window.setTimeout(() => setLeaving((l) => (l === current ? null : l)), 1300);
    },
    [animateBrushBurst]
  );

  /* --- rotation ----------------------------------------------------- */
  const startFocusRotation = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (reduced) return; // reduced motion: the user drives the hero manually
    const dwell = DWELL_MIN + Math.random() * (DWELL_MAX - DWELL_MIN);
    timerRef.current = window.setTimeout(() => {
      if (!pausedRef.current && !document.hidden) {
        const i = FOCUSES.findIndex((f) => f.id === focusRef.current);
        setFocus(FOCUSES[(i + 1) % FOCUSES.length].id);
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
  /* One class flips the whole intro on. Every element's own transition-delay
     does the staggering, so the sequence stays in CSS and lands inside 1.5s. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.classList.add("is-ready"));
    return () => cancelAnimationFrame(id);
  }, []);

  /* --- reduced motion ----------------------------------------------- */
  useEffect(() => {
    function setupReducedMotion() {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => setReduced(mq.matches);
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    return setupReducedMotion();
  }, []);

  /* --- parallax ------------------------------------------------------ */
  useEffect(() => {
    function setupParallax() {
      const el = rootRef.current;
      if (!el) return;

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (reduced || !fine.matches) {
        el.style.setProperty("--px", "0");
        el.style.setProperty("--py", "0");
        return;
      }

      let tx = 0;
      let ty = 0;
      let cx = 0;
      let cy = 0;
      let raf = 0;

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
      };

      /* Critically-damped-ish follow. 0.075 keeps the field lagging the
         cursor enough to feel like weight rather than a rigid attachment. */
      const tick = () => {
        cx += (tx - cx) * 0.075;
        cy += (ty - cy) * 0.075;
        el.style.setProperty("--px", cx.toFixed(4));
        el.style.setProperty("--py", cy.toFixed(4));
        raf = requestAnimationFrame(tick);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    }
    return setupParallax();
  }, [reduced]);

  const wordState = (id: Focus) => (id === focus ? "active" : id === leaving ? "leaving" : "idle");

  return (
    <section
      ref={rootRef}
      className="c-hero"
      data-focus={focus}
      data-reduced={reduced ? "true" : "false"}
      aria-labelledby="hero-title"
    >
      {/* Displacement filters that roughen every brush mark into paint.
          Defined once; referenced by BrushField as url(#fx-rough-*). */}
      <svg className="c-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="fx-rough-s" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055 0.11" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
          </filter>
          <filter id="fx-rough-m" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.07" numOctaves="3" seed="23" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="13" />
          </filter>
          <filter id="fx-rough-l" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.045" numOctaves="3" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="22" />
          </filter>
          <filter id="fx-rough-xl" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.024" numOctaves="3" seed="41" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="38" />
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
      </svg>

      {/* REPLACE-ME: final painted background plate goes here, behind everything
          (see public/assets/README.md — /assets/background.webp). */}
      <div className="c-hero__ground" aria-hidden="true" />

      <div className="c-layer" data-depth="bg" aria-hidden="true">
        <BrushField layer="back" />
        <FocusMotifs />
      </div>

      <div className="c-layer" data-depth="type">
        <h1 className="c-word" id="hero-title">
          <span className="u-sr">Frank Fu — data, product, design.</span>
          <span className="c-word__stack" aria-hidden="true">
            {FOCUSES.map((f) => (
              <span key={f.id} className="c-word__item" data-state={wordState(f.id)}>
                {f.label}
              </span>
            ))}
          </span>
        </h1>
      </div>

      <div className="c-layer" data-depth="mid" aria-hidden="true">
        <BrushField layer="mid" />
      </div>

      <div className="c-layer" data-depth="figure">
        <div className="c-figure">
          <CenterFigure />
        </div>
      </div>

      <div className="c-layer" data-depth="fore" aria-hidden="true">
        <BrushField layer="fore" />
      </div>

      {/* ---------- editorial furniture, pinned to the four corners ---------- */}
      <div className="c-ui">
        <div className="c-ui__tl">
          <a className="c-mark-word" href="/">
            FRANK&nbsp;FU
          </a>
          <p className="c-kicker">Data · Product · Design</p>
        </div>

        <nav className="c-ui__tr c-nav" aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                {/* Routes don't exist yet — swap to next/link once they do. */}
                <a className="c-nav__link" href={n.href}>
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="c-ui__bl c-statement">
          I explore complex systems and turn them into clearer decisions, products, and
          experiences.
        </p>

        <div className="c-ui__br c-focus">
          <p className="c-focus__legend" id="focus-legend">
            Focus
          </p>
          <ul aria-describedby="focus-legend">
            {FOCUSES.map((f) => {
              const active = f.id === focus;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    className="c-focus__btn"
                    aria-pressed={active}
                    onClick={() => {
                      setFocus(f.id);
                      startFocusRotation(); // user input resets the dwell
                    }}
                    onFocus={() => (pausedRef.current = true)}
                    onBlur={() => (pausedRef.current = false)}
                    onMouseEnter={() => (pausedRef.current = true)}
                    onMouseLeave={() => (pausedRef.current = false)}
                  >
                    <span className="c-focus__idx">{f.index}</span>
                    <span className="c-focus__label">{f.label}</span>
                    {/* Non-colour state cue: a bar that fills, plus aria-pressed. */}
                    <span className="c-focus__bar" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
