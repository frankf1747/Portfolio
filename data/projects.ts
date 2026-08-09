export type Project = {
  slug: string;
  index: string;
  title: string;
  year: string;
  tags: string[];
  discipline: "data" | "product" | "design";
  /** 4-colour palette fed to the gradient when this project is active */
  palette: [string, string, string, string];
  summary: string;
  role: string;
  deliverables: string;
  body: { kind: "prose" | "full" | "split"; text?: string }[];
};

export const projects: Project[] = [
  {
    slug: "starbucks-search",
    index: "01",
    title: "Starbucks search relevance",
    year: "2026",
    tags: ["Search", "Ranking", "Evaluation"],
    discipline: "data",
    palette: ["#16254b", "#23418a", "#aadfd9", "#e64f0f"],
    summary:
      "Ranking menu queries for the UCLA × Starbucks challenge — query understanding, offline evaluation, and an error taxonomy that changed where the team spent its time.",
    role: "Data analyst",
    deliverables: "Ranking model · offline eval harness · error taxonomy",
    body: [
      { kind: "prose", text: "Thousands of real customer queries, a menu that reads like a dialect, and one question: what did this person actually want? I built the query-understanding layer and the offline evaluation that let us argue about ranking changes with evidence instead of taste." },
      { kind: "full" },
      { kind: "prose", text: "The error taxonomy mattered most. Once failures had names — tokenisation misses, modifier confusion, dietary-intent blindness — the fixes prioritised themselves." },
      { kind: "split" }
    ]
  },
  {
    slug: "doordash-rdd",
    index: "02",
    title: "DoorDash regression discontinuity",
    year: "2026",
    tags: ["Causal inference", "Econometrics"],
    discipline: "data",
    palette: ["#2b0508", "#8f0d1c", "#e8455a", "#ffd9c2"],
    summary:
      "Estimating the causal effect of a delivery-fee threshold with a regression discontinuity design — identification strategy, robustness checks, honest caveats.",
    role: "Analyst",
    deliverables: "RDD analysis · robustness suite · decision memo",
    body: [
      { kind: "prose", text: "A fee threshold creates a natural experiment: consumers just above and just below the cutoff are statistically identical, except for the fee. That discontinuity identifies the causal effect of price on ordering behaviour." },
      { kind: "full" },
      { kind: "prose", text: "Most of the work was earning the right to the word 'causal': density tests at the cutoff, placebo thresholds, bandwidth sensitivity. The memo led with what we could not claim." },
      { kind: "split" }
    ]
  },
  {
    slug: "multi-agent-rag",
    index: "03",
    title: "Multi-agent RAG system",
    year: "2026",
    tags: ["AI", "Retrieval", "Product"],
    discipline: "product",
    palette: ["#1a1c0d", "#4f5a1e", "#b7c46a", "#c25a20"],
    summary:
      "A working agent pipeline — retrieval, tools, tests — built and shipped, not just diagrammed. Chroma for vectors, a test suite that keeps it honest.",
    role: "Builder / PM",
    deliverables: "Agent pipeline · vector store · test suite · report",
    body: [
      { kind: "prose", text: "Agents are easy to demo and hard to trust. This one retrieves, reasons, and calls tools — and every capability claim is backed by a test that fails when it regresses." },
      { kind: "full" },
      { kind: "prose", text: "The product decision that shaped everything: scope the agent to answer only what its corpus can support, and say so when it can't. Reliability is the feature." },
      { kind: "split" }
    ]
  },
  {
    slug: "dell-ma",
    index: "04",
    title: "Dell M&A analysis",
    year: "2025",
    tags: ["Strategy", "Valuation"],
    discipline: "product",
    palette: ["#16254b", "#23418a", "#aadfd9", "#e64f0f"],
    summary:
      "Market sizing and acquisition strategy for a live case, argued to a partner panel under questioning.",
    role: "Strategy lead",
    deliverables: "Market model · target screen · partner presentation",
    body: [
      { kind: "prose", text: "A live M&A case: size the market, screen the targets, defend the number. The model survived the panel; the strategy survived the follow-ups." },
      { kind: "full" }
    ]
  },
  {
    slug: "ai-joke-factory",
    index: "05",
    title: "AI Joke Factory",
    year: "2025",
    tags: ["UX", "Product design"],
    discipline: "design",
    palette: ["#2b0508", "#8f0d1c", "#e8455a", "#ffd9c2"],
    summary:
      "End-to-end product design — flows, backend logic, and a v2 rebuilt on what users actually said.",
    role: "Product designer",
    deliverables: "User flows · backend spec · v2 redesign",
    body: [
      { kind: "prose", text: "Designed the flows, specified the backend, shipped a v1 — then rebuilt the workflow for v2 around user notes instead of assumptions. The dashboard tracks what the jokes can't: whether people come back." },
      { kind: "full" }
    ]
  },
  {
    slug: "this-portfolio",
    index: "06",
    title: "This portfolio",
    year: "2026",
    tags: ["Design system", "WebGL"],
    discipline: "design",
    palette: ["#1a1c0d", "#4f5a1e", "#b7c46a", "#c25a20"],
    summary:
      "A structured taste-discovery workflow — specimens, falsifiable hypotheses, checkpoint probes — compiled into design tokens, then into the site you are reading.",
    role: "Designer / developer",
    deliverables: "Taste profile · design tokens · this site",
    body: [
      { kind: "prose", text: "Every visual decision here traces to a specimen ledger: references decomposed on a fixed rubric, hypotheses falsified in the open, a background that carries the palette of whichever project you're looking at." },
      { kind: "full" }
    ]
  }
];

export const disciplines = ["all", "data", "product", "design"] as const;
