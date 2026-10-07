"use client";

import { useEffect, useRef, useState } from "react";

/* The Cedars-Sinai study, made practical: not "AI for burnout" but a loop a
   nursing operations team could run on Monday.

   01 THE PROBLEM — real survey numbers: burnout tops the list of reasons
   nurses give for leaving, but it is a symptom, and an annual survey finds
   it a year late.
   02 FROM FEELING TO CAUSE — the root-cause step (Frank's part of the
   deck), interactive: a nurse's own words → the operational cause → who
   owns it → the fix → what moves if it works.
   03 PROVE IT — the pilot that decides whether to scale, and the rules that
   keep it from becoming surveillance.

   Survey figures: 2022 National Sample Survey of Registered Nurses (HRSA).
   Replacement cost: Halter et al., 2017. The comments and the unit map are
   illustrative — written from the deck's examples, not real staff data. */

const REASONS: [string, number][] = [
  ["Burnout", 65.9],
  ["Better pay or benefits", 61.2],
  ["Inadequate staffing", 51.7],
  ["Stressful work environment", 48.1],
  ["Lack of good leadership", 37.3],
  ["Career advancement", 33.4]
];

/* `col` is the cause's column in the unit map */
type Case = { said: string; cause: string; owner: string; fix: string; measure: string; col: number };
const CASES: Case[] = [
  {
    said: "I spend my whole shift staring at the screen. I scroll ten pages just to see why a med was ordered.",
    cause: "Documentation friction",
    owner: "Nursing informatics",
    fix: "Draft notes from the bedside conversation; the order's reason shown beside the order",
    measure: "Charting minutes per shift",
    col: 0
  },
  {
    said: "We were two nurses short again, and nobody saw the surge coming.",
    cause: "Staffing below demand",
    owner: "Staffing office",
    fix: "Census forecast 7 days out; flex pool booked before the surge, not during it",
    measure: "Overtime hours, short-staffed shifts",
    col: 1
  },
  {
    said: "Third time this month I've been floated to a unit I don't know.",
    cause: "Allocation mismatch",
    owner: "Unit managers",
    fix: "Float by competency match, with a monthly cap per nurse",
    measure: "Floats per nurse, float-shift incidents",
    col: 2
  },
  {
    said: "We fill in the survey every year. Nothing ever changes.",
    cause: "Broken feedback loop",
    owner: "Nurse managers",
    fix: "Each unit's top friction reviewed in the monthly huddle, with an owner and a date",
    measure: "Days from signal to action",
    col: 3
  }
];

const UNITS = ["ICU", "ED", "Med-Surg", "Oncology", "L&D"];
const CAUSES = ["Documentation", "Staffing", "Floating", "Feedback"];
/* illustrative intensity, 0–1 */
const MAP = [
  [0.9, 0.5, 0.2, 0.4],
  [0.6, 0.95, 0.3, 0.5],
  [0.7, 0.6, 0.8, 0.3],
  [0.5, 0.3, 0.2, 0.6],
  [0.4, 0.7, 0.1, 0.2]
];

function useSeen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

export default function CedarsDemo() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  const bars = useSeen<HTMLDivElement>();
  const map = useSeen<HTMLDivElement>();

  return (
    <>
      <section className="study__block sbx">
        <h3 className="small study__label">01 — THE PROBLEM</h3>
        <p className="sbx__lede">Why nurses consider leaving. Burnout tops the list, but it is a symptom, not a cause.</p>

        <div className={`cdx__bars${bars.seen ? " is-in" : ""}`} ref={bars.ref}>
          {REASONS.map(([r, v], k) => (
            <div className={`cdx__bar${k === 0 ? " is-lead" : ""}`} key={r} style={{ "--k": k } as React.CSSProperties}>
              <span className="cdx__barL">{r}</span>
              <span className="cdx__barT">
                <i style={{ width: `${v}%` }} />
              </span>
              <span className="cdx__barV">{v}%</span>
            </div>
          ))}
          <p className="fig__cap">2022 National Sample Survey of Registered Nurses. Multiple reasons allowed.</p>
        </div>

        <div className="cdx__gaps">
          <div>
            <span className="small sbx__stepK">TOO COARSE</span>
            <p>&ldquo;Burnout: high&rdquo; doesn&apos;t say whether to fix staffing, charting or leadership.</p>
          </div>
          <div>
            <span className="small sbx__stepK">TOO LATE</span>
            <p>An annual survey finds intent to leave after the nurse has decided.</p>
          </div>
          <div>
            <span className="small sbx__stepK">TOO COSTLY</span>
            <p>$11K–$90K to replace one nurse.</p>
          </div>
        </div>
      </section>

      <section className="study__block sbx">
        <h3 className="small study__label">02 — FROM FEELING TO CAUSE</h3>
        <p className="sbx__lede">A weekly two-minute check-in. Pick what a nurse says; see where it goes.</p>

        <div className="sbx__presets" role="group" aria-label="Example check-in answers">
          {CASES.map((x, k) => (
            <button key={x.cause} type="button" className={`sbx__preset${k === i ? " is-on" : ""}`} aria-pressed={k === i} onClick={() => setI(k)}>
              &ldquo;{x.said}&rdquo;
            </button>
          ))}
        </div>

        <ol className="cdx__chain" key={i} aria-live="polite">
          {[
            ["ROOT CAUSE", c.cause],
            ["OWNER", c.owner],
            ["FIX", c.fix],
            ["MEASURE", c.measure]
          ].map(([k, v], n) => (
            <li key={k} style={{ "--k": n } as React.CSSProperties}>
              <span className="small sbx__stepK">{k}</span>
              <span className={n === 0 ? "cdx__cause" : "cdx__v"}>{v}</span>
            </li>
          ))}
        </ol>

        <h4 className="small sbx__sub">WHAT THE WEEK LOOKS LIKE, BY UNIT</h4>
        <div className={`cdx__map${map.seen ? " is-in" : ""}`} ref={map.ref}>
          <span />
          {CAUSES.map((x) => (
            <span key={x} className="small cdx__mapH">
              {x}
            </span>
          ))}
          {UNITS.map((u, r) => (
            <div className="cdx__mapRow" key={u}>
              <span className="small cdx__mapU">{u}</span>
              {MAP[r].map((v, k) => (
                <i
                  key={k}
                  className={k === c.col ? "is-col" : ""}
                  style={{ "--v": v, "--k": r * 4 + k } as React.CSSProperties}
                  title={`${u} · ${CAUSES[k]}`}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="fig__cap">
          Illustrative. Each unit gets its own top cause, so the fix lands where it hurts: the ED&apos;s problem is staffing,
          the ICU&apos;s is charting.
        </p>
      </section>

      <section className="study__block sbx">
        <h3 className="small study__label">03 — PROVE IT BEFORE SCALING</h3>
        <p className="sbx__lede">Pilot units against matched control units, read as a difference-in-differences.</p>

        <div className="cdx__time">
          {[
            ["BASELINE", "4–8 weeks", "Satisfaction, overtime, charting time, floats"],
            ["PILOT", "8–16 weeks", "Check-ins and fixes live in pilot units only"],
            ["FOLLOW-UP", "3–12 months", "Attrition, after the test ends"]
          ].map(([k, d, s], n) => (
            <div className={`cdx__phase${n === 1 ? " is-live" : ""}`} key={k} style={{ flexGrow: [6, 12, 20][n] }}>
              <span className="small sbx__stepK">{k}</span>
              <b>{d}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <p className="fig__cap">Scale only where the pilot units beat their controls. Stop where they don&apos;t.</p>

        <h4 className="small sbx__sub">GUARDRAILS</h4>
        <ul className="cdx__rules">
          <li>Opt-in, and reported only for groups of 10 or more. Never about one nurse.</li>
          <li>Never used in performance reviews.</li>
          <li>Each unit compared to its own baseline, not to other units.</li>
          <li>Role-based access and audit logs, HIPAA-aligned.</li>
        </ul>
      </section>
    </>
  );
}
