"use client";

import "./clinical.scss";

import { useState } from "react";
import { progressPage } from "@/data/project-pages";
import Board, { Region, WireDefs, route, withTab, type Rect, type Stop } from "./Board";
import snapshot from "@/data/clinical-snapshot.json";

/* §13 — Clinical Trial Risk, told as one whiteboard.

   The story runs in the order the work did: the ETL first — two public
   datasets that had never been joined, landed and processed on Google
   Cloud, modelled in Snowflake, served back on Google Cloud — then what
   the joined data makes possible. The pipeline is drawn as a flow, not as
   boxes: two streams as pipes, stations along them, and the point where
   they meet.

   Every figure comes from the pipeline repo (README, model card,
   models/v6/metrics.json). The curve is the real test-set ROC, recomputed
   from the held-out scores (it reproduces the published AUC to four
   places). The trials are a FROZEN SNAPSHOT of the v6 lookup in
   data/clinical-snapshot.json; the live GCP lookup is one link away. */

const W = 4200;
const H = 2860;
const LIVE = "https://ctrisk-lookup-420431563670.us-east1.run.app";
const REPO = "https://github.com/frankf1747/clinical_trial_risk_pipeline";

const REGION: Record<string, Rect> = {
  rA: [80, 90, 4040, 520],
  rB: [80, 700, 4040, 1000],
  rC: [80, 1790, 1640, 980],
  rD: [1800, 1790, 2320, 980]
};

const STOPS: Stop[] = [
  { r: [0, 0, W, H], focus: null, n: "Overview", t: <>One project on one board. <b>Scroll</b> and I&apos;ll walk you through it in order.</> },
  { r: withTab(REGION.rA), focus: "rA", n: "01 · The point", t: <>Two public datasets that had never been joined. <b>Joined, they say which running trials are likely to stop.</b></> },
  { r: withTab(REGION.rB), focus: "rB", n: "02 · The ETL", t: <>Read left to right: <b>two streams on Google Cloud, one join, modelled in Snowflake, served back on Google Cloud.</b></> },
  { r: [100, 760, 1980, 900], focus: "rB", n: "02 · Land + Spark", t: <>FDA safety reports and the trial registry each get landed and cleaned, then <b>meet in one point-in-time join.</b></> },
  { r: [1700, 760, 1700, 900], focus: "rB", n: "02 · Snowflake", t: <>RAW → INT → FEATURES: <b>one row per trial, frozen per model version</b>, then scored.</> },
  { r: [3180, 760, 940, 900], focus: "rB", n: "02 · Serve", t: <>The scores leave as one file. <b>The app reads it and never touches the warehouse.</b></> },
  { r: withTab(REGION.rC), focus: "rC", n: "03 · Does it work?", t: <><b>71% of the time</b> it ranks a trial that was terminated above one that completed.</> },
  { r: withTab(REGION.rD), focus: "rD", n: "04 · Open these first", t: <>Every dot is a running trial. <b>Click one</b> to see why it scores where it does.</> },
  { r: [0, 0, W, H], focus: null, n: "The whole board", t: <>The join is the work; <b>the ranking is what it makes possible.</b></> }
];

/* ---------------- 02 · the ETL, drawn as a flow ---------------- */

/* the two streams and the trunk they merge into */
const FY = 1050; // FAERS stream
const RY = 1400; // registry stream
const MY = 1225; // merged trunk
const MERGE_X = 1840;

type Station = { x: number; y: number; name: string; note: string; tool?: string; below?: boolean; key?: boolean; right?: boolean };

const STATIONS: Station[] = [
  { x: 330, y: FY, name: "openFDA · FAERS", note: "Every adverse-event report, 2004–26", tool: "public" },
  { x: 760, y: FY, name: "Land", note: "24 parallel tasks into Cloud Storage", tool: "Cloud Run Job" },
  { x: 1150, y: FY, name: "Flatten", note: "One row per report × drug", tool: "PySpark" },
  { x: 1520, y: FY, name: "Match drugs", note: "Typed names → 13,707 substances", tool: "PySpark" },

  { x: 330, y: RY, name: "ClinicalTrials.gov", note: "AACT snapshot + 25 archives", tool: "public", below: true },
  { x: 760, y: RY, name: "Land", note: "As published", tool: "Cloud Storage", below: true },
  { x: 1150, y: RY, name: "Clean + label", note: "Terminated vs completed", tool: "PySpark", below: true },
  { x: 1520, y: RY, name: "Attributes + text", note: "Design, eligibility, text", tool: "PySpark", below: true },

  { x: MERGE_X, y: MY, name: "Point-in-time join", note: "As of each trial's start", tool: "PySpark", key: true, right: true },

  { x: 2260, y: MY, name: "RAW", note: "Off Cloud Storage", below: true, tool: "External stage" },
  { x: 2520, y: MY, name: "INT", note: "Safety + sponsor history", tool: "SQL" },
  { x: 2780, y: MY, name: "FEATURES", note: "One row per trial, cloned per model", below: true, tool: "Zero-copy clone" },
  { x: 3040, y: MY, name: "Score", note: "Risk + reasons", tool: "LightGBM + SHAP", key: true },
  { x: 3300, y: MY, name: "SERVING", note: "111,118 trials", below: true, tool: "Views" },

  { x: 3560, y: MY, name: "serving/", note: "One file, swapped in", tool: "COPY INTO" },
  { x: 3820, y: MY, name: "Lookup + API", note: "Any trial, by NCT ID", below: true, tool: "FastAPI · Cloud Run" }
];

/* volumes riding on the pipes, so the data visibly changes size */
const VOLUMES: { x: number; y: number; t: string; pk?: boolean }[] = [
  { x: 545, y: FY, t: "118 GB", pk: true },
  { x: 955, y: FY, t: "20.7M reports", pk: true },
  { x: 1335, y: FY, t: "73.1M rows", pk: true },
  { x: 545, y: RY, t: "605k studies" },
  { x: 955, y: RY, t: "raw tables" },
  { x: 1335, y: RY, t: "81k trials" },
  { x: 2050, y: MY, t: "Parquet" },
  { x: 2650, y: MY, t: "66k labelled" },
  { x: 3170, y: MY, t: "111k scored" }
];

const ZONES: { x0: number; x1: number; label: string; sub: string; bg: string }[] = [
  { x0: 130, x1: 560, label: "Public sources", sub: "two datasets, no shared key", bg: "#efece4" },
  { x0: 600, x1: 2110, label: "Google Cloud · land + process", sub: "Cloud Run · Cloud Storage · Dataproc Serverless", bg: "#e3e8ff" },
  { x0: 2150, x1: 3420, label: "Snowflake · model-ready data", sub: "RAW → INT → FEATURES → SERVING", bg: "#dff1f7" },
  { x0: 3460, x1: 4070, label: "Google Cloud · serve", sub: "Cloud Storage · Cloud Run", bg: "#e3e8ff" }
];

function Pipes() {
  /* the streams curve into the trunk a little before the join */
  const faers = `M${330},${FY} L${1600},${FY} C${1720},${FY} ${1720},${MY} ${MERGE_X},${MY}`;
  const reg = `M${330},${RY} L${1600},${RY} C${1720},${RY} ${1720},${MY} ${MERGE_X},${MY}`;
  const trunk = `M${MERGE_X},${MY} L${3820},${MY}`;
  /* Its own layer, drawn ABOVE the region panel: the panel's translucent
     white would otherwise wash every colour in the flow out. */
  return (
    <svg className="wb__wires" width={W} height={H} aria-hidden="true">
      {ZONES.map((z) => (
        <rect key={z.label} x={z.x0} y={812} width={z.x1 - z.x0} height={858} rx={24} fill={z.bg} />
      ))}
      <path d={faers} className="ct-pipe is-faers" />
      <path d={reg} className="ct-pipe is-reg" />
      <path d={trunk} className="ct-pipe is-trunk" />
      {/* what is flowing: dashes travelling along each pipe */}
      <path d={faers} className="ct-flow" />
      <path d={reg} className="ct-flow" />
      <path d={trunk} className="ct-flow" />
    </svg>
  );
}

/* the reading path between regions, under everything */
function Routes() {
  return (
    <svg className="wb__wires" width={W} height={H} aria-hidden="true">
      <WireDefs />
      {route("M2100,610 L2100,692")}
      {route("M900,1700 L900,1782")}
      {route("M1720,2220 L1792,2220")}
    </svg>
  );
}

function Etl() {
  return (
    <>
      <Pipes />
      {ZONES.map((z) => (
        <div key={z.label} className="ct-zone" style={{ left: z.x0 + 24, top: 1578 }}>
          <b>{z.label}</b>
          <span>{z.sub}</span>
        </div>
      ))}
      {VOLUMES.map((v) => (
        <span key={`${v.x},${v.y}`} className={`ct-vol${v.pk ? " is-pk" : ""}`} style={{ left: v.x, top: v.y }}>
          {v.t}
        </span>
      ))}
      {STATIONS.map((s) => (
        <div key={`${s.x},${s.y}`}>
          <i className={`ct-stop${s.key ? " is-key" : ""}`} style={{ left: s.x, top: s.y }} />
          <div className={`ct-label${s.below ? " is-below" : ""}${s.right ? " is-right" : ""}${s.key ? " is-key" : ""}`} style={{ left: s.x, top: s.y }}>
            {s.tool && <span className="ct-tool">{s.tool}</span>}
            <b>{s.name}</b>
            <span>{s.note}</span>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------- 03 · the ROC curve ---------------- */

function Roc() {
  const S = 620; // plot size
  const P = (x: number, y: number) => `${(x * S).toFixed(1)},${((1 - y) * S).toFixed(1)}`;
  const curve = snapshot.roc.map(([x, y]) => P(x, y)).join(" L");
  const t10 = snapshot.test.top10;
  return (
    <svg className="ct-chart" viewBox={`-90 -30 ${S + 130} ${S + 120}`} width={S + 130} height={S + 120} aria-label="ROC curve, AUC 0.710">
      <rect x={0} y={0} width={S} height={S} className="ct-plot" />
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g}>
          <line x1={g * S} y1={0} x2={g * S} y2={S} className="ct-grid" />
          <line x1={0} y1={(1 - g) * S} x2={S} y2={(1 - g) * S} className="ct-grid" />
        </g>
      ))}
      {/* the area under the curve, then the curve */}
      <path d={`M${P(0, 0)} L${curve} L${P(1, 0)} Z`} className="ct-area" />
      <line x1={0} y1={S} x2={S} y2={0} className="ct-chance" />
      <path d={`M${curve}`} className="ct-curve" />
      <text x={S * 0.62} y={S * 0.47} className="ct-chanceT" transform={`rotate(-45 ${S * 0.62} ${S * 0.47})`}>
        coin flip · 0.50
      </text>
      <text x={S * 0.66} y={S * 0.7} className="ct-aucT">AUC 0.710</text>

      {/* the operating point a reviewer would use */}
      <circle cx={t10.fpr * S} cy={(1 - t10.tpr) * S} r={9} className="ct-pt" />
      <line x1={t10.fpr * S + 12} y1={(1 - t10.tpr) * S + 4} x2={S * 0.16} y2={S * 0.83} className="ct-lead" />
      <text x={S * 0.17} y={S * 0.84} className="ct-ptT">
        <tspan x={S * 0.17}>Review the top 10%:</tspan>
        <tspan x={S * 0.17} dy={28}>
          catches {Math.round(t10.tpr * 100)}% of terminations
        </tspan>
      </text>

      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <text x={v * S} y={S + 28} className="ct-tick" textAnchor="middle">
            {v * 100}%
          </text>
          <text x={-14} y={(1 - v) * S + 6} className="ct-tick" textAnchor="end">
            {v * 100}%
          </text>
        </g>
      ))}
      <text x={S / 2} y={S + 66} className="ct-axis" textAnchor="middle">
        Completed trials wrongly flagged
      </text>
      <text x={-S / 2} y={-62} className="ct-axis" textAnchor="middle" transform="rotate(-90)">
        Terminated trials caught
      </text>
    </svg>
  );
}

/* ---------------- 04 · the trials, on two axes ---------------- */

type Trial = (typeof snapshot.trials)[number];
const TRIALS: Trial[] = [...snapshot.trials].sort((a, b) => b.risk - a.risk);

const STATUS: Record<string, string> = {
  RECRUITING: "Recruiting",
  ACTIVE_NOT_RECRUITING: "Active, not recruiting",
  NOT_YET_RECRUITING: "Not yet recruiting",
  ENROLLING_BY_INVITATION: "Enrolling by invitation"
};

const reason = (t: string) =>
  t.replace(/\s*\((raises|lowers) risk\)\s*$/, "").replace("Wording of the registration (title, summary, criteria)", "Registration wording");

/* axes: overall termination risk across, enrolment-failure risk up */
const XMAX = 0.6;
const YMAX = 0.5;
const PW = 1140;
const PH = 660;
const X_CUT = 0.254; // 90th percentile of active trials, overall
const Y_CUT = 0.12; // 90th percentile, enrolment

function Trials() {
  const [sel, setSel] = useState(0);
  const t = TRIALS[sel];
  const px = (v: number) => (v / XMAX) * PW;
  const py = (v: number) => PH - (v / YMAX) * PH;
  const maxC = Math.max(...t.reasons.map((r) => Math.abs(r.c)));

  return (
    <div className="ct-trials">
      <svg className="ct-chart" viewBox={`-90 -20 ${PW + 120} ${PH + 110}`} width={PW + 120} height={PH + 110}>
        <rect x={0} y={0} width={PW} height={PH} className="ct-plot" />
        {/* the review zone: top 10% on either score */}
        <rect x={px(X_CUT)} y={0} width={PW - px(X_CUT)} height={PH} className="ct-zoneR" />
        <line x1={px(X_CUT)} y1={0} x2={px(X_CUT)} y2={PH} className="ct-cut" />
        <line x1={0} y1={py(Y_CUT)} x2={PW} y2={py(Y_CUT)} className="ct-cut" />
        <text x={px(X_CUT) + 16} y={30} className="ct-q is-pk">
          OPEN FIRST · TOP 10% RISK
        </text>
        <text x={PW - 16} y={py(Y_CUT) - 14} className="ct-q" textAnchor="end">
          ↑ likely to stall on recruitment
        </text>
        <text x={PW - 16} y={py(Y_CUT) + 30} className="ct-q" textAnchor="end">
          ↓ at risk for other reasons
        </text>

        {snapshot.cloud.map(([x, y], i) => (
          <circle key={i} cx={px(x)} cy={py(y)} r={4.5} className="ct-dot" />
        ))}
        {TRIALS.map((x, i) => (
          <g key={x.id} className={`ct-trial${i === sel ? " is-on" : ""}`} onClick={() => setSel(i)}>
            <circle cx={px(x.risk)} cy={py(x.enroll)} r={i === sel ? 20 : 15} />
            <text x={px(x.risk)} y={py(x.enroll) + 6} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}

        {[0, 0.2, 0.4, 0.6].map((v) => (
          <text key={v} x={px(v)} y={PH + 30} className="ct-tick" textAnchor="middle">
            {Math.round(v * 100)}%
          </text>
        ))}
        {[0, 0.25, 0.5].map((v) => (
          <text key={v} x={-14} y={py(v) + 6} className="ct-tick" textAnchor="end">
            {Math.round(v * 100)}%
          </text>
        ))}
        <text x={PW / 2} y={PH + 72} className="ct-axis" textAnchor="middle">
          Chance the trial ends terminated, any reason →
        </text>
        <text x={-PH / 2} y={-62} className="ct-axis" textAnchor="middle" transform="rotate(-90)">
          Chance it stops for low enrolment →
        </text>
      </svg>

      <div className="ct-why">
        <div className="wb-k is-pk">
          #{sel + 1} · {t.id} · Phase {t.phase} · {STATUS[t.status] ?? t.status}
        </div>
        <h4>{t.title}</h4>
        <p className="ct-sponsor">
          {t.sponsor} · started {t.start}
        </p>
        <div className="ct-scores">
          <div>
            <b>{Math.round(t.risk * 100)}%</b>
            <span>terminated, any reason</span>
          </div>
          <div>
            <b>{Math.round(t.enroll * 100)}%</b>
            <span>stops for low enrolment</span>
          </div>
          <div>
            <b>{t.pct >= 99.95 ? "Top 0.1%" : `P${Math.round(t.pct)}`}</b>
            <span>of {snapshot.scored.toLocaleString()} running trials</span>
          </div>
        </div>
        <div className="wb-k" style={{ marginTop: 26 }}>
          Why it scores here
        </div>
        <div className="ct-reasons">
          {t.reasons.map((r) => (
            <div key={r.t} className={r.c > 0 ? "is-up" : "is-down"}>
              <span className="ct-rl">{reason(r.t)}</span>
              <span className="ct-bar">
                <i style={{ width: `${(Math.abs(r.c) / maxC) * 50}%` }} />
              </span>
              <span className="ct-dir">{r.c > 0 ? "raises" : "lowers"}</span>
            </div>
          ))}
        </div>
        <p className="ct-note">Reasons explain the score, not why a trial would stop. Snapshot of model v6, {snapshot.asOf}.</p>
      </div>
    </div>
  );
}

/* ---------------- the board ---------------- */

export default function ClinicalBoard() {
  return (
    <Board
      size={[W, H]}
      regions={REGION}
      stops={STOPS}
      crumb="CLINICAL TRIAL RISK"
      links={[
        { label: "Code", href: REPO },
        { label: "Live lookup", href: LIVE },
        { label: "Progress", href: progressPage("clinical-trial-risk") }
      ]}
      after={
        <>
          <div>
            <h3>Stack</h3>
            <p>
              Google Cloud: Cloud Run Jobs, Cloud Storage, Dataproc Serverless (PySpark), Cloud Run. Snowflake: external stages, SQL layers,
              zero-copy clones. LightGBM · SHAP · FastAPI · GitHub Actions
            </p>
          </div>
          <div>
            <h3>A note on what&apos;s shown</h3>
            <p>
              The trials are a frozen snapshot of the v6 lookup published {snapshot.asOf}. The{" "}
              <a className="link-a" href={LIVE} target="_blank" rel="noreferrer noopener">
                live lookup ↗
              </a>{" "}
              searches all {snapshot.total.toLocaleString()} trials; the{" "}
              <a className="link-a" href={REPO} target="_blank" rel="noreferrer noopener">
                code ↗
              </a>{" "}
              is public.
            </p>
          </div>
        </>
      }
    >
      {(dim) => (
        <>
          <Routes />

          {/* ===== 01 THE POINT ===== */}
          <Region r={REGION.rA} n={1} title="The point" dim={dim("rA")}>
            <div style={{ position: "absolute", left: 56, top: 56, width: 1820 }}>
              <div className="wb-k is-pk">Clinical Trial Risk · independent project · 2026</div>
              <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, marginTop: 18 }}>Open the riskiest trial first</div>
              <p className="ct-lede">
                The trial registry and the FDA&apos;s adverse-event reports had never been joined. I built the ETL that joins them, on{" "}
                <b>Google Cloud and Snowflake</b>. The joined data scores every running drug trial for its <b>risk of stopping early</b>, with a
                reason.
              </p>
            </div>
            <div className="ct-msgs">
              {[
                ["The ETL", "118 GB of FDA safety reports (20.7M of them) and 605k registry records, joined into one row per trial."],
                ["The check", "It ranks a terminated trial above a completed one 71% of the time, on trials it never saw."],
                ["The use", "Reviewing its top 10% finds terminations at 2.1× the rate of picking at random."]
              ].map(([k, p], i) => (
                <div key={k} className="ct-msg">
                  <span>{i + 1}</span>
                  <div>
                    <b>{k}</b>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </div>
          </Region>

          {/* ===== 02 THE ETL ===== */}
          <Region r={REGION.rB} n={2} title="The ETL · Google Cloud + Snowflake" dim={dim("rB")}>
            <p className="ct-head">Two streams that had never met, joined as of the day each trial started.</p>
          </Region>
          <div className={`wb-flow${dim("rB") ? " wb-dim" : ""}`}>
            <Etl />
          </div>

          {/* ===== 03 DOES IT WORK ===== */}
          <Region r={REGION.rC} n={3} title="Does it work?" dim={dim("rC")}>
            <p className="ct-head" style={{ right: 56 }}>Right 71% of the time, on trials it never saw.</p>
            <div style={{ position: "absolute", left: 40, top: 200 }}>
              <Roc />
            </div>
            <div className="ct-explain">
              {[
                ["What the curve shows", "Slide down the ranking: each step catches more terminated trials (up) at the cost of flagging more that completed (across). The more the curve bows up-left, the better."],
                ["AUC, in plain words", "Pick one trial that was terminated and one that completed. 71% of the time the model scores the terminated one higher. A coin flip gets 50%."],
                ["Tested honestly", "Trained on trials started 2008–14; tested on 10,242 from 2015–16. A model that scored 0.714 was rejected because four of its fields leaked the outcome."]
              ].map(([h, p]) => (
                <div key={h}>
                  <b>{h}</b>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </Region>

          {/* ===== 04 OPEN THESE FIRST ===== */}
          <Region r={REGION.rD} n={4} title="Open these first" dim={dim("rD")}>
            <p className="ct-head" style={{ right: 56 }}>
              Most running trials sit low and left. The ones to open first stand out.
            </p>
            <div style={{ position: "absolute", left: 40, top: 200, right: 40 }}>
              <Trials />
            </div>
          </Region>
        </>
      )}
    </Board>
  );
}
