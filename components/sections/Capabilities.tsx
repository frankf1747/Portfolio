"use client";

import { useRef } from "react";
import SmartText, { type SmartTextHandle } from "../SmartText";
import { scrambleText } from "@/lib/smartText";

/* §8 — capability plus the tools it is actually practised with.

   The bare eight-word list this replaced is on every portfolio and nobody
   believes any of it; the tool line is the part a reader can verify.

   TWO FACES IN ONE SLOT. At rest you see the capability; on hover the
   capability leaves and the tools take its place. The scramble carries the
   swap — not a 3D flip, because the decode is already the site's transition
   of record and a rotate would be the only keyframe-shaped move on the page.

   The reverse is a COLUMN-WRAPPED LIST, not a run of body copy. Set as a
   sentence at small size it read as leftover text under a 76rem word rather
   than as the other side of the same card: the two faces have to look like
   peers. Each tool is its own element at 24rem, and the list wraps into
   however many columns the reserved height needs.

   Tools scramble through scrambleText rather than SmartText. One engine
   instance per tool would be ~40 across the section for an effect that only
   ever plays on hover. */

const ITEMS: { t: string; tools: string[] }[] = [
  { t: "DATA ANALYTICS", tools: ["SQL", "Python", "Databricks", "Fabric", "Medallion ETL", "Semantic modeling"] },
  { t: "MACHINE LEARNING", tools: ["scikit-learn", "Random forest", "XGBoost", "Feature engineering", "Cross-validation", "Clustering"] },
  /* "Prompt engineering" left when AI ENGINEERING arrived carrying "Context
     engineering", which has largely superseded it as the term of art — one
     skill should not be claimed twice.

     "Evals" and AI ENGINEERING's "Eval loop" DO both stand, deliberately, and
     are not the duplicate they look like: this one is the graders you write
     for an agent you are building, that one is the measure-and-feed-back cycle
     that keeps a shipped agent honest. Different work, different category.
     Orchestration is what LangGraph is actually for and was missing.

     RAG left for AI ENGINEERING, which is the right side of the line: retrieval
     is about what a model is allowed to REACH, alongside MCP, not about how an
     agent is assembled. Skills took its place — packaged capabilities are how
     an agent gets built now, and that is squarely this category. */
  { t: "AGENTIC DEV", tools: ["LangGraph", "LLM APIs", "Skills", "Evals", "Orchestration"] },
  { t: "OPTIMIZATION", tools: ["Gurobi", "Integer programming", "Forecasting"] },
  { t: "EXPERIMENTATION", tools: ["A/B testing", "Causal inference", "RDD"] },
  { t: "VISUALIZATION", tools: ["Power BI", "DAX", "Tableau", "GA4"] },
  { t: "PRODUCT", tools: ["PRDs", "User flows", "Figma", "Agile"] },
  { t: "FRONTEND/BACKEND", tools: ["React", "Next.js", "APIs"] },
  { t: "PRODUCTIVITY", tools: ["Microsoft 365", "Genie Space", "Power Automate"] },
  /* Separate from AGENTIC DEV on purpose: that one is BUILDING an agent, this
     is what makes one fit to ship — how it is governed, what it is allowed to
     reach (MCP for tools, RAG for knowledge), what goes in its context, and
     how it is measured over time. MCP
     moved here from PRODUCTIVITY, where it never belonged: it is a developer
     protocol for giving models tools and context, not an office tool sitting
     next to Microsoft 365.

     "Tool use", "Guardrails" and "Tracing" were all cut. The first is table
     stakes — every API has it, so claiming it says nothing. The other two name
     products you buy rather than work you do. */
  { t: "AI ENGINEERING", tools: ["AI governance", "MCP", "RAG", "Context engineering", "Eval loop"] },
];

/* THREE ROWS, 4 / 4 / 2 — the first two filled, the last short.

   TWO CONSTRAINTS, and the second is easy to miss. The obvious one is that a
   row's items must fit the 1400rem budget. The other is that a hover PANEL is
   wider than its item and grows RIGHTWARD, so `item.left + panel.width` has to
   stay on the grid too. AI ENGINEERING has the widest panel in the set at
   433rem; sitting last in row one it started at 1068 and ran to 1536, nearly
   100rem off the screen. It is last in the list now, where row three's short
   span gives it room to open into.

   Measured at 1440: rows 1322 / 1276 / 607, and every panel's right edge
   inside 1400 — the widest is FRONTEND/BACKEND reaching 1261. */
const ROWS = [4, 4, 2];

export default function Capabilities() {
  const names = useRef<(SmartTextHandle | null)[]>([]);
  const faces = useRef<(HTMLSpanElement | null)[]>([]);

  /* Only the arriving face decodes. Scrambling the one on its way out reads
     as two things failing at once rather than one turning over. */
  const onEnter = (i: number) =>
    faces.current[i]
      ?.querySelectorAll<HTMLElement>(".caps__tool")
      .forEach((el) => scrambleText(el, { duration: 460 }));

  const onLeave = (i: number) => names.current[i]?.play({ scrambleOnly: true });

  return (
    <section className="caps" id="capabilities">
      <div className="caps__head">
        <SmartText className="small index">02 — EXPERTISE</SmartText>
        <SmartText className="small">WHAT I WORK WITH</SmartText>
      </div>

      <div className="caps__strip" role="list">
        {ROWS.map((n, r, arr) => ITEMS.slice(
          arr.slice(0, r).reduce((a, b) => a + b, 0),
          arr.slice(0, r + 1).reduce((a, b) => a + b, 0)
        )).map((row, r) => (
          /* Alternating, so the class still means something if the inset is
             ever given a rule. It has none on .caps__row today — both rows
             measured padding-left 0 — so this is currently inert here; the
             padding it implies belongs to .subjects__row. */
          <div className={`caps__row${r % 2 ? " is-inset" : ""}`} key={r}>
            {row.map((it) => {
              const i = ITEMS.indexOf(it);
              return (
                <div
                  className="caps__item"
                  role="listitem"
                  key={it.t}
                  onMouseEnter={() => onEnter(i)}
                  onMouseLeave={() => onLeave(i)}
                >
                  <SmartText as="span" className="small caps__idx">
                    {String(i + 1).padStart(2, "0")}
                  </SmartText>

                  <span className="caps__face">
                    <SmartText
                      className="h1 caps__name"
                      trigger="view"
                      pace="hover"
                      instanceRef={{
                        get current() {
                          return names.current[i] ?? null;
                        },
                        set current(v: SmartTextHandle | null) {
                          names.current[i] = v;
                        }
                      }}
                    >
                      {it.t}
                    </SmartText>

                    <span
                      className="caps__tools"
                      /* Two columns again, now that the panel sizes to its
                         content rather than to the name. The earlier spill was
                         not the column count on its own — it was two columns
                         inside a box pinned to the name width, which gave
                         PRODUCT a 46rem column for a 100rem label. With the
                         width free, two columns keep the panel short, which is
                         what keeps the row gap tight. */
                      style={{ columnCount: it.tools.length > 3 ? 2 : 1 }}
                      ref={(el) => {
                        faces.current[i] = el;
                      }}
                    >
                      {it.tools.map((x) => (
                        <span className="caps__tool" key={x}>
                          {x}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
