"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import SmartText from "../SmartText";

/* §9 — scattered, overlapping cards.

   Geometry and per-card parallax offsets are the measured values. The
   parallax rides a wrapper so `.card`'s own 1s transform transition is
   left free for the hover scale, and never lags the scroll.

   Suppression is blur + scale only — opacity NEVER changes — and the
   reset is bound to .cards, not .card, so moving between two cards
   never passes through a neutral frame. */

type Card = {
  n: string;
  client: string;
  descriptor: string;
  /** Unbuilt work. Renders the frame with a marker and does NOT link. */
  /** Corner flag. Any string shows the badge; omit it for a finished card.
      Was a boolean tied to card 05 alone, which could only ever say one
      thing. */
  status?: string;
  /** §13 detail route. Present = the card is a link. Absent = a frame, as
      before — a card that 404s is worse than one that does not link. */
  href?: string;
  /** Client mark for the cover. A MARK, not a cover image: it signs the
      artwork from a corner rather than filling the frame. */
  logo?: string;
  /** Cover artwork. A logo alone on a grey panel is not a thumbnail — it is
      an empty panel with a sticker. Each card that has a detail page gets a
      drawing of ITS OWN argument instead. */
  cover?: "pyramid";
  x: number;
  w: number;
  h: number;
  /** scroll parallax offset in design px */
  p: number;
  /** cursor parallax depth, 0 = pinned, 1 = full travel */
  d: number;
  services: string[];
};

/* §9 cover — the §13 pyramid, PROJECTED, and alive on hover.

   A flat triangle with a curve on it says nothing: it reads as a shape and
   the line looks painted on one face. The idea of the page is a route that
   WRAPS a solid, so the cover is a real projection — the same 3-sided
   pyramid seen from 22 degrees above, with the climb going round the back
   and out the other side. Hovering turns it through a full revolution and
   redraws the route from the base corner to the apex, which is the page's
   whole argument played in three seconds.

   ONE pure function builds every frame. cover(yaw, draw) returns nothing
   but strings, so the same call renders the resting state on the server
   and each animated frame in the browser — the static markup and the
   animation cannot drift apart, because they are the same code.

   Faces, not near-side outlines: at rest a corner faces the camera, but
   under rotation every face takes its turn, so each of the three is built
   independently and drawn only when its normal faces the viewer. That test
   — sin(normal + yaw) > 0 — is what decides visible from hidden for the
   bands, both kinds of edge, and every sample of the route. Hidden route
   runs draw thin and faint; that contrast IS the third dimension, and it
   is what makes one line legible as a full turn around a solid. */

/* Proportions are set against the projection, not guessed. The drawn width
   is 2·cos30·R = 242 and the drawn height is H·cos(pitch) = 204, so the
   object sits WIDER than it is tall — at 116/246 it drew 201 wide by 228
   and read as a thin spire in a landscape frame. Rotation swings a corner
   out to ±R = ±140, still clear of the 510 box, and the vertical span
   (72 → 328) clears the wordmark above and the status flag below. */
const COVER_R = 140;
const COVER_H = 220;
const COVER_CX = 255;
const COVER_CY = 276; // origin placed so the object centres on y 200
const RAD = (d: number) => (d * Math.PI) / 180;
const PITCH_C = Math.cos(RAD(22));
const PITCH_S = Math.sin(RAD(22));
const COVER_BANDS: [number, number][] = [
  [0, 0.36],
  [0.36, 0.72],
  [0.72, 1]
];

/* polygon radius at an angle, corners normalised to 1 — the route hugs the
   flat faces rather than a circumscribed cone, exactly as it does in 3D */
const ngonR = (deg: number) => {
  const local = ((deg % 120) + 120) % 120;
  return Math.cos(RAD(60)) / Math.cos(RAD(local - 60));
};

type CoverFrame = {
  bands: string[];
  seams: string;
  edges: string;
  route: string;
  routeFar: string;
};

/* Polyline → smooth path: quadratic segments through the midpoints of each
   pair, the standard C1 construction. The route follows the POLYGON, so it
   has a genuine kink at each of the three pyramid edges — in 3D the
   Catmull-Rom curve rounds those away, and without an equivalent here the
   line arrived visibly sharp at every corner. Rounding them costs about a
   pixel of fidelity and buys a line that reads as drawn rather than
   plotted. */
const smoothPath = (p: [number, number][]) => {
  const n = p.length;
  if (n < 2) return "";
  const f = (q: [number, number]) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  if (n === 2) return `M${f(p[0])} L${f(p[1])} `;
  let d = `M${f(p[0])} `;
  let i = 1;
  for (; i < n - 2; i++) {
    const m: [number, number] = [(p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2];
    d += `Q${f(p[i])} ${f(m)} `;
  }
  d += `Q${f(p[i])} ${f(p[i + 1])} `;
  return d;
};

const cover = (yaw: number, draw: number): CoverFrame => {
  const PN = (deg: number, r: number, f: number): [number, number] => {
    const a = RAD(deg + yaw);
    return [
      COVER_CX + Math.cos(a) * r,
      COVER_CY - COVER_H * f * PITCH_C + Math.sin(a) * r * PITCH_S
    ];
  };
  const P = (deg: number, r: number, f: number) => {
    const q = PN(deg, r, f);
    return `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  };
  const rAt = (f: number) => COVER_R * (1 - f);

  /* ALL THREE FACES, ALWAYS — bands, seams and edges alike.

     Culling the back face looked correct and animated badly. The fills
     were innocent: a face is edge-on exactly when its visibility flips, so
     its quad is zero-area at that instant and vanishing is invisible. The
     EDGES were the fault — a base edge projects to a full-length vertical
     line at that same moment, and it was switching from solid ink to
     dashed-faint right there, which is the flicker on every quarter turn.

     Drawing everything and letting the translucent fills stack turns the
     object into consistent glass: the back faces read through the front,
     nothing appears or disappears, and the rotation is continuous. Band
     opacities are cut to compensate for the doubled layer. */
  const bands: string[] = [];
  let seams = "";
  let edges = "";

  for (let i = 0; i < 3; i++) {
    const c1 = 90 + 120 * i;
    const c2 = 210 + 120 * i;

    for (const [f0, f1] of COVER_BANDS) {
      bands.push(
        `${P(c1, rAt(f0), f0)} ${P(c2, rAt(f0), f0)} ${P(c2, rAt(f1), f1)} ${P(c1, rAt(f1), f1)}`
      );
    }
    for (const f of [0.36, 0.72]) {
      seams += `M${P(c1, rAt(f), f)} L${P(c2, rAt(f), f)} `;
    }
    edges += `M${P(c1, COVER_R, 0)} L${P(c2, COVER_R, 0)} `;
    edges += `M${P(0, 0, 1)} L${P(c1, COVER_R, 0)} `;
  }

  /* The route keeps its near/far split — that one IS smooth, because the
     line crosses a silhouette tangentially, and it is the only remaining
     cue that the climb goes round the back. */
  let route = "";
  let routeFar = "";
  const top = Math.max(0, Math.min(draw, 1));
  if (top > 0.004) {
    const N = 180;
    const pts: [number, number][] = [];
    const seen: boolean[] = [];
    for (let s = 0; s <= N; s++) {
      const t = (s / N) * top;
      const a = 90 - t * 360;
      pts.push(PN(a, COVER_R * (1 - t) * ngonR(a - 90), t));
      const face = Math.floor(((((a - 90) % 360) + 360) % 360) / 120);
      seen.push(Math.sin(RAD(150 + 120 * face + yaw)) > 0);
    }
    /* The crossing sample ends one run and begins the next, so the two
       meet exactly and the line has no gap at a silhouette. */
    let run: [number, number][] = [pts[0]];
    let on = seen[0];
    const flush = () => {
      const d = smoothPath(run);
      if (on) route += d;
      else routeFar += d;
    };
    for (let s = 1; s <= N; s++) {
      run.push(pts[s]);
      if (seen[s] !== on) {
        flush();
        run = [pts[s]];
        on = seen[s];
      }
    }
    flush();
  }

  return { bands, seams, edges, route, routeFar };
};

/* Rest: no rotation, route complete. The loop lands back on exactly this
   at yaw 360, so a cycle ends where the static markup began. */
const COVER_REST = cover(0, 1);

const PyramidCover = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const card = svg?.closest(".card");
    if (!svg || !card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bandEls = Array.from(svg.querySelectorAll<SVGPolygonElement>(".card__band"));
    const q = (sel: string) => svg.querySelector<SVGPathElement>(sel);
    const seamEl = q(".card__seam");
    const edgeEl = q(".card__edge");
    const routeEl = q(".card__route:not(.card__route--far)");
    const routeFarEl = q(".card__route--far");

    /* One cycle: yaw is LINEAR so the loop point is seamless (easing it
       made the object hesitate every revolution), while the route eases
       out and finishes early.

       The two speeds are deliberately UNEQUAL. The line draws in ~1.7s and
       the turn takes 4.6s, so the climb reads as the quick, legible event
       and the rotation as the slow reveal carrying it — at 2.6s for both
       they competed, and the object appeared to spin. The route then holds
       at the summit for the remaining ~60%, which is the part that lets
       you actually watch the finished line travel round the back. */
    /* Two INDEPENDENT clocks, which is the whole point: the rotation is a
       slow continuous carrier and the climb is a repeating event on top of
       it. Tying both to one cycle (as this did) forced them to share a
       period, and the object read as spinning to a beat.

       ROT is one revolution — half the previous speed. Yaw stays LINEAR:
       easing it made the object hesitate at every wrap.

       The route draws base → apex, holds at the summit, and starts again
       from the bottom. The hold is the point of the whole thing: the climb
       finishes, and you get three seconds to watch the finished line carry
       round the back before it resets. */
    const ROT = 9.2; // seconds per revolution
    const DRAW_TIME = 2.6; // base corner → apex
    const HOLD = 3; // pause at the summit before redrawing
    const DRAW_CYCLE = DRAW_TIME + HOLD;
    const SETTLE = 0.8;

    const paint = (yawDeg: number, draw: number) => {
      const f = cover(yawDeg, draw);
      f.bands.forEach((pts, i) => bandEls[i]?.setAttribute("points", pts));
      seamEl?.setAttribute("d", f.seams);
      edgeEl?.setAttribute("d", f.edges);
      routeEl?.setAttribute("d", f.route);
      routeFarEl?.setAttribute("d", f.routeFar);
    };

    /* Both clocks read off ONE elapsed time, so they never drift apart
       across a long hover the way two counters would. */
    const at = (p: number): [number, number] => {
      const d = Math.min((p % DRAW_CYCLE) / DRAW_TIME, 1);
      return [(360 * p) / ROT, 1 - (1 - d) ** 3];
    };

    let hovered = false;
    let raf = 0;
    let last = 0;
    let phase = 0;
    let settling = false;
    let settleT = 0;
    let fromYaw = 0;
    let fromDraw = 1;
    let yaw = 0;
    let draw = 1;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!settling) {
        phase += dt;
        [yaw, draw] = at(phase);
        /* Leaving hands over to a short settle rather than snapping — but
           it no longer waits for the turn to complete, which at 9.2s a
           revolution would have meant seconds of spinning after the cursor
           had gone. The settle always rotates FORWARD to the next whole
           turn, so the object never appears to rewind. */
        if (!hovered) {
          settling = true;
          settleT = 0;
          fromYaw = yaw;
          fromDraw = draw;
        }
      } else {
        settleT += dt;
        const k = Math.min(settleT / SETTLE, 1);
        const e = 1 - (1 - k) ** 3;
        const target = Math.ceil(fromYaw / 360) * 360;
        yaw = fromYaw + (target - fromYaw) * e;
        draw = fromDraw + (1 - fromDraw) * e;
        if (k >= 1) {
          paint(0, 1);
          raf = 0;
          settling = false;
          phase = 0;
          return;
        }
      }

      paint(yaw, draw);
      raf = requestAnimationFrame(tick);
    };

    const enter = () => {
      hovered = true;
      /* Re-entering mid-settle restarts the climb rather than resuming a
         half-finished one. */
      settling = false;
      phase = 0;
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      hovered = false;
    };

    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="card__art"
      viewBox="0 0 510 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {COVER_REST.bands.map((pts, i) => (
        <polygon
          key={i}
          className={`card__band card__band--${(i % 3) + 1}`}
          points={pts}
        />
      ))}
      <path className="card__seam" d={COVER_REST.seams} />
      <path className="card__edge" d={COVER_REST.edges} />
      <path className="card__route card__route--far" d={COVER_REST.routeFar} />
      <path className="card__route" d={COVER_REST.route} />
    </svg>
  );
};

/* Slot order is a ranking and the frame geometry carries it. Slot 02 was
   400x314; it is 510x400 here so MOOBOX, the only founder card, gets a large
   frame without disturbing the BioMarin → MOOBOX → UCLA sequence. At x=800 a
   510 frame reaches 1310, inside the reach of slot 04 (x=830, w=510, 1340),
   so nothing collides.

   Hrefs are per-card and optional: BIOMARIN's §13 page is up, so that one
   links; the rest stay frames until their routes land. UPLOADING stays on
   every card that is still being written — a live detail page is not the
   same claim as a finished case study, and card 01 is both. */
const CARDS: Card[] = [
  { n: "01", client: "BIOMARIN", descriptor: "END-TO-END SUPPLY CHAIN INTELLIGENCE", status: "UPLOADING", href: "/works/biomarin", logo: "/logos/biomarin.svg", cover: "pyramid", x: 40, w: 510, h: 400, p: -120, d: 1, services: ["ONTOLOGY DESIGN", "SEMANTIC MODELING", "AGENTIC REPORTING"] },
  { n: "02", client: "MOOBOX", descriptor: "DEMAND & DISTRIBUTION — FOUNDER", status: "UPLOADING", x: 800, w: 510, h: 400, p: 0, d: 0.45, services: ["LIFECYCLE MODEL", "SEGMENTATION", "A/B TESTING", "FORECASTING"] },
  { n: "03", client: "UCLA ANDERSON SCHOOL OF MANAGEMENT", descriptor: "LEAN OPS SIMULATION — PRODUCT BUILD", status: "UPLOADING", x: 120, w: 510, h: 401, p: 8, d: 0.8, services: ["REACT APP", "USAGE TELEMETRY", "ADAPTIVE SCENARIOS"] },
  { n: "04", client: "DISPATCH AGENT", descriptor: "OPERATIONS INTELLIGENCE — AUTOMATED REPORTING", status: "UPLOADING", x: 830, w: 510, h: 401, p: 0, d: 0.6, services: ["LANGGRAPH ORCHESTRATION", "RAG", "ANOMALY DETECTION", "DELIVERY"] },
  { n: "05", client: "COMPETITIVE ANALYSIS AGENT", descriptor: "MARKET INTELLIGENCE — AUTOMATION", status: "IN PROGRESS", x: 300, w: 310, h: 227, p: 53, d: 0.3, services: ["SCOPING", "SOURCE DESIGN", "EVAL PLAN"] }
];

export default function Work() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const posRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* parallax + entry */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-in");
      },
      { threshold: 0.15 }
    );
    posRefs.current.forEach((el) => el && io.observe(el));

    if (reduced) return () => io.disconnect();

    /* MAX_SHIFT is in design px, so it scales with the rem trick like
       everything else. It is the FULL travel of the deepest card (d = 1)
       from centre to either edge of the block; every other card gets
       MAX_SHIFT × its own d, so raising this spreads the whole scatter
       apart rather than sliding it as a sheet — the depth difference
       between cards grows with it, which is the point.

       42 is roughly 8% of the widest frame, up from 26 (~5%), which was
       too reticent to read as parallax at all until you went looking for
       it. Going much past this starts to detach the cards from the
       cursor and the scatter reads as unstable.

       LERP moved with it. It is the fraction of the remaining distance
       covered per frame, so at a fixed 0.08 a longer throw simply takes
       longer to arrive — the cards would have travelled further but felt
       heavier, which is the opposite of the intent. 0.10 keeps roughly
       the original settle time across the bigger distance. */
    const MAX_SHIFT = 42;
    const LERP = 0.1;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = wrap.getBoundingClientRect();
      /* -1 → 1 across the block in both axes */
      targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
      targetY = ((e.clientY - r.top) / r.height) * 2 - 1;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);

      curX += (targetX - curX) * LERP;
      curY += (targetY - curY) * LERP;

      const r = wrap.getBoundingClientRect();
      /* -1 → 1 as the block travels through the viewport */
      const progress =
        1 - (r.top + r.height / 2) / (window.innerHeight / 2 + r.height / 2);

      posRefs.current.forEach((el, i) => {
        if (!el) return;
        const c = CARDS[i];
        el.style.setProperty("--py", `${c.p * progress + curY * MAX_SHIFT * c.d}rem`);
        el.style.setProperty("--px", `${curX * MAX_SHIFT * c.d}rem`);
      });
    };

    raf = requestAnimationFrame(frame);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="work" id="work">

      <h2 className="work__title">
        {/* decodes slower than the other section headings on purpose —
            it is the title of the block the page is built around */}
        <SmartText as="span" className="h1" pace="slow">PROJECTS</SmartText>
        {/* The SECTION number, not the card count. Projects is §3 in the
            rail; binding this to CARDS.length made it read as inventory. */}
        <span className="work__count" aria-hidden="true">(3)</span>
      </h2>

      <div className="cards" ref={wrapRef}>
        {CARDS.map((c, i) => (
          <div
            key={c.n}
            className="card__pos"
            ref={(el) => {
              posRefs.current[i] = el;
            }}
            style={
              {
                "--x": `${c.x}rem`,
                "--w": `${c.w}rem`,
                "--h": `${c.h}rem`,
                "--ar": c.w / c.h
              } as React.CSSProperties
            }
          >
            {/* Anchor only where a route exists; everything else stays the
                div it was, so an unbuilt card is not focusable or clickable. */}
            {(() => {
              const Frame = c.href ? Link : "div";
              const frameProps = c.href
                ? { href: c.href, "aria-label": `${c.client} — ${c.descriptor}` }
                : {};
              return (
            <Frame
              {...(frameProps as { href: string })}
              className={`card${c.status ? " is-flagged" : ""}${c.href ? " is-linked" : ""}`}
            >
              <span className="card__media" aria-hidden="true">
                {c.cover === "pyramid" && <PyramidCover />}
                {c.status && <span className="card__flag">{c.status}</span>}
                {c.logo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className="card__mark" src={c.logo} alt="" />
                )}
              </span>
              <span className="bottom">
                <span className="card__title">
                  <span className="card__n">({c.n})</span>
                  <span className="card__client">{c.client}</span>
                </span>
                <span className="subtitle">{c.descriptor}</span>
                <span className="services">
                  {c.services.map((s, si) => (
                    <span key={s} style={{ "--i": si } as React.CSSProperties}>
                      {s}
                    </span>
                  ))}
                </span>
              </span>
            </Frame>
              );
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}
