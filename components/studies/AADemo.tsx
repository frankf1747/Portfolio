"use client";

import { useState } from "react";
import { Bars, Block, Cap, Chain, Panels, Rules, Stats, Sub } from "./kit";

/* American Airlines — which pilot sequences through DFW are likely to run
   late (Group 9). A pilot flies A → DFW → B; if either leg is late the
   delay cascades into duty-time limits and crew re-accommodation. The team
   scored each leg with a random forest on 2024 flight data and combined
   them as P_total = 1 − (1 − P_A)(1 − P_B). Frank owned results & impact.

   Delay causes: BTS on-time arrival performance for American Airlines,
   Jan 2020 – Oct 2025, as charted in the deck. The leg probabilities in the
   scorer are ILLUSTRATIVE (a simple base × season × time-of-day shape), to
   show how the composite behaves; the deck's model learned them. */

const CAUSES: [string, number][] = [
  ["Aircraft arriving late", 8.18],
  ["Air carrier", 6.8],
  ["National aviation system", 5.41],
  ["Cancelled", 2.39],
  ["Weather", 0.83],
  ["Diverted", 0.28],
  ["Security", 0.07]
];

const AIRPORTS: [string, number][] = [
  ["ORD", 0.24],
  ["MIA", 0.22],
  ["ATL", 0.19],
  ["LAX", 0.16],
  ["DEN", 0.18],
  ["SEA", 0.12]
];
const SEASONS: [string, number][] = [
  ["Spring storms", 1.35],
  ["Summer peak", 1.2],
  ["Holidays", 1.25],
  ["Fall", 0.85]
];
const BANKS: [string, number][] = [
  ["Morning bank", 0.8],
  ["Evening bank", 1.3]
];

const clamp = (v: number) => Math.min(0.95, Math.max(0.01, v));
const pct = (v: number) => `${Math.round(v * 100)}%`;

function Seg<T extends [string, number]>({ label, items, i, onPick }: { label: string; items: T[]; i: number; onPick: (k: number) => void }) {
  return (
    <div className="aax__seg" role="group" aria-label={label}>
      <span className="small sbx__stepK">{label}</span>
      {items.map(([k], n) => (
        <button key={k} type="button" className={`ddx__chip${n === i ? " is-on" : ""}`} aria-pressed={n === i} onClick={() => onPick(n)}>
          {k}
        </button>
      ))}
    </div>
  );
}

export default function AADemo() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [s, setS] = useState(0);
  const [t, setT] = useState(1);
  const f = SEASONS[s][1] * BANKS[t][1];
  const pa = clamp(AIRPORTS[a][1] * f);
  const pb = clamp(AIRPORTS[b][1] * f);
  const total = 1 - (1 - pa) * (1 - pb);
  const band = total >= 0.5 ? 2 : total >= 0.3 ? 1 : 0;
  const ACTION = [
    "Keep as scheduled.",
    "Add buffer to the DFW layover.",
    "Re-pair the sequence, or hold a reserve pilot at DFW."
  ];

  return (
    <>
      <Block n="01" title="THE PROBLEM" lede="A pilot flies A → DFW → B. One late leg and the delay cascades: missed connections, duty-time limits, a crew to re-accommodate.">
        <div className="aax__path" aria-hidden="true">
          <span>A</span>
          <i />
          <b>DFW</b>
          <i className="is-late" />
          <span>B</span>
        </div>
        <Bars
          rows={CAUSES}
          max={9}
          lead={0}
          cap="Why American's flights ran late, % of flights, BTS on-time data Jan 2020 – Oct 2025 (76.05% on time). The biggest single cause is the cascade itself: the aircraft arriving late."
        />
        <Stats
          items={[
            ["$22B", "AIRLINE DELAY COST / YR"],
            ["$33B", "TOTAL ECONOMIC IMPACT"],
            ["$101", "OPERATING COST / MIN"]
          ]}
        />
      </Block>

      <Block n="02" title="SCORE A SEQUENCE" lede="Each leg gets its own delay probability; the sequence is late if either leg is. Build one.">
        <div className="aax__controls">
          <Seg label="INTO DFW FROM" items={AIRPORTS} i={a} onPick={setA} />
          <Seg label="OUT OF DFW TO" items={AIRPORTS} i={b} onPick={setB} />
          <Seg label="SEASON" items={SEASONS} i={s} onPick={setS} />
          <Seg label="DEPARTURE" items={BANKS} i={t} onPick={setT} />
        </div>

        <div className="aax__calc">
          <div>
            <span className="small sbx__stepK">LEG 1 · P_A</span>
            <b>{pct(pa)}</b>
            <span>{AIRPORTS[a][0]} → DFW</span>
          </div>
          <div>
            <span className="small sbx__stepK">LEG 2 · P_B</span>
            <b>{pct(pb)}</b>
            <span>DFW → {AIRPORTS[b][0]}</span>
          </div>
          <div className={`aax__total is-b${band}`}>
            <span className="small sbx__stepK">SEQUENCE · 1 − (1 − P_A)(1 − P_B)</span>
            <b>{pct(total)}</b>
            <span className="aax__meter">
              <i style={{ width: pct(total) }} />
            </span>
          </div>
        </div>
        <Chain
          k={`${a}${b}${s}${t}`}
          widths="1fr 2.4fr"
          cells={[
            ["RISK", ["Low", "Elevated", "High"][band]],
            ["SCHEDULING CALL", ACTION[band]]
          ]}
        />
        <Cap>
          Illustrative leg probabilities. In the project, a random forest predicts each leg from season and holiday flags, historical
          route delay, weather (visibility, wind, precipitation), airport congestion and NAS delays, on 2024 flight data.
        </Cap>
      </Block>

      <Block n="03" title="RESULTS & IMPACT" lede="My section: from a risk score to money saved, and what a scheduler does with it.">
        <Stats
          items={[
            ["15%", "FEWER CONTROLLABLE CASCADES"],
            ["$8.6M", "ANNUALIZED SAVINGS"]
          ]}
        />
        <Cap>
          Projected, DFW hub, peak spring months. Savings = avoidable high-risk sequences per day × peak days × minutes avoided
          per sequence × $ per minute × realized effectiveness.
        </Cap>
        <Sub>WHAT A SCHEDULER DOES WITH IT</Sub>
        <Panels
          items={[
            ["BUFFER", "Lengthen the DFW layover on sequences that score high."],
            ["INVESTIGATE", "Send the airports that keep topping the list to root-cause review."],
            ["ALLOCATE", "Place reserve crews where high-risk sequences cluster."]
          ]}
        />
        <Sub>WHAT I&apos;D FIX BEFORE TRUSTING THE RANKING</Sub>
        <Rules
          limits
          items={[
            "The top of the list was small airports with few flights, where one bad day reads as 99% risk. Rank only routes with enough flights, and shrink small samples toward the network average.",
            "Judge the model on what scheduling needs: AUC under class imbalance, precision vs recall at the buffer threshold, and calibrated probabilities.",
            "Validate operationally: did high-risk sequences actually run late more often than low-risk ones, next season?"
          ]}
        />
      </Block>
    </>
  );
}
