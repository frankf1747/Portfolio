/* The drawing kit every About sketch is built from.

   One SVG, one coordinate system: the figure's viewBox is laid out in DESIGN
   px (1440-artboard units), the same units the stylesheet is written in, and
   the SVG is sized in CSS to track the reading unit. So 1 user unit = 1rem at
   every width and nothing here ever multiplies by the root font size — the
   prototype did, and had to rebuild on every resize.

   Every sketch draws inside the same 700 × 400 box (BOX), in box-local
   coordinates; index.ts places that box on the stage and owns the arrow that
   runs from the box out to the labels. */

export const NS = "http://www.w3.org/2000/svg";

export const INK = "#262048";
export const PINK = "#f2247a";
export const PAPER = "#f5f3ec";
export const MUTE = "rgb(38 32 72 / 0.55)";
export const FAINT = "rgb(38 32 72 / 0.35)";

/* the shared box, in stage coordinates */
export const BOX = { x: 118, y: 60, w: 700, h: 400 };

/* hatch fills, defined once in index.ts */
export const HATCH = "url(#abHatch)";
export const HATCH_PINK = "url(#abHatchPink)";

export type Pt = [number, number];
/** where the arrow leaves a sketch: x, y and the direction it leaves in */
export type Port = [number, number, number];

/** The reader's pointer in box-local units; `inside` is false when absent. */
export type Pointer = { x: number; y: number; inside: boolean };

export type Scene = {
  caption: string;
  /** `t` is ms since this sketch came on, paused while off screen. */
  frame(t: number, p: Pointer): { port: Port; readout: string };
};

export type NodeRefs = {
  frame: SVGPathElement;
  inner: SVGPathElement | null;
  t: SVGTextElement;
  s: SVGTextElement;
};

type Attrs = Record<string, string | number>;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
/** progress of t through [a, b], clamped to 0..1 */
export const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const inW = (t: number, a: number, b: number) => t >= a && t <= b;

/* seeded, so the same data and the same hand on every visit */
export const rng = (seed: number) => () => {
  let s = (seed = (seed + 0x6d2b79f5) | 0);
  s = Math.imul(s ^ (s >>> 15), 1 | s);
  s = (s + Math.imul(s ^ (s >>> 7), 61 | s)) ^ s;
  return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
};

export const el = <K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
  attrs: Attrs = {}
): SVGElementTagNameMap[K] => {
  const n = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  parent.appendChild(n);
  return n;
};

/** a rounded rect as a path, so the wobble filters can push its edge around */
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;

/* The smallest text a sketch may set, in design units. At the scale the
   figure gets on a laptop (~1.2) this renders at 11px; the sketches used to
   go down to 6.5, which rendered under 5px. A label that does not fit at
   this size is a label to cut, not to shrink. */
export const TEXT_MIN = 9;

export const tx = (
  parent: Element,
  x: number,
  y: number,
  s: string,
  o: { size?: number; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; ls?: number } = {}
) => {
  const t = el(parent, "text", {
    x,
    y,
    "font-size": Math.max(TEXT_MIN, o.size ?? 11),
    "font-weight": o.weight ?? 500,
    fill: o.fill ?? INK,
    "text-anchor": o.anchor ?? "start",
    "letter-spacing": o.ls ?? 0.04
  });
  t.textContent = s;
  return t;
};

export const head = (to: Pt, ang: number, len: number) =>
  `M${to[0] - len * Math.cos(ang - 0.45)},${to[1] - len * Math.sin(ang - 0.45)} L${to[0]},${to[1]} L${to[0] - len * Math.cos(ang + 0.45)},${to[1] - len * Math.sin(ang + 0.45)}`;

/** horizontal S-curve between two points */
export const curve = (p0: Pt, p3: Pt) => {
  const dx = (p3[0] - p0[0]) / 2;
  return `M${p0} C${p0[0] + dx},${p0[1]} ${p3[0] - dx},${p3[1]} ${p3}`;
};

/** vertical S-curve between two points */
export const vcurve = (p0: Pt, p3: Pt) => {
  const dy = (p3[1] - p0[1]) / 2;
  return `M${p0} C${p0[0]},${p0[1] + dy} ${p3[0]},${p3[1] - dy} ${p3}`;
};

export const wob = (i: number) => `url(#wob${(i % 3) + 1})`;

/** A labelled box: title, optional subtitle, optional second outline for the
    one node in a sketch that is in charge (the orchestrator, the MCP server). */
export const node = (
  g: Element,
  n: { x: number; y: number; w: number; h: number; t: string; s?: string },
  i: number,
  o: { size?: number; sw?: number; double?: boolean } = {}
): NodeRefs => {
  const frame = el(g, "path", { d: rr(n.x, n.y, n.w, n.h, 8), fill: PAPER, stroke: INK, "stroke-width": o.sw ?? 1.4, filter: wob(i) });
  const inner = o.double
    ? el(g, "path", { d: rr(n.x + 4, n.y + 4, n.w - 8, n.h - 8, 6), fill: "none", stroke: INK, "stroke-width": 1, filter: "url(#wobS)" })
    : null;
  const cy = n.y + n.h / 2;
  return {
    frame,
    inner,
    t: tx(g, n.x + n.w / 2, n.s ? cy - 2 : cy + 4, n.t, { size: o.size ?? 12, weight: 700, anchor: "middle" }),
    s: tx(g, n.x + n.w / 2, cy + 14, n.s ?? "", { size: 8.5, fill: MUTE, anchor: "middle" })
  };
};

/** the pen is pink while a node is working */
export const lit = (n: NodeRefs, on: boolean) => {
  n.frame.setAttribute("stroke", on ? PINK : INK);
  n.inner?.setAttribute("stroke", on ? PINK : INK);
  n.t.setAttribute("fill", on ? PINK : INK);
};

/** a path plus its length, for things that travel along it */
export type Wire = { path: SVGPathElement; len: number };
export const wire = (g: Element, d: string, attrs: Attrs = {}): Wire => {
  const path = el(g, "path", { d, stroke: INK, "stroke-width": 1.2, fill: "none", ...attrs });
  return { path, len: path.getTotalLength() };
};

/** park a token at fraction p along a wire */
export const along = (c: SVGCircleElement | SVGRectElement, w: Wire, p: number, half = 0) => {
  const q = w.path.getPointAtLength(clamp(p, 0, 1) * w.len);
  if (c instanceof SVGCircleElement) {
    c.setAttribute("cx", String(q.x));
    c.setAttribute("cy", String(q.y));
  } else {
    c.setAttribute("x", String(q.x - half));
    c.setAttribute("y", String(q.y - half));
  }
  return q;
};
