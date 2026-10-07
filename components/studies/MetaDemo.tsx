"use client";

import { useState } from "react";
import { Bars, Block, Cap, Chain, Phases, Picker, Rules, Stats, Sub } from "./kit";

/* Meta — where Meta AI belongs on Instagram. The case's own (synthetic)
   data, re-counted from the provided workbook: 192 of 2,000 Profile
   interactions are AI prompts (9.6%); the 500 prompts are 25 distinct
   questions and none is about Instagram; Reels + Feed hold 57% of time
   spent; the pre-launch Profile-AI test cut time spent 37.3% (t = −4.19).
   Frank owned the product view: which surface fits which intent, and what
   each one would cannibalize. */

const PROMPTS = [
  "Explain the process of photosynthesis.", "How can I achieve a work-life balance?", "What is the difference between machine learning and deep learning?",
  "Define artificial intelligence.", "How do I learn Python?", "What is the meaning of life?", "How to improve my public speaking skills?",
  "What are the benefits of meditation?", "Generate a random number between 1 and 100.", "What is the best way to lose weight?",
  "What is the history of the internet?", "What are some examples of renewable energy sources?", "How to learn a new language quickly?",
  "Write a short story about a lost dog.", "What are the advantages of remote work?", "List the top 10 movies of 2023.",
  "How to create a website from scratch?", "Summarize the plot of '1984' by George Orwell.", "How to troubleshoot a slow computer?",
  "Tell me a joke about programmers.", "Steps to start a small business.", "Can you explain quantum mechanics?",
  "Provide an overview of the solar system.", "Describe the process of making chocolate.", "How to fix a flat tire?"
];

type Surface = { k: string; share: number; mode: string; intent: string; ask: string; eats: string; phase: string; risk: string };
const SURFACES: Surface[] = [
  { k: "Explore", share: 15.7, mode: "Lean-forward", intent: "Discovery", ask: "“Find me accounts like this one.”", eats: "Almost nothing. It adds to browsing.", phase: "Phase 1", risk: "Low" },
  { k: "Search", share: 11.0, mode: "Lean-forward", intent: "Direct Q&A", ask: "“Best ramen near me, with photos.”", eats: "Native search clicks, and the creator traffic they send.", phase: "Phase 2", risk: "Medium" },
  { k: "Profile", share: 16.3, mode: "Identity", intent: "No context (live today)", ask: "“Explain photosynthesis.”", eats: "Nothing, but it earns nothing for Instagram either.", phase: "Baseline", risk: "Medium" },
  { k: "Feed", share: 28.1, mode: "Lean-back", intent: "Passive scrolling", ask: "Rarely asked; it interrupts the scroll.", eats: "Scroll rhythm, and the ad impressions in it.", phase: "Phase 3, gated", risk: "High" },
  { k: "Reels", share: 28.9, mode: "Lean-back", intent: "Entertainment", ask: "Almost never.", eats: "The swipe loop and the most ad revenue per minute.", phase: "Phase 3, gated", risk: "Highest" }
];

export default function MetaDemo() {
  const [i, setI] = useState(0);
  const s = SURFACES[i];

  return (
    <>
      <Block n="01" title="WHAT THE DATA SAYS" lede="Demand for the AI is real. What people ask it is the problem.">
        <Stats
          items={[
            ["9.6%", "PROFILE ACTIONS = AI"],
            ["0 / 25", "ABOUT INSTAGRAM"],
            ["−37%", "TIME SPENT, PRE-TEST"]
          ]}
        />
        <Sub>EVERY DISTINCT PROMPT IN THE SAMPLE</Sub>
        <div className="mtx__wall" aria-label="All 25 distinct prompts in the sample">
          {PROMPTS.map((p, k) => (
            <span key={p} style={{ "--k": k } as React.CSSProperties}>
              {p}
            </span>
          ))}
        </div>
        <Cap>
          500 prompts, 25 distinct questions, all ChatGPT-style. Profile gives the AI no context, so people ask it general
          knowledge. That is cost without Instagram value. Pre-launch test: n = 199 vs 153, t = −4.19, p &lt; 0.001.
        </Cap>
      </Block>

      <Block n="02" title="WHERE AI BELONGS" lede="The surface decides what people ask, so the surface decides whether the AI pays back. Pick one.">
        <Picker items={SURFACES} i={i} onPick={setI} label="Instagram surface" render={(x) => `${x.k} · ${x.mode.toLowerCase()}`} />
        <Chain
          k={i}
          widths="1fr 1.3fr 1.6fr 1fr"
          cells={[
            ["INTENT", s.intent],
            ["WHAT PEOPLE WOULD ASK", s.ask],
            ["WHAT IT CANNIBALIZES", s.eats],
            ["CALL", `${s.phase} · ${s.risk} risk`]
          ]}
        />
        <Sub>SHARE OF TIME SPENT, BY SURFACE</Sub>
        <Bars rows={SURFACES.map((x) => [x.k, x.share] as [string, number])} max={35} lead={i} cap="From the case data. Ad load is flat (~1.5%) across surfaces, so revenue risk scales with attention: the big two are where AI could cost the most." />
      </Block>

      <Block n="03" title="HOW TO SHIP IT" lede="Expand, but only as fast as the guardrails allow. Each phase runs at least two weeks.">
        <Phases
          live={0}
          items={[
            ["PHASE 1", "Explore", "Discovery intent, low risk"],
            ["PHASE 2", "Search", "Gated on Phase 1 guardrails"],
            ["PHASE 3", "Feed / Reels", "Gated on Phase 2"],
            ["PHASE 4", "Composer / DM", "The Instagram-native unlock"]
          ]}
        />
        <Cap>North star: AI-attributed Instagram actions (follow, save, post), not chat volume.</Cap>
        <Sub>THE TEST BEHIND EACH PHASE</Sub>
        <Rules
          items={[
            "User-level randomisation, hash-based layers so concurrent surface tests don't collide.",
            "1% global holdback as a long-term clean baseline.",
            "≥ 50K per arm: detects a ±41 s change in time spent (~1.6%) at 80% power.",
            "Guardrails: app time spent, core-surface engagement, ad impressions. Ship the next phase only if all hold."
          ]}
        />
      </Block>
    </>
  );
}
