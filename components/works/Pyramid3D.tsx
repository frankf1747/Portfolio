"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* §13 — the triangle, in depth.

   The 2D shape ARGUED (slices, bottom-up); this one is CLIMBED. The three
   pieces are already an ascent — foundation, connections, decision — so the
   scroll state drives three things at once:

     - ROTATION: a third of a turn per piece, so every stop presents a fresh
       face. The turn lands exactly on the page's pause, which is what gives
       the section snap its visual payoff.
     - THE LINE: a route drawn on the surface from base to apex, revealed a
       third at a time. It is the reader's own position on the argument.
     - ALTITUDE: the camera starts low, looking up at the mass of the base,
       and ends above the apex looking down at the point. "Going higher" is
       literal.

   FLAT INK, NO LIGHTS. Everything is MeshBasicMaterial and line work in the
   site's own tokens (read from the CSS custom properties at mount, so a
   token change propagates here for free). A lit, shaded object would be a
   second design language; this is the same page, with depth.

   All motion is exponential damping inside one rAF loop — the site has no
   keyframes anywhere and this is not the place to start. State arrives
   through a ref, so scroll changes never rebuild the scene.

   The pyramid is a 3-sided cone: three faces for three pieces. The route
   hugs the faces rather than floating on the circumscribed cone — the
   radius at each angle is the POLYGON's radius, not the circle's. */

const H = 2.0; // pyramid height
/* Base radius against camera distance is solved from the projection, not
   tuned: a corner mid-turn is the widest the object ever gets, and it has
   to clear the horizontal half-view — tan(17°)·d·aspect — at every stop.
   At 1.35 with the old short distances the base corners clipped on every
   turn. 1.28 against 4.2–4.7 leaves ~0.1 of margin at all three, and reads
   as a pyramid with weight rather than the spike 1.15 gave. */
const R = 1.28; // base circumradius
/* One band per piece — the 2D triangle's base / mids / apex, in depth.
   Each lights on its own section, so section 2 is no longer the one stop
   with nothing to show. Boundaries double as the tier rings. */
const BANDS: [number, number][] = [
  [0, 0.36],
  [0.36, 0.72],
  [0.72, 1.0]
];
const TIERS = [0.36, 0.72]; // ring cuts — the band seams

const TUBE_R = 0.015;
/* The route rides INSIDE the surface (0.985) and the depth mask sits
   further in (0.94) — so the route is always between them: never outside
   the silhouette (0.985·R + TUBE_R = 1.276 < R = 1.28), always in front of the
   mask on the near side, always behind it on the far side. The old 1.012
   put the line 1.2% PROUD of the faces, which is what made it spill past
   the bottom-right corner.

   The sandwich only holds if the fillet respects it too: FILLET_FLOOR caps
   the corner cut at 3% of the local surface, so with the inset the route
   never drops below 0.97·0.985 = 0.955 — still outside the 0.94 mask. The
   unfloored fillet cut to 0.897 at the corners, which sank the tube's
   centre up to 0.05 UNDER the mask exactly where the route bends around
   an edge: the solid pass vanished there and only the 26% ghost showed —
   the line read as passing through the body at sections 02 and 03. */
const ROUTE_INSET = 0.985;
const MASK_INSET = 0.94;
const FILLET_FLOOR = 0.97;

/* Radius of an n-gon at angle θ (circumradius 1): the surface the route
   rides. Without this the spiral bulges off the flat faces mid-face. */
const ngonR = (theta: number, n = 3) => {
  const seg = (2 * Math.PI) / n;
  const local = ((theta % seg) + seg) % seg;
  return Math.cos(seg / 2) / Math.cos(local - seg / 2);
};

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};

export default function Pyramid3D({
  active,
  onFallback
}: {
  active: number;
  onFallback: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  /* Fallback only: the real driver is continuous scroll progress, measured
     from .stack__copy every frame. The discrete index steps in thirds and
     the object is 3-fold symmetric, so driven by index alone every rest
     pose is indistinguishable and the turn is never seen. */
  const activeRef = useRef(active);
  activeRef.current = active;

  /* onFallback in a ref for the same reason SmartText holds instanceRef in
     one: an inline arrow from the parent is a new identity every render and
     must not tear the scene down. */
  const fallbackRef = useRef(onFallback);
  fallbackRef.current = onFallback;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      /* No WebGL — hand the column back to the SVG. */
      fallbackRef.current();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const ink = cssColor("--ink", "#262048");
    const mark = cssColor("--mark", "#f2247a");
    const yellow = cssColor("--yellow", "#ffe500");
    const paper = cssColor("--paper", "#f5f3ec");

    /* The bands ESCALATE: a greyed pink at the foundation, the full mark in
       the middle, yellow at the apex. Value concentrates upward — the same
       argument the 2D triangle made by area, made here by saturation. The
       foundation's pink is knocked back toward paper (and a little toward
       ink, so it greys rather than merely fades) — infrastructure should
       read as substantial, not loud. */
    const greyPink = mark.clone().lerp(paper, 0.5).lerp(ink, 0.12);
    const hl = [greyPink, mark, yellow];
    const hlPeak = [0.5, 0.5, 0.55];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);

    /* Everything that turns lives in one group; the camera does not orbit,
       the object rotates — simpler, and the legend stays screen-fixed. */
    const rig = new THREE.Group();
    scene.add(rig);

    /* The body is the three BANDS rather than one cone: each carries its
       own material so it can light independently. Open-ended (the base
       disk of a capped cone reads through the translucent faces as a
       broken flap); CylinderGeometry shares ConeGeometry's theta start, so
       corners line up with the edges and rings for free. */
    const bandMats: THREE.MeshBasicMaterial[] = [];
    for (const [t0, t1] of BANDS) {
      const geo = new THREE.CylinderGeometry(R * (1 - t1), R * (1 - t0), H * (t1 - t0), 3, 1, true);
      geo.translate(0, (H * (t0 + t1)) / 2, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: ink.clone(),
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      bandMats.push(mat);
      const band = new THREE.Mesh(geo, mat);
      band.renderOrder = -1;
      rig.add(band);
    }

    const capped = new THREE.ConeGeometry(R, H, 3);
    capped.translate(0, H / 2, 0);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(capped),
      new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.85 })
    );
    rig.add(edges);

    /* DEPTH MASK — the de-clutter. The faces are translucent, so without
       this the whole route spiral and both rings show through from every
       angle; from the summit camera the back half reads as scribble
       escaping the silhouette. An invisible solid (colorWrite off, depth
       still written, drawn first) occludes everything behind the body
       exactly as if it were opaque — the route and rings exist only where
       a solid object would show them, while the ink faces keep their
       translucency. Slightly inset so the route, which rides 1.2% off the
       surface, always wins the depth test on the visible side. */
    const mask = new THREE.Mesh(capped, new THREE.MeshBasicMaterial({ colorWrite: false }));
    /* Radial only — scaling height too would lift the mask's apex clear of
       the route near the top and leak the far side back into view. */
    mask.scale.set(MASK_INSET, 1, MASK_INSET);
    mask.renderOrder = -2;
    rig.add(mask);

    /* Tier rings — the 2D slices, reduced to two horizontal cuts. Drawn as
       the triangle outline at that height, shrunk by the cone's taper. */
    for (const t of TIERS) {
      const pts: THREE.Vector3[] = [];
      const r = R * (1 - t);
      /* PI/2, not PI/6: ConeGeometry's vertices sit at 90/210/330 degrees
         in this cos/sin frame (cylinder theta starts on +z). The first
         build used 30/150/270 — every ring corner poked through the middle
         of a face, 60 degrees out of phase with the object it was cut from. */
      for (let i = 0; i <= 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, t * H, Math.sin(a) * r));
      }
      rig.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.3 })
        )
      );
    }

    /* The route: one wrap around the pyramid, base to apex, riding the
       faces (ngonR) just inside the surface. A tube, not a Line — WebGL
       lines are 1px and the route is the cue. Revealed by drawRange: tube
       indices run along the path, so a count is a distance climbed.

       Starts AT the front-left base corner of the resting face, so the
       climb begins at the bottom of the object in plain sight and reads
       left-to-right. It runs clockwise, angle decreasing: drawn the other
       way the tip tracks left and the eye reads the climb as a descent.

       THE RUN-UP. A corner start is a silhouette problem: the corner sits
       on a silhouette edge at every rest, the mask is inset 6%, and at
       section 03 a solid tail there leaked past the mask's corner in
       projection (ray-traced: 4° of clearance is the exact threshold, 6°
       adds margin). So the first 6° of sweep is a RUN-UP that unwinds
       over the first RUNUP_T of height on an easeOutSine — one continuous
       curve with the climb, not a separate stub: a second curve meeting
       the route at an angle put a visible kink at the joint. Beyond the
       run-up the angle is exactly 204° − 360·t^E, so the emergence
       calibration below is untouched. The run-up region is rendered as
       its own drawRange window and faded by FACING (see paintStub): bold
       where the resting face fronts the camera (page top, section 01 —
       the climb visibly starts at the corner), gone once it turns away
       (sections 02, 03 — where solid at the corner is exactly the leak). */
    const START = (7 * Math.PI) / 6;
    const TRIM = (6 * Math.PI) / 180;
    const RUNUP_T = 0.05;

    /* SWEEP EXPONENT — solved, not tuned.

       With a uniform sweep the route was visible from too low at section
       02 — below that band's 0.36 cutoff — so the line appeared to start
       in the foundation band while the copy talked about the middle one.
       Sweeping a little slower low down also suits the shape: the base is
       where the radius is widest, so a degree of turn covers the most
       ground there.

       Solved by RAY-TRACING against the depth mask from section 02's
       actual rest camera, not from the closed form: the old derivation
       (A(0.36) = 90 → E = 1.357) ignored the mask's 6% inset, which lets
       the route show through the silhouette sliver before it truly rounds
       the edge — measured emergence was ~0.45, well above the cutoff.
       With the 204° start, E = 1.118 puts the first unoccluded sample at
       height 0.360 exactly. */
    const SWEEP_E = 1.118;
    const N = 200;

    /* FILLET THE CORNERS — by smoothing the RADIUS, never the points.

       The route hugs the polygon, so it genuinely bends at each of the
       three edges, and CatmullRomCurve3 interpolates THROUGH its points:
       every kink survives. The previous fix averaged the 3D points, which
       rounded the corners and also chord-cut across the flat faces — the
       line sank INTO the body everywhere it was not near a corner.

       Averaging the radius factor instead leaves every sample on its own
       ray. But an average raises MINIMA as well as lowering maxima, and a
       face midpoint is a minimum of that factor — so a plain average
       pushed the line 2.6% OUTSIDE the faces there. Hence min(): the
       fillet may only ever cut inward. And hence max() against
       FILLET_FLOOR: unfloored, the corner cut reached 0.897 of the
       surface — under the 0.94 depth mask, which occluded the solid pass
       for the whole bend (see the constants block). The fillet may cut
       inward, but never through the mask. */
    const angles: number[] = [];
    const raw: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const runup = Math.sin((Math.PI / 2) * Math.min(t / RUNUP_T, 1));
      const a = START - TRIM * runup - Math.pow(t, SWEEP_E) * Math.PI * 2;
      angles.push(a);
      raw.push(ngonR(a - Math.PI / 2));
    }
    const fillet = raw.map((f, i, arr) => {
      const w = Math.min(4, i, arr.length - 1 - i);
      if (!w) return f;
      let sum = 0;
      for (let k = -w; k <= w; k++) sum += arr[i + k];
      return Math.max(Math.min(sum / (w * 2 + 1), f), f * FILLET_FLOOR);
    });

    /* (1 - t), matching the body's own taper — NOT (1 - t·0.985). The old
       damped slope made the spiral shrink SLOWER than the faces, so from
       mid-height up the line rode increasingly outside the surface — 0.034
       proud at the apex, over twice the tube's radius — and the whole
       upper wrap floated off the object under section 03's look-down
       camera. */
    const routePts = angles.map((a, i) => {
      const t = i / N;
      const r = R * (1 - t) * fillet[i] * ROUTE_INSET;
      return new THREE.Vector3(Math.cos(a) * r, t * H, Math.sin(a) * r);
    });

    const curve = new THREE.CatmullRomCurve3(routePts);
    const tube = new THREE.TubeGeometry(curve, 240, TUBE_R, 8, false);
    const routeIndexCount = tube.index ? tube.index.count : 0;

    /* HEIGHT → ARC. TubeGeometry samples the path by ARC LENGTH, so
       drawRange reveals equal lengths of line — but the path is a spiral
       whose radius is widest at the base, where a unit of arc buys almost
       no climb. Half the length is only ~0.35 of the height, which is why
       a reveal asked to stop mid-band stopped at its lower edge instead.

       The points are generated at uniform HEIGHT, so their cumulative
       chord lengths are exactly the table that converts one to the other. Every
       reveal target below is therefore a height on the pyramid, and this
       is the only place that has to know about arc length. */
    const cum = [0];
    for (let i = 1; i < routePts.length; i++) {
      cum.push(cum[i - 1] + routePts[i].distanceTo(routePts[i - 1]));
    }
    const total = cum[N];
    const arcOfHeight = (h: number) => {
      const x = Math.max(0, Math.min(h, 1)) * N;
      const i = Math.min(Math.floor(x), N - 1);
      return (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / total;
    };

    /* TWO passes over the same geometry, which is what keeps the whole
       climb legible on a solid object. A full wrap means most of the route
       is round the back at any moment; masked outright, the line appeared
       to begin halfway up a face instead of at the bottom corner it is
       actually drawn from.

       GHOST first (depthTest off, so it shows through the body) then the
       SOLID pass depth-tested normally on top. The near half reads at full
       strength, the far half as a trace behind the faces — the climb is
       continuous from the base corner, and the object still reads as
       solid. Each pass carries its own geometry instance, because their
       drawRange windows differ (see the run-up split below). */
    const routeMat = new THREE.MeshBasicMaterial({ color: mark });
    /* 0.10, down from 0.26. At 0.26 the far half of the wrap read as a
       SECOND LINE crossing the faces — at section 02 the whole back half
       (base corner round to the left edge) projects as a swoop dipping
       through the lit band, at 03 as a diagonal to the base corner — and
       both were reported as the route cutting through the object. The
       trace only has to whisper that the line continues behind; anything
       loud enough to follow as a stroke is loud enough to misread. */
    const ghostMat = new THREE.MeshBasicMaterial({
      color: mark,
      transparent: true,
      opacity: 0.1,
      depthTest: false,
      depthWrite: false
    });
    const ghost = new THREE.Mesh(tube, ghostMat);
    ghost.renderOrder = 0;
    rig.add(ghost);

    /* The SOLID pass is split at the run-up boundary — same vertices,
       cloned geometry, so the curve stays one unbroken stroke and only
       the rendering differs. The run-up window takes the facing-faded
       material (see START and paintStub); the climb window takes the
       plain solid and is what the reveal drives. */
    const runupCount = Math.floor(routeIndexCount * arcOfHeight(RUNUP_T));
    const runupGeo = tube.clone();
    runupGeo.setDrawRange(0, runupCount);
    const stubMat = new THREE.MeshBasicMaterial({ color: mark, transparent: true });
    const runup = new THREE.Mesh(runupGeo, stubMat);
    runup.renderOrder = 1;
    rig.add(runup);

    const solidGeo = tube.clone();
    const solid = new THREE.Mesh(solidGeo, routeMat);
    solid.renderOrder = 1;
    rig.add(solid);

    /* ROUND ENDS. TubeGeometry is open — its ends are raw rings, and the
       start one read as a flat chip sticking off the base corner. A sphere
       at each end is the whole fix: the tail one is fixed at the bottom
       corner, the head one rides the reveal each frame. */
    /* Caps take the SOLID material, not the ghost. Built from ghostMat
       they inherited depthTest:false, so once the head swung round the
       back its cap kept drawing over the body — a dot floating free of the
       line it belongs to. Depth-tested, a cap is only ever the rounded end
       of a visible line. */
    const capGeo = new THREE.SphereGeometry(TUBE_R, 12, 8);
    /* Three fixed caps and one riding one:
       - corner cap, faded with the run-up, rounds the true start;
       - a ghost corner cap under it keeps the TRACE ending round at the
         corner when the solid pair has faded (sections 02/03);
       - tail cap at the run-up boundary rounds the climb's open ring
         whenever the run-up is faded out from in front of it;
       - head cap rides the reveal. */
    const cornerCap = new THREE.Mesh(capGeo, stubMat);
    cornerCap.position.copy(routePts[0]);
    cornerCap.renderOrder = 1;
    rig.add(cornerCap);
    const cornerGhostCap = new THREE.Mesh(capGeo, ghostMat);
    cornerGhostCap.position.copy(routePts[0]);
    cornerGhostCap.renderOrder = 0;
    rig.add(cornerGhostCap);
    const tail = new THREE.Mesh(capGeo, routeMat);
    tail.position.copy(routePts[Math.round(RUNUP_T * N)]);
    tail.renderOrder = 1;
    rig.add(tail);
    const head = new THREE.Mesh(capGeo, routeMat);
    head.renderOrder = 1;
    rig.add(head);

    /* Facing of the face the run-up rides (normal at local 150°) against
       the camera axis (+z, world 90°): cos((150° − yaw) − 90°). Checked at
       the rests: page top +0.5, section 01 +1 (solid), 02/03 −0.5 (gone).
       The floor at 0.15 is still on the front side, so the pair is fully
       gone before the silhouette sliver could expose it. */
    const paintStub = (rot: number) => {
      const facing = Math.cos(Math.PI / 3 - rot);
      const o = Math.max(0, Math.min((facing - 0.15) / 0.3, 1));
      stubMat.opacity = o;
      runup.visible = o > 0.01;
      cornerCap.visible = o > 0.01;
    };

    /* ---- continuous progress ----

       ONE coordinate, s, anchored to the three rest positions:
         s = -1  page top
         s =  0  piece 01 centred
         s =  1  piece 02 centred
         s =  2  piece 03 centred
       Piecewise-linear between them, so the object rests exactly when the
       page rests no matter how the header or the pieces are sized. Read
       from layout every frame (three rects; scrolling does not dirty
       layout) rather than from the section index, which steps in thirds
       and, on a 3-fold symmetric object, makes every rest pose identical.

       The negative leg is what carries the reveal: the line has to be
       ALREADY CLIMBING when section 01 arrives, so its origin is the top
       of the page, not the top of the stack. */
    const pieceEls = Array.from(document.querySelectorAll<HTMLElement>(".stack__copy .piece"));
    const coord = () => {
      if (pieceEls.length < 3) return Math.max(0, Math.min(activeRef.current, 2));
      const vh = window.innerHeight;
      const y = window.scrollY;
      const c = pieceEls.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + y + r.height / 2 - vh / 2;
      });
      const raw =
        y <= c[0]
          ? c[0] > 0
            ? -1 + y / c[0]
            : 0
          : y <= c[1]
            ? (y - c[0]) / (c[1] - c[0] || 1)
            : y <= c[2]
              ? 1 + (y - c[1]) / (c[2] - c[1] || 1)
              : 2;

      /* SETTLE EARLY, THEN HOLD.

         Linear in scroll, the object only finishes its step at the exact
         centre of a section — but a 100vh piece owns the screen long
         before that, and the legend flips to it half a section early. The
         reader is therefore reading "03" while the pyramid is still 30%
         from its rest: mid-turn, and with the route stalled below the apex
         because the reveal is keyed to the same coordinate.

         Compressing each step into the first 62% of its scroll span fixes
         both at once — the turn and the climb are finished by the time the
         piece has taken the screen, and the remaining 38% is a genuine
         hold on the rest pose rather than a slow crawl into it.

         Smoothstep, so the compression does not add a hard stop of its
         own; integers are preserved, so every rest still lands exactly on
         its pose. */
      const i = Math.floor(raw);
      const t = Math.min((raw - i) / 0.62, 1);
      return i + t * t * (3 - 2 * t);
    };

    /* Camera and band lighting run off p = s/2 clamped to the stack. */
    const pOf = (s: number) => Math.max(0, Math.min(s, 2)) / 2;
    /* Rotation runs off s DIRECTLY, negative leg included — that leg is the
       approach from the top of the page, and clamping it to p meant the
       object sat dead still through the whole descent and only the line
       moved. Arriving at section 01 you had never seen it turn, so nothing
       established it as a solid.

       So the approach gets a HALF step. At the page top the object rests
       corner-on (yaw 120°, a near edge to the camera, both flanking faces
       raking away); over the descent it swings 60° and squares its face at
       section 01. The route's tip crosses the silhouette edge on the way,
       which is the moment that reads as "this thing has sides".

       Past section 01 the step doubles to the full 120° per section, so
       each stop still brings up the next face. Both branches give PI/3 at
       s = 0, so the change of pace is continuous — no kink at the handover.

       +PI/3 is what squares a face at a stop: face centres sit at 30/150/
       270, and yawing by 60 puts one on the camera axis.

       (Face-on was blamed once for the object reading flat; that was the
       wrong call. The cause was the CAMERA, level at -3 and +3 degrees for
       the first two stops, where the base ring and both tier rings project
       to straight lines and no phase can save it.) */
    const rotOf = (s: number) =>
      s <= 0
        ? Math.PI / 3 - s * (Math.PI / 3)
        : Math.PI / 3 - s * ((2 * Math.PI) / 3);

    /* The reveal is the exception — it runs off s directly, and its value is a
       HEIGHT on the pyramid, keyed to where the climb should have reached
       at each rest:
         page top  0     nothing drawn, tail waiting at the base corner
         piece 01  0.18  mid-way up the foundation band
         piece 02  0.64  high in the middle band — still in progress
         piece 03  1.0   the summit
       Mid-band at 01 and 02 because resting on a seam reads as finished;
       the summit at 03 because that stop IS the arrival. */
    /* Section 2 sits high in its band rather than at the midpoint: 0.54
       read as barely past the seam it had just crossed. 0.64 is clearly
       inside the middle band and clearly still short of the apex — in
       progress, which is the state that stop is describing. */
    const REST = [0.18, 0.64, 1.0];
    const drawOf = (s: number) => {
      if (s <= 0) return Math.max(0, (s + 1) * REST[0]);
      if (s <= 1) return REST[0] + (REST[1] - REST[0]) * s;
      return Math.min(REST[1] + (REST[2] - REST[1]) * (s - 1), 1);
    };
    /* Band lighting: a triangular ramp centred on each section, half a
       section wide either side, so bands cross-fade as the scroll passes
       between them and exactly one is lit at each rest. */
    const bandW = (i: number, p: number) =>
      Math.max(0, 1 - Math.abs(p - i / 2) / 0.5);
    const keyOf = (keys: number[], p: number) => {
      const seg = Math.min(p * 2, 1.999999);
      const i = Math.floor(seg);
      return keys[i] + (keys[i + 1] - keys[i]) * (seg - i);
    };

    /* Seeded from the CURRENT progress and applied once before the first
       render. Without this the opening frame draws from the camera's
       default origin — inside the object, route fully drawn — a one-frame
       flash on fast devices and a permanent portrait of the bug anywhere
       rAF is starved. */
    const s0 = coord();
    const p0 = pOf(s0);

    /* EVERY stop frames the whole object; the ascent is expressed as
       ANGLE, not amputation — a cropped base at the summit reads as a
       framing error, not altitude.

       ELEVATION IS THE WHOLE POINT, and the first build got it wrong: at
       -3.4 and +3.3 degrees the first two stops were level with the
       object, so the base ring projected to a straight line, the tier
       rings to straight lines, and the pyramid read as a flat triangle.
       A route that genuinely wraps it then has its near and far halves
       land on top of each other in projection — which is why the climb
       looked like a squiggle on one face instead of a turn around a solid.
       Nothing was wrong with the route; the camera was never above it.

       15 / 20 / 25 degrees: enough at the first stop to open the base ring
       and separate the two halves of the wrap, rising to a clear look down
       onto the apex at the last. The top of that range was 32 and is now
       25 — a full wrap DOUBLES BACK on itself in projection where it
       crosses the silhouette, and the steeper the look-down the more
       contorted that reversal reads. 25 is the §9 cover's angle to within
       a few degrees, which is the shape being matched. The ascent still reads, because it is the
       CHANGE in angle that reads, not the absolute height.

       Framing checked against the projection: with fov 34 the half-span at
       the look target is tan(17°)·d, and all three keep the full object
       inside it — 1.15 of horizontal half-extent against 1.38, and roughly
       1.3 of vertical against 1.49. */
    const camY = [2.05, 2.6, 3.05];
    const lookY = [0.8, 0.92, 1.02];
    const dist = [4.7, 4.45, 4.2];

    /* A FACE squares to the camera at every stop; the approach from the
       page top arrives into that square from corner-on — see rotOf. */
    let rotNow = rotOf(s0);
    let camNow = new THREE.Vector3(0, keyOf(camY, p0), keyOf(dist, p0));
    let lookNow = new THREE.Vector3(0, keyOf(lookY, p0), 0);
    let drawNow = drawOf(s0);
    const wNow = [0, 1, 2].map((i) => bandW(i, p0));

    rig.rotation.y = rotNow;
    camera.position.copy(camNow);
    camera.lookAt(lookNow);
    const paintBands = () => {
      wNow.forEach((w, i) => {
        bandMats[i].color.copy(ink).lerp(hl[i], w);
        bandMats[i].opacity = 0.07 + (hlPeak[i] - 0.07) * w;
      });
    };
    const paintRoute = () => {
      const u = arcOfHeight(drawNow);
      const count = Math.floor(routeIndexCount * u);
      /* ghost shows the whole trace from the corner; the solid climb only
         past the run-up boundary — the run-up window has its own mesh and
         facing fade (see paintStub). */
      tube.setDrawRange(0, count);
      solidGeo.setDrawRange(runupCount, Math.max(0, count - runupCount));
      head.position.copy(curve.getPointAt(Math.min(Math.max(u, 0), 1)));
      head.visible = drawNow > 0.004;
    };
    paintBands();
    paintRoute();
    paintStub(rotNow);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const sNow = coord();
      const p = pOf(sNow);

      /* WEIGHT. At 6 the object tracked the scroll almost exactly, so the
         turn finished inside the page's own glide and there was nothing
         left to watch on arrival — the approach from the top especially,
         where it appeared to simply be in position. At 2.4 it trails the
         scroll and keeps turning for roughly a second after the page has
         settled, which is what makes the rotation readable as rotation.
         Both the turn and the climb ride this, so they slow together. */
      const k = 1 - Math.exp(-2.4 * dt);

      rotNow += (rotOf(sNow) - rotNow) * k;
      rig.rotation.y = rotNow;
      paintStub(rotNow);

      camNow.lerp(new THREE.Vector3(0, keyOf(camY, p), keyOf(dist, p)), k);
      lookNow.lerp(new THREE.Vector3(0, keyOf(lookY, p), 0), k);
      camera.position.copy(camNow);
      camera.lookAt(lookNow);

      drawNow += (drawOf(sNow) - drawNow) * k;
      paintRoute();

      for (let b = 0; b < 3; b++) wNow[b] += (bandW(b, p) - wNow[b]) * k;
      paintBands();

      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* One synchronous frame so the column is never blank before the first
       rAF — and so a starved rAF (hidden tab) still shows the object. */
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);













    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="stack__gl" ref={hostRef} aria-hidden="true" />;
}
