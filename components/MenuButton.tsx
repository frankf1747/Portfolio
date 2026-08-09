"use client";

/* Floating menu button — fades/scales in once past the hero, then stays
   fixed. Opens the full-screen navigation overlay. Not a play/pause. */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lenis, prefersReduced } from "@/lib/motion";
import TransitionLink from "./TransitionLink";

export default function MenuButton() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    let shown = false;
    const update = () => {
      const y = lenis ? lenis.scroll : window.scrollY;
      const should = y > innerHeight * 0.9;
      if (should === shown) return;
      shown = should;
      if (prefersReduced()) {
        btn.style.opacity = should ? "1" : "0";
        btn.style.pointerEvents = should ? "auto" : "none";
        return;
      }
      gsap.to(btn, {
        opacity: should ? 1 : 0,
        scale: should ? 1 : 0.7,
        duration: 0.5,
        ease: "expo.out",
        onStart: () => { btn.style.pointerEvents = should ? "auto" : "none"; }
      });
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    if (prefersReduced()) {
      panelRef.current.style.display = open ? "flex" : "none";
      return;
    }
    if (open) {
      panelRef.current.style.display = "flex";
      gsap.fromTo(panelRef.current, { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: "expo.inOut" });
    } else {
      gsap.to(panelRef.current, {
        yPercent: -100, duration: 0.5, ease: "expo.inOut",
        onComplete: () => { if (panelRef.current) panelRef.current.style.display = "none"; }
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="c-MenuBtn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        data-cursor={open ? "Close" : "Menu"}
      >
        <span className="c-MenuBtn-bars" aria-hidden="true">
          <i /><i />
        </span>
      </button>

      <div ref={panelRef} className="c-MenuPanel" role="dialog" aria-modal="true" aria-label="Navigation">
        <nav className="c-MenuPanel-nav">
          <TransitionLink href="/" cursor="Home"><span onClick={() => setOpen(false)}>Home</span></TransitionLink>
          <TransitionLink href="/work" cursor="Work"><span onClick={() => setOpen(false)}>Work</span></TransitionLink>
          <TransitionLink href="/about" cursor="About"><span onClick={() => setOpen(false)}>About</span></TransitionLink>
          <a href="mailto:frankfu1747@gmail.com" data-cursor="Email">Contact</a>
        </nav>
      </div>
    </>
  );
}
