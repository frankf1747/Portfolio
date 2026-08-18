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
  { t: "DATA ANALYTICS", tools: ["SQL", "Python", "Databricks", "Fabric", "Snowflake", "Spark", "Medallion ETL", "Semantic modeling"] },
  { t: "AGENTIC DEV", tools: ["LangGraph", "LLM APIs", "RAG", "Evals", "Prompt engineering"] },
  { t: "EXPERIMENTATION", tools: ["A/B testing", "Causal inference", "RDD"] },
  { t: "OPTIMIZATION", tools: ["Gurobi", "Integer programming", "Forecasting"] },
  { t: "VISUALIZATION", tools: ["Power BI", "DAX", "Tableau", "GA4"] },
  { t: "PRODUCT", tools: ["PRDs", "User flows", "Figma", "Agile"] },
  { t: "FRONTEND/BACKEND", tools: ["React", "Next.js", "APIs"] },
  { t: "PRODUCTIVITY", tools: ["Microsoft 365", "Genie Space", "MCP", "Power Automate"] }
];

const SPLIT = 4;

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
        {[ITEMS.slice(0, SPLIT), ITEMS.slice(SPLIT)].map((row, r) => (
          <div className={`caps__row${r ? " is-inset" : ""}`} key={r}>
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
                      /* Balanced columns. Filling one column to a height cap
                         left AGENTIC DEV as four items and then a lonely
                         fifth — the weight sat all on one side. */
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
