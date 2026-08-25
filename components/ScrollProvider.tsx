"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import type { VirtualScrollData } from "lenis";
import { introSeen } from "./introSeen";

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
    /* `intro` is the page's claim; whether the lock actually arms also
       depends on the session — a return visit skips the overture (see
       introSeen.ts), so locking for it would freeze the page for nothing.
       Read once here: Hero writes the flag later in this same page load,
       and re-reading would see that write. */
    const introActive = intro && !introSeen();

    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      lenis?.start();
      document.documentElement.removeAttribute("data-locked");
      /* The lock also swallowed the browser's own jump to a #hash target:
         overflow:hidden clamps the document, Next's anchor scroll no-ops,
         and nothing re-applied it — so /#work landed the reader at the
         top of a page that would not scroll. Re-apply it here, at the
         first moment scrolling exists. */
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el) {
        if (lenis) lenis.scrollTo(el, { immediate: true });
        else el.scrollIntoView();
      }
    };

    /* THE STACK'S PAUSE — one gesture, one glide.

       Three shapes failed before this one, and each failure named the next
       constraint:

         lenis/snap is debounce(onSnap, 500) — it watches a flick sail
         through the whole stack and tidies up afterwards.

         Swallowing wheel events until a quiet gap gave one-gesture-one-
         section, but gestures inside the quiet window were eaten outright
         and the lock read as a dead stop. So input must never be blocked
         without producing motion.

         Clamping each delta against the room left to the next stop kept
         every gesture moving, but the tail's decaying deltas could not
         cover the last stretch: the page crept, stopped short, and a
         separate correction shoved it the rest of the way.

         Committing that last stretch to scrollTo mid-glide removed the
         creep and introduced a surge — Lenis eases with easeOutExpo, whose
         speed at t=0 is ~6.9x the average, so handing it 380px over 1s
         restarts the motion at ~2600px/s. Against a glide already running
         at ~1500px/s that is a visible jump, arriving exactly where the
         landing should be calmest.

       The lesson across all four: any motion STARTED MID-GESTURE has to
       match the velocity already on screen, and none of these can. So this
       does not start mid-gesture. It decides at the FIRST event of a
       gesture, when the page is at rest, and animates the whole way to the
       next stop in one move with an ease-in-out — gentle at both ends
       because both ends are stationary. The rest of the gesture, momentum
       tail and all, is swallowed: there is nothing left to decide, and
       nothing that could fight the animation in flight.

       A gesture ends three ways, so the next flick is never eaten:
         - quiet: a gap over QUIET_MS
         - reversal: the delta changes sign
         - a spike: a delta well above a tail that has already decayed past
           40% of its peak. The peak guard matters — a flick RAMPS before it
           decays, and without it every step of the ramp read as a new
           gesture.

       Aiming is off targetScroll, not scroll, so a second flick mid-glide
       advances one more section instead of re-aiming at the one in flight.

       Touch passes through untouched — phones keep free scroll, and the
       mobile layout drops the 100vh blocks anyway. Keyboard and scrollbar
       never enter Lenis, so they stay native, which also keeps the page
       accessible. */
    const QUIET_MS = 180;
    const MARGIN = 0.15;
    /* Ease in AND out. Lenis's own easeOutExpo is right for chasing a
       moving wheel target and wrong here: it opens at full speed, which is
       precisely the jolt this is built to avoid. */
    const EASE = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

    let lastT = 0;
    let prevAbs = 0;
    let peakAbs = 0;
    let sign = 0;

    const gate = (data: VirtualScrollData): boolean => {
      const event = data.event as WheelEvent;
      if (event.type.includes("touch")) return true;

      const l = lenis;
      if (!l || !snap) return true;
      const dir = Math.sign(data.deltaY);
      if (dir === 0) return true;

      const vh = window.innerHeight;
      const stops = Array.from(
        document.querySelectorAll<HTMLElement>(snap),
        (el) => {
          const r = el.getBoundingClientRect();
          return Math.round(r.top + window.scrollY + r.height / 2 - vh / 2);
        }
      );
      if (!stops.length) return true;
      const from = l.targetScroll;

      /* RELEASE AT THE END — tested FIRST, and that ordering is the whole
         point. Everything below swallows every event of a gesture after
         its first, so releasing further down meant one delta per flick
         reached Lenis and the rest of the momentum was thrown away: the
         page nudged, then stuck. That is the drag.

         Past the last stop and still heading down, the reader is done with
         the stack. Hand the event back untouched — no preventDefault, no
         bookkeeping, nothing managed — and let the page scroll exactly as
         it does anywhere else on the site.

         The gesture state is cleared on the way out so that re-entering
         from below counts as a fresh gesture rather than the tail of
         whatever flick carried the reader out. Upward is untouched:
         scrolling back up re-enters the stack and picks up its stops. */
      if (dir > 0 && from >= stops[stops.length - 1] - vh * MARGIN) {
        lastT = 0;
        prevAbs = 0;
        peakAbs = 0;
        sign = 0;
        return true;
      }

      /* Lenis only calls preventDefault AFTER this hook, so anything
         swallowed here has to be prevented here — otherwise the browser
         scrolls natively and the gate gates nothing. */
      if (event.cancelable) event.preventDefault();

      const now = performance.now();
      const gap = now - lastT;
      lastT = now;
      const abs = Math.abs(data.deltaY);
      const spike = abs > prevAbs * 1.5 + 6 && prevAbs < peakAbs * 0.4;
      const fresh = gap > QUIET_MS || dir !== sign || spike;
      prevAbs = abs;
      peakAbs = fresh ? abs : Math.max(peakAbs, abs);
      sign = dir;

      if (!fresh) return false;

      /* The margin only exists so a landing a few pixels short cannot aim
         at the stop it is already sitting on — an 8px target reads as a
         dead wheel. Small on purpose: at 0.25vh, resting late in a section
         put the next stop inside the margin and a whole piece was skipped. */
      const target =
        dir > 0
          ? (stops.find((v) => v > from + vh * MARGIN) ?? Math.round(l.limit))
          : ([...stops].reverse().find((v) => v < from - vh * MARGIN) ?? 0);

      /* Duration follows distance, so a short hop is not stretched to the
         same beat as a full section. */
      const span = Math.abs(target - from) / vh;
      l.scrollTo(target, {
        duration: Math.max(0.6, Math.min(span * 1.15, 1.45)),
        easing: EASE
      });
      return false;
    };

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        virtualScroll: snap ? gate : undefined
      });
      if (introActive) {
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
    const failsafe = introActive ? window.setTimeout(unlock, 9000) : 0;

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
