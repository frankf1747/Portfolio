"use client";

import { useState } from "react";
import { Block, Cap, Chain, Panels, Picker, Stats, Sub, useSeen } from "./kit";

/* Apple — winback offers. A real A/B test (MA Team 7): $0.99 first month
   vs a free month, 180,000 returning subscribers. Every figure here is
   from the team's deck. The free trial won signups, $0.99 won payers, and
   the two tied at the bottom line — until the test was split by how long
   users had been gone. Frank wrote the recommendation: route the offer by
   tenure, then keep testing. */

type Duel = { k: string; a: number; b: number; note: string };

const FUNNEL: Duel[] = [
  { k: "SIGNED UP", a: 3.84, b: 4.06, note: "Free +6% · p = 0.02" },
  { k: "TRIAL → PAID", a: 52.1, b: 48.3, note: "Free −8% · p < 0.01" },
  { k: "PAYING, PER 100 SHOWN", a: 2.0, b: 1.96, note: "A tie" }
];

const SEGMENTS = [
  { k: "Gone 0–3 months", a: 3.29, b: 2.6, lift: "−21.0%", win: "$0.99", why: "Already close to coming back. A free month mostly draws price-shoppers." },
  { k: "Gone 3–6 months", a: 1.55, b: 1.93, lift: "+24.5%", win: "Free trial", why: "Still has intent, but $0.99 isn't enough to overcome the friction of returning." },
  { k: "Gone 6+ months", a: 0.89, b: 1.16, lift: "+30.3%", win: "Free trial", why: "They've forgotten the product. Free is the only hook that registers." }
];

function DuelRow({ d, seen, max }: { d: Duel; seen: boolean; max: number }) {
  return (
    <div className="apx__duel">
      <span className="small sbx__stepK">{d.k}</span>
      {[
        ["$0.99", d.a],
        ["Free", d.b]
      ].map(([l, v]) => (
        <div className={`apx__bar${(v as number) >= Math.max(d.a, d.b) && d.a !== d.b && Math.abs(d.a - d.b) > 0.05 ? " is-win" : ""}`} key={l as string}>
          <span className="apx__l">{l as string}</span>
          <span className="cdx__barT">
            <i style={{ width: seen ? `${((v as number) / max) * 100}%` : 0 }} />
          </span>
          <span className="cdx__barV">{(v as number).toFixed(2)}%</span>
        </div>
      ))}
      <span className="small apx__note">{d.note}</span>
    </div>
  );
}

export default function AppleDemo() {
  const [i, setI] = useState(2);
  const seg = SEGMENTS[i];
  const f = useSeen<HTMLDivElement>();
  const g = useSeen<HTMLDivElement>();

  return (
    <>
      <Block n="01" title="THE TEST" lede="Two winback offers, a clean A/B split across the US, UK, Canada and Australia. Our gut said free would win.">
        <Stats
          items={[
            ["180K", "RETURNING USERS"],
            ["4", "STOREFRONTS"],
            ["3", "CHURN SEGMENTS"],
            ["5.1%", "IN BOTH ARMS, REMOVED"]
          ]}
        />
        <div className={`apx__funnel cdx__bars${f.seen ? " is-in" : ""}`} ref={f.ref}>
          {FUNNEL.map((d, k) => (
            <DuelRow key={d.k} d={d} seen={f.seen} max={k === 1 ? 60 : k === 0 ? 5 : 2.6} />
          ))}
        </div>
        <Cap>Free wins the signup, $0.99 wins the payment. At the bottom line they cancel out: one offer for everyone is the wrong question.</Cap>
      </Block>

      <Block n="02" title="WHO'S COMING BACK" lede="Split by how long a user had been gone, and the answer flips. Pick a segment.">
        <Picker items={SEGMENTS} i={i} onPick={setI} label="Churn segment" render={(x) => x.k} />
        <div className={`cdx__bars${g.seen ? " is-in" : ""}`} ref={g.ref}>
          <DuelRow d={{ k: "PAID, % OF USERS SHOWN THE OFFER", a: seg.a, b: seg.b, note: `Free vs $0.99: ${seg.lift}` }} seen={g.seen} max={3.5} />
        </div>
        <Chain
          k={i}
          widths="1fr 1fr 2.4fr"
          cells={[
            ["WINNER", seg.win],
            ["FREE VS $0.99", seg.lift],
            ["WHY", seg.why]
          ]}
        />
      </Block>

      <Block n="03" title="THE RECOMMENDATION" lede="Match the offer to the user, ship it this quarter, then keep testing.">
        <div className="apx__route">
          {SEGMENTS.map((x, k) => (
            <div className={`apx__routeRow${k === i ? " is-on" : ""}`} key={x.k}>
              <span>{x.k}</span>
              <i aria-hidden="true" />
              <b>{x.win}</b>
            </div>
          ))}
          <div className="apx__pay">
            <span className="study__statV">+10%</span>
            <span className="small study__statL">MORE PAYING CUSTOMERS THAN THE BEST SINGLE OFFER</span>
          </div>
        </div>
        <Cap>Low engineering lift: the app already segments users by how long they've been gone.</Cap>

        <Sub>TEST NEXT</Sub>
        <Panels
          items={[
            ["HIGHEST UPSIDE", "A 3-month free trial for users gone 6+ months."],
            ["LOWEST RISK", "Re-run the recent-churner test yearly; behaviour drifts as the catalog grows."],
            ["NEW GROUND", "Half off for users who turn down both offers today."]
          ]}
        />
      </Block>
    </>
  );
}
