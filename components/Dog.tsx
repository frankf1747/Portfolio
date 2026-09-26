"use client";

import { useEffect, useRef } from "react";

/* The dog. A small sketched companion that wanders the viewport, slowly,
   and stops now and then to do nothing much.

   Drawn in the page's own hand: ink line over paper fill, pushed through
   the #wobS filter like the contact ring, with the accent spent on a collar
   and a tongue. Because the filter's noise is fixed in place while the legs
   move through it, the lines "boil" slightly as it walks — the classic look
   of hand-drawn animation, for free.

   FIXED, not absolute: it roams the screen you are looking at, so it keeps
   you company down the whole scroll instead of living in one section.
   pointer-events: none throughout — it walks over links, never blocks them.

   BEHAVIOUR. With a mouse on the page it FOLLOWS the cursor: walks to it,
   trotting when it has fallen far behind, and stops a little short so it
   is never underneath it. Once there it watches — turning to face the
   cursor, panting, now and then sniffing or glancing about — and if the
   cursor sits still for a while it lies down for a nap, waking when it
   moves again. With no mouse (touch, or the pointer off the page) it
   WANDERS instead: walk to a random point, idle a few seconds, repeat.
   STAMINA. Walking tires it, trotting tires it faster, idling recovers.
   Run it ragged and it drops where it stands and sleeps (zZZ) for a few
   seconds — and a tired dog is not woken by the cursor; it gets up when it
   has slept. Then it is fresh and follows again.

   All poses are CSS, keyed off data-mode (and data-pace for the trot);
   this file only moves the dog and chooses what it does next.

   Arrives after the intro (html[data-nav="in"]), walking in from the left.
   Under reduced motion it does not move at all: it is found asleep in the
   bottom-right corner. */

type Mode = "walk" | "stand" | "sniff" | "look" | "lie";

/* mode, weight, duration range in seconds. The nap is rarer and longer. */
const IDLES: [Mode, number, [number, number]][] = [
  ["stand", 4, [2, 4.5]],
  ["sniff", 3, [2, 3.5]],
  ["look", 2, [2.5, 4]],
  ["lie", 2, [5, 9]]
];

/* Design px per second — multiplied by the root unit, so the pace scales
   with the dog. Slow enough to read as ambling, not travelling. */
const SPEED = 42;
/* the trot, used when following and the cursor is far off */
const RUN = 120;
/* following: stop within NEAR of the cursor, set off again past FAR —
   the gap between them stops it twitching at the boundary */
const NEAR = 70;
const FAR = 130;
/* a still cursor this long, and the dog lies down */
const NAP_AFTER = 8000;
/* Stamina, in "tiredness seconds": walking adds 1/s, trotting 2.5/s,
   standing about takes 1.5/s off. Past TIRED it sleeps where it stands,
   for SLEEP_FOR seconds, and wakes fully rested. 26 ≈ half a minute of
   ambling after the cursor, or ~10s of chasing it at a trot. */
const TIRED = 26;
const SLEEP_FOR: [number, number] = [6, 10];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Dog() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let face = 1;
    let mode: Mode = "walk";
    let until = 0;
    let lookAt = 0;
    let raf = 0;
    let last = performance.now();
    /* the cursor, while there is one on the page */
    let cx: number | null = null;
    let cy: number | null = null;
    let lastMove = 0;
    let tiredness = 0;
    let sleepUntil = 0;

    const unit = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 1;

    /* Kept off the top 90px so it never tangles with the nav. */
    const bounds = () => {
      const r = el.getBoundingClientRect();
      return {
        minX: 16,
        maxX: Math.max(16, window.innerWidth - r.width - 16),
        minY: 90,
        maxY: Math.max(90, window.innerHeight - r.height - 16)
      };
    };

    const setMode = (m: Mode) => {
      mode = m;
      el.dataset.mode = m;
    };

    const setPace = (fast: boolean) => {
      el.dataset.pace = fast ? "run" : "walk";
    };

    /* the idles while it keeps the cursor company: mostly watching */
    const WATCH: [Mode, number, [number, number]][] = [
      ["stand", 5, [2.5, 5]],
      ["sniff", 2, [1.5, 3]],
      ["look", 1, [2, 3]]
    ];
    const pick = (list: typeof IDLES, now: number) => {
      const total = list.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * total;
      for (const [m, w, [a, b]] of list) {
        r -= w;
        if (r <= 0) {
          setMode(m);
          until = now + rand(a, b) * 1000;
          lookAt = now + rand(500, 1200);
          return;
        }
      }
    };

    const place = () => {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.setProperty("--face", String(face));
    };

    /* Next destination. Tries for a stretch of moderate length — long enough
       to be a walk, short enough that it is not forever crossing the whole
       screen edge to edge. */
    const newTarget = () => {
      const b = bounds();
      const far = Math.max(window.innerWidth, window.innerHeight) * 0.6;
      for (let i = 0; i < 10; i++) {
        tx = rand(b.minX, b.maxX);
        ty = rand(b.minY, b.maxY);
        const d = Math.hypot(tx - x, ty - y);
        if (d > 140 && d < far) break;
      }
      setMode("walk");
    };

    const idle = (now: number) => {
      const total = IDLES.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * total;
      for (const [m, w, [a, b]] of IDLES) {
        r -= w;
        if (r <= 0) {
          setMode(m);
          until = now + rand(a, b) * 1000;
          lookAt = now + rand(500, 1200);
          return;
        }
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const b = bounds();
      x = b.maxX;
      y = b.maxY;
      setMode("lie");
      place();
      return;
    }

    /* Enter from off the left edge, low on the screen. */
    {
      const b = bounds();
      x = -el.getBoundingClientRect().width;
      y = rand(b.minY + (b.maxY - b.minY) * 0.6, b.maxY);
      newTarget();
      place();
    }

    /* ---------- following the cursor ---------- */
    const follow = (now: number, dt: number) => {
      const r = el.getBoundingClientRect();
      const b = bounds();
      /* aim the dog's centre at the cursor, kept inside the walkable area */
      const gx = Math.min(Math.max((cx as number) - r.width / 2, b.minX), b.maxX);
      const gy = Math.min(Math.max((cy as number) - r.height / 2, b.minY), b.maxY);
      const dx = gx - x;
      const dy = gy - y;
      const d = Math.hypot(dx, dy);
      const still = now - lastMove;

      if (mode === "walk") {
        if (d < NEAR) {
          setPace(false);
          if (still > NAP_AFTER) {
            setMode("lie");
          } else {
            pick(WATCH, now);
          }
        } else {
          const fast = d > 320;
          setPace(fast);
          const step = Math.min(d - NEAR * 0.6, (fast ? RUN : SPEED) * unit() * dt);
          if (step > 0) {
            x += (dx / d) * step;
            y += (dy / d) * step;
          }
          if (Math.abs(dx) > 1) face = dx > 0 ? 1 : -1;
        }
        return;
      }

      /* at the cursor */
      if (d > FAR) {
        setMode("walk");
        return;
      }
      if (mode === "lie") {
        if (still < 400) pick(WATCH, now); // woken by the cursor moving
        return;
      }
      if (still > NAP_AFTER) {
        setMode("lie");
        return;
      }
      if (now >= until) pick(WATCH, now);
      if (mode === "look") {
        if (now >= lookAt) {
          face = -face;
          lookAt = now + rand(700, 1600);
        }
      } else if (Math.abs(dx) > 4) {
        /* watching: turned toward the cursor */
        face = dx > 0 ? 1 : -1;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      /* capped, so a backgrounded tab does not teleport it on return */
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      /* stamina — spent moving, recovered resting */
      if (mode === "walk") tiredness += dt * (el.dataset.pace === "run" ? 2.5 : 1);
      else if (mode !== "lie") tiredness = Math.max(0, tiredness - dt * 1.5);

      /* worn out: drop where it stands and sleep it off */
      if (!sleepUntil && tiredness > TIRED) {
        sleepUntil = now + rand(SLEEP_FOR[0], SLEEP_FOR[1]) * 1000;
        setPace(false);
        setMode("lie");
      }
      if (sleepUntil) {
        if (now < sleepUntil) {
          place();
          return; // nothing wakes a tired dog early
        }
        sleepUntil = 0;
        tiredness = 0;
        if (cx !== null) pick(WATCH, now);
        else newTarget();
      }

      if (cx !== null && cy !== null) {
        follow(now, dt);
        place();
        return;
      }

      setPace(false);
      if (mode === "walk") {
        const dx = tx - x;
        const dy = ty - y;
        const d = Math.hypot(dx, dy);
        if (d < 2) {
          idle(now);
        } else {
          const step = Math.min(d, SPEED * unit() * dt);
          x += (dx / d) * step;
          y += (dy / d) * step;
          if (Math.abs(dx) > 1) face = dx > 0 ? 1 : -1;
        }
      } else if (now >= until) {
        newTarget();
      } else if (mode === "look" && now >= lookAt) {
        face = -face;
        lookAt = now + rand(700, 1600);
      }

      place();
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      const b = bounds();
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
      if (x >= 0) x = clamp(x, b.minX, b.maxX);
      y = clamp(y, b.minY, b.maxY);
      tx = clamp(tx, b.minX, b.maxX);
      ty = clamp(ty, b.minY, b.maxY);
    };
    window.addEventListener("resize", onResize);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cx = e.clientX;
      cy = e.clientY;
      lastMove = performance.now();
    };
    /* pointer gone: back to wandering, from wherever it stands */
    const onLeave = () => {
      cx = cy = null;
      newTarget();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="dog" ref={ref} data-mode="walk" aria-hidden="true">
      <svg className="dog__svg" viewBox="0 0 90 60">
        {/* Everything in .dog__ink is wobbled. Paint order is depth: legs
            first so the paper-filled body covers their tops, tail before the
            body so its root tucks under, ear after the skull so it overlaps. */}
        <g className="dog__ink">
          <path className="dog__leg is-far is-back" d="M31 35 L30 48 H33" />
          <path className="dog__leg is-far is-front" d="M54 35 L54 48 H57" />
          <path className="dog__leg is-back" d="M36 35 L36 49 H39" />
          <path className="dog__leg is-front" d="M59 34 L60 49 H63" />
          <g className="dog__upper">
            <path className="dog__tail" d="M25 25 C18 21 15 15 17 9" />
            <path
              className="dog__body"
              d="M24 27 C24 21 30 19 38 19 H56 C63 19 66 23 65 29 C64 35 59 37 52 37 H32 C26 37 24 33 24 27 Z"
            />
            <g className="dog__head">
              <path className="dog__collar" d="M61 18 C62 22 63 25 65 27" />
              <path
                className="dog__skull"
                d="M60 18 C60 10 66 7 72 8 C78 9 81 13 80 18 C80 21 83 22 86 22 C88.5 22 88.5 26 85 27 C80 28 74 28 70 27 C64 26 60 23 60 18 Z"
              />
              <path className="dog__ear" d="M64 10 C60 11 58 17 60 24 C63 23 65 18 67 11" />
              <path className="dog__tongue" d="M78 27 C78 31 81 32 82 29 L82 27.5" />
              <circle className="dog__eye" cx="73" cy="15" r="1.3" />
              <circle className="dog__nose" cx="86.5" cy="23.2" r="1.7" />
            </g>
          </g>
        </g>
      </svg>
      {/* Outside the svg, so the facing flip does not mirror the letters. */}
      <span className="dog__zzz">
        <i>z</i>
        <i>Z</i>
        <i>Z</i>
      </span>
    </div>
  );
}
