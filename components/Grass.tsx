"use client";

import { useEffect, useRef } from "react";

/* Four small, quiet tufts of sketched grass on the hero's paper, above
   the subtitle — not in a row, and not all at one distance. Two are drawn
   in stronger ink (`bold`) to lead the eye; the others stay faint. Kept deliberately sparse (three blades at most) and set back
   in opacity: an accent in the margins, not a lawn over the page.

   PLACEMENT is fixed, hand-picked on a 2000×978 view (see TUFTS). x is a
   fraction of the hero's width; the GROUND line is a fraction of the
   distance from the top of the hero down to the subtitle — NOT of the
   hero's height. The subtitle is pinned a fixed distance from the bottom,
   so on a shorter window a height fraction slid the low tufts into the
   letters; measured against the title, the gap to it scales instead. The two high tufts are further off, so they
   draw smaller and fainter; the two low ones are nearer, larger, full ink.

   MOTION. Each blade is a tapered sliver (two quadratic curves meeting at
   the tip), filled in ink and pushed through #wob2, and each is a SPRING
   pulled toward a target angle made of wind (two slow sines, travelling
   across the page so tufts move a beat apart) and the cursor (blades lean
   away from it, harder the closer it is, and are dragged along by a quick
   sweep). Low damping gives the overshoot that makes it feel alive.

   Sprouts once the subtitle appears. Frames with the hero off screen are
   skipped. Reduced motion draws it once, grown and still. */

type Blade = {
  x: number;
  y: number;
  len: number;
  lean: number;
  w: number;
  phase: number;
  delay: number;
  a: number;
  v: number;
  path: SVGPathElement;
  head?: SVGCircleElement;
};

type Tuft = {
  fx: number;
  fy: number;
  scale: number;
  count: number;
  flower: boolean;
  seed: number;
  /* drawn in stronger ink, to lead the eye */
  bold?: boolean;
};

/* fx = centre (fraction of width); fy = where the blades root (fraction of
   the way down to the subtitle's top). Measured: on the 2000×978 reference
   the subtitle's top is at 689px, and the ground lines at 350/330/578/470.
   `count` is blades INCLUDING a flower's stem — three at most, per tuft. */
const TUFTS: Tuft[] = [
  { fx: 0.158, fy: 0.508, scale: 0.72, count: 3, flower: true, seed: 101 }, // high left, far
  { fx: 0.805, fy: 0.479, scale: 0.7, count: 2, flower: false, seed: 202, bold: true }, // high right, far
  { fx: 0.303, fy: 0.839, scale: 0.95, count: 3, flower: false, seed: 303, bold: true }, // mid left, near
  { fx: 0.892, fy: 0.682, scale: 0.85, count: 3, flower: true, seed: 606 } // right, mid-distance
];

const K = 70; // spring stiffness
const C = 7; // damping — low on purpose
const REACH = 110; // px the cursor's influence reaches
const PUSH = 0.9; // radians at point blank

const NS = "http://www.w3.org/2000/svg";

/* a tiny seeded random, so a tuft's own blades stay put across a rebuild */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Grass() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const ink = svg?.querySelector<SVGGElement>(".grass__ink");
    const content = svg?.parentElement;
    if (!svg || !ink || !content) return;
    const sub = content.querySelector(".hero__sub");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let blades: Blade[] = [];
    let W = 0;
    let H = 0;

    const build = () => {
      const r = svg.getBoundingClientRect();
      W = r.width;
      H = r.height;
      if (!W || !H) return;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      ink.replaceChildren();
      blades = [];

      const u = Math.max(0.7, W / 1440);
      /* the subtitle's top, in this svg's coordinates */
      const subTop = sub ? sub.getBoundingClientRect().top - r.top : H * 0.7;

      for (const t of TUFTS) {
        const gy = t.fy * subTop;
        const scale = t.scale;
        const far = scale < 0.8;
        const gx = t.fx * W;
        const rnd = seeded(t.seed);
        /* shorter than before — accents, not a lawn */
        const tall = 38 * scale * u;

        const make = (flower: boolean, i: number) => {
          const n = t.flower ? t.count - 1 : t.count;
          const off = flower || n < 2 ? (rnd() - 0.5) * 6 : (i / (n - 1) - 0.5) * (10 + rnd() * 6) * scale;
          const centre = 1 - Math.abs(off) / (12 * scale);
          const b: Blade = {
            x: gx + off,
            y: gy,
            len: flower
              ? tall * (1.05 + rnd() * 0.2)
              : tall * (0.5 + 0.5 * Math.max(0.2, centre)) * (0.8 + rnd() * 0.3),
            lean: flower ? (rnd() - 0.5) * 0.2 : off * (0.045 / scale) + (rnd() - 0.5) * 0.18,
            w: (flower ? 0.7 : 0.9 + rnd() * 0.5) * scale,
            phase: rnd() * Math.PI * 2,
            delay: rnd() * 0.5,
            a: 0,
            v: 0,
            path: document.createElementNS(NS, "path")
          };
          const tone = t.bold ? "is-bold" : far ? "is-far" : "";
          if (tone) b.path.setAttribute("class", tone);
          ink.appendChild(b.path);
          if (flower) {
            const head = document.createElementNS(NS, "circle");
            head.setAttribute("class", `grass__flower${tone ? ` ${tone}` : ""}`);
            head.setAttribute("r", (3 * scale).toFixed(1));
            /* hidden until drawn — an unplaced circle sits at 0,0 */
            head.style.opacity = "0";
            ink.appendChild(head);
            b.head = head;
          }
          blades.push(b);
        };

        /* a flower takes one of the tuft's three blades */
        const plain = t.flower ? t.count - 1 : t.count;
        for (let i = 0; i < plain; i++) make(false, i);
        if (t.flower) make(true, 0);
      }
    };

    const draw = (b: Blade, grow: number) => {
      const len = b.len * grow;
      const th = b.lean + b.a;
      const tx = b.x + len * Math.sin(th);
      const ty = b.y - len * Math.cos(th);
      const ct = b.lean * 0.5 + b.a * 0.35;
      const cx = b.x + len * 0.5 * Math.sin(ct);
      const cy = b.y - len * 0.55;
      const w = b.w;
      b.path.setAttribute(
        "d",
        `M${(b.x - w).toFixed(1)} ${b.y.toFixed(1)}Q${(cx - w * 0.6).toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}Q${(cx + w * 0.6).toFixed(1)} ${cy.toFixed(1)} ${(b.x + w).toFixed(1)} ${b.y.toFixed(1)}Z`
      );
      if (b.head) {
        b.head.setAttribute("cx", tx.toFixed(1));
        b.head.setAttribute("cy", ty.toFixed(1));
        b.head.style.opacity = grow > 0.9 ? "1" : "0";
      }
    };

    build();
    /* the subtitle's height shifts when its webfont lands; re-measure then */
    document.fonts?.ready.then(() => {
      build();
      if (reduced) blades.forEach((b) => draw(b, 1));
    });

    const ro = new ResizeObserver(() => {
      const r = svg.getBoundingClientRect();
      if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) {
        build();
        if (reduced) blades.forEach((b) => draw(b, 1));
      }
    });
    ro.observe(svg);

    if (reduced) {
      blades.forEach((b) => draw(b, 1));
      return () => ro.disconnect();
    }

    /* ---------- pointer ---------- */
    let px = -1e4;
    let py = -1e4;
    let vx = 0;
    let lastPx = 0;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      if (lastT) vx += ((e.clientX - lastPx) / Math.max(1, now - lastT) - vx) * 0.3;
      lastPx = e.clientX;
      lastT = now;
      px = e.clientX;
      py = e.clientY;
    };
    const onLeave = () => {
      px = py = -1e4;
    };

    /* ---------- loop ---------- */
    let raf = 0;
    let last = performance.now();
    let sproutAt = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      if (!sproutAt && sub?.classList.contains("is-in")) sproutAt = now;
      const since = sproutAt ? (now - sproutAt) / 1000 : -1;

      const r = svg.getBoundingClientRect();
      /* skipped off screen — checked per frame, not by an observer, since
         the hero content slides up into view after load */
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const mx = px - r.left;
      const my = py - r.top;
      vx *= 0.94;

      for (const b of blades) {
        const g = since < 0 ? 0 : Math.min(1, Math.max(0, (since - 0.3 - b.delay) / 0.9));
        const grow = 1 - Math.pow(1 - g, 3);

        const wind = 0.075 * Math.sin(t * 1.25 - b.x * 0.011) + 0.035 * Math.sin(t * 2.9 + b.phase);

        let push = 0;
        const dx = b.x - mx;
        /* vertical reach: full across the blade's own height, fading 60px out */
        const outY = my > b.y ? my - b.y : my < b.y - b.len ? b.y - b.len - my : 0;
        const vf = Math.max(0, 1 - outY / 60);
        if (vf > 0 && Math.abs(dx) < REACH) {
          const f = Math.pow(1 - Math.abs(dx) / REACH, 2) * vf;
          push = Math.sign(dx || 1) * f * PUSH + Math.max(-0.5, Math.min(0.5, vx * 0.35)) * f;
        }

        b.v += (K * (wind + push - b.a) - C * b.v) * dt;
        b.a += b.v * dt;
        draw(b, grow);
      }
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <svg ref={svgRef} className="hero__grass" aria-hidden="true" focusable="false">
      <g className="grass__ink" />
    </svg>
  );
}
