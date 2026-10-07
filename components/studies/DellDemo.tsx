"use client";

import { useEffect, useState } from "react";
import { Block, Cap, Panels, Picker, Rules, Sub, useSeen } from "./kit";

/* Dell — a meeting-prep assistant as a team of agents (Group 4). A
   facilitator scopes the meeting, one researcher gathers and a second
   checks it, a presentation agent builds the deck and a Q&A agent
   rehearses the hard questions; a human approves what ships. Frank
   designed agents 4 and 5 (presentation, Q&A).

   The meetings and every agent output below are illustrative, written to
   show the hand-offs; the roles and the review structure are the team's. */

type Run = {
  meeting: string;
  goal: string;
  research: string[];
  flag: string;
  deck: string[];
  qa: [string, string][];
};

const RUNS: Run[] = [
  {
    meeting: "Quarterly review with a key enterprise account",
    goal: "Renew the fleet contract; surface the upgrade path before a competitor does.",
    research: ["Their headcount grew 18% this year", "Two support escalations last quarter", "Fleet hits end-of-warranty in Q3"],
    flag: "“Headcount +18%” comes from one press release. Confirm before it goes on a slide.",
    deck: ["Where you are: fleet, usage, costs", "What changed this year", "The upgrade path, priced", "Support: what went wrong, what we fixed", "Decision and next steps"],
    qa: [
      ["Why now, not next fiscal year?", "slide 3"],
      ["What did you do about the escalations?", "slide 4"],
      ["Can you match a competitor's price?", "not in the deck: prepared answer"]
    ]
  },
  {
    meeting: "Pitch a PC refresh to a hospital's IT director",
    goal: "Get a pilot of 200 devices approved for the ward stations.",
    research: ["Clinicians log in 60+ times a shift", "Security audit is due in spring", "Budget cycle closes in 6 weeks"],
    flag: "The login count is an industry figure, not this hospital's. Label it that way.",
    deck: ["The cost of a slow login, per shift", "Security: what the audit will ask", "The 200-device pilot", "Rollout without downtime", "What we need from you"],
    qa: [
      ["How do you handle patient-data security?", "slide 2"],
      ["What if the pilot disrupts a ward?", "slide 4"],
      ["Who supports it at 3 a.m.?", "not in the deck: prepared answer"]
    ]
  },
  {
    meeting: "Kick-off with a new component supplier",
    goal: "Agree lead times, quality checkpoints and who escalates what.",
    research: ["Their on-time rate last year", "One recall in the category in 2024", "Shared tooling with an existing vendor"],
    flag: "The recall belongs to a different supplier in the same category. Don't attribute it.",
    deck: ["What we're building together", "Lead times and buffers", "Quality checkpoints", "Escalation map", "First 90 days"],
    qa: [
      ["What happens if a batch fails inspection?", "slide 3"],
      ["Who owns a delay on our side?", "slide 4"],
      ["Can lead times flex in peak season?", "not in the deck: prepared answer"]
    ]
  }
];

const AGENTS = [
  ["FACILITATOR", "Sets the goal, scope and who does what"],
  ["RESEARCHER A", "Gathers the briefing"],
  ["RESEARCHER B", "Checks A's claims, flags weak evidence"],
  ["PRESENTATION", "Turns the brief into the deck"],
  ["Q&A COACH", "Rehearses the questions you'll get"],
  ["HUMAN", "Approves what ships"]
];

export default function DellDemo() {
  const [i, setI] = useState(0);
  const r = RUNS[i];
  const run = useSeen<HTMLDivElement>(0.2);
  const [shown, setShown] = useState(0);

  /* each agent hands off to the next, one every 0.7s */
  useEffect(() => {
    if (!run.seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(AGENTS.length);
    setShown(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= AGENTS.length) window.clearInterval(id);
    }, 700);
    return () => window.clearInterval(id);
  }, [run.seen, i]);

  const out: React.ReactNode[] = [
    r.goal,
    <ul key="r">{r.research.map((x) => <li key={x}>{x}</li>)}</ul>,
    <span key="f" className="dlx__flag">⚑ {r.flag}</span>,
    <ol key="d">{r.deck.map((x) => <li key={x}>{x}</li>)}</ol>,
    <ul key="q">{r.qa.map(([q, a]) => <li key={q}>{q} <em>→ {a}</em></li>)}</ul>,
    "✓ Approved for the meeting"
  ];

  return (
    <>
      <Block n="01" title="THE PROBLEM" lede="Most meetings are prepared badly, not because people don't care, but because prep is four jobs done in a hurry.">
        <Panels
          items={[
            ["TOO MANY", "Back-to-back calendars leave no time to prepare."],
            ["NO CONTEXT", "Who's in the room, what they want, what happened last time."],
            ["NO STRUCTURE", "Agendas that don't lead to a decision."],
            ["NO REHEARSAL", "The hard question arrives live, unanswered."]
          ]}
        />
      </Block>

      <Block n="02" title="THE TEAM AT WORK" lede="Pick a meeting. Five agents prepare it in sequence, and a human signs off.">
        <Picker items={RUNS} i={i} onPick={setI} label="Example meeting" render={(x) => x.meeting} />
        <div className="dlx__run" ref={run.ref} key={i}>
          {AGENTS.map(([k, d], n) => (
            <div key={k} className={`dlx__step${n < shown ? " is-in" : ""}${n === 3 || n === 4 ? " is-mine" : ""}${n === 2 ? " is-check" : ""}`}>
              <div className="dlx__who">
                <span className="small sbx__stepK">
                  {n + 1} · {k}
                </span>
                <span className="dlx__role">{d}</span>
              </div>
              <div className="dlx__out">{out[n]}</div>
            </div>
          ))}
        </div>
        <Cap>Illustrative run. Highlighted: the presentation and Q&amp;A agents, my part of the design.</Cap>
      </Block>

      <Block n="03" title="WHY FIVE AGENTS, NOT ONE" lede="Splitting the work is what makes the output trustworthy.">
        <Panels
          items={[
            ["GENERATE ≠ VALIDATE", "One agent researches, a second checks it. Nobody grades their own work."],
            ["SPECIALISTS", "A deck and a rehearsal need different reasoning than research does."],
            ["A HUMAN GATE", "Nothing reaches the meeting without a person approving it."]
          ]}
        />
        <Sub>GUARDRAILS</Sub>
        <Rules
          items={[
            "Confidential meeting material stays in the company's own workspace.",
            "Every claim on a slide traces to a source the validator checked.",
            "Scope control: the facilitator refuses work outside the meeting's goal.",
            "Bias review on what the research leaves out, not just what it says."
          ]}
        />
      </Block>
    </>
  );
}
