/* §13 WORKS — the experience pages behind the §9 project cards.

   A card is one frame on the wall; a work page is the whole engagement, and
   at BioMarin that is several projects rather than one. So the page is built
   as an EXPERIENCE: a thesis at the top for the reader who gives it fifteen
   seconds, then the pieces underneath for the one who does not.

   The pieces are a STACK, not a list. Each is the precondition for the next,
   which is why the page draws them as a triangle: remove the base and
   everything above it falls over. Ordered bottom-up in this array, the way
   they were built and the way the shape reads. */

export type Piece = {
  n: string;
  /** A few words, imperative. Sets at display size. */
  title: string;
  /** One sentence. This is the whole piece — there is no long form. */
  body: string;
  /** CONCEPTS and methods, not a tool inventory — the tools are named once in
      the page header. Three or four, each one a thing that was decided. */
  tools: string[];
};

export type Work = {
  slug: string;
  n: string;
  client: string;
  /** Logo art for the header. Lives in public/logos. */
  logo: string;
  /** The page's TITLE — an article title, not a job title. What the work is
      about, in a few words. The org name is a credential, not a headline, so
      it sits in the small line above with the role.

      One string per LINE. The break is a typographic decision, not something
      to leave to the measure: a short kicker over a long line puts the mass
      at the bottom, which is what makes a display title feel seated instead
      of top-heavy. Left to wrap on its own this one broke the other way —
      a full line over a single orphaned word. */
  descriptor: string[];
  role: string;
  dates: string;
  brand: string;
  /** The line the page is built on. Memorable before it is explanatory. */
  thesis: string;
  /** One line under the thesis. Says why it mattered, not what was done. */
  subThesis: string;
  /** Spec-sheet rows. One string per LINE — the values stack rather than
      running together, so nothing ever breaks mid-item. */
  facts: { label: string; value: string[] }[];
  pieces: Piece[];
  /** The so-what. Last thing on the page before the exit. */
  takeaway: string;
};

export const works: Work[] = [
  {
    slug: "biomarin",
    n: "01",
    client: "BIOMARIN",
    logo: "/logos/biomarin.svg",
    descriptor: ["END-TO-END BIOTECH", "SUPPLY CHAIN INTELLIGENCE"],
    role: "DATA ANALYTICS INTERN \u00b7 GLOBAL EXTERNAL MANUFACTURING",
    dates: "2606 — PRESENT",
    brand: "#262048",

    /* The problem is FRAGMENTATION ACROSS SYSTEMS OF RECORD, and naming the
       systems is the whole case for the build: SAP is authoritative over the
       transaction, QMS over the quality record, and neither is authoritative
       over the batch — so the end-to-end view has to be assembled by hand,
       late, unreconciled, and computed differently by every function that
       needs it. The rest is context that never lands in a system at all,
       which is §02's problem, not a third source.

       The thesis claims the VALUE, not the problem. A reader who gives this
       page fifteen seconds should leave holding what the work is worth, and
       fragmentation is the setup for that, not the point of it — so the
       systems drop to the line underneath, and are named for real one row
       further down in SCOPE. Plain language up top, credentials in the spec
       sheet, and nothing lost either way.

       A layer EXPLAINS what happened; it does not predict. The forward look
       is a consequence, not a claim: once history is structured and cycle
       times are defined, a deviation is measurable against an expectation
       early. In biologics, where lead times run 12 to 18 months, that
       margin is the entire business case.

       Three consumers, one model — leadership, planning, agents. That is
       the frame the page is written to. */
    thesis:
      "Visibility that arrives in time to change the outcome — not to explain it.",
    subThesis:
      "Order in one system, quality in another, the context in comment fields nobody reads. I built the model that unifies them — for leadership, planning, and agents.",

    facts: [
      { label: "SCOPE", value: ["SAP \u00b7 QMS", "8 commercial products, end to end"] },
      {
        label: "TOOLS",
        value: ["Databricks \u00b7 Fabric \u00b7 SQL", "Power BI \u00b7 Power Automate \u00b7 Genie"]
      },
      {
        label: "SHIPPED",
        value: ["Supply chain control tower", "AI-queryable data product"]
      }
    ],

    pieces: [
      {
        n: "01",
        title: "BUILD THE FOUNDATION",
        body:
          "Reporting was assembled by hand from exports — late, and reconciled to nothing. I built the gold layer straight off SAP and QMS, so one governed set of tables now feeds everything downstream.",
        tools: ["DIRECT-FROM-SOURCE INGESTION", "MEDALLION ARCHITECTURE", "BATCH-LEVEL GRAIN"]
      },
      {
        n: "02",
        title: "DRAW THE CONNECTIONS",
        body:
          "Tables record a transfer; they do not explain one. That sits in free-text comments, in whatever words the writer chose, read by nobody. I gave it a shared vocabulary — entities, states, owners.",
        tools: ["DOMAIN ONTOLOGY", "GOVERNED DEFINITIONS", "STATE & OWNERSHIP MODEL"]
      },
      {
        n: "03",
        title: "DRIVE THE DECISION",
        body:
          "One model, three consumers. A tiered view for leadership, cycle-time and exception management for planning, and structure enough for Power Automate to route a breach to the owner the model already knows.",
        tools: ["TIERED EXECUTIVE VIEW", "EXCEPTION MANAGEMENT", "AUTOMATED ROUTING"]
      }
    ],

    takeaway:
      "In biologics, a slip caught late cannot be recovered. All of this exists to surface it earlier."
  }
];

export const getWork = (slug: string) => works.find((w) => w.slug === slug);
