/* ============================================================
   Brush-stroke geometry for the hero.

   Painterly system: every mark is a hand-authored path run through an
   SVG displacement filter (defined once in Hero.tsx as #fx-rough-*).
   The filter warps the silhouette with fractal noise, so smooth bezier
   outlines come out ragged, dry-edged and hand-painted. `fx` picks the
   roughness grade per shape.

   Composition rules, from the reference:
     · density is highest in a ring around the figure and falls off
       toward the edges;
     · rotation mostly points along the radius, so the whole field
       reads as ONE explosion, not scattered decoration;
     · no stars, no regular polygons, no concentric circles — only
       strokes, swipes, splashes and paint masses.

   REPLACE-ME (asset swap): give any instance a `src` (e.g.
   "/assets/strokes/mid-01.png") and BrushField renders that image in
   place of the inline path — keep x/y/scale/rotate/layer/family and
   the motion system keeps working. See public/assets/README.md.
   ============================================================ */

export type StrokeFamily = "cool" | "warm" | "hot";
export type StrokeLayer = "back" | "mid" | "fore";
export type StrokeKind =
  | "mass" | "sweep" | "flick" | "slash" | "wedge" | "bar" | "club"
  | "splash" | "dry" | "ribbon" | "loop" | "hatch";

const STROKED: StrokeKind[] = ["ribbon", "loop", "hatch"];
export const isStroked = (k: StrokeKind) => STROKED.includes(k);

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

/* Blunt chunks — flat colour that stays thick end to end. */
const BAR_1 =
  "M18 8 C 60 2, 140 4, 184 14 C 196 17, 198 52, 184 58 C 140 68, 56 68, 16 60 C 2 57, 4 12, 18 8 Z";
const CLUB_1 =
  "M14 40 C 20 10, 60 0, 96 12 C 140 27, 172 58, 166 84 C 160 106, 110 110, 74 96 C 34 80, 8 66, 14 40 Z";

/* Ink splash — a body plus flung droplets. */
const SPLASH_PATHS = [
  "M56 44 C 70 24, 106 22, 122 42 C 136 60, 122 84, 94 86 C 66 88, 44 64, 56 44 Z",
  "M138 28 C 144 24, 152 28, 150 34 C 148 40, 138 40, 136 34 C 135 31, 135 30, 138 28 Z",
  "M26 66 C 31 62, 38 66, 36 72 C 34 77, 26 76, 24 71 Z",
  "M146 68 C 150 66, 155 69, 153 73 C 151 77, 145 75, 144 71 Z",
  "M40 26 C 44 23, 49 26, 47 30 C 45 34, 39 32, 38 28 Z",
  "M110 96 C 114 93, 119 96, 117 100 C 115 104, 109 102, 108 98 Z"
];

/* Dry-brush — parallel slivers with gaps, a splayed brush breaking up. */
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

type Shape = Pick<Stroke, "kind" | "fx" | "vb" | "w" | "h" | "d" | "paths" | "width">;

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
    src: i.src,
    ...S[i.s]
  }));
}

/* ---------------- the composition ----------------
   Figure occupies roughly x 42–58, y 24–72; its face box is x 43–57,
   y 22–40. MID paints behind the figure (occlusion is wanted there),
   FORE crosses in front but stays out of the face box. */

export const strokes: Stroke[] = make([
  /* ===== BACK ============================================== */
  /* layer 2 — dark paint masses. The background must read as a finished
     abstract painting before any bright mark lands on it. */
  { s: "mass1", l: "back", f: "cool", x: 24, y: 28, sc: 1.6, r: -14, c: "--m-navy", o: 0.85 },
  { s: "mass2", l: "back", f: "hot", x: 78, y: 66, sc: 1.5, r: 10, c: "--m-burgundy", o: 0.8 },
  { s: "mass1", l: "back", f: "cool", x: 14, y: 76, sc: 1.3, r: 24, c: "--m-green", o: 0.75 },
  { s: "mass2", l: "back", f: "hot", x: 82, y: 18, sc: 1.4, r: -22, c: "--m-purple", o: 0.8 },
  { s: "mass1", l: "back", f: "hot", x: 50, y: 90, sc: 1.5, r: 6, c: "--m-plum", o: 0.75 },
  { s: "mass2", l: "back", f: "warm", x: 46, y: 8, sc: 1.3, r: 16, c: "--m-navy", o: 0.7 },

  /* broad colour strokes that pass visibly BEHIND the giant word */
  { s: "sweep1", l: "back", f: "cool", x: 28, y: 50, sc: 2.1, r: -6, c: "--c-turquoise", o: 0.55 },
  { s: "sweep3", l: "back", f: "hot", x: 73, y: 55, sc: 2.0, r: 6, c: "--c-violet", o: 0.55 },
  { s: "sweep2", l: "back", f: "cool", x: 50, y: 36, sc: 1.8, r: -12, c: "--c-blue", o: 0.5 },
  { s: "sweep1", l: "back", f: "warm", x: 18, y: 15, sc: 1.6, r: -28, c: "--c-green", o: 0.45 },
  { s: "sweep3", l: "back", f: "hot", x: 84, y: 84, sc: 1.7, r: 18, c: "--c-pink", o: 0.45 },
  { s: "ribbon1", l: "back", f: "cool", x: 42, y: 10, sc: 1.4, r: -6, c: "--c-turquoise", o: 0.6 },
  { s: "ribbon2", l: "back", f: "hot", x: 60, y: 90, sc: 1.3, r: 8, c: "--c-pink", o: 0.55 },
  { s: "splash1", l: "back", f: "warm", x: 8, y: 42, sc: 1.9, r: 20, c: "--c-orange", o: 0.5, shed: "sm" },
  { s: "splash1", l: "back", f: "cool", x: 92, y: 36, sc: 1.7, r: -30, c: "--c-cyan", o: 0.45, shed: "sm" },

  /* ===== MID — the eruption behind the figure ============== */
  /* inner fan, radius 8–22% from centre, angles pointing outward */
  { s: "wedge1", l: "mid", f: "cool", x: 54, y: 33, sc: 1.3, r: -62, c: "--c-cyan" },
  { s: "flick1", l: "mid", f: "warm", x: 45, y: 32, sc: 1.2, r: -116, c: "--c-orange" },
  { s: "slash1", l: "mid", f: "warm", x: 61, y: 40, sc: 1.5, r: -28, c: "--c-yellow" },
  { s: "slash1", l: "mid", f: "hot", x: 39, y: 42, sc: 1.5, r: 206, c: "--c-magenta" },
  { s: "wedge1", l: "mid", f: "cool", x: 37, y: 52, sc: 1.4, r: 186, c: "--c-turquoise" },
  { s: "slash1", l: "mid", f: "warm", x: 64, y: 52, sc: 1.6, r: 4, c: "--c-orange" },
  { s: "flick1", l: "mid", f: "hot", x: 62, y: 62, sc: 1.3, r: 32, c: "--c-pink" },
  { s: "wedge1", l: "mid", f: "cool", x: 41, y: 64, sc: 1.4, r: 152, c: "--c-green" },
  { s: "slash1", l: "mid", f: "cool", x: 52, y: 71, sc: 1.5, r: 86, c: "--c-cyan" },
  { s: "flick2", l: "mid", f: "warm", x: 47, y: 58, sc: 1.1, r: 122, c: "--c-yellow" },
  { s: "club1", l: "mid", f: "hot", x: 57, y: 45, sc: 1.2, r: -14, c: "--c-magenta", o: 0.95 },
  { s: "bar1", l: "mid", f: "cool", x: 44, y: 37, sc: 1.1, r: -142, c: "--c-blue" },
  { s: "splash1", l: "mid", f: "hot", x: 50, y: 46, sc: 1.3, r: 0, c: "--c-pink" },
  { s: "flick1", l: "mid", f: "cool", x: 57, y: 24, sc: 1.1, r: -74, c: "--c-turquoise" },
  { s: "dry1", l: "mid", f: "hot", x: 36, y: 29, sc: 1.2, r: -148, c: "--c-violet", shed: "sm" },
  { s: "dry1", l: "mid", f: "cool", x: 65, y: 68, sc: 1.2, r: 22, c: "--c-green", shed: "sm" },

  /* outer ring, radius 26–38% — sparser, larger, still radial */
  { s: "sweep1", l: "mid", f: "warm", x: 77, y: 36, sc: 1.35, r: -18, c: "--c-amber" },
  { s: "sweep3", l: "mid", f: "cool", x: 23, y: 60, sc: 1.35, r: 168, c: "--c-cyan" },
  { s: "club1", l: "mid", f: "warm", x: 28, y: 25, sc: 1.2, r: -132, c: "--c-orange", shed: "md" },
  { s: "bar1", l: "mid", f: "cool", x: 74, y: 71, sc: 1.2, r: 26, c: "--c-turquoise", shed: "md" },
  { s: "loop1", l: "mid", f: "cool", x: 33, y: 21, sc: 1.0, r: -10, c: "--c-cyan", shed: "sm" },
  { s: "loop2", l: "mid", f: "hot", x: 70, y: 23, sc: 0.9, r: 30, c: "--c-pink", shed: "sm" },
  { s: "splash1", l: "mid", f: "warm", x: 21, y: 74, sc: 1.2, r: 162, c: "--c-yellow", shed: "md" },
  { s: "splash1", l: "mid", f: "hot", x: 81, y: 52, sc: 1.1, r: -12, c: "--c-violet", shed: "md" },

  /* ===== FORE — crosses in front of figure and word ======== */
  /* torso/leg crossings — the marks that weld the figure into the paint */
  { s: "slash1", l: "fore", f: "cool", x: 50, y: 62, sc: 1.1, r: 8, c: "--c-cyan" },
  { s: "sweep1", l: "fore", f: "cool", x: 50, y: 52, sc: 0.95, r: 4, c: "--c-turquoise", o: 0.95 },
  { s: "flick1", l: "fore", f: "hot", x: 46, y: 74, sc: 1.2, r: 118, c: "--c-magenta" },
  { s: "flick1", l: "fore", f: "warm", x: 56, y: 78, sc: 1.15, r: 56, c: "--c-orange" },
  /* word crossings, left and right of the figure */
  { s: "wedge1", l: "fore", f: "warm", x: 36, y: 48, sc: 1.0, r: 192, c: "--c-yellow" },
  { s: "wedge1", l: "fore", f: "hot", x: 65, y: 44, sc: 1.0, r: -10, c: "--c-pink" },
  /* eruption above the head — stays out of the face box */
  { s: "flick2", l: "fore", f: "cool", x: 50, y: 13, sc: 0.9, r: -90, c: "--c-green" },
  { s: "flick2", l: "fore", f: "cool", x: 43, y: 11, sc: 0.8, r: -116, c: "--c-cyan" },
  { s: "flick2", l: "fore", f: "warm", x: 58, y: 12, sc: 0.8, r: -64, c: "--c-orange", shed: "sm" },
  /* texture accents */
  { s: "hatch1", l: "fore", f: "cool", x: 31, y: 64, sc: 1.3, r: -16, c: "--c-green", shed: "sm" },
  { s: "hatch1", l: "fore", f: "warm", x: 71, y: 58, sc: 1.2, r: 22, c: "--c-yellow", shed: "sm" },
  { s: "dry1", l: "fore", f: "hot", x: 50, y: 87, sc: 1.1, r: 96, c: "--c-pink", shed: "sm" },
  { s: "loop2", l: "fore", f: "cool", x: 32, y: 36, sc: 0.6, r: -30, c: "--c-cyan", shed: "md" },
  { s: "splash1", l: "fore", f: "cool", x: 63, y: 70, sc: 0.8, r: 40, c: "--c-turquoise", shed: "md" }
]);

/** Burst vector for a mark: unit direction away from the composition centre. */
export function burstVector(s: Stroke): { bx: number; by: number } {
  const dx = s.x - 50;
  const dy = s.y - 50;
  const len = Math.hypot(dx, dy) || 1;
  return { bx: +(dx / len).toFixed(3), by: +(dy / len).toFixed(3) };
}
