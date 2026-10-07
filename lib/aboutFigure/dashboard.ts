import { INK, PINK, PAPER, MUTE, HATCH, clamp, ease, win, el, rr, tx, wob, type Scene, type Pointer, type Port } from "./kit";

/* A DASHBOARD — KPIs that count up, a donut of why orders run late, and
   pipeline vs actuals as paired bars under a forecast line, with a
   crosshair for the reader to scrub. Every figure here is
   a placeholder, and generic on purpose: it shows the shape of the work,
   not anyone's numbers. */

/* left: why orders run late, as a donut. The biggest cause is the story,
   so it alone takes the accent. */
const CAUSES: [string, number][] = [["Squirrel", 38], ["Rain", 27], ["Zoomies", 18], ["Other", 17]];
const DN = { cx: 92, cy: 282, r: 44, w: 22 };

/* right: pipeline and actuals by month as paired bars, forecast as a line */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const PIPE = [5.4, 3.7, 6.0, 3.3, 2.8, 4.5, 4.6, 4.4];
const ACT = [9.0, 6.1, 9.8, 5.9, 4.5, 7.4, 7.6, 7.3];
const FC = [8.6, 6.0, 9.9, 5.6, 4.3, 7.0, 7.3, 7.1];
const PL = { x0: 282, x1: 664, y0: 214, y1: 350, hi: 10 };
const slot = (PL.x1 - PL.x0) / MONTHS.length;
const mx = (i: number) => PL.x0 + slot * (i + 0.5);
const vy = (v: number) => PL.y1 - (v / PL.hi) * (PL.y1 - PL.y0);

export function dashboardScene(g: SVGGElement, reduced: boolean): Scene {
  el(g, "path", { d: rr(0, 0, 700, 400, 10), fill: PAPER, stroke: INK, "stroke-width": 1.5, filter: "url(#wob2)" });
  el(g, "path", { d: "M0,46 L700,46", stroke: INK, "stroke-width": 1.1, filter: "url(#wob1)" });
  tx(g, 22, 29, "Good boy ops", { size: 13, weight: 700 });
  const live = el(g, "circle", { cx: 462, cy: 25, r: 4, fill: PINK });
  tx(g, 472, 29, "Live", { size: 10, fill: PINK });
  ([["Week 41", 522], ["All dogs", 606]] as const).forEach(([s, x], i) => {
    el(g, "path", { d: rr(x, 13, 78, 24, 12), fill: "none", stroke: PINK, "stroke-width": 1, filter: wob(i + 1) });
    tx(g, x + 39, 29, s, { size: 10, fill: PINK, anchor: "middle" });
  });

  const kpis = ([
    ["Walks on time", 94.2, (v: number) => v.toFixed(1) + "%", "▲ 2.1 pts"],
    ["Socks stolen", 1284, (v: number) => Math.round(v).toLocaleString("en-US"), "▼ 8%"],
    ["Daily naps", 3.1, (v: number) => v.toFixed(1) + " h", "▲ 0.4 h"]
  ] as const).map(([lab, val, fmt, delta], i) => {
    const x = 22 + i * 222, y = 62, w = 210, h = 82;
    el(g, "path", { d: rr(x, y, w, h, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: wob(i) });
    tx(g, x + 14, y + 23, lab, { size: 10, fill: MUTE });
    const v = tx(g, x + 14, y + 64, fmt(val), { size: 30, weight: 700, ls: -1.2 });
    tx(g, x + w - 14, y + 64, delta, { size: 11, fill: PINK, anchor: "end" });
    return { v, val, fmt };
  });

  /* ---- late orders by cause ---- */
  el(g, "path", { d: rr(22, 162, 226, 220, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob3)" });
  tx(g, 36, 186, "Late walks by cause", { size: 10, fill: MUTE });
  const C = 2 * Math.PI * DN.r;
  const total = CAUSES.reduce((a, [, v]) => a + v, 0);
  let acc = 0;
  const slices = CAUSES.map(([name, v], i) => {
    const start = acc / total;
    acc += v;
    const arc = el(g, "circle", {
      cx: DN.cx, cy: DN.cy, r: DN.r, fill: "none",
      stroke: i === 0 ? PINK : INK, "stroke-opacity": i === 0 ? 1 : [0, 0.7, 0.4, 0.18][i],
      "stroke-width": DN.w, transform: `rotate(-90 ${DN.cx} ${DN.cy})`
    });
    const ly = 238 + i * 26;
    el(g, "rect", { x: 160, y: ly - 8, width: 9, height: 9, rx: 2, fill: i === 0 ? PINK : INK, "fill-opacity": i === 0 ? 1 : [0, 0.7, 0.4, 0.18][i] });
    tx(g, 174, ly, name, { size: 9, fill: i === 0 ? INK : MUTE });
    tx(g, 174, ly + 12, `${v}%`, { size: 9, weight: 700, fill: i === 0 ? PINK : INK });
    return { arc, start, frac: v / total };
  });
  tx(g, DN.cx, DN.cy + 4, "214", { size: 18, weight: 700, anchor: "middle", ls: -0.5 });
  tx(g, DN.cx, DN.cy + 17, "late", { size: 9, fill: MUTE, anchor: "middle" });
  /* a pencil ring round the outside, so the donut sits in the sketch */
  el(g, "circle", { cx: DN.cx, cy: DN.cy, r: DN.r + DN.w / 2 + 3, fill: "none", stroke: INK, "stroke-width": 1, filter: "url(#wobS)" });

  /* ---- pipeline vs forecast ---- */
  el(g, "path", { d: rr(260, 162, 418, 220, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob1)" });
  tx(g, 274, 186, "Treats vs forecast", { size: 10, fill: MUTE });
  el(g, "rect", { x: 448, y: 179, width: 9, height: 9, fill: HATCH, stroke: INK, "stroke-width": 0.8 });
  tx(g, 461, 187, "Begged", { size: 9, fill: MUTE });
  el(g, "rect", { x: 520, y: 179, width: 9, height: 9, fill: INK, "fill-opacity": 0.75 });
  tx(g, 533, 187, "Given", { size: 9, fill: MUTE });
  el(g, "path", { d: "M584,183.5 h14", stroke: PINK, "stroke-width": 2 });
  tx(g, 602, 187, "Forecast", { size: 9, fill: MUTE });
  el(g, "path", { d: `M${PL.x0},${PL.y1} L${PL.x1},${PL.y1}`, stroke: INK, "stroke-width": 1.2 });
  const bw = 15;
  const bars = MONTHS.flatMap((m, i) => {
    tx(g, mx(i), 368, m, { size: 9, fill: MUTE, anchor: "middle" });
    return [
      { r: el(g, "rect", { x: mx(i) - bw - 1, width: bw, y: PL.y1, height: 0, fill: HATCH, stroke: INK, "stroke-width": 0.9 }), v: PIPE[i], i },
      { r: el(g, "rect", { x: mx(i) + 1, width: bw, y: PL.y1, height: 0, fill: INK, "fill-opacity": 0.75 }), v: ACT[i], i }
    ];
  });
  const fp = FC.map((v, i) => [mx(i), vy(v)] as [number, number]);
  const fline = el(g, "path", { d: "M" + fp.map((q) => q.join(",")).join(" L"), stroke: PINK, "stroke-width": 2, fill: "none", "stroke-linejoin": "round", filter: "url(#wob2)" });
  const flen = fline.getTotalLength();
  const fdots = fp.map(([x, y]) => el(g, "circle", { cx: x, cy: y, r: 3, fill: PAPER, stroke: PINK, "stroke-width": 1.5, opacity: 0 }));

  const ch = el(g, "g", { opacity: 0 });
  const chLine = el(ch, "path", { stroke: INK, "stroke-width": 1, "stroke-dasharray": "3 3" });
  const chBox = el(ch, "path", { fill: INK });
  const chTxt = tx(ch, 0, 0, "", { size: 9, fill: PAPER, anchor: "middle" });

  const a = fp[fp.length - 2], b = fp[fp.length - 1];
  const port: Port = [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])];

  return {
    caption: "Fig. 1b — Hover the months.",
    frame(t: number, p: Pointer) {
      const T = reduced ? 1e6 : t;
      const e = ease(win(T, 150, 1100));
      kpis.forEach((k) => (k.v.textContent = k.fmt(k.val * e)));
      live.setAttribute("opacity", String(reduced ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(T / 600))));

      /* the donut sweeps round, a slice at a time */
      const sweep = ease(win(T, 250, 1400));
      slices.forEach(({ arc, start, frac }) => {
        const shown = clamp(sweep - start, 0, frac);
        const len = Math.max(0, shown * C - 2);
        arc.setAttribute("stroke-dasharray", `${len} ${C}`);
        arc.setAttribute("stroke-dashoffset", String(-start * C));
      });

      bars.forEach(({ r, v, i }) => {
        const h = (v / PL.hi) * (PL.y1 - PL.y0) * ease(win(T, 300 + i * 90, 800 + i * 90));
        r.setAttribute("y", String(PL.y1 - h));
        r.setAttribute("height", String(h));
      });
      const fe = ease(win(T, 1100, 2100));
      fline.style.strokeDasharray = String(flen);
      fline.style.strokeDashoffset = String(flen * (1 - fe));
      fdots.forEach((d, i) => d.setAttribute("opacity", fe >= (i + 0.5) / FC.length ? "1" : "0"));

      const inPlot = p.inside && p.x > PL.x0 && p.x < PL.x1 && p.y > PL.y0 - 30 && p.y < PL.y1 + 20;
      if (inPlot && fe === 1) {
        const i = clamp(Math.floor((p.x - PL.x0) / slot), 0, MONTHS.length - 1);
        const x = mx(i);
        ch.setAttribute("opacity", "1");
        chLine.setAttribute("d", `M${x},${PL.y0 - 4} L${x},${PL.y1}`);
        const w = 150, bx = clamp(x - w / 2, 264, 674 - w), by = PL.y0 - 22;
        chBox.setAttribute("d", `M${bx},${by} h${w} v18 h${-w} Z`);
        chTxt.setAttribute("x", String(bx + w / 2));
        chTxt.setAttribute("y", String(by + 12.5));
        chTxt.textContent = `${MONTHS[i]} · ${ACT[i]}k treats vs ${FC[i]}k`;
      } else ch.setAttribute("opacity", "0");

      return { port, readout: "Refreshed <b>at breakfast</b>" };
    }
  };
}
