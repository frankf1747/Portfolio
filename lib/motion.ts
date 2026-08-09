/* Motion core: Lenis driven from gsap.ticker, ScrollTrigger wired via
   scrollerProxy. One ease token everywhere. */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
export const easeExpo = "expo.out";
export const DUR = { fast: 0.4, base: 0.8, slow: 1.4 };

export let lenis: Lenis | null = null;

export const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

let booted = false;

export function bootMotion() {
  if (booted || typeof window === "undefined") return;
  booted = true;

  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced() || isTouch()) return; // native scroll on touch / reduced

  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });

  /* drive Lenis from gsap's ticker — one clock for everything */
  gsap.ticker.add((time) => {
    lenis!.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  /* Lenis v1 smooths the native window scroll, so ScrollTrigger's default
     scroller is already correct — no scrollerProxy needed. */
  lenis.on("scroll", ScrollTrigger.update);
  ScrollTrigger.refresh();
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate });
  else window.scrollTo(0, 0);
}

/* Split an element's text into line spans for clip-path reveals */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  el.textContent = "";
  const measure = words.map(w => {
    const span = document.createElement("span");
    span.textContent = w + " ";
    span.style.display = "inline-block";
    el.appendChild(span);
    return span;
  });
  const lines: HTMLElement[] = [];
  let currentTop: number | null = null;
  let bucket: HTMLSpanElement[] = [];
  const flush = () => {
    if (!bucket.length) return;
    const line = document.createElement("span");
    line.className = "u-line";
    const inner = document.createElement("span");
    inner.className = "u-line-inner";
    inner.textContent = bucket.map(s => s.textContent).join("");
    line.appendChild(inner);
    lines.push(line);
    bucket = [];
  };
  measure.forEach(span => {
    const top = span.offsetTop;
    if (currentTop === null) currentTop = top;
    if (top !== currentTop) { flush(); currentTop = top; }
    bucket.push(span);
  });
  flush();
  el.textContent = "";
  lines.forEach(l => el.appendChild(l));
  return lines.map(l => l.querySelector(".u-line-inner") as HTMLElement);
}

export function revealLines(lines: HTMLElement[], delay = 0) {
  gsap.fromTo(
    lines,
    { yPercent: 110 },
    { yPercent: 0, duration: DUR.base, ease: easeExpo, stagger: 0.04, delay }
  );
}
