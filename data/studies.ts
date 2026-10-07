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
  /** A live demo replaces the problem / solution / takeaway blocks. */
  demo?: "starbucks" | "cedars" | "doordash" | "meta" | "dell" | "apple" | "microsoft" | "american";
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
      "Say what you want in your own words; get every Starbucks drink that fits, best first. I owned the pipeline: constraint extraction, filtering and ranking.",
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
    figures: ["pipeline", "latency"],
    demo: "starbucks"
  },

  /* ---- not yet written. Source material noted per entry. ---- */
  {
    slug: "doordash",
    n: "02",
    name: "DOORDASH",
    descriptor: "CAUSAL INFERENCE — REGRESSION DISCONTINUITY",
    year: "2026",
    role: "Causal design, in a team of five",
    context: "UCLA MSBA 409 final proposal, Team 18, spring 2026.",
    brand: "#FF3008",
    topic: "PROMO EMAIL RDD",
    what:
      "What is one $5 win-back email worth? DoorDash sends it to lapsed users whose re-order score clears a cutoff, so we priced it exactly there: a fuzzy regression discontinuity that turns the estimate into a move on the cutoff.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "doordash"
  },
  {
    slug: "meta",
    n: "03",
    name: "META",
    descriptor: "PRODUCT ANALYTICS — AI ENTRY POINTS",
    year: "2026",
    role: "Product view: where AI belongs, in a team of six",
    context: "UCLA MSBA × Meta data science seminar. The case data is synthetic, provided by Meta.",
    brand: "#0064E0",
    topic: "AI ENTRY POINTS",
    what:
      "Meta AI lived on one Instagram surface. Should it spread, and where? Yes, in stages: Explore, then Search, then Feed and Reels only if the guardrails hold. I owned the product view: which surface fits which intent, and what each one would cannibalize.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "meta"
  },
  {
    slug: "dell",
    n: "04",
    name: "DELL",
    descriptor: "AGENTIC SYSTEMS — MEETING PREP",
    year: "2026",
    role: "Presentation and Q&A agents, in a team of six",
    context: "UCLA MSBA seminar, Group 4.",
    brand: "#0076CE",
    topic: "MULTI-AGENT MEETING PREP",
    what:
      "Meeting prep is research, checking, a deck and rehearsal, usually done in a hurry. We designed a five-agent team that does it, with one agent checking another and a human approving what ships. I designed the presentation and Q&A agents.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "dell"
  },
  {
    slug: "apple",
    n: "05",
    name: "APPLE",
    descriptor: "EXPERIMENTATION — WINBACK OFFERS",
    year: "2026",
    role: "The recommendation, in a team of five",
    context: "UCLA MSBA industry seminar 2026, MA Team 7. The product is anonymised in the case.",
    brand: "#0071E3",
    topic: "SUBSCRIPTION WINBACK TEST",
    what:
      "Free trial or $0.99 to win back lapsed subscribers? An A/B test on 180,000 users called it a tie. Split by how long users had been gone, it wasn't: route the offer by tenure for 10% more paying customers. I wrote the recommendation.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "apple"
  },
  {
    slug: "microsoft",
    n: "06",
    name: "MICROSOFT",
    descriptor: "PRODUCTIZATION — REVIEW MINING",
    year: "2026",
    role: "Productization plan, in a team of six",
    context: "UCLA MSBA seminar, MA Team 3.",
    brand: "#0078D4",
    topic: "REVIEW MINING TO PERSONAS",
    what:
      "A notebook that mined Amazon reviews could say what customers were saying, but not what to do. We planned its next life with Copilot: modular code, narrow agents with a validator, personas that carry an action, and a loop that ends as someone's task.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "microsoft"
  },
  {
    slug: "cedars-sinai",
    n: "07",
    name: "CEDARS-SINAI",
    descriptor: "WORKFORCE ANALYTICS — NURSE BURNOUT",
    year: "2026",
    role: "Root-cause analysis, in a team of six",
    context: "UCLA Anderson × Cedars-Sinai case, January 2026.",
    // Cedars-Sinai red (Pantone 186 C, as in their deck and wordmark).
    brand: "#C8102E",
    topic: "NURSE BURNOUT & STAFFING",
    what:
      "Annual surveys tell a hospital its nurses are burning out a year too late, and not why. We designed a weekly check-in that turns “burnout” into specific operational causes, each with an owner, a fix and a test. I led the root-cause analysis.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "cedars"
  },
  {
    slug: "american-airlines",
    n: "08",
    name: "AMERICAN",
    descriptor: "PREDICTIVE MODELING — CREW SEQUENCE RISK",
    year: "2026",
    role: "Results & impact, in a team of four",
    context: "UCLA Anderson × American Airlines case, Group 9.",
    // American Airlines blue, from the flight symbol.
    brand: "#0078D2",
    topic: "PILOT SEQUENCE RISK",
    what:
      "A pilot flies A → DFW → B, and one late leg cascades into duty-time limits and re-crewing. We scored every leg with a random forest on 2024 flight data and combined them into a sequence risk, so schedulers can buffer the risky ones before the storm. I led results and impact.",
    problem: "",
    solution: [],
    takeaway: "",
    demo: "american"
  }
];
