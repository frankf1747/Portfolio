"use client";

import { useMemo, useState } from "react";
import { Block, Cap, Chain, Panels, Picker, Rules, Stats, Sub } from "./kit";

/* DoorDash — "The Price of a Promo Email". A fuzzy regression
   discontinuity at the re-order score cutoff that decides who gets a $5
   win-back email.

   The simulator is the design itself, run on SIMULATED users: pick what
   the email truly does and a bandwidth, and the local linear fits on each
   side of the cutoff recover it. ITT is the jump in orders, the first
   stage is the jump in emails received, LATE is their ratio (Wald).
   Business figures are the deck's illustrative ranges (10-K inputs and
   industry benchmarks), not DoorDash's numbers. */

const C = 0.1;
const X0 = 0.04, X1 = 0.16;
const N = 120000;

type Scenario = { k: string; tau: number; action: string; impact: string };
const SCENARIOS: Scenario[] = [
  { k: "Large & positive", tau: 0.08, action: "Lower the cutoff; widen the send list 20–30%", impact: "+$80M–$160M GMV / yr" },
  { k: "Small & positive", tau: 0.03, action: "Hold the cutoff; invest in creative and segmentation", impact: "+$20M–$40M GMV / yr" },
  { k: "Null", tau: 0, action: "Raise the cutoff; move the budget to acquisition", impact: "$30M–$50M reallocated" },
  { k: "Negative", tau: -0.03, action: "Pause, or raise the cutoff sharply; re-test a softer touch", impact: "$15M–$30M CLV protected" }
];
const BANDS = [0.01, 0.02, 0.04];

/* seeded, so every visit draws the same users */
const rng = (seed: number) => () => {
  let s = (seed = (seed + 0x6d2b79f5) | 0);
  s = Math.imul(s ^ (s >>> 15), 1 | s);
  s = (s + Math.imul(s ^ (s >>> 7), 61 | s)) ^ s;
  return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
};

type U = { x: number; d: number; y: number };
function simulate(tau: number): U[] {
  const r = rng(37);
  const out: U[] = [];
  for (let i = 0; i < N; i++) {
    const x = X0 + r() * (X1 - X0);
    /* base re-order chance rises with the score; above c about half are
       actually reached (deliverability, opens), so the design is fuzzy */
    const base = 0.06 + 1.1 * (x - X0);
    const d = x >= C && r() < 0.5 ? 1 : 0;
    const y = r() < base + d * tau ? 1 : 0;
    out.push({ x, d, y });
  }
  return out;
}

/* least squares of v on (x - c) within one side of the bandwidth */
function fit(us: U[], key: "y" | "d") {
  const n = us.length;
  if (n < 3) return { a: 0, b: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const u of us) {
    const x = u.x - C, y = u[key];
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  return { a: (sy - b * sx) / n, b };
}

function estimate(us: U[], h: number) {
  const lo = us.filter((u) => u.x < C && u.x >= C - h);
  const hi = us.filter((u) => u.x >= C && u.x < C + h);
  const yl = fit(lo, "y"), yh = fit(hi, "y"), dl = fit(lo, "d"), dh = fit(hi, "d");
  const itt = yh.a - yl.a, fs = dh.a - dl.a;
  return { yl, yh, itt, fs, late: fs > 0.05 ? itt / fs : 0, n: lo.length + hi.length };
}

const W = 640, H = 260, PAD = 34;
const sx = (x: number) => PAD + ((x - X0) / (X1 - X0)) * (W - PAD * 2);
const Y0 = 0.02, Y1 = 0.26;
const sy = (y: number) => H - 26 - ((y - Y0) / (Y1 - Y0)) * (H - 46);
const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`;

export default function DoorDashDemo() {
  const [s, setS] = useState(1);
  const [b, setB] = useState(1);
  const sc = SCENARIOS[s], h = BANDS[b];
  const us = useMemo(() => simulate(sc.tau), [sc.tau]);
  const est = useMemo(() => estimate(us, h), [us, h]);

  /* binned means for the scatter */
  const bins = useMemo(() => {
    const k = 24, w = (X1 - X0) / k;
    return Array.from({ length: k }, (_, i) => {
      const a = X0 + i * w, inBin = us.filter((u) => u.x >= a && u.x < a + w);
      return { x: a + w / 2, y: inBin.reduce((t, u) => t + u.y, 0) / (inBin.length || 1) };
    });
  }, [us]);

  const line = (f: { a: number; b: number }, from: number, to: number) =>
    `M${sx(from)},${sy(f.a + f.b * (from - C))} L${sx(to)},${sy(f.a + f.b * (to - C))}`;

  return (
    <>
      <Block n="01" title="THE QUESTION" lede="Every week a model scores each lapsed user's chance of ordering again. Score at or above the cutoff: a $5 email. Below: nothing.">
        <div className="ddx__pair">
          {[
            ["0.099", "No email", false],
            ["0.101", "$5 email", true]
          ].map(([v, t, on]) => (
            <div className={`ddx__user${on ? " is-on" : ""}`} key={v as string}>
              <span className="small sbx__stepK">RE-ORDER SCORE</span>
              <b>{v as string}</b>
              <span>{t as string}</span>
            </div>
          ))}
          <p>
            Two users, identical in every way that matters, get opposite treatment. A/B pilots report the average lift across the
            whole list; the money is decided <em>at the cutoff</em>, so that is where to measure it.
          </p>
        </div>
        <Stats
          items={[
            ["$1.6B", "SALES & MARKETING / YR"],
            ["~80M", "WIN-BACK EMAILS / YR"],
            ["~15%", "TYPICAL OPEN RATE"]
          ]}
        />
      </Block>

      <Block n="02" title="THE DESIGN, RUNNING" lede="Pick what the email truly does. The regression discontinuity has to find it from the data alone.">
        <Picker items={SCENARIOS} i={s} onPick={setS} label="True effect of the email" render={(x) => `${x.k} · true effect ${pct(x.tau)}`} />

        <div className="ddx__plot">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Order rate by re-order score, with a fitted line on each side of the cutoff">
            <rect className="ddx__band" x={sx(C - h)} y={10} width={sx(C + h) - sx(C - h)} height={H - 36} />
            <path className="ddx__axis" d={`M${PAD},${H - 26} H${W - PAD}`} />
            <path className="ddx__cut" d={`M${sx(C)},10 V${H - 26}`} />
            {bins.map((p) => (
              <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={4} className={p.x >= C ? "is-hi" : ""} />
            ))}
            <path className="ddx__fit" d={line(est.yl, C - h, C)} />
            <path className="ddx__fit is-hi" d={line(est.yh, C, C + h)} />
            <path className="ddx__jump" d={`M${sx(C) + 6},${sy(est.yl.a)} V${sy(est.yh.a)}`} />
            <text x={sx(C) + 12} y={(sy(est.yl.a) + sy(est.yh.a)) / 2 + 4} className="ddx__t is-hi">
              ITT {pct(est.itt)}
            </text>
            <text x={sx(C)} y={H - 8} textAnchor="middle" className="ddx__t">
              cutoff c = 0.10
            </text>
            <text x={PAD} y={H - 8} className="ddx__t">0.04</text>
            <text x={W - PAD} y={H - 8} textAnchor="end" className="ddx__t">0.16 · re-order score</text>
            <text x={PAD} y={18} className="ddx__t">14-day order rate</text>
          </svg>
        </div>

        <div className="ddx__bw" role="group" aria-label="Bandwidth">
          <span className="small sbx__stepK">BANDWIDTH</span>
          {BANDS.map((v, k) => (
            <button key={v} type="button" className={`ddx__chip${k === b ? " is-on" : ""}`} aria-pressed={k === b} onClick={() => setB(k)}>
              ± {v.toFixed(2)}
            </button>
          ))}
          <span className="small ddx__n">{est.n.toLocaleString("en-US")} USERS IN WINDOW</span>
        </div>

        <Chain
          k={`${s}${b}`}
          widths="1fr 1fr 1fr 1.2fr"
          cells={[
            ["ITT · JUMP IN ORDERS", pct(est.itt)],
            ["FIRST STAGE · JUMP IN EMAILS", `${(est.fs * 100).toFixed(0)}% reached`],
            ["LATE = ITT ÷ FIRST STAGE", pct(est.late)],
            ["TRUE EFFECT", `${pct(sc.tau)} per reached user`]
          ]}
        />
        <Cap>
          Simulated users, not DoorDash data. Change the bandwidth: an estimate that holds steady across ±0.01, ±0.02 and ±0.04 is a
          real effect, not a curve-fitting artifact.
        </Cap>
      </Block>

      <Block n="03" title="FROM ESTIMATE TO DECISION" lede="Each result maps to one move on the cutoff, worth eight to nine figures a year.">
        <div className="ddx__table" role="table">
          {SCENARIOS.map((x, k) => (
            <div className={`ddx__row${k === s ? " is-on" : ""}`} role="row" key={x.k}>
              <span role="cell" className="ddx__k">{x.k}</span>
              <span role="cell">{x.action}</span>
              <span role="cell" className="ddx__imp">{x.impact}</span>
            </div>
          ))}
        </div>
        <Cap>Ranges from the deck: per-user effect × ~80M sends, and unsubscribes × 12-month CLV. Illustrative orders of magnitude.</Cap>

        <Sub>WHY THE ESTIMATE HOLDS</Sub>
        <Panels
          items={[
            ["NO GAMING", "Users can't see their score or the cutoff, so nobody sorts themselves across it."],
            ["DENSITY", "A McCrary test checks there's no pile-up of users just above the cutoff."],
            ["BALANCE", "Tenure, past spend and cuisine mix show no jump at the cutoff."],
            ["FUZZY → IV", "Only some are reached, so the cutoff is an instrument: report ITT and LATE."]
          ]}
        />

        <Sub>WHAT IT CAN'T TELL YOU</Sub>
        <Rules
          limits
          items={[
            "The effect is local to the cutoff: loyalists and long-gone users need their own design.",
            "If the score model is retrained mid-quarter, the cutoff moves; the window is pre-registered.",
            "14- and 30-day windows miss promo dependency that builds over quarters."
          ]}
        />
      </Block>
    </>
  );
}
