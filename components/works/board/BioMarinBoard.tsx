"use client";

import Board, { Node, Region, Tool, WireDefs, route, wire, wireLabel, withTab, type Rect, type Stop } from "./Board";

/* §13 — BioMarin, told as one whiteboard: what it is, the business
   question, how it is built, what it is worth and what comes next. The
   camera, caption, minimap and crumb are the shared shell in Board.tsx. */

const W = 3900;
const H = 2040;

/* ---------- layout, in board px ---------- */

const REGION: Record<string, Rect> = {
  rA: [80, 90, 1100, 640],
  rB: [1260, 90, 1320, 640],
  rC: [80, 810, 2500, 1160],
  rD: [2660, 90, 1160, 700],
  rE: [2660, 870, 1160, 760]
};

const STOPS: Stop[] = [
  { r: [0, 0, W, H], focus: null, n: "Overview", t: <>One project on one board. <b>Scroll</b> and I&apos;ll walk you through it in order.</> },
  { r: withTab(REGION.rA), focus: "rA", n: "01 · What it's about", t: <>A monthly operations scorecard, <b>automated end to end</b>, with agents that explain it and warn early.</> },
  { r: withTab(REGION.rB), focus: "rB", n: "02 · The question", t: <>Not just the number: <b>its cause, an owner, and enough time to act.</b></> },
  { r: [80, 780, 2500, 1190], focus: "rC", n: "03 · How it's built", t: <>Left to right. <b>One path ends in the deck</b>; a weekly branch signals owners and feeds back into it.</> },
  { r: [100, 870, 1330, 640], focus: "rC", n: "03 · Govern and calculate", t: <>Three GxP sources, <b>one governed layer with one key</b>, twelve metrics in a single scheduled run.</> },
  { r: [1360, 935, 1220, 400], focus: "rC", n: "03 · Monthly: the deep dive", t: <>An agent team drafts the trend and likely root cause; <b>Copilot drafts the deck from a detailed skill, and an SME reviews it.</b></> },
  { r: [1360, 1320, 1220, 390], focus: "rC", n: "03 · Weekly: the early warning", t: <>Checks catch a risk while it&apos;s avoidable. <b>The owner&apos;s cause and action flow back into the draft.</b></> },
  { r: [100, 1400, 2480, 600], focus: "rC", n: "03 · Guardrails", t: <>Built for a GMP setting: <b>read-only, QA-confirmed, and nothing ships without a person.</b></> },
  { r: withTab(REGION.rD), focus: "rD", n: "04 · Business value", t: <><b>85% less manual processing</b>, and the time moves to root cause and to acting early.</> },
  { r: withTab(REGION.rE), focus: "rE", n: "05 · What's next", t: <>The scorecard is the foundation. <b>The closed loop is the payoff.</b></> },
  { r: [0, 0, W, H], focus: null, n: "The whole board", t: <>The backbone before the brain: <b>each layer only holds if the one beneath it does.</b></> }
];

const COLS: [number, string, string, string][] = [
  [130, "1", "SOURCES", "GxP systems of record"],
  [590, "2", "GOVERN", "one model, one key"],
  [1080, "3", "CALCULATE", "12 metrics, one run"],
  [1540, "4", "ANALYSE", "agents draft"],
  [2000, "5", "DELIVER", "one deck, or a signal"],
  [2340, "6", "DECIDE", "people own the call"]
];

const GUARDRAILS: [string, string][] = [
  ["Read-only", "Agents never write to a GxP system of record."],
  ["QA-confirmed definitions", "Each metric's logic is signed off before it's automated."],
  ["Agents draft, people approve", "Nothing reaches leadership without SME review."],
  ["Grounded and scored", "Evals check every figure traces to the metric store."]
];

function Wires() {
  return (
    <svg className="wb__wires" width={W} height={H} aria-hidden="true">
      <WireDefs />

      {/* sources converge on the governed layer (x 590) */}
      {wire("M430,1080 C500,1080 500,1150 552,1150 L576,1150")}
      {wire("M430,1250 L576,1250")}
      {wire("M430,1420 C500,1420 500,1350 552,1350 L576,1350")}
      {wireLabel(500, 1100, "REST")}
      {wireLabel(500, 1414, "DAX")}

      {/* govern → calculate (x 1080) */}
      {wire("M920,1250 L1066,1250")}

      {/* calculate forks: monthly to the agents, weekly to the checks (x 1540) */}
      {wire("M1380,1210 C1440,1210 1440,1166 1500,1166 L1526,1166")}
      {wire("M1380,1290 C1440,1290 1440,1546 1500,1546 L1526,1546", true)}

      {/* monthly path (x 2000, 2340) */}
      {wire("M1880,1166 L1986,1166")}
      {wire("M2280,1166 L2326,1166")}

      {/* weekly path */}
      {wire("M1880,1546 L1986,1546", true)}
      {wire("M2280,1546 L2326,1546", true)}

      {/* the owner's answer flows back up into the draft (bottom at y 1332) */}
      {wire("M2440,1400 C2440,1366 2140,1394 2140,1370 L2140,1346", true)}

      {/* the reading path between regions */}
      {route("M1180,410 L1242,410")}
      {route("M1920,730 C1920,766 1700,756 1700,772 L1700,792")}
      {route("M2580,880 C2660,880 2760,872 2760,836 L2760,808")}
      {route("M3240,790 L3240,852")}
    </svg>
  );
}

export default function BioMarinBoard() {
  return (
    <Board
      size={[W, H]}
      regions={REGION}
      stops={STOPS}
      crumb="BIOMARIN"
      after={
        <>
        <div>
          <h3>Stack</h3>
          <p>Databricks (medallion, SQL) · Fivetran · Microsoft Fabric notebooks · Power BI semantic models (REST and DAX) · Delta tables · Power Automate · Copilot · agent evals</p>
        </div>
        <div>
          <h3>A note on what&apos;s shown</h3>
          <p>The flow follows the real build. Signal thresholds are illustrative; internal names and figures are left out. The 85% is the reported result.</p>
        </div>
        </>
      }
    >
      {(dim) => (
        <>
        <Wires />

        {/* ===== 01 WHAT IT'S ABOUT ===== */}
        <Region r={REGION.rA} n={1} title="What it's about" dim={dim("rA")}>
          <div style={{ position: "absolute", left: 56, top: 70, right: 56 }}>
            <div className="wb-k is-pk">BioMarin · External Operations · Summer 2026</div>
            <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 16 }}>
              From processing
              <br />
              to adaptive learning
            </div>
            <p style={{ fontSize: 24, lineHeight: 1.42, color: "var(--mute)", marginTop: 22, maxWidth: "40ch" }}>
              Automated metric tracking for the monthly operations scorecard, with an agent team that drafts the{" "}
              <b className="wb-strong">root-cause deep dive</b> and <b className="wb-strong">signals the owner</b> before a miss.
            </p>
          </div>
          {[
            ["The company", "Biotech", "Rare diseases and GMP manufacturing, where every batch matters."],
            ["The team", "External Ops", "Runs a network of contract manufacturers across sites."],
            ["The scorecard", "12 metrics", "Quality, batch release and training, reviewed every month."],
            ["My role", "End to end", "Designed and built it as the Insights & Analytics intern."]
          ].map(([k, h, p], i) => (
            <div key={k} className="wb-card" style={{ left: 56 + i * 252, top: 440, width: 236, borderColor: i === 3 ? "var(--accent)" : undefined }}>
              <div className={`wb-k${i === 3 ? " is-pk" : ""}`}>{k}</div>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </Region>

        {/* ===== 02 THE BUSINESS QUESTION ===== */}
        <Region r={REGION.rB} n={2} title="The business question" dim={dim("rB")}>
          <div className="wb-sticky is-y" style={{ left: 56, top: 70, width: 680, rotate: "-1.5deg", padding: "32px 36px" }}>
            <div className="wb-k" style={{ color: "#8a7a2a" }}>
              The ask
            </div>
            <div style={{ fontSize: 33, fontWeight: 700, lineHeight: 1.22, marginTop: 12, fontStyle: "italic" }}>
              &ldquo;Can every number on the scorecard arrive with its context, its likely cause and an owner, early enough to prevent the miss
              instead of just reporting it?&rdquo;
            </div>
          </div>
          <p style={{ position: "absolute", left: 66, top: 448, width: 650, fontSize: 21, lineHeight: 1.45, color: "var(--mute)" }}>
            In a GMP operation a late deviation closure or a lapsed training record is a compliance risk, not just a red cell.{" "}
            <b className="wb-strong">Automation brings the numbers in; AI brings the why, early enough to act on it.</b>
          </p>
          <div className="wb-k" style={{ position: "absolute", left: 800, top: 78 }}>
            Today
          </div>
          {[
            ["Numbers arrive", "without context", ": pulled by hand from four systems and pasted onto the deck.", 2],
            ["Hard to explain", "why a metric moved", ", so little time is left for root-cause analysis.", -1.5],
            ["Misses are flagged at the monthly review,", "after they were avoidable", ".", 1.5]
          ].map(([a, b, c, rot], i) => (
            <div key={i} className="wb-sticky is-p" style={{ left: 790 + (i === 1 ? 14 : 0), top: 112 + i * 172, width: 470, rotate: `${rot}deg`, fontSize: 21 }}>
              {a} <b>{b}</b>
              {c}
            </div>
          ))}
        </Region>

        {/* ===== 03 HOW IT'S BUILT ===== */}
        <Region r={REGION.rC} n={3} title="How it's built" dim={dim("rC")}>
          <p style={{ position: "absolute", left: 44, top: 34, right: 44, fontSize: 22, lineHeight: 1.4, color: "var(--mute)", whiteSpace: "nowrap" }}>
            Every source lands in one governed layer and is calculated in one run.{" "}
            <b className="wb-strong">The main path ends in one drafted deck; a weekly branch signals owners, and their answers flow back into it.</b>
          </p>
        </Region>

        <div className={`wb-flow${dim("rC") ? " wb-dim" : ""}`}>
          {COLS.map(([x, n, t, s]) => (
            <div key={t} className="wb-colhead" style={{ left: x, top: 892 }}>
              <span className="wb-num">{n}</span>
              <b>{t}</b>
              <span>{s}</span>
            </div>
          ))}
          <div className="wb-lane" style={{ left: 1540, top: 984, color: "var(--ink)" }}>
            <i />
            Monthly · the scorecard
          </div>
          <div className="wb-lane" style={{ left: 1540, top: 1364, color: "var(--accent)" }}>
            <i />
            Weekly · proactive signals
          </div>

          {/* 1 sources */}
          <Node r={[130, 1010, 300, 140]} kind="src"><b>Veeva QMS</b><p>deviations · CAPAs</p></Node>
          <Node r={[130, 1180, 300, 140]} kind="src"><b>SAP S/4HANA</b><p>batch release decisions · shipments</p></Node>
          <Node r={[130, 1350, 300, 140]} kind="src"><b>LMS + HR</b><p>GMP training records · people</p></Node>

          {/* 2 govern */}
          <Node r={[590, 1010, 330, 480]}>
            <b>Governed layer</b>
            <p>read-only from every source</p>
            <div className="wb-sub"><b>Databricks medallion</b><span>SAP, bronze → silver → gold</span></div>
            <div className="wb-sub"><b>Power BI semantic models</b><span>quality + training, queried by REST and DAX</span></div>
            <div className="wb-sub is-pk"><b>One key</b><span>batch · site · month, so metrics join</span></div>
          </Node>

          {/* 3 calculate */}
          <Node r={[1080, 1120, 300, 260]}>
            <b>12 metrics, one run</b>
            <p>Rate vs target, by site × month, with 13 months of history.</p>
            <div className="wb-sub" style={{ marginTop: 14 }}><b>Delta metric store</b><span>one source for the deck and the agents</span></div>
          </Node>

          {/* 4–6 monthly */}
          <Node r={[1540, 1020, 340, 312]} kind="ag">
            <span className="wb-chip">AGENT TEAM</span>
            <b>Root-cause deep dive</b>
            <div style={{ marginTop: 8 }}>
              <div className="wb-row"><b>Trend</b>what changed this month</div>
              <div className="wb-row"><b>Root cause</b>likely driver by site, product, category</div>
              <div className="wb-row"><b>Recurrence</b>seen this before?</div>
            </div>
          </Node>
          <Node r={[2000, 1020, 280, 312]} kind="out">
            <b>The draft deck</b>
            <p>Copilot builds it from the metric store.</p>
            <div className="wb-sub is-dark"><b>Deck skill</b><span>a detailed playbook: layout, metric definitions, house style, how to write up a miss</span></div>
          </Node>
          <Node r={[2340, 1020, 200, 312]} kind="ppl">
            <b>SME reviews</b>
            <p>edits the read, then leadership signs off at the monthly review.</p>
          </Node>

          {/* 4–6 weekly */}
          <Node r={[1540, 1400, 340, 292]} kind="sig">
            <span className="wb-chip">EARLY WARNING</span>
            <b>Weekly checks</b>
            <div style={{ marginTop: 8 }}>
              <div className="wb-row"><b>Deviation</b>open day 21 of 30, closure at risk</div>
              <div className="wb-row"><b>Recurrence</b>3rd time at one site this quarter</div>
              <div className="wb-row"><b>Training</b>GMP course due within 7 days</div>
            </div>
          </Node>
          <Node r={[2000, 1400, 280, 292]}>
            <b>Signal to the owner</b>
            <p>A Teams message or email: what&apos;s at risk, the context, and a drafted read.</p>
          </Node>
          <Node r={[2340, 1400, 200, 292]} kind="ppl">
            <b>Owner acts</b>
            <p>confirms the cause, sets the action and an owner.</p>
          </Node>

          {/* the tools that run the process, on the wires they run */}
          <Tool x={507} y={1250} name="Fivetran" note="SAP replication" />
          <Tool x={997} y={1250} name="Notebooks" note="Fabric + Databricks" />
          <Tool x={1460} y={1186} name="Power Automate" note="monthly" />
          <Tool x={1460} y={1430} name="Power Automate" note="weekly" pk />

          <div className="wb-sticky is-y" style={{ left: 1856, top: 952, width: 220, rotate: "2deg", fontSize: 16, padding: "9px 13px", zIndex: 2 }}>
            <b>Evals</b> check every claim cites the metric store.
          </div>
          <div className="wb-elab" style={{ left: 1880, top: 1346 }}>
            owner&apos;s answer → draft
          </div>

          <div className="wb-k" style={{ position: "absolute", left: 130, top: 1748, color: "var(--ink)" }}>
            GxP guardrails
          </div>
          {GUARDRAILS.map(([t, d], i) => (
            <div key={t} className="wb-card" style={{ left: 130 + i * 610, top: 1782, width: 590, height: 158, padding: "18px 22px" }}>
              <h4 style={{ margin: 0, fontSize: 28 }}>{t}</h4>
              <p style={{ fontSize: 21 }}>{d}</p>
            </div>
          ))}
        </div>

        {/* ===== 04 BUSINESS VALUE ===== */}
        <Region r={REGION.rD} n={4} title="What it brings the business" dim={dim("rD")}>
          <div style={{ position: "absolute", left: 50, top: 66, right: 50, display: "flex", alignItems: "flex-end", gap: 30, paddingBottom: 30, borderBottom: "2px solid var(--line)" }}>
            <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.9, color: "var(--accent)" }}>85%</div>
            <div style={{ paddingBottom: 12 }}>
              <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>less manual data processing</div>
              <p style={{ fontSize: 21, lineHeight: 1.4, color: "var(--mute)", marginTop: 6, maxWidth: "32ch" }}>
                The other 15% is on purpose: it&apos;s where people review, judge and sign off.
              </p>
            </div>
          </div>
          <div style={{ position: "absolute", left: 50, right: 50, top: 318, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36 }}>
            {[
              ["Why, not what", "Time moves to root cause", "Hours went into pulling data and pasting it onto the deck.", "The deep dive arrives drafted, and the team tests and refines it."],
              ["Weekly", "Act while it's avoidable", "Misses surfaced at the monthly review, after the due date.", "Early warnings reach the named owner days before the due date."],
              ["Days → 1 run", "Meetings become a schedule", "Days of coordination and manual pulls every cycle.", "One scheduled source-to-deck run, refreshed more often."]
            ].map(([h, s, before, now]) => (
              <div key={h}>
                <div className="wb-stat"><b>{h}</b><span>{s}</span></div>
                <div className="wb-bn">
                  <b>Before</b>
                  <p>{before}</p>
                </div>
                <div className="wb-bn is-now">
                  <b>Now</b>
                  <p>{now}</p>
                </div>
              </div>
            ))}
          </div>
        </Region>

        {/* ===== 05 WHAT I PROPOSED ===== */}
        <Region r={REGION.rE} n={5} title="What I proposed next" dim={dim("rE")}>
          <div style={{ position: "absolute", left: 50, top: 60, width: 570 }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Every closed loop makes the next one smarter</div>
            <p style={{ fontSize: 20, lineHeight: 1.45, color: "var(--mute)", marginTop: 16 }}>
              Today a deviation is investigated, closed, then forgotten. If cause, owner, action and outcome are written back into one context
              layer, people and AI can ask:
            </p>
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              {[
                ["Did the CAPA work?", "Effectiveness, not just closure."],
                ["Have we seen this before?", "Similar deviations, causes and fixes."],
                ["Is it coming again?", "Recurrence spotted before the event."]
              ].map(([q, a]) => (
                <div key={q} className="wb-sticky is-b" style={{ position: "relative", fontSize: 20, padding: "14px 18px" }}>
                  <b>{q}</b> {a}
                </div>
              ))}
            </div>
          </div>
          <svg style={{ position: "absolute", left: 640, top: 50 }} width={480} height={480} viewBox="0 0 480 480" aria-hidden="true">
            <defs>
              <marker id="wb-m" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#262048" /></marker>
              <marker id="wb-mp" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f2247a" /></marker>
            </defs>
            <circle cx="240" cy="240" r="170" fill="none" stroke="#e2ded4" strokeWidth="2" />
            <path d="M295,79 A170,170 0 0 1 405,195" fill="none" stroke="#262048" strokeWidth="3" markerEnd="url(#wb-m)" />
            <path d="M403,295 A170,170 0 0 1 305,399" fill="none" stroke="#262048" strokeWidth="3" markerEnd="url(#wb-m)" />
            <path d="M175,399 A170,170 0 0 1 77,295" fill="none" stroke="#f2247a" strokeWidth="3" strokeDasharray="7 7" data-dash="7 7" markerEnd="url(#wb-mp)" />
            <path d="M75,195 A170,170 0 0 1 168,86" fill="none" stroke="#f2247a" strokeWidth="3" strokeDasharray="7 7" data-dash="7 7" markerEnd="url(#wb-mp)" />
            <g fontFamily="var(--font-mono)" fontWeight={500} fontSize={17} textAnchor="middle" letterSpacing={1}>
              <rect x="185" y="45" width="110" height="44" rx="22" fill="#262048" /><text x="240" y="73" fill="#fff">FLAG</text>
              <rect x="375" y="218" width="100" height="44" rx="22" fill="#262048" /><text x="425" y="246" fill="#fff">DECIDE</text>
              <rect x="190" y="391" width="100" height="44" rx="22" fill="#262048" /><text x="240" y="419" fill="#fff">ACT</text>
              <rect x="5" y="218" width="104" height="44" rx="22" fill="#fff" stroke="#f2247a" strokeWidth="2" strokeDasharray="5 4" /><text x="57" y="246" fill="#f2247a">REVIEW</text>
            </g>
            <circle cx="240" cy="240" r="94" fill="#ffe1ee" />
            <text x="240" y="226" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight={500} fontSize={17} fill="#f2247a" letterSpacing={1}>CONTEXT</text>
            <text x="240" y="252" textAnchor="middle" fontFamily="var(--font-body)" fontSize={16} fill="#262048">cause · owner</text>
            <text x="240" y="274" textAnchor="middle" fontFamily="var(--font-body)" fontSize={16} fill="#262048">action · outcome</text>
            <text x="305" y="36" fontFamily="var(--font-mono)" fontSize={14} fill="#77738a">well served today</text>
            <text x="20" y="462" fontFamily="var(--font-mono)" fontSize={14} fill="#f2247a">the missing half: in inboxes</text>
          </svg>
          <div style={{ position: "absolute", left: 50, right: 50, top: 560, paddingTop: 22, borderTop: "2px solid var(--line)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, fontSize: 19, lineHeight: 1.45, color: "var(--mute)" }}>
            <p><b className="wb-strong">The first step is already built.</b> When an owner answers a weekly signal, their cause and action are captured. That is the start of the loop.</p>
            <p><b className="wb-strong">What it takes:</b> an operating-model change, not another agent. Record the outcome where the work happens, and check effectiveness later.</p>
          </div>
        </Region>
        </>
      )}
    </Board>
  );
}
