/* ============================================================
   Brush-stroke geometry for the hero.

   Painterly system: every mark is a hand-authored path run through an
   SVG displacement filter (defined once in Hero.tsx as #fx-rough-*),
   so smooth bezier outlines come out ragged and hand-painted.

   Art direction (from the background spec):
     · the eruption ORIGINATES LOW — an invisible source at roughly
       x 50%, y 82%. Strokes shoot up and outward from there, then
       bend, loop and wander: ~30% radial explosion, ~70% controlled
       graphic chaos;
     · a calm dark column is preserved through the middle (x ≈ 38–62,
       y ≈ 15–70) for the figure and the giant typography — only thin
       scribbles and faint fragments may enter it;
     · density lives along the bottom, the side edges and the upper
       corners. The frame is designed everywhere, not an explosion at
       the foot of an empty canvas;
     · complementary collisions are deliberate: cyan↔orange,
       lime↔violet, yellow↔cobalt, magenta↔emerald, turquoise↔red —
       adjacent instances are paired for vibration;
     · big graphic forms join the brushwork: imperfect targets, open
       rings, looping worm-ribbons, bending curves, chunky fragments.
       Several enormous forms enter from outside the frame.

   REPLACE-ME (asset swap): give any instance a `src` (e.g.
   "/assets/strokes/mid-01.png") and BrushField renders that image in
   place of the inline path — keep x/y/scale/rotate/layer/family and
   the motion system keeps working. See public/assets/README.md.
   ============================================================ */

export type StrokeFamily = "cool" | "warm" | "hot";
export type StrokeLayer = "back" | "mid" | "fore";
export type StrokeKind =
  | "mass" | "sweep" | "flick" | "slash" | "wedge" | "bar" | "club"
  | "curve" | "worm" | "target" | "ring" | "chunk" | "tri" | "blob"
  | "splash" | "dry" | "ribbon" | "loop" | "hatch";

const STROKED: StrokeKind[] = ["ribbon", "loop", "hatch"];
export const isStroked = (k: StrokeKind) => STROKED.includes(k);

/** The invisible source of the whole eruption, in composition %. */
export const ORIGIN = { x: 50, y: 82 };

export type Stroke = {
  id: string;
  layer: StrokeLayer;
  family: StrokeFamily;
  kind: StrokeKind;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
  opacity: number;
  drift: "a" | "b" | "c" | "d";
  dur: number;
  order: number;
  /** `md` marks drop at ≤1024px; `sm` marks also drop at ≤720px. */
  shed?: "md" | "sm";
  /** Roughness grade — which #fx-rough-* filter warps this mark. */
  fx: "s" | "m" | "l" | "xl";
  vb: string;
  w: number;
  h: number;
  d?: string;
  paths?: string[];
  /** Per-path fill vars (targets etc.); falls back to `color`. */
  palette?: string[];
  fillRule?: "evenodd";
  width?: number;
  /** Optional raster/vector asset that replaces the inline path. */
  src?: string;
};

/* ---------------- shape library ---------------- */

/* Huge soft-edged paint masses — the dark colour fields of layer 2. */
const MASS_1 =
  "M40 150 C 10 90, 60 20, 150 14 C 250 8, 340 40, 368 110 C 392 172, 340 250, 240 264 C 140 278, 70 220, 40 150 Z";
const MASS_2 =
  "M20 120 C 40 50, 140 10, 240 30 C 330 48, 390 110, 370 180 C 350 250, 240 290, 140 260 C 60 236, 4 180, 20 120 Z";

/* Long tapered sweeps — thick belly, pointed ends. */
const SWEEP_1 =
  "M2 46 C 54 14, 118 6, 186 16 C 244 24, 312 22, 418 6 C 366 30, 300 46, 232 44 C 168 42, 96 44, 2 46 Z";
const SWEEP_2 =
  "M4 96 C 60 44, 122 96, 190 62 C 250 32, 314 60, 396 18 C 340 60, 276 92, 208 84 C 140 76, 74 108, 4 96 Z";
const SWEEP_3 =
  "M2 30 C 70 62, 150 60, 224 34 C 288 12, 340 22, 398 44 C 330 46, 276 40, 220 52 C 148 68, 66 62, 2 30 Z";

/* Short flicks — comma-shaped lift-off dabs. */
const FLICK_1 =
  "M6 40 C 40 8, 100 -2, 176 10 C 132 30, 76 50, 30 56 C 18 58, 8 52, 6 40 Z";
const FLICK_2 = "M2 20 C 50 4, 130 0, 198 8 C 140 26, 62 34, 2 20 Z";

/* Directional whips — blunt at one end, whipping to a point. */
const SLASH_1 =
  "M2 30 C 30 12, 70 6, 118 10 C 176 15, 238 26, 298 44 C 232 42, 168 36, 112 34 C 66 32, 26 38, 2 30 Z";
const WEDGE_1 =
  "M4 22 C 22 6, 52 4, 78 14 C 132 34, 190 52, 256 72 C 188 68, 124 56, 74 44 C 40 36, 10 34, 4 22 Z";

/* Blunt chunks of flat colour. */
const BAR_1 =
  "M18 8 C 60 2, 140 4, 184 14 C 196 17, 198 52, 184 58 C 140 68, 56 68, 16 60 C 2 57, 4 12, 18 8 Z";
const CLUB_1 =
  "M14 40 C 20 10, 60 0, 96 12 C 140 27, 172 58, 166 84 C 160 106, 110 110, 74 96 C 34 80, 8 66, 14 40 Z";

/* Bending curve — a broad stroke that launches, then arcs away. The
   shape that turns "radial firework" into "energy that wanders". */
const CURVE_1 =
  "M8 208 C 6 140, 30 62, 96 24 C 140 -2, 196 -2, 240 14 C 200 22, 158 30, 126 56 C 78 94, 52 152, 44 210 C 32 214, 18 214, 8 208 Z";

/* Looping worm-ribbon — an S-band of paint with varying width. */
const WORM_1 =
  "M6 70 C 60 10, 120 120, 200 50 C 240 16, 280 30, 300 14 C 296 40, 258 52, 216 80 C 140 132, 60 44, 22 96 C 14 90, 8 80, 6 70 Z";

/* Imperfect concentric target — three wobbly rings, per-ring colour. */
const TARGET_PATHS = [
  "M60 6 C 92 8, 116 32, 114 62 C 112 92, 86 114, 56 112 C 26 110, 4 84, 6 56 C 8 26, 30 4, 60 6 Z",
  "M60 26 C 80 27, 95 42, 94 61 C 93 80, 77 94, 58 93 C 39 92, 25 76, 26 58 C 27 40, 41 25, 60 26 Z",
  "M59 44 C 68 44, 76 51, 75 60 C 74 69, 66 76, 57 75 C 48 74, 42 66, 43 58 C 44 49, 50 44, 59 44 Z"
];

/* Open elliptical ring — a thick painted hoop. */
const RING_1 =
  "M60 4 C 95 6, 118 30, 116 62 C 114 94, 86 116, 54 114 C 22 112, 2 86, 4 54 C 6 24, 28 2, 60 4 Z " +
  "M60 24 C 82 26, 98 42, 96 62 C 94 84, 76 96, 56 94 C 36 92, 22 76, 24 56 C 26 38, 40 22, 60 24 Z";

/* Chunky fragments — cut-paper geometry, roughened by the filter. */
const CHUNK_1 = "M8 14 L 96 4 L 110 48 L 88 60 L 14 66 Z";
const TRI_1 = "M10 88 L 64 6 L 118 74 C 84 84, 40 92, 10 88 Z";

/* Asymmetric painted island. */
const BLOB_1 =
  "M30 60 C 18 30, 48 8, 84 14 C 118 20, 140 44, 130 76 C 122 102, 84 116, 52 104 C 28 95, 38 84, 30 60 Z";

/* Ink splash — a body plus flung droplets. */
const SPLASH_PATHS = [
  "M56 44 C 70 24, 106 22, 122 42 C 136 60, 122 84, 94 86 C 66 88, 44 64, 56 44 Z",
  "M138 28 C 144 24, 152 28, 150 34 C 148 40, 138 40, 136 34 C 135 31, 135 30, 138 28 Z",
  "M26 66 C 31 62, 38 66, 36 72 C 34 77, 26 76, 24 71 Z",
  "M146 68 C 150 66, 155 69, 153 73 C 151 77, 145 75, 144 71 Z",
  "M40 26 C 44 23, 49 26, 47 30 C 45 34, 39 32, 38 28 Z",
  "M110 96 C 114 93, 119 96, 117 100 C 115 104, 109 102, 108 98 Z"
];

/* Dry-brush — parallel slivers with gaps. */
const DRY_1 = [
  "M2 26 C 60 10, 140 6, 216 14 C 150 24, 66 34, 2 26 Z",
  "M8 40 C 66 28, 138 24, 206 30 C 144 40, 70 48, 8 40 Z",
  "M18 12 C 70 2, 128 0, 180 4 C 126 12, 66 18, 18 12 Z",
  "M4 52 C 52 46, 110 42, 158 46 C 108 54, 52 58, 4 52 Z"
];

/* Line work — drawn on with stroke-dasharray at entrance. */
const RIBBON_1 = "M6 74 C 84 18, 158 96, 236 44 C 302 0, 372 58, 442 30";
const RIBBON_2 = "M4 30 C 76 96, 148 6, 226 52 C 296 94, 358 24, 420 66";
const LOOP_1 =
  "M104 16 C 44 2, 4 46, 22 78 C 42 114, 108 106, 116 66 C 122 34, 80 22, 60 44 C 44 62, 60 84, 78 76";
const LOOP_2 =
  "M8 62 C 2 26, 44 4, 74 18 C 108 34, 106 82, 72 92 C 42 100, 22 78, 32 58";
const HATCH_1 = ["M2 8 C 30 2, 62 6, 92 2", "M0 22 C 32 16, 66 20, 96 15", "M4 36 C 34 30, 64 34, 90 29"];

/* ---------------- shape presets ---------------- */

type Shape = Pick<
  Stroke,
  "kind" | "fx" | "vb" | "w" | "h" | "d" | "paths" | "width" | "fillRule"
>;

const S: Record<string, Shape> = {
  mass1: { kind: "mass", fx: "xl", vb: "0 0 400 280", w: 400, h: 280, d: MASS_1 },
  mass2: { kind: "mass", fx: "xl", vb: "0 0 400 300", w: 400, h: 300, d: MASS_2 },
  sweep1: { kind: "sweep", fx: "l", vb: "0 0 420 52", w: 420, h: 52, d: SWEEP_1 },
  sweep2: { kind: "sweep", fx: "l", vb: "0 0 400 120", w: 400, h: 120, d: SWEEP_2 },
  sweep3: { kind: "sweep", fx: "l", vb: "0 0 400 76", w: 400, h: 76, d: SWEEP_3 },
  flick1: { kind: "flick", fx: "m", vb: "0 0 180 60", w: 180, h: 60, d: FLICK_1 },
  flick2: { kind: "flick", fx: "m", vb: "0 0 200 34", w: 200, h: 34, d: FLICK_2 },
  slash1: { kind: "slash", fx: "m", vb: "0 0 300 50", w: 300, h: 50, d: SLASH_1 },
  wedge1: { kind: "wedge", fx: "m", vb: "0 0 260 78", w: 260, h: 78, d: WEDGE_1 },
  bar1: { kind: "bar", fx: "l", vb: "0 0 200 70", w: 200, h: 70, d: BAR_1 },
  club1: { kind: "club", fx: "l", vb: "0 0 180 110", w: 180, h: 110, d: CLUB_1 },
  curve1: { kind: "curve", fx: "l", vb: "0 0 248 218", w: 248, h: 218, d: CURVE_1 },
  worm1: { kind: "worm", fx: "m", vb: "0 0 306 136", w: 306, h: 136, d: WORM_1 },
  target1: { kind: "target", fx: "m", vb: "0 0 120 118", w: 120, h: 118, paths: TARGET_PATHS },
  ring1: { kind: "ring", fx: "m", vb: "0 0 120 118", w: 120, h: 118, d: RING_1, fillRule: "evenodd" },
  chunk1: { kind: "chunk", fx: "m", vb: "0 0 118 70", w: 118, h: 70, d: CHUNK_1 },
  tri1: { kind: "tri", fx: "m", vb: "0 0 126 94", w: 126, h: 94, d: TRI_1 },
  blob1: { kind: "blob", fx: "l", vb: "0 0 150 120", w: 150, h: 120, d: BLOB_1 },
  splash1: { kind: "splash", fx: "m", vb: "0 0 160 110", w: 160, h: 110, paths: SPLASH_PATHS },
  dry1: { kind: "dry", fx: "s", vb: "0 0 220 60", w: 220, h: 60, paths: DRY_1 },
  ribbon1: { kind: "ribbon", fx: "s", vb: "0 0 448 108", w: 448, h: 108, d: RIBBON_1, width: 13 },
  ribbon2: { kind: "ribbon", fx: "s", vb: "0 0 426 100", w: 426, h: 100, d: RIBBON_2, width: 10 },
  loop1: { kind: "loop", fx: "s", vb: "0 0 132 116", w: 132, h: 116, d: LOOP_1, width: 7 },
  loop2: { kind: "loop", fx: "s", vb: "0 0 116 100", w: 116, h: 100, d: LOOP_2, width: 7 },
  hatch1: { kind: "hatch", fx: "s", vb: "0 0 98 42", w: 98, h: 42, paths: HATCH_1, width: 5 }
};

/* Instance helper. */
type Inst = {
  s: keyof typeof S;
  l: StrokeLayer;
  f: StrokeFamily;
  x: number;
  y: number;
  sc: number;
  r: number;
  c: string;
  o?: number;
  shed?: "md" | "sm";
  pal?: string[];
  src?: string;
};

const DRIFTS = ["a", "b", "c", "d"] as const;

function make(list: Inst[]): Stroke[] {
  return list.map((i, n) => ({
    id: `${i.l}-${n}`,
    layer: i.l,
    family: i.f,
    x: i.x,
    y: i.y,
    scale: i.sc,
    rotate: i.r,
    color: i.c,
    opacity: i.o ?? 1,
    drift: DRIFTS[n % 4],
    dur: 19 + ((n * 7) % 23), // prime-ish spread: no two marks share a period
    order: n + 1,
    shed: i.shed,
    palette: i.pal,
    src: i.src,
    ...S[i.s]
  }));
}

/* ---------------- the composition ----------------
   Origin (50, 82). Calm column x 38–62, y 15–70. The figure stands
   above the origin: face box ≈ x 44–56, y 42–55; legs ≈ y 58–78. */

export const strokes: Stroke[] = make([
  /* ===== BACK ============================================== */
  /* layer 2 — dark masses. One backs the calm column so the giant
     typography always sits on deep navy; the rest field the edges. */
  { s: "mass1", l: "back", f: "cool", x: 50, y: 40, sc: 2.0, r: -6, c: "--m-navy", o: 0.9 },
  { s: "mass2", l: "back", f: "cool", x: 22, y: 10, sc: 1.6, r: 12, c: "--m-teal", o: 0.85 },
  { s: "mass2", l: "back", f: "hot", x: 16, y: 30, sc: 1.7, r: -16, c: "--m-violetd", o: 0.85 },
  { s: "mass1", l: "back", f: "hot", x: 85, y: 26, sc: 1.6, r: 20, c: "--m-purple", o: 0.85 },
  { s: "mass2", l: "back", f: "warm", x: 12, y: 74, sc: 1.7, r: 8, c: "--m-indigo", o: 0.85 },
  { s: "mass1", l: "back", f: "hot", x: 88, y: 72, sc: 1.7, r: -12, c: "--m-plum", o: 0.85 },
  { s: "mass1", l: "back", f: "hot", x: 50, y: 94, sc: 1.9, r: 4, c: "--m-violetd", o: 0.85 },

  /* enormous curves entering from outside the frame */
  { s: "curve1", l: "back", f: "cool", x: 6, y: 56, sc: 2.3, r: -14, c: "--c-turquoise", o: 0.6 },
  { s: "curve1", l: "back", f: "hot", x: 94, y: 54, sc: 2.3, r: 122, c: "--c-violet", o: 0.6 },
  { s: "sweep2", l: "back", f: "cool", x: 18, y: 92, sc: 2.0, r: -22, c: "--c-blue", o: 0.6 },
  { s: "sweep2", l: "back", f: "hot", x: 82, y: 93, sc: 2.0, r: 204, c: "--c-pink", o: 0.6 },

  /* upper-left: orange/red targets against the dark teal field —
     the reference's signature corner, and a cyan↔orange collision */
  { s: "target1", l: "back", f: "warm", x: 13, y: 15, sc: 1.35, r: 8, c: "--c-orange",
    pal: ["--c-orange", "--c-red", "--c-yellow"] },
  { s: "target1", l: "back", f: "warm", x: 27, y: 22, sc: 0.8, r: -12, c: "--c-amber",
    pal: ["--c-amber", "--c-orange", "--c-blue"], shed: "md" },
  { s: "target1", l: "back", f: "cool", x: 87, y: 12, sc: 0.95, r: 14, c: "--c-yellow",
    pal: ["--c-yellow", "--c-orange", "--c-blue"], shed: "md" },
  { s: "ring1", l: "back", f: "cool", x: 5, y: 38, sc: 1.15, r: 10, c: "--c-cyan", o: 0.75, shed: "sm" },
  { s: "blob1", l: "back", f: "cool", x: 95, y: 42, sc: 1.4, r: -18, c: "--c-turquoise", o: 0.6, shed: "sm" },

  /* upper edges stay designed, not empty */
  { s: "ribbon1", l: "back", f: "cool", x: 32, y: 7, sc: 1.5, r: -4, c: "--c-turquoise", o: 0.6 },
  { s: "ribbon2", l: "back", f: "cool", x: 70, y: 6, sc: 1.3, r: 6, c: "--c-lime", o: 0.55 },

  /* ===== MID — the eruption + the wander ==================== */
  /* burst core: big strokes shooting up and out from (50, 82).
     cyan↔orange collide at the source */
  { s: "wedge1", l: "mid", f: "cool", x: 43, y: 71, sc: 1.6, r: -108, c: "--c-cyan" },
  { s: "wedge1", l: "mid", f: "warm", x: 57, y: 72, sc: 1.6, r: -68, c: "--c-orange" },
  { s: "slash1", l: "mid", f: "warm", x: 35, y: 77, sc: 1.7, r: -148, c: "--c-yellow" },
  { s: "slash1", l: "mid", f: "hot", x: 65, y: 77, sc: 1.7, r: -32, c: "--c-magenta" },
  { s: "flick1", l: "mid", f: "cool", x: 29, y: 84, sc: 1.4, r: -172, c: "--c-lime" },
  { s: "flick1", l: "mid", f: "cool", x: 71, y: 85, sc: 1.4, r: -8, c: "--c-blue" },
  { s: "sweep1", l: "mid", f: "cool", x: 23, y: 74, sc: 1.5, r: -158, c: "--c-turquoise" },
  { s: "sweep1", l: "mid", f: "warm", x: 77, y: 74, sc: 1.5, r: -22, c: "--c-red" },
  { s: "bar1", l: "mid", f: "hot", x: 50, y: 91, sc: 1.3, r: 2, c: "--c-violet" },
  { s: "splash1", l: "mid", f: "hot", x: 50, y: 78, sc: 1.2, r: 0, c: "--c-pink", o: 0.95 },
  { s: "dry1", l: "mid", f: "warm", x: 39, y: 88, sc: 1.3, r: -142, c: "--c-orange" },
  { s: "dry1", l: "mid", f: "cool", x: 61, y: 89, sc: 1.3, r: -38, c: "--c-cyan" },

  /* the wander: once clear of the source, energy bends and loops.
     lime worm over the dark violet mass; magenta worm toward the
     turquoise blob — both complementary collisions */
  { s: "worm1", l: "mid", f: "cool", x: 19, y: 33, sc: 1.5, r: -28, c: "--c-lime" },
  { s: "worm1", l: "mid", f: "hot", x: 81, y: 35, sc: 1.4, r: 22, c: "--c-magenta" },
  { s: "curve1", l: "mid", f: "warm", x: 11, y: 46, sc: 1.5, r: -96, c: "--c-amber", o: 0.95 },
  { s: "curve1", l: "mid", f: "cool", x: 89, y: 47, sc: 1.5, r: 88, c: "--c-blue", o: 0.95 },
  /* yellow slash cutting through the cobalt bar */
  { s: "bar1", l: "mid", f: "cool", x: 15, y: 58, sc: 1.25, r: -14, c: "--c-blue" },
  { s: "sweep3", l: "mid", f: "warm", x: 14, y: 61, sc: 1.4, r: -188, c: "--c-yellow" },
  /* scarlet chunk against the turquoise curve on the right */
  { s: "chunk1", l: "mid", f: "warm", x: 86, y: 62, sc: 1.15, r: 14, c: "--c-red", shed: "md" },
  { s: "tri1", l: "mid", f: "cool", x: 7, y: 82, sc: 1.2, r: 12, c: "--c-turquoise", shed: "md" },
  { s: "target1", l: "mid", f: "hot", x: 75, y: 21, sc: 0.75, r: -8, c: "--c-magenta",
    pal: ["--c-magenta", "--c-violet", "--c-yellow"], shed: "sm" },
  { s: "ring1", l: "mid", f: "cool", x: 26, y: 19, sc: 0.8, r: -14, c: "--c-green", o: 0.9, shed: "sm" },
  { s: "chunk1", l: "mid", f: "hot", x: 91, y: 85, sc: 1.2, r: -18, c: "--c-violet", shed: "md" },
  { s: "blob1", l: "mid", f: "warm", x: 6, y: 93, sc: 1.1, r: 24, c: "--c-red", shed: "sm" },
  /* thin line work may cross the calm column's upper reaches */
  { s: "loop1", l: "mid", f: "cool", x: 37, y: 15, sc: 1.0, r: -10, c: "--c-cyan" },
  { s: "loop2", l: "mid", f: "hot", x: 63, y: 17, sc: 0.9, r: 24, c: "--c-pink" },
  { s: "flick2", l: "mid", f: "cool", x: 28, y: 46, sc: 1.0, r: -166, c: "--c-mint", shed: "sm" },
  { s: "flick2", l: "mid", f: "warm", x: 73, y: 51, sc: 1.0, r: -14, c: "--c-amber", shed: "sm" },

  /* ===== FORE — over the figure's legs and the eruption ===== */
  /* crossings that weld the figure into the paint (face stays clear) */
  { s: "slash1", l: "fore", f: "cool", x: 50, y: 68, sc: 1.2, r: 6, c: "--c-cyan" },
  { s: "flick1", l: "fore", f: "warm", x: 44, y: 63, sc: 1.0, r: 162, c: "--c-orange" },
  { s: "flick1", l: "fore", f: "hot", x: 57, y: 72, sc: 1.0, r: 28, c: "--c-magenta" },
  { s: "wedge1", l: "fore", f: "cool", x: 38, y: 82, sc: 1.2, r: -162, c: "--c-green" },
  { s: "wedge1", l: "fore", f: "hot", x: 62, y: 84, sc: 1.2, r: -18, c: "--c-pink" },
  { s: "flick2", l: "fore", f: "warm", x: 50, y: 88, sc: 1.1, r: 92, c: "--c-yellow" },
  /* wandering fore ribbons drifting off to the sides */
  { s: "worm1", l: "fore", f: "cool", x: 25, y: 66, sc: 1.0, r: -16, c: "--c-turquoise", shed: "sm" },
  { s: "worm1", l: "fore", f: "hot", x: 75, y: 64, sc: 1.0, r: 16, c: "--c-violet", shed: "sm" },
  /* thin scribbles entering the calm column — allowed, and welcome */
  { s: "loop2", l: "fore", f: "cool", x: 45, y: 24, sc: 0.6, r: -26, c: "--c-cyan" },
  { s: "loop1", l: "fore", f: "warm", x: 58, y: 29, sc: 0.55, r: 32, c: "--c-amber", shed: "md" },
  { s: "hatch1", l: "fore", f: "cool", x: 34, y: 35, sc: 1.2, r: -20, c: "--c-lime", shed: "sm" },
  { s: "hatch1", l: "fore", f: "hot", x: 66, y: 33, sc: 1.2, r: 18, c: "--c-pink", shed: "sm" },
  /* foot of the eruption */
  { s: "dry1", l: "fore", f: "cool", x: 50, y: 95, sc: 1.2, r: 90, c: "--c-mint", shed: "sm" },
  { s: "splash1", l: "fore", f: "cool", x: 35, y: 91, sc: 0.9, r: 148, c: "--c-lime", shed: "md" },
  { s: "splash1", l: "fore", f: "cool", x: 66, y: 92, sc: 0.9, r: 28, c: "--c-blue", shed: "md" }
]);

/** Burst vector for a mark: unit direction away from the eruption source. */
export function burstVector(s: Stroke): { bx: number; by: number } {
  const dx = s.x - ORIGIN.x;
  const dy = s.y - ORIGIN.y;
  const len = Math.hypot(dx, dy) || 1;
  return { bx: +(dx / len).toFixed(3), by: +(dy / len).toFixed(3) };
}
