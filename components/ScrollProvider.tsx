"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/* §0 + §3 boot layer.

   - data-touch on <html>, so desktop-only effects can be gated
   - --start-vh captured on first paint and FROZEN, so a mobile URL-bar
     resize can never retrigger the intro geometry
   - Lenis smooth scroll (the only animation library on the site)
   - .is-start / .is-down state machine that the nav reads */

export default function ScrollProvider() {
  useEffect(() => {
    const html = document.documentElement;

    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    html.dataset.touch = touch ? "true" : "false";

    /* frozen for the life of the page — never updated */
    if (!html.style.getPropertyValue("--start-vh")) {
      html.style.setProperty("--start-vh", `${window.innerHeight}px`);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let raf = 0;

    /* Nothing scrolls during the intro — the landing is all transforms, and
       a scroll mid-launch would fight the two layers travelling at
       different rates. Unlocked by Hero at T+4.6.

       The safety timer is not optional: if Hero throws or never mounts,
       the event never fires and the page would be permanently unscrollable.
       Whatever happens, scrolling is restored. */
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      lenis?.start();
      document.documentElement.removeAttribute("data-locked");
    };

    if (!reduced) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.stop();
      html.dataset.locked = "true";
      const tick = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      unlocked = true;
    }

    window.addEventListener("site:intro-end", unlock, { once: true });
    const failsafe = window.setTimeout(unlock, 9000);

    /* §6 nav state is DIRECTION, not depth — scrolling up re-expands the
       nav wherever you are, rather than only at the top.

       The 4px deadband is load-bearing: without it trackpad micro-jitter
       flips the class every frame and the nav shimmers. Much above ~8px
       and deliberate short flicks stop registering. */
    let last = 0;
    let dir: "up" | "down" = "up";

    const applyState = (y: number) => {
      const d = y - last;
      if (Math.abs(d) > 4) {
        dir = d > 0 ? "down" : "up";
        last = y;
      }
      html.classList.toggle("is-start", y <= 2);
      html.classList.toggle("is-down", dir === "down" && y > 2);
    };

    applyState(window.scrollY);

    const onScroll = ({ scroll }: { scroll: number }) => applyState(scroll);
    const onNative = () => applyState(window.scrollY);

    if (lenis) lenis.on("scroll", onScroll);
    else window.addEventListener("scroll", onNative, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      window.removeEventListener("site:intro-end", unlock);
      html.removeAttribute("data-locked");
      if (lenis) {
        lenis.off("scroll", onScroll);
        lenis.destroy();
      } else {
        window.removeEventListener("scroll", onNative);
      }
      html.classList.remove("is-start", "is-down");
    };
  }, []);

  return null;
}
