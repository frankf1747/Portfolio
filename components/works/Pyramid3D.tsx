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
/* 1.15, and the camera distances below start at 4.6: the pair is solved
   from the projection, not tuned. A corner mid-turn reaches its widest at
   x' = R/sqrt(d^2 - R^2) against a horizontal half-view of tan(17°)·aspect
   ≈ 0.286 — R 1.35 with d 3.2–4.55 clipped the base corners against the
   canvas on every turn. R 1.15 needs d ≥ 4.2; every stop keeps margin. */
const R = 1.15; // base circumradius
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
/* The route rides INSIDE the surface (0.975) and the depth mask sits
   further in (0.94) — so the route is always between them: never outside
   the silhouette (0.975·R + TUBE_R = 1.137 < R), always in front of the
   mask on the near side, always behind it on the far side. The old 1.012
   put the line 1.2% PROUD of the faces, which is what made it spill past
   the bottom-right corner. */
const ROUTE_INSET = 0.975;
const MASK_INSET = 0.94;

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
       faces (ngonR) with a hair of clearance to stay off the surface. A
       tube, not a Line — WebGL lines are 1px and the route is the cue.
       Revealed by drawRange: tube indices run along the path, so a count
       is a distance climbed. */
    const routePts: THREE.Vector3[] = [];
    /* 90° — a CORNER, and the whole design in one number. A full wrap
       across three pieces means each third of the route spans exactly one
       face; started at a corner, each stop's reveal is a complete
       corner-to-corner diagonal on precisely the face the rotation has
       just turned to the camera. One face, one climb, one stop. (Started
       mid-face — the -90° and +30° attempts — the reveal straddles two
       faces and the depth mask serves it up as disconnected fragments.)

       The wrap runs CLOCKWISE (angle decreasing) and the rig counter-turns
       to match: drawn the other way the tip lands on the LEFT edge and a
       left-to-right eye reads the climb as a descent. Mirroring the wrap
       moves the tail to the lower-left and the tip up-and-right — an
       ascent in reading order. The matching start corner is 210°. */
    const START = (7 * Math.PI) / 6;
    for (let i = 0; i <= 140; i++) {
      const t = i / 140;
      const a = START - t * Math.PI * 2;
      const r = R * (1 - t * 0.985) * ngonR(a - Math.PI / 2) * ROUTE_INSET;
      routePts.push(new THREE.Vector3(Math.cos(a) * r, t * H, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(routePts);
    const tube = new THREE.TubeGeometry(curve, 240, TUBE_R, 8, false);
    const routeIndexCount = tube.index ? tube.index.count : 0;

    /* HEIGHT → ARC. TubeGeometry samples the path by ARC LENGTH, so
       drawRange reveals equal lengths of line — but the path is a spiral
       whose radius is widest at the base, where a unit of arc buys almost
       no climb. Half the length is only ~0.35 of the height, which is why
       a reveal asked to stop mid-band stopped at its lower edge instead.

       routePts are generated at uniform HEIGHT, so their cumulative chord
       lengths are exactly the table that converts one to the other. Every
       reveal target below is therefore a height on the pyramid, and this
       is the only place that has to know about arc length. */
    const cum = [0];
    for (let i = 1; i < routePts.length; i++) {
      cum.push(cum[i - 1] + routePts[i].distanceTo(routePts[i - 1]));
    }
    const N = routePts.length - 1;
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
       solid. drawRange lives on the geometry, so one reveal drives both. */
    const routeMat = new THREE.MeshBasicMaterial({ color: mark });
    const ghostMat = new THREE.MeshBasicMaterial({
      color: mark,
      transparent: true,
      opacity: 0.26,
      depthTest: false,
      depthWrite: false
    });
    const ghost = new THREE.Mesh(tube, ghostMat);
    ghost.renderOrder = 0;
    rig.add(ghost);
    const solid = new THREE.Mesh(tube, routeMat);
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
    const tail = new THREE.Mesh(capGeo, routeMat);
    tail.position.copy(curve.getPointAt(0));
    tail.renderOrder = 1;
    rig.add(tail);
    const head = new THREE.Mesh(capGeo, routeMat);
    head.renderOrder = 1;
    rig.add(head);

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
      if (y <= c[0]) return c[0] > 0 ? -1 + y / c[0] : 0;
      if (y <= c[1]) return (y - c[0]) / (c[1] - c[0] || 1);
      if (y <= c[2]) return 1 + (y - c[1]) / (c[2] - c[1] || 1);
      return 2;
    };

    /* Rotation, camera and band lighting run off p = s/2 clamped to the
       stack, so each rest still turns a fresh face to the camera. */
    const pOf = (s: number) => Math.max(0, Math.min(s, 2)) / 2;
    const rotOf = (p: number) => Math.PI / 3 - p * ((4 * Math.PI) / 3);

    /* The reveal is the exception — it runs off s directly, and its value is a
       HEIGHT on the pyramid, keyed to where the climb should have reached
       at each rest:
         page top  0     nothing drawn, tail waiting at the base corner
         piece 01  0.18  mid-way up the foundation band
         piece 02  0.54  mid-way up the middle band — still in progress
         piece 03  1.0   the summit
       Mid-band at 01 and 02 because resting on a seam reads as finished;
       the summit at 03 because that stop IS the arrival. */
    const REST = [0.18, 0.54, 1.0];
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
       framing error, not altitude. Checked against the projection: with
       fov 34 the visible half-span at the look target is tan(17°)·d, and
       all three keep y ∈ [0, 2] inside it with margin.
         1: low and back — eye level with the base, looking slightly up
         2: closer, chest height — the working view
         3: high above — ~30° down onto the apex, base still standing */
    const camY = [0.55, 1.2, 3.0];
    const lookY = [0.82, 0.95, 1.1];
    const dist = [4.6, 4.4, 4.25];

    /* PI/3 fronts a FACE at every stop (face centres sit at 30/150/270;
       yawing by +60 brings one to the camera axis). The first build rested
       at -30, which fronted neither face nor edge — the silhouette sat
       lopsided at every pause. */
    let rotNow = rotOf(p0);
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
      tube.setDrawRange(0, Math.floor(routeIndexCount * u));
      head.position.copy(curve.getPointAt(Math.min(Math.max(u, 0), 1)));
      head.visible = drawNow > 0.004;
    };
    paintBands();
    paintRoute();

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const sNow = coord();
      const p = pOf(sNow);

      /* Faster damping than a discrete step would want (6, not 3.2): the
         target is already animated by the page's own scroll easing, so
         this only smooths measurement jitter — heavier and the object
         would lag the scroll it is supposed to be attached to. */
      const k = 1 - Math.exp(-6 * dt);

      rotNow += (rotOf(p) - rotNow) * k;
      rig.rotation.y = rotNow;

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
