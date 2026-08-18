/* §12 STUDIES — the case work.
   Projects (§9) is what Frank built. Studies is what he took apart.

   Each study opens in a scrim overlay as a one-page report: four blocks,
   plus optional stats and a figure. The figure is a DIAGRAM, not a chart —
   it carries no scale and no invented numbers. Anything numeric lives in
   `stats`, and every value there must be traceable to source material in
   project_raw/. */

export type StudyFigure = "pipeline" | "latency";

export type Study = {
  slug: string;
  n: string;
  /** Strip label. Short — this sets at .h1 in a horizontal scroller. */
  name: string;
  descriptor: string;
  year: string;
  role: string;
  /** Where the analysis came from, shown under the title in the report. */
  context: string;
  /** The subject company's own colour. Drives the logo chip and the name.
      §2 says one ground and one mark per viewport, never three — this is a
      deliberate exception, on the same principle as the per-project palette
      in data/projects.ts. */
  brand: string;
  /** Logo art, shown beside the title INSIDE the study window. The slot is
      reserved and sized whether or not this is set. Deliberately not on the
      homepage strip: seven marks out there is a logo wall. */
  logo?: string;
  /** 2 to 4 words. Sits under the name in the strip and is the only thing a
      reader gets before opening, so it has to carry the case. */
  topic: string;
  /** Unwritten studies render the card but open a stub. */
  draft?: boolean;
  what: string;
  problem: string;
  solution: string[];
  takeaway: string;
  stats?: { value: string; label: string }[];
  figures?: StudyFigure[];
};

const DRAFT_COPY = "This one has not been written up yet. The source material is in hand; the report follows.";

export const studies: Study[] = [
  {
    slug: "starbucks",
    n: "01",
    name: "STARBUCKS",
    descriptor: "PRODUCT RECOMMENDATION — RANKING",
    year: "2026",
    role: "Pipeline: extraction, filtering, ranking",
    context: "UCLA Starbucks Data Challenge, January 2026.",
    brand: "#00704A",
    topic: "CONSTRAINED PRODUCT SEARCH",
    what:
      "Take a customer's sentence, return every Starbucks product that fits it, ranked best first. I owned the pipeline: constraint extraction, filtering, and ranking.",
    problem:
      "People don't order in fields. They say “trying to be healthy, got some cold brew that's under $4.0 and strong?” That one sentence carries a category, a price ceiling, a caffeine preference and a health intent, none of them labelled. The catalog on the other side is 115 products with clean structured attributes. The gap between those two things is the entire problem, and the 100 test queries arrive with every constraint column empty.",
    solution: [
      "Extraction. Llama 3.1 70B through Groq, prompted as an information extraction system: a fixed JSON schema, values restricted to a controlled vocabulary, JSON only, and few-shot examples for the ambiguous cases.",
      "Filtering. Deterministic and boring on purpose. Every extracted constraint maps to one column predicate on the product table, which takes 115 products down to a candidate set of 5 to 20.",
      "Ranking. TF-IDF over product name, description and attributes, scored by cosine similarity against the query. We chose this over an LLM re-rank deliberately: it is fast, it is interpretable, and it costs nothing per query."
    ],
    takeaway:
      "NDCG@5 of 0.936 and NDCG@10 of 0.932 on the training set. The more useful result was where the time goes. Filtering and ranking are effectively free, and latency is almost entirely the single LLM extraction call, which points the next three moves at the front of the pipeline rather than at better ranking: cache common queries to skip the model, distil extraction into a small fine-tuned one, and move the vectors into a real store once the catalog outgrows 115 items.",
    stats: [
      { value: "0.936", label: "NDCG@5" },
      { value: "0.932", label: "NDCG@10" },
      { value: "115", label: "PRODUCTS" },
      { value: "100", label: "TEST QUERIES" }
    ],
    figures: ["pipeline", "latency"]
  },

  /* ---- not yet written. Source material noted per entry. ---- */
  {
    slug: "doordash",
    n: "02",
    name: "DOORDASH",
    descriptor: "CAUSAL INFERENCE — RDD",
    year: "2026",
    role: "Analyst",
    context: "Source: DoorDash_RDD.pptx and RDD_Overview_DoorDash.docx",
    brand: "#FF3008",
    topic: "FEE THRESHOLD RDD",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  },
  {
    slug: "meta",
    n: "03",
    name: "META",
    descriptor: "AI ENTRY POINTS — STRATEGY",
    year: "2026",
    role: "Analyst",
    context: "Source: UCLA MSBA Seminar Meta deck, script and data",
    brand: "#0064E0",
    topic: "AI ENTRY POINTS",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  },
  {
    slug: "dell",
    n: "04",
    name: "DELL",
    descriptor: "AGENTIC SYSTEMS — MEETING PREP",
    year: "2026",
    role: "Analyst",
    context: "UCLA MSBA seminar, Group 4. A project-manager agent coordinating expert worker agents for research, deck building and role-play Q&A.",
    brand: "#0076CE",
    topic: "MULTI-AGENT MEETING PREP",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  },
  {
    slug: "apple",
    n: "05",
    name: "APPLE",
    descriptor: "EXPERIMENTATION — WINBACK OFFERS",
    year: "2026",
    role: "Analyst",
    context: "UCLA MSBA industry seminar, MA Team 7. An A/B test on winback offers across 180,000 returning subscribers.",
    brand: "#1D1D1F",
    topic: "SUBSCRIPTION WINBACK TEST",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  },
  {
    slug: "microsoft",
    n: "06",
    name: "MICROSOFT",
    descriptor: "PRODUCTIZATION — REVIEW MINING",
    year: "2026",
    role: "Analyst",
    context: "UCLA MSBA seminar, MA Team 3. Turning a notebook-based Amazon review analyzer into a marketing intelligence system.",
    brand: "#0078D4",
    topic: "REVIEW MINING TO PERSONAS",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  },
  {
    slug: "cedar",
    n: "07",
    name: "CEDAR",
    descriptor: "WORKFORCE ANALYTICS — STAFFING",
    year: "2026",
    role: "Analyst",
    context: "Nurse attrition and burnout, and an AI staffing and demand-forecasting response. Subject is almost certainly Cedars-Sinai; confirm before launch.",
    brand: "#3B5F5A",
    topic: "NURSE BURNOUT & STAFFING",
    draft: true,
    what: DRAFT_COPY,
    problem: "",
    solution: [],
    takeaway: ""
  }
];
