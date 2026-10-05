import { INK, PINK, PAPER, MUTE, HATCH, HATCH_PINK, clamp, ease, win, el, rr, tx, wob, type Scene, type Pointer, type Port } from "./kit";

/* A DASHBOARD — KPIs that count up, bars that grow, a trend that draws in,
   and a crosshair on the trend for the reader to scrub. Every figure here is
   a placeholder, and generic on purpose: it shows the shape of the work,
   not anyone's numbers. */

const WK = [86.1, 87.0, 86.4, 88.2, 89.0, 88.1, 90.3, 91.0, 90.2, 91.7, 92.9, 94.2];
const PL = { x0: 282, x1: 656, y0: 206, y1: 350, lo: 84, hi: 96 };
const wx = (i: number) => PL.x0 + (i * (PL.x1 - PL.x0)) / (WK.length - 1);
const wy = (v: number) => PL.y1 - ((v - PL.lo) / (PL.hi - PL.lo)) * (PL.y1 - PL.y0);
const BASE = 350;

export function dashboardScene(g: SVGGElement, reduced: boolean): Scene {
  el(g, "path", { d: rr(0, 0, 700, 400, 10), fill: PAPER, stroke: INK, "stroke-width": 1.5, filter: "url(#wob2)" });
  el(g, "path", { d: "M0,46 L700,46", stroke: INK, "stroke-width": 1.1, filter: "url(#wob1)" });
  tx(g, 22, 29, "Ops overview", { size: 13, weight: 700 });
  const live = el(g, "circle", { cx: 462, cy: 25, r: 4, fill: PINK });
  tx(g, 472, 29, "Live", { size: 10, fill: PINK });
  ([["Week 41", 522], ["All sites", 606]] as const).forEach(([s, x], i) => {
    el(g, "path", { d: rr(x, 13, 78, 24, 12), fill: "none", stroke: PINK, "stroke-width": 1, filter: wob(i + 1) });
    tx(g, x + 39, 29, s, { size: 10, fill: PINK, anchor: "middle" });
  });

  const kpis = ([
    ["On-time rate", 94.2, (v: number) => v.toFixed(1) + "%", "▲ 2.1 pts"],
    ["Open backlog", 1284, (v: number) => Math.round(v).toLocaleString("en-US"), "▼ 8%"],
    ["Cycle time", 3.1, (v: number) => v.toFixed(1) + " d", "▼ 0.4 d"]
  ] as const).map(([lab, val, fmt, delta], i) => {
    const x = 22 + i * 222, y = 62, w = 210, h = 82;
    el(g, "path", { d: rr(x, y, w, h, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: wob(i) });
    tx(g, x + 14, y + 23, lab, { size: 10, fill: MUTE });
    const v = tx(g, x + 14, y + 64, fmt(val), { size: 30, weight: 700, ls: -1.2 });
    tx(g, x + w - 14, y + 64, delta, { size: 11, fill: PINK, anchor: "end" });
    return { v, val, fmt };
  });

  el(g, "path", { d: rr(22, 162, 226, 220, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob3)" });
  tx(g, 36, 186, "Late orders by site", { size: 10, fill: MUTE });
  const bars = [52, 84, 40, 128, 64, 46].map((h, i) => {
    const x = 42 + i * 33;
    const r = el(g, "rect", { x, width: 20, y: BASE, height: 0, fill: i === 3 ? HATCH_PINK : HATCH, stroke: i === 3 ? PINK : INK, "stroke-width": 1 });
    tx(g, x + 10, 370, "ABCDEF"[i], { size: 9, fill: MUTE, anchor: "middle" });
    return { r, h };
  });

  el(g, "path", { d: rr(260, 162, 418, 220, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob1)" });
  tx(g, 274, 186, "On-time rate, 12 wks", { size: 10, fill: MUTE });
  const tY = wy(92);
  el(g, "path", { d: `M${PL.x0},${tY} L${PL.x1},${tY}`, stroke: PINK, "stroke-width": 1.1, "stroke-dasharray": "4 4", fill: "none" });
  tx(g, PL.x0 + 2, tY - 7, "Target 92%", { size: 9, fill: PINK });
  const wp = WK.map((v, i) => [wx(i), wy(v)] as [number, number]);
  const line = "M" + wp.map((q) => q.join(",")).join(" L");
  const area = el(g, "path", { d: `${line} L${PL.x1},${PL.y1} L${PL.x0},${PL.y1} Z`, fill: HATCH, opacity: 0 });
  const trend = el(g, "path", { d: line, stroke: INK, "stroke-width": 2, fill: "none", "stroke-linejoin": "round", filter: "url(#wob2)" });
  const len = trend.getTotalLength();
  tx(g, PL.x0, 370, "W30", { size: 9, fill: MUTE });
  tx(g, PL.x1, 370, "W41", { size: 9, fill: MUTE, anchor: "end" });

  const ch = el(g, "g", { opacity: 0 });
  const chLine = el(ch, "path", { stroke: INK, "stroke-width": 1, "stroke-dasharray": "3 3" });
  const chDot = el(ch, "circle", { r: 5, fill: PINK });
  const chBox = el(ch, "path", { fill: INK });
  const chTxt = tx(ch, 0, 0, "", { size: 10, fill: PAPER, anchor: "middle" });

  const a = wp[wp.length - 2], b = wp[wp.length - 1];
  const port: Port = [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])];

  return {
    caption: "Fig. 1b — Hover the trend.",
    frame(t: number, p: Pointer) {
      const T = reduced ? 1e6 : t;
      const e = ease(win(T, 150, 1100));
      kpis.forEach((k) => (k.v.textContent = k.fmt(k.val * e)));
      bars.forEach(({ r, h }, i) => {
        const hh = h * ease(win(T, 250 + i * 80, 950 + i * 80));
        r.setAttribute("y", String(BASE - hh));
        r.setAttribute("height", String(hh));
      });
      const te = ease(win(T, 300, 1500));
      trend.style.strokeDasharray = String(len);
      trend.style.strokeDashoffset = String(len * (1 - te));
      area.setAttribute("opacity", String(0.5 * te));
      live.setAttribute("opacity", String(reduced ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(T / 600))));

      const inPlot = p.inside && p.x > PL.x0 - 10 && p.x < PL.x1 + 10 && p.y > PL.y0 - 30 && p.y < PL.y1 + 20;
      if (inPlot && te === 1) {
        const i = clamp(Math.round(((p.x - PL.x0) / (PL.x1 - PL.x0)) * (WK.length - 1)), 0, WK.length - 1);
        const [px, py] = wp[i];
        ch.setAttribute("opacity", "1");
        chLine.setAttribute("d", `M${px},${PL.y0 - 4} L${px},${PL.y1}`);
        chDot.setAttribute("cx", String(px));
        chDot.setAttribute("cy", String(py));
        const bw = 86, bh = 20, bx = clamp(px - bw / 2, 264, 674 - bw), by = py - 34;
        chBox.setAttribute("d", `M${bx},${by} h${bw} v${bh} h${-bw} Z`);
        chTxt.setAttribute("x", String(bx + bw / 2));
        chTxt.setAttribute("y", String(by + 14));
        chTxt.textContent = `W${30 + i} · ${WK[i].toFixed(1)}%`;
      } else ch.setAttribute("opacity", "0");

      return { port, readout: "Refreshed <b>daily, 07:00</b>" };
    }
  };
}
