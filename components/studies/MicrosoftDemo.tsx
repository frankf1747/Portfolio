"use client";

import { useEffect, useState } from "react";
import { Block, Cap, Chain, Panels, Picker, Sub, useSeen } from "./kit";

/* Microsoft — from review mining to marketing intelligence (MA Team 3).
   The starting point was an Amazon-review analyzer notebook that stopped
   at "themes". The plan, with Copilot across the Microsoft stack: modular
   code, a team of narrow agents with a validator, personas that carry a
   marketing action, and a loop that ends in an assigned task.

   The review sentences are illustrative; the personas and the loop are
   from the deck. The availability example is a real finding from Frank's
   UGC Trend Analyzer, the built-out version of the same idea. */

const STAGES = ["Reviews", "Themes", "Personas", "Strategy", "Action"];

type Case = { said: string; theme: string; persona: string; action: string; check: string };
const CASES: Case[] = [
  {
    said: "Love the K-cups and the subscription, they show up every month like clockwork. Box arrived crushed, again.",
    theme: "Packaging damage (negative)",
    persona: "Convenience-driven coffee buyer",
    action: "Fix the shipping box first; keep leading with subscribe-and-save and the morning routine.",
    check: "Theme found in the source sentences, not just keywords"
  },
  {
    said: "Gluten-free and low sugar, which I wanted, but the texture is like cardboard.",
    theme: "Health vs texture trade-off",
    persona: "Health-conscious snack buyer",
    action: "Lead with ingredient transparency; test copy that sets texture expectations honestly.",
    check: "Polarity scored per sentence, so the praise and the complaint both count"
  },
  {
    said: "Impossible to find in stores, so I order five boxes at a time.",
    theme: "Availability",
    persona: "Loyal devotee",
    action: "Treat it as a distribution signal, not a defect: these reviewers rate higher, not lower.",
    check: "Real finding: “can't find it” complaints come with a 0.22★ higher rating (p = 0.03)"
  }
];

const LOOP = [
  ["DETECT", "The pipeline spots a rising negative theme"],
  ["REFRESH", "The Power BI dashboard updates itself"],
  ["SUMMARISE", "Copilot rewrites it in business language"],
  ["ALERT", "Power Automate posts to the team's Teams channel"],
  ["ASSIGN", "A task lands with marketing or product"],
  ["DRAFT", "Copilot preps the next report or slide"]
];

export default function MicrosoftDemo() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  const loop = useSeen<HTMLDivElement>();
  const [step, setStep] = useState(0);

  /* the loop walks itself once seen, one step every 1.4s */
  useEffect(() => {
    if (!loop.seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % LOOP.length), 1400);
    return () => window.clearInterval(id);
  }, [loop.seen]);

  return (
    <>
      <Block n="01" title="THE GAP" lede="The analyzer answered “what are customers saying?”, not “what should we do next?”">
        <div className="msx__stages">
          {STAGES.map((x, k) => (
            <span key={x} className={k <= 1 ? "is-done" : ""}>
              {x}
              {k === 1 && <em>the notebook stopped here</em>}
            </span>
          ))}
        </div>
        <Panels
          items={[
            ["HARD TO RERUN", "Logic spread across notebook cells; one person, one machine."],
            ["UNTRUSTED LABELS", "Overlapping categories, a bloated “other”, unstable clusters."],
            ["NO HAND-OFF", "Outputs read as data, not decisions; nothing reached a stakeholder."]
          ]}
        />
      </Block>

      <Block n="02" title="FROM REVIEW TO ACTION" lede="Pick a review. Each sentence becomes a theme, a person, and something to do about it.">
        <Picker items={CASES} i={i} onPick={setI} label="Example review" render={(x) => <>&ldquo;{x.said}&rdquo;</>} />
        <Chain
          k={i}
          widths="1fr 1fr 1.6fr 1.3fr"
          cells={[
            ["THEME", c.theme],
            ["PERSONA", c.persona],
            ["MARKETING ACTION", c.action],
            ["VALIDATION AGENT", `✓ ${c.check}`]
          ]}
        />
        <Sub>A TEAM OF NARROW AGENTS, NOT ONE GENERALIST</Sub>
        <div className="msx__agents">
          {[
            ["Data quality", "Missing values, duplicates, consistent categories"],
            ["NLP", "Keywords and clusters that hold up"],
            ["Persona", "Patterns into people"],
            ["Strategist", "Themes into campaigns"],
            ["Validator", "Every claim backed by the data"]
          ].map(([k, d], n) => (
            <div key={k} className={n === 4 ? "is-key" : ""}>
              <b>{k}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>
        <Cap>The validator is the trust-builder: it is the agent that says when an insight was hallucinated.</Cap>
      </Block>

      <Block n="03" title="THE LOOP" lede="The advantage isn't smarter analysis. It's that the insight ends as someone's task.">
        <div className="msx__loop" ref={loop.ref}>
          {LOOP.map(([k, d], n) => (
            <div key={k} className={n === step ? "is-on" : n < step ? "is-past" : ""}>
              <span className="small sbx__stepK">
                {n + 1} · {k}
              </span>
              <span>{d}</span>
            </div>
          ))}
        </div>
        <Cap>GitHub and VS Code for the code, Power BI and Power Automate for the loop, Teams and Copilot Studio for the hand-off.</Cap>
      </Block>
    </>
  );
}
