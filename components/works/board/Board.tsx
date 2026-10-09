"use client";

import "./board.scss";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

/* §13 — a project told as one whiteboard.

   Everything the project is sits on one board at once. Scrolling drives a
   camera over it in reading order, so the reader is led through without
   the board ever being cut into slides, and the first and last stops pull
   all the way out so the whole shape is seen.

   This file is the SHELL every project board shares — the camera, the
   caption that narrates each stop, the minimap and the breadcrumb row — so
   the project pages read as one set. A board supplies its size, its
   regions, its stops and its content (see BioMarinBoard, ClinicalBoard).

   The board is drawn at a fixed size in px and transformed as one piece;
   see board.scss for why nothing inside it is in rem.

   Native scroll, no Lenis: the page is one sticky stage and a tall
   scroller, and the camera reads window.scrollY directly. */

export type Rect = [number, number, number, number];
export type Stop = { r: Rect; focus: string | null; n: string; t: ReactNode };

/* scroll per stop, in viewport heights */
const PER = 0.85;
/* minimap width, in rem */
const MINI = 168;

export const box = ([x, y, w, h]: Rect): CSSProperties => ({ left: x, top: y, width: w, height: h });

/* the tab sits 22px above a region's top edge; stops include it */
export const withTab = ([x, y, w, h]: Rect): Rect => [x, y - 30, w, h + 30];

/* ---------- pieces a board is drawn with ---------- */

export function Region({ r, n, title, dim, children }: { r: Rect; n: number | string; title: string; dim: boolean; children?: ReactNode }) {
  return (
    <div className={`wb-region${dim ? " wb-dim" : ""}`} style={box(r)}>
      <div className="wb-tab">
        <span>{n}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Node({ r, kind = "", children }: { r: Rect; kind?: string; children: ReactNode }) {
  return (
    <div className={`wb-node${kind ? ` is-${kind}` : ""}`} style={box(r)}>
      {children}
    </div>
  );
}

/* a tool that runs on a connector, drawn on the wire itself */
export function Tool({ x, y, name, note, pk }: { x: number; y: number; name: string; note: string; pk?: boolean }) {
  return (
    <div className={`wb-tool${pk ? " is-pk" : ""}`} style={{ left: x, top: y }}>
      <b>{name}</b>
      <span>{note}</span>
    </div>
  );
}

/* Connectors.

   Arrowheads are drawn in user space with their BASE at the path's end
   (refX 0), so a line always meets the middle of the triangle's back edge
   rather than running under it and poking out at a corner. Each path's end
   point therefore sits one arrow-length short of what it points at.

   A marker takes its angle from the path's last segment, and on a cubic
   that is the last control point, not the direction the curve visibly
   travels. Every curve ends in a short straight run so the head lines up
   with the line coming into it.

   Dashed paths carry data-dash and are re-spaced on mount (see fitDashes)
   so they finish on a whole dash at the arrow, never a gap. */

export const NAVY = "#262048";
export const PINK = "#f2247a";
export const MUTE = "#77738a";

export function WireDefs() {
  const marker = (id: string, c: string, size: number) => (
    <marker id={id} viewBox="0 0 10 10" refX="0" refY="5" markerUnits="userSpaceOnUse" markerWidth={size} markerHeight={size} orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill={c} />
    </marker>
  );
  return (
    <defs>
      {marker("wb-an", NAVY, 13)}
      {marker("wb-ap", PINK, 13)}
      {marker("wb-ar", PINK, 16)}
    </defs>
  );
}

/* a connector; pink ones are dashed */
export const wire = (d: string, pk = false) => (
  <path
    key={d}
    d={d}
    fill="none"
    stroke={pk ? PINK : NAVY}
    strokeWidth={3}
    data-dash={pk ? "9 7" : undefined}
    strokeDasharray={pk ? "9 7" : undefined}
    markerEnd={`url(#${pk ? "wb-ap" : "wb-an"})`}
  />
);

/* the reading path between regions */
export const route = (d: string) => (
  <path key={d} d={d} fill="none" stroke={PINK} strokeWidth={4} data-dash="12 10" strokeDasharray="12 10" opacity={0.8} markerEnd="url(#wb-ar)" />
);

export const wireLabel = (x: number, y: number, t: string) => (
  <text key={`${x},${y}`} x={x} y={y} fontFamily="var(--font-mono)" fontSize={14} fill={MUTE} textAnchor="middle">
    {t}
  </text>
);

/* Re-space each dashed path so it starts and ends on a whole dash: keep the
   dash : gap ratio, fit a whole number of periods into the real length. */
function fitDashes(root: Element) {
  root.querySelectorAll<SVGPathElement>("path[data-dash]").forEach((p) => {
    const [dash, gap] = (p.dataset.dash ?? "").split(" ").map(Number);
    const len = p.getTotalLength();
    if (!dash || !len) return;
    const periods = Math.max(1, Math.round((len - dash) / (dash + gap)));
    const k = len / (periods * (dash + gap) + dash);
    p.style.strokeDasharray = `${dash * k} ${gap * k}`;
  });
}

/* ---------- the shell ---------- */

export default function Board({
  size: [W, H],
  regions,
  stops,
  crumb,
  links = [],
  after,
  children
}: {
  size: [number, number];
  regions: Record<string, Rect>;
  stops: Stop[];
  /* the last breadcrumb step: the project's name */
  crumb: string;
  /* outward links after the trail: the code, a live demo */
  links?: { label: string; href: string }[];
  /* the notes under the board */
  after: ReactNode;
  /* the board's content, told which regions are dimmed at this stop */
  children: (dim: (id: string) => boolean) => ReactNode;
}) {
  const tourRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const vpRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(0);
  const nearRef = useRef(0);
  const N = stops.length;
  const miniH = Math.round((MINI * H) / W);

  const yOf = useCallback((k: number) => (tourRef.current?.offsetTop ?? 0) + k * PER * window.innerHeight, []);
  const go = useCallback(
    (d: number) => {
      const k = Math.max(0, Math.min(N - 1, nearRef.current + d));
      window.scrollTo({ top: yOf(k), behavior: "smooth" });
    },
    [N, yOf]
  );

  useEffect(() => {
    const tour = tourRef.current;
    const board = boardRef.current;
    if (!tour || !board) return;

    const MS = MINI / W;
    const cam = ([x, y, w, h]: Rect) => {
      const vw = window.innerWidth;
      const top = 84;
      const bot = 92;
      const vh = window.innerHeight - top - bot;
      const s = Math.min((vw - 110) / w, vh / h);
      return { s, cx: x + w / 2, cy: y + h / 2, vw, mid: top + vh / 2 };
    };
    /* each stop holds still for the first and last fifth of its scroll */
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const frame = () => {
      /* a hidden tab can report no height yet; 0 / 0 would make p NaN. resize runs this again */
      if (!window.innerHeight) return;
      const p = Math.max(0, Math.min(N - 1, (window.scrollY - tour.offsetTop) / (PER * window.innerHeight)));
      const k = Math.min(N - 2, Math.floor(p));
      const t = ease(Math.max(0, Math.min(1, (p - k - 0.2) / 0.6)));
      const a = cam(stops[k].r);
      const b = cam(stops[k + 1].r);
      /* zoom interpolates in log space, so a 3× zoom feels even all the way */
      const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
      const cx = a.cx + (b.cx - a.cx) * t;
      const cy = a.cy + (b.cy - a.cy) * t;
      const tx = a.vw / 2 - cx * s;
      const ty = a.mid - cy * s;
      board.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;

      const vp = vpRef.current;
      if (vp) {
        vp.style.left = `${Math.max(0, (-tx / s) * MS)}rem`;
        vp.style.top = `${Math.max(0, (-ty / s) * MS)}rem`;
        vp.style.width = `${Math.min(MINI, (window.innerWidth / s) * MS)}rem`;
        vp.style.height = `${Math.min(miniH, (window.innerHeight / s) * MS)}rem`;
      }

      const r = Math.round(p);
      if (r !== nearRef.current) {
        nearRef.current = r;
        setNear(r);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      /* the board may hold its own inputs; arrows there belong to them */
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select, [role='listbox']")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };

    fitDashes(board);
    frame();
    window.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", frame);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", frame);
      window.removeEventListener("resize", frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [N, go, miniH, stops, W]);

  /* once the reader has moved off the first stop, the → cue stops pulsing */
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    if (near > 0) setMoved(true);
  }, [near]);

  const stop = stops[near];
  const dim = (id: string) => !!stop.focus && stop.focus !== id;

  return (
    <main className="wb">
      <div ref={tourRef} style={{ height: `calc(${(N - 1) * PER * 100}vh + 100vh)` }}>
        <div className="wb__stage">
          <div className="wb__board" ref={boardRef} style={{ width: W, height: H }}>
            {children(dim)}
          </div>

          <div className="wb__crumb">
            <Breadcrumbs
              trail={[{ label: "FRANK FU", href: "/" }, { label: "PROJECTS", href: "/#work" }, { label: crumb }]}
              after={
                links.length ? (
                  <span className="wb__links">
                    {links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
                        {l.label} <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </span>
                ) : undefined
              }
            />
            {/* The way through the board is the arrow keys, and most readers
                won't guess it: → is drawn as a key, in the mark, and pulses
                until they first move. Both keys also work as buttons. */}
            <span className="wb__hint">
              <span>Scroll or press</span>
              <button type="button" className="wb__key" onClick={() => go(-1)} disabled={near === 0} aria-label="Previous stop">
                ←
              </button>
              <button
                type="button"
                className={`wb__key is-next${moved ? "" : " is-cue"}`}
                onClick={() => go(1)}
                disabled={near === N - 1}
                aria-label="Next stop"
              >
                →
              </button>
            </span>
          </div>

          <div className="wb__mini" aria-hidden="true" style={{ height: `${miniH}rem` }}>
            {Object.entries(regions).map(([id, [x, y, w, h]]) => {
              const m = MINI / W;
              return (
                <i
                  key={id}
                  className={stop.focus === id ? "is-on" : undefined}
                  style={{ left: `${x * m}rem`, top: `${y * m}rem`, width: `${w * m}rem`, height: `${h * m}rem` }}
                />
              );
            })}
            <div className="wb__vp" ref={vpRef} />
          </div>

          <div className="wb__cap" aria-live="polite">
            <button type="button" onClick={() => go(-1)} aria-label="Previous stop">
              ←
            </button>
            <span className="wb__capN">{`${String(near + 1).padStart(2, "0")} / ${N} · ${stop.n}`}</span>
            <span className="wb__capT">{stop.t}</span>
            <button type="button" onClick={() => go(1)} aria-label="Next stop">
              →
            </button>
          </div>
        </div>
      </div>

      <div className="wb__after">{after}</div>
    </main>
  );
}
