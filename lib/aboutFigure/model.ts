import {
  INK, PINK, PAPER, MUTE, clamp, ease, win, inW, rng, el, rr, tx, head, curve, wob, node, lit, wire, along,
  type Scene, type Pointer, type Wire, type NodeRefs
} from "./kit";

/* A MODEL — the pipeline that feeds it, then three models compete.

   The flow chart down the left is small on purpose: the model is the
   heaviest thing in this sketch. The data is a saturating curve so the
   comparison has a real answer — a straight line underfits it, the tree
   ensembles find the bend. Every fit and every score is computed live, and
   the reader's cursor is a data point in all of them. */

const FLOW = [
  { t: "Raw data", s: "Sources" },
  { t: "EDA", s: "Profile · outliers" },
  { t: "Clean", s: "Validate · impute" },
  { t: "Features", s: "Encode · scale" }
];
const FW = 108, FH = 46, FY = [14, 104, 194, 284];
const MP = { x: 140, y: 4, w: 454, h: 392 }; //  the model panel
const CH = { x: 184, y: 100, w: 384, h: 244 }; // its chart
const RPT = { x: 612, y: 172, w: 88, h: 58 };
const MODELS = ["Linear", "Random forest", "Gradient boost"];
/* each model's turn on screen, then the cross-validated winner holds */
const TURNS: [number, number][] = [[1700, 3000], [3000, 4300], [4300, 5600]];
const LOOP = 9000;
const SAMPLES = 64;

/* ---------- the data ---------- */

const N = 36;
const rand = rng(42);
const gauss = () => {
  let s = 0;
  for (let i = 0; i < 6; i++) s += rand();
  return (s - 3) / Math.SQRT1_2;
};
const PTS: [number, number][] = Array.from({ length: N }, (_, i) => {
  const x = 0.04 + (0.92 * (i + rand() * 0.9)) / N;
  return [x, clamp(0.2 + 0.56 / (1 + Math.exp(-11 * (x - 0.52))) + gauss() * 0.06, 0.04, 0.96)];
});

/* ---------- the models ----------
   Small and exact rather than clever: 37 points, so a regression tree is a
   sorted scan per node, a forest is 12 of them on fixed bootstrap draws (so
   the fit never flickers between frames), and boosting is 30 depth-2 trees
   on the residuals. A full refit with 5-fold CV is a few milliseconds. */

type Fit = (X: number[], Y: number[], W: number[], idx: number[]) => (x: number) => number;
type Tree = { v: number } | { t: number; l: Tree; r: Tree };

const fitLin: Fit = (X, Y, W, idx) => {
  let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const i of idx) {
    sw += W[i]; sx += W[i] * X[i]; sy += W[i] * Y[i]; sxx += W[i] * X[i] * X[i]; sxy += W[i] * X[i] * Y[i];
  }
  const b = (sw * sxy - sx * sy) / (sw * sxx - sx * sx);
  const a = (sy - b * sx) / sw;
  return (x) => a + b * x;
};

const fitTree = (X: number[], Y: number[], W: number[], idx: number[], depth: number): Tree => {
  let tw = 0, ty = 0, ty2 = 0;
  for (const i of idx) { tw += W[i]; ty += W[i] * Y[i]; ty2 += W[i] * Y[i] * Y[i]; }
  if (depth === 0 || idx.length < 4) return { v: ty / tw };
  const srt = [...idx].sort((a, b) => X[a] - X[b]);
  let best = -1, bestErr = Infinity, lw = 0, ly = 0, ly2 = 0;
  for (let k = 0; k < srt.length - 1; k++) {
    const i = srt[k];
    lw += W[i]; ly += W[i] * Y[i]; ly2 += W[i] * Y[i] * Y[i];
    if (k < 1 || k > srt.length - 3 || X[srt[k]] === X[srt[k + 1]]) continue;
    const rw = tw - lw, ry = ty - ly, ry2 = ty2 - ly2;
    const err = ly2 - (ly * ly) / lw + ry2 - (ry * ry) / rw;
    if (err < bestErr) { bestErr = err; best = k; }
  }
  if (best < 0) return { v: ty / tw };
  return {
    t: (X[srt[best]] + X[srt[best + 1]]) / 2,
    l: fitTree(X, Y, W, srt.slice(0, best + 1), depth - 1),
    r: fitTree(X, Y, W, srt.slice(best + 1), depth - 1)
  };
};
const predict = (n: Tree, x: number): number => ("v" in n ? n.v : x <= n.t ? predict(n.l, x) : predict(n.r, x));

const BOOT = Array.from({ length: 12 }, (_, b) => {
  const r = rng(100 + b);
  return Array.from({ length: N + 1 }, () => Math.floor(r() * (N + 1)));
});
const fitRF: Fit = (X, Y, W, idx) => {
  const trees = BOOT.map((bs) => fitTree(X, Y, W, bs.map((k) => idx[k % idx.length]), 3));
  return (x) => trees.reduce((a, t) => a + predict(t, x), 0) / trees.length;
};

const fitGB: Fit = (X, Y, W, idx) => {
  let sw = 0, sy = 0;
  for (const i of idx) { sw += W[i]; sy += W[i] * Y[i]; }
  const f0 = sy / sw;
  const R = Y.slice();
  const pred: number[] = [];
  const trees: Tree[] = [];
  for (const i of idx) pred[i] = f0;
  for (let m = 0; m < 30; m++) {
    for (const i of idx) R[i] = Y[i] - pred[i];
    const t = fitTree(X, R, W, idx, 2);
    trees.push(t);
    for (const i of idx) pred[i] += 0.2 * predict(t, X[i]);
  }
  return (x) => f0 + 0.2 * trees.reduce((a, t) => a + predict(t, x), 0);
};

const FITS = [fitLin, fitRF, fitGB];

export function modelScene(g: SVGGElement, reduced: boolean): Scene {
  /* index N is the reader's point (or the drifting "new data" one), weighted
     like a few observations: enough to visibly move every fit, not enough to
     drag a forest into a spike */
  const XS = PTS.map((q) => q[0]).concat([0.9]);
  const YS = PTS.map((q) => q[1]).concat([0.7]);
  const WS = PTS.map(() => 1).concat([4]);
  const ALL = Array.from({ length: N + 1 }, (_, i) => i);

  /* 5-fold CV over the observed points; the reader's point always trains */
  const cvScore = (fit: Fit) => {
    let ybar = 0;
    for (let i = 0; i < N; i++) ybar += YS[i];
    ybar /= N;
    let ssr = 0, sst = 0;
    for (let f = 0; f < 5; f++) {
      const train: number[] = [], test: number[] = [];
      for (let i = 0; i < N; i++) (i % 5 === f ? test : train).push(i);
      train.push(N);
      const m = fit(XS, YS, WS, train);
      for (const i of test) { ssr += (YS[i] - m(XS[i])) ** 2; sst += (YS[i] - ybar) ** 2; }
    }
    return 1 - ssr / sst;
  };

  const X = (x: number) => CH.x + x * CH.w;
  const Y = (y: number) => CH.y + (1 - y) * CH.h;

  /* ---------- draw ---------- */

  /* the flow chart that feeds it */
  const flow: NodeRefs[] = FLOW.map((n, i) => {
    const nd = node(g, { x: 0, y: FY[i], w: FW, h: FH, t: n.t, s: n.s }, i, { size: 10.5 });
    tx(g, 8, FY[i] + 12, `0${i + 1}`, { size: 7, fill: MUTE });
    return nd;
  });
  const legs: Wire[] = [];
  for (let i = 0; i < 3; i++) {
    const p1: [number, number] = [FW / 2, FY[i + 1] - 3];
    legs.push(wire(g, `M${FW / 2},${FY[i] + FH} L${p1}`));
    el(g, "path", { d: head(p1, Math.PI / 2, 7), stroke: INK, "stroke-width": 1.2, fill: "none" });
  }
  legs.push(wire(g, curve([FW, FY[3] + FH / 2], [MP.x - 3, 236]), { filter: "url(#wob1)" }));
  el(g, "path", { d: head([MP.x - 3, 236], 0, 7), stroke: INK, "stroke-width": 1.2, fill: "none" });

  /* the model panel — the heaviest thing here */
  const pf = el(g, "path", { d: rr(MP.x, MP.y, MP.w, MP.h, 10), fill: PAPER, stroke: INK, "stroke-width": 1.8, filter: "url(#wob2)" });
  const pi = el(g, "path", { d: rr(MP.x + 5, MP.y + 5, MP.w - 10, MP.h - 10, 8), fill: "none", stroke: INK, "stroke-width": 1, filter: "url(#wobS)" });
  tx(g, MP.x + 18, MP.y + 26, "05", { size: 9, fill: MUTE });
  const ph = tx(g, MP.x + 40, MP.y + 26, "Analyze — advanced models", { size: 12.5, weight: 700 });
  tx(g, MP.x + 18, MP.y + 41, "Add a data point: all three refit · 5-fold CV", { size: 8, fill: MUTE });
  let cx = MP.x + 18;
  const chips = MODELS.map((m) => {
    const w = (m.length + 7) * 5.4 + 16;
    const f = el(g, "path", { d: rr(cx, MP.y + 52, w, 20, 10), fill: "none", stroke: "rgb(38 32 72 / 0.4)", "stroke-width": 1, filter: "url(#wob3)" });
    const t = tx(g, cx + 10, MP.y + 65.5, m, { size: 8.5, weight: 700 });
    cx += w + 8;
    return { f, t };
  });

  const ax = el(g, "g", { filter: "url(#wob1)", stroke: INK, "stroke-width": 1.6, fill: "none", "stroke-linecap": "round" });
  el(ax, "path", { d: `M${X(0)},${Y(1.06)} L${X(0)},${Y(0)} L${X(1.04)},${Y(0)}` });
  el(ax, "path", { d: head([X(0), Y(1.06)], -Math.PI / 2, 9) });
  el(ax, "path", { d: head([X(1.04), Y(0)], 0, 9) });
  for (let k = 1; k <= 4; k++) {
    el(ax, "path", { d: `M${X(k / 4)},${Y(0)} L${X(k / 4)},${Y(0) + 6}` });
    el(ax, "path", { d: `M${X(0)},${Y(k / 4)} L${X(0) - 6},${Y(k / 4)}` });
  }
  tx(g, X(0) + 10, Y(1.06) + 4, "Impact", { size: 10 });
  tx(g, X(1.04), Y(0) + 24, "Evidence", { size: 10, anchor: "end" });
  const resid = el(g, "path", { stroke: "rgb(38 32 72 / 0.28)", "stroke-width": 1, fill: "none" });
  const dg = el(g, "g", { filter: "url(#wobS)" });
  PTS.forEach(([x, y], i) =>
    el(dg, "circle", { cx: X(x), cy: Y(y), r: 4.4, fill: i % 5 === 2 ? INK : PAPER, stroke: INK, "stroke-width": 1.4 })
  );
  const curveP = el(g, "path", { stroke: PINK, "stroke-width": 2.8, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", filter: "url(#wob2)" });
  const ring = el(g, "circle", { r: 12, fill: "none", stroke: PINK, "stroke-width": 1.3, "stroke-dasharray": "3 3" });
  const dot = el(g, "circle", { r: 6, fill: PINK });
  const tag = tx(g, 0, 0, "", { size: 11, fill: PINK });

  /* and out the other side */
  const ry = RPT.y + RPT.h / 2;
  legs.push(wire(g, `M${MP.x + MP.w},${ry} L${RPT.x - 3},${ry}`));
  el(g, "path", { d: head([RPT.x - 3, ry], 0, 7), stroke: INK, "stroke-width": 1.2, fill: "none" });
  const rpt = node(g, { x: RPT.x, y: RPT.y, w: RPT.w, h: RPT.h, t: "Report", s: "→ the team" }, 2, { size: 10.5 });
  tx(g, RPT.x + 8, RPT.y + 12, "06", { size: 7, fill: MUTE });
  const sent = tx(g, RPT.x + RPT.w / 2, RPT.y + RPT.h + 18, "✓ Sent", { size: 9.5, weight: 700, fill: PINK, anchor: "middle" });
  const tok = el(g, "rect", { width: 7, height: 7, fill: PINK, opacity: 0 });

  /* ---------- state ---------- */

  let ex = 0.9, ey = 0.7;
  let fits: number[][] = [];
  let scores = [0, 0, 0];
  let fitKey = "", fitAt = -1e9;
  let shownCurve: number[] | null = null;

  const refit = () => {
    XS[N] = ex;
    YS[N] = ey;
    fits = FITS.map((f) => {
      const m = f(XS, YS, WS, ALL);
      return Array.from({ length: SAMPLES }, (_, k) => m(k / (SAMPLES - 1)));
    });
    scores = FITS.map(cvScore);
  };
  const score = (i: number) => "." + String(Math.round(clamp(scores[i], 0, 0.99) * 100)).padStart(2, "0");
  const LEGS: [number, number][] = [[250, 550], [650, 950], [1050, 1350], [1400, 1700], [5850, 6150]];

  return {
    caption: "Fig. 1a — Three models, best one ships.",
    frame(t: number, p: Pointer) {
      /* the reader's point, or a slow phantom one */
      const inChart = p.inside && p.x > CH.x - 14 && p.x < CH.x + CH.w + 14 && p.y > CH.y - 14 && p.y < CH.y + CH.h + 14;
      /* while the reader is playing with the data, hold the finished state —
         every score live, the winner marked — instead of restarting the run
         under their cursor */
      const tt = reduced || inChart ? 7000 : t % LOOP;
      const tx_ = inChart ? clamp((p.x - CH.x) / CH.w, 0.02, 0.98) : 0.9;
      const ty_ = inChart ? clamp(1 - (p.y - CH.y) / CH.h, 0.02, 0.98) : reduced ? 0.72 : 0.7 + 0.2 * Math.sin((t * 2 * Math.PI) / 9000);
      ex += (tx_ - ex) * 0.14;
      ey += (ty_ - ey) * 0.14;
      const key = `${Math.round(ex * 60)},${Math.round(ey * 60)}`;
      const now = performance.now();
      if (!fits.length || (key !== fitKey && now - fitAt > 90)) {
        fitKey = key;
        fitAt = now;
        refit();
      }

      /* which model is on show: each in turn, then the cross-validated winner */
      const best = scores.indexOf(Math.max(...scores));
      const decided = reduced || tt >= TURNS[2][1];
      const shown = decided ? best : tt >= TURNS[0][0] ? TURNS.findIndex(([a, b]) => tt >= a && tt < b) : 0;
      const target = fits[shown];
      if (!shownCurve) shownCurve = target.slice();
      const sc = shownCurve;
      for (let k = 0; k < SAMPLES; k++) sc[k] += (target[k] - sc[k]) * 0.16;
      const cop = reduced ? 1 : win(tt, 1600, 1950);
      curveP.setAttribute("d", "M" + sc.map((v, k) => `${X(k / (SAMPLES - 1)).toFixed(1)},${Y(clamp(v, -0.05, 1.05)).toFixed(1)}`).join(" L"));
      curveP.setAttribute("opacity", String(cop));
      const at = (x: number) => {
        const f = x * (SAMPLES - 1), k = Math.min(SAMPLES - 2, Math.floor(f));
        return sc[k] + (sc[k + 1] - sc[k]) * (f - k);
      };
      let d = "";
      for (const [x, y] of PTS) d += `M${X(x)},${Y(y)} L${X(x)},${Y(at(x)).toFixed(1)}`;
      resid.setAttribute("d", d);
      resid.setAttribute("opacity", String(cop));

      chips.forEach((c, i) => {
        const on = i === shown && tt >= TURNS[0][0];
        const won = decided && i === best;
        c.f.setAttribute("stroke", on || won ? PINK : "rgb(38 32 72 / 0.4)");
        c.f.setAttribute("fill", won ? PINK : "none");
        c.t.setAttribute("fill", won ? PAPER : on ? PINK : INK);
        const ran = reduced || tt >= TURNS[i][0];
        c.t.textContent = `${MODELS[i]} ${ran ? score(i) : "—"}${won ? " ✓" : ""}`;
      });

      for (const c of [dot, ring]) {
        c.setAttribute("cx", String(X(ex)));
        c.setAttribute("cy", String(Y(ey)));
      }
      /* near the right edge the label would run over the panel's frame —
         it flips to the point's left there */
      const flip = ex > 0.75;
      tag.setAttribute("x", String(X(ex) + (flip ? -18 : 18)));
      tag.setAttribute("y", String(Y(ey) - 12));
      tag.setAttribute("text-anchor", flip ? "end" : "start");
      tag.textContent = inChart ? "You" : "New data";

      /* the flow chart runs first, the report goes out last */
      flow.forEach((n, i) => lit(n, inW(tt, i * 400, i * 400 + 500)));
      const analysing = inW(tt, 1650, 5650);
      pf.setAttribute("stroke", analysing ? PINK : INK);
      pi.setAttribute("stroke", analysing ? PINK : INK);
      ph.setAttribute("fill", analysing ? PINK : INK);
      lit(rpt, tt >= 6100);
      sent.setAttribute("opacity", tt >= 6200 ? "1" : "0");
      let moving = false;
      LEGS.forEach(([a, b], k) => {
        if (!inW(tt, a, b)) return;
        along(tok, legs[k], ease(win(tt, a, b)), 3.5);
        moving = true;
      });
      tok.setAttribute("opacity", moving && !reduced ? "1" : "0");

      const readout =
        tt < TURNS[0][0] && !reduced
          ? `Preparing data &nbsp;·&nbsp; step <b>${Math.min(4, Math.floor(tt / 400) + 1)}</b>/4`
          : !decided
            ? `Fitting <b>${MODELS[shown].toLowerCase()}</b> &nbsp;·&nbsp; cv r² <b>${score(shown)}</b>`
            : `Best <b>${MODELS[best].toLowerCase()}</b> &nbsp;·&nbsp; cv r² <b>${score(best)}</b>`;
      return { port: [RPT.x + RPT.w, ry, 0], readout };
    }
  };
}
