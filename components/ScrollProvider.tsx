"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import type { VirtualScrollData } from "lenis";

/* §0 + §3 boot layer.

   - data-touch on <html>, so desktop-only effects can be gated
   - --start-vh captured on first paint and FROZEN, so a mobile URL-bar
     resize can never retrigger the intro geometry
   - Lenis smooth scroll (the only animation library on the site)
   - .is-start / .is-down state machine that the nav reads */

/* `intro` is the landing's launch gate. Sub-pages have no Hero, so nothing
   would ever dispatch site:intro-end and the reader would sit through the
   full 9s failsafe unable to scroll. They pass intro={false}.

   `snap` is a selector whose elements become one-gesture-per-step stops.
   It lives here rather than in the component that wants it because Lenis is
   scoped to this effect and never exposed — same reason the overlay lock is
   an event. Landing passes nothing and scrolls freely. */
export default function ScrollProvider({
  intro = true,
  snap
}: {
  intro?: boolean;
  snap?: string;
}) {
  useEffect(() => {
    const html = document.documentElement;

    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    html.dataset.touch = touch ? "true" : "false";

    /* Frozen for the life of the page — never updated once it holds a real
       height. The `> 0` test is load-bearing: an embedded or prerendering
       viewport can report innerHeight 0 on first paint, and "0px" is a
       truthy property value, so the old guard froze the hero at zero
       height for good and the whole landing played inside a collapsed
       box. Leave it unset until a real measurement arrives. */
    if (
      window.innerHeight > 0 &&
      parseFloat(html.style.getPropertyValue("--start-vh") || "0") <= 0
    ) {
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

    /* THE STACK'S PAUSE — a travel cap, not a gate.

       Two failed shapes first, because they bound this one. lenis/snap is
       registered as debounce(onSnap, 500): it watches a flick sail through
       the whole stack and tidies up afterwards. Replacing it with a gate
       that swallowed wheel events gave one-gesture-one-piece, but reading
       it back on a real trackpad: gestures inside the quiet window were
       eaten outright, and the lock felt like a dead stop. Blocking INPUT is
       what felt broken — so nothing is blocked any more.

       Instead the DELTA is clamped. Lenis calls `virtualScroll` for every
       raw wheel event before applying it, and mutating data.deltaY there is
       honoured (the source destructures after the hook returns). Each
       gesture gets a bound: the first piece-centre meaningfully past where
       the gesture began, or the page edge when none is. Every event spends
       its delta freely up to that bound and not a pixel past it, so Lenis
       eases into the stop on its own curve — the pause is the easing, not a
       freeze. Header and exit sit outside the stops and scroll free.

       A "gesture" ends three ways, because a trackpad tail must not absorb
       the next flick (the failure the gate had):
         - quiet: a gap over QUIET_MS since the last event
         - reversal: the delta changes sign
         - a spike: a delta clearly above the envelope, but ONLY once the
           tail has decayed below 0.4x the gesture's peak. The peak guard is
           load-bearing: a flick RAMPS before it decays (20, 60, 130...),
           and without the guard every step of the ramp read as a new
           gesture — each one re-bounded from further along, and past the
           last piece the only bound left is the page end, which is why a
           hard flick from piece two sailed to the bottom with no pause on
           three.
       Any of these re-bounds from wherever the target now is — a second
       flick mid-tail advances one more piece instead of dying.

       The settle is the same magnetism, backwards: when the wheel goes
       quiet and the rest point is within half a viewport of a piece, ease
       onto its centre. Gentle browsing far from the stack never triggers
       it, and it uses a plain scrollTo with no lock, so a new gesture
       simply takes over mid-settle.

       Touch passes through untouched — phones keep free scroll, and the
       mobile layout drops the 100vh blocks anyway. Keyboard and scrollbar
       never enter Lenis, so they stay native, which also keeps the page
       accessible. */
    const QUIET_MS = 180;
    let lastT = 0;
    let prevAbs = 0;
    let peakAbs = 0;
    let sign = 0;
    let bound: number | null = null;
    let settleTimer = 0;

    const gate = (data: VirtualScrollData): boolean => {
      const event = data.event as WheelEvent;
      if (event.type.includes("touch")) return true;

      const l = lenis;
      if (!l || !snap) return true;
      const d = data.deltaY;
      const dir = Math.sign(d);
      if (dir === 0) return true;

      const now = performance.now();
      const gap = now - lastT;
      lastT = now;
      const abs = Math.abs(d);
      const spike = abs > prevAbs * 1.5 + 6 && prevAbs < peakAbs * 0.4;
      const fresh = gap > QUIET_MS || dir !== sign || spike;
      prevAbs = abs;
      peakAbs = fresh ? abs : Math.max(peakAbs, abs);
      sign = dir;

      const vh = window.innerHeight;
      const stops = Array.from(
        document.querySelectorAll<HTMLElement>(snap),
        (el) => {
          const r = el.getBoundingClientRect();
          return Math.round(r.top + window.scrollY + r.height / 2 - vh / 2);
        }
      );
      if (!stops.length) return true;

      if (fresh) {
        /* The quarter-viewport margin is load-bearing: re-bounding from
           "the next stop past the target" with no margin meant a settle
           that had not quite landed left the next bound 8px away, and the
           following flick travelled 8px — which reads as a dead wheel. */
        /* 0.15vh, down from 0.25: the margin only exists so a settle that
           has not quite landed cannot re-bind to the stop it is sitting on
           (a bound 8px away reads as a dead wheel). At 0.25 it had a second
           effect: resting late in a section put the next stop inside the
           margin and the bound skipped a whole piece. */
        const from = l.targetScroll;
        bound =
          dir > 0
            ? (stops.find((v) => v > from + vh * 0.15) ?? Math.round(l.limit))
            : ([...stops].reverse().find((v) => v < from - vh * 0.15) ?? 0);
      }

      /* Scheduled before the zero-delta return below: a clamped-to-zero
         event is still gesture activity, and the settle must not fire in
         the middle of a tail just because the tail is pinned at the bound. */
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const l2 = lenis;
        if (!l2) return;
        const y = l2.scroll;
        const near = stops.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
        const dist = Math.abs(near - y);
        if (dist > 2 && dist <= vh / 2) l2.scrollTo(near, { duration: 0.7 });
      }, 350);

      if (bound !== null) {
        const room = bound - l.targetScroll;
        const clamped = dir > 0 ? Math.min(d, Math.max(0, room)) : Math.max(d, Math.min(0, room));
        if (clamped === 0) {
          /* Lenis treats a zero-delta wheel event as "no gesture" and
             returns BEFORE its own preventDefault — so at the bound the
             browser would scroll natively past the stop with the rest of
             the momentum. Prevent it here and skip Lenis outright. */
          if (event.cancelable) event.preventDefault();
          return false;
        }
        data.deltaY = clamped;
      }

      return true;
    };

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        virtualScroll: snap ? gate : undefined
      });
      if (intro) {
        lenis.stop();
        html.dataset.locked = "true";
      } else {
        unlocked = true;
      }
      const tick = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      unlocked = true;
    }

    window.addEventListener("site:intro-end", unlock, { once: true });
    const failsafe = intro ? window.setTimeout(unlock, 9000) : 0;

    /* Overlay scroll lock. Lenis is scoped to this effect, so anything that
       needs to freeze the page has to ask through an event — setting
       data-locked alone stops the native document but leaves Lenis
       consuming wheel input and scrolling behind the panel.

       Guarded on `unlocked` so a lock arriving mid-intro cannot start Lenis
       early on release. */
    const lock = () => {
      lenis?.stop();
      html.dataset.locked = "true";
    };
    const relock = () => {
      if (!unlocked) return;
      lenis?.start();
      html.removeAttribute("data-locked");
    };
    window.addEventListener("site:lock", lock);
    window.addEventListener("site:unlock", relock);

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
      window.removeEventListener("site:lock", lock);
      window.removeEventListener("site:unlock", relock);
      window.clearTimeout(settleTimer);
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
