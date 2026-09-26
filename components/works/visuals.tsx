/* §9 card visuals — one designed mock per project.

   These are PLACEHOLDERS with intent: each one sketches what the real
   screenshot or diagram will show, so the grid can be judged as a design
   before the images exist. Structure comes from the content spec; the
   figures shown (eleven partners, ~11%, ~600 / 7 courses, five agents) are
   the ones already approved there. Everything else — field names, segment
   names, source rows — is illustrative filler, not a claim.

   BIOMARIN carries no values at all: the spec rules out real figures,
   partner names and screenshots for it, so its record is skeleton bars.

   All decorative: the card's headline and summary carry the meaning, so
   every visual is aria-hidden at the card level. */

import type { CSSProperties } from "react";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/* ---------- 01 BIOMARIN — eleven feeds, one keyed record ---------- */

const FEEDS = ["PDF", "XLS", "EML", "CSV", "PDF", "XLS", "EML", "PDF", "CSV", "XLS", "EML"];

export function BioVisual() {
  return (
    <div className="v-bio">
      <div className="v-bio__feeds">
        <span className="v-cap">11 PARTNER FEEDS</span>
        <div className="v-bio__grid">
          {FEEDS.map((f, i) => (
            <span key={i} className="v-chip" style={v({ "--i": i })}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <svg className="v-wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[12, 31, 50, 69, 88].map((y) => (
          <path key={y} d={`M0 ${y} C55 ${y} 45 50 100 50`} />
        ))}
      </svg>

      <div className="v-panel v-bio__rec">
        <div className="v-row v-row--head">
          <span className="v-cap">BATCH</span>
          <span className="v-id">B-····</span>
          <span className="v-pill">KEYED</span>
        </div>
        {[
          ["MATERIAL", "72%"],
          ["SITE", "44%"],
          ["LOT", "58%"],
          ["RELEASE", "36%"]
        ].map(([k, w]) => (
          <div className="v-row" key={k}>
            <span className="v-cap">{k}</span>
            <span className="v-bar" style={v({ "--w": w })} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 02 MOOBOX — three systems into one lifecycle view ---------- */

export function MooVisual() {
  return (
    <div className="v-moo">
      <div className="v-moo__src">
        {["CRM", "ORDERS", "FULFILMENT"].map((s) => (
          <span key={s} className="v-pill v-pill--ghost">
            {s}
          </span>
        ))}
      </div>

      <div className="v-panel v-moo__panel">
        <div className="v-row v-row--head">
          <span className="v-title">Lifecycle view</span>
          <span className="v-kpi">
            ≈ +11%<small>REPEAT CONVERSION</small>
          </span>
        </div>
        {[
          ["NEW", "38%"],
          ["REPEAT", "82%"],
          ["AT RISK", "54%"],
          ["LAPSED", "26%"]
        ].map(([k, w], i) => (
          <div className="v-seg" key={k}>
            <span className="v-cap">{k}</span>
            <span className="v-seg__track">
              <span className="v-seg__fill" style={v({ "--w": w, "--i": i })} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 03 UCLA — the sim as a running product ---------- */

export function UclaVisual() {
  return (
    <div className="v-panel v-ucla">
      <div className="v-win">
        <i />
        <i />
        <i />
        <span className="v-cap">LEAN OPS SIM</span>
      </div>
      <div className="v-ucla__body">
        <div className="v-row">
          <span className="v-cap">ROUND 3 / 5</span>
          <span className="v-track">
            <span style={v({ "--w": "60%" })} />
          </span>
        </div>
        <svg className="v-spark" viewBox="0 0 120 36" preserveAspectRatio="none">
          <path className="v-spark__area" d="M0 30 L15 26 L30 28 L45 20 L60 22 L75 14 L90 16 L105 8 L120 10 L120 36 L0 36Z" />
          <path className="v-spark__line" d="M0 30 L15 26 L30 28 L45 20 L60 22 L75 14 L90 16 L105 8 L120 10" />
        </svg>
        <div className="v-row v-row--foot">
          <span className="v-pill">~600 PARTICIPANTS</span>
          <span className="v-cap">7 COURSES</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 05 COMPETITIVE — a scoping board, still being filled ---------- */

export function CompVisual() {
  const rows: [string, number, "done" | "open" | "todo"][] = [
    ["PRICING", 3, "done"],
    ["RELEASES", 2, "done"],
    ["HIRING", 1, "open"],
    ["REVIEWS", 0, "todo"]
  ];
  return (
    <div className="v-panel v-comp">
      <div className="v-row v-row--head">
        <span className="v-title">Scoping board</span>
        <span className="v-pill">DRAFT</span>
      </div>
      {rows.map(([k, cadence, state]) => (
        <div className="v-comp__row" key={k}>
          <span className="v-cap">{k}</span>
          <span className="v-dots">
            {[0, 1, 2].map((d) => (
              <i key={d} className={d < cadence ? "is-on" : ""} />
            ))}
          </span>
          <span className={`v-state is-${state}`} />
        </div>
      ))}
    </div>
  );
}

/* ---------- 04 DISPATCH — the real graph, per the spec ----------
   Three agents (context via RAG, ops KPIs + anomalies, weather → dispatch
   risk) hand off to a writer; the fifth step delivers by email. Nodes sit
   at fixed percentages and the wires are drawn in the same 0–100 space, so
   the chart stretches with the card without re-layout. */

const DISP_NODES = [
  { x: 18, y: 12, t: "CONTEXT", s: "RAG" },
  { x: 50, y: 12, t: "OPS DATA", s: "KPI · ANOMALY" },
  { x: 82, y: 12, t: "WEATHER", s: "DISPATCH RISK" }
];

export function DispatchVisual() {
  return (
    <div className="v-disp">
      <svg className="v-wires v-wires--flow" viewBox="0 0 100 100" preserveAspectRatio="none">
        {DISP_NODES.map((n) => (
          <path key={n.x} d={`M${n.x} 18 C${n.x} 32 50 30 50 42`} />
        ))}
        <path d="M50 58 V76" />
      </svg>

      {DISP_NODES.map((n) => (
        <span key={n.t} className="v-node" style={v({ "--x": `${n.x}%`, "--y": `${n.y}%` })}>
          <b>{n.t}</b>
          <small>{n.s}</small>
        </span>
      ))}

      <div className="v-panel v-disp__writer" style={v({ "--x": "50%", "--y": "50%" })}>
        <div className="v-row v-row--head">
          <span className="v-title">Writer</span>
          <span className="v-cap">LEADERSHIP REPORT</span>
        </div>
        <span className="v-bar" style={v({ "--w": "92%" })} />
        <span className="v-bar" style={v({ "--w": "76%" })} />
        <span className="v-bar" style={v({ "--w": "84%" })} />
      </div>

      <div className="v-panel v-disp__mail" style={v({ "--x": "50%", "--y": "80%" })}>
        <span className="v-mail__icon" />
        <span className="v-mail__text">
          <b>To: Leadership</b>
          <small>Ops report · attached</small>
        </span>
        <span className="v-pill">SENT</span>
      </div>
    </div>
  );
}

/* ---------- 06 NEXT — a roadmap line, the next builds on it ---------- */

export function NextVisual() {
  const stops = [
    { x: 12, y: 62, t: "SCOPING", s: "done" },
    { x: 50, y: 38, t: "BUILD", s: "now" },
    { x: 88, y: 62, t: "SHIP", s: "next" }
  ];
  return (
    <div className="v-next">
      <svg className="v-wires v-wires--road" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 70 C6 70 8 62 12 62 C28 62 34 38 50 38 C66 38 72 62 88 62 C92 62 94 70 100 70" />
      </svg>
      {stops.map((s) => (
        <span key={s.t} className={`v-stop is-${s.s}`} style={v({ "--x": `${s.x}%`, "--y": `${s.y}%` })}>
          <i />
          <span className="v-cap">{s.t}</span>
        </span>
      ))}
    </div>
  );
}
