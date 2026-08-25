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

    /* ONE ARGUMENT IN THREE MOVES, and the subThesis announces all three
       before the reader climbs them: a record that REPRODUCES, definitions
       that AGREE, a route that REACHES the person who can act.

       Each piece owns exactly one of those verbs and nothing else. That
       constraint is load-bearing, because the draft before this one had
       §02 and §03 collapsing into each other: both claimed "cause", both
       claimed a single governed version. Joining cause to movement is
       connection work, so §02 owns cause outright; §03 owns the DECISION
       LATENCY that was the actual brief, which nothing else touches.

       The thesis claims the VALUE, not the problem. A reader who gives this
       page fifteen seconds should leave holding what the work is worth, so
       the systems are named one row down in SCOPE rather than up here.
       Plain language above, credentials in the spec sheet.

       THE FINDING SITS IN THE SUBTHESIS, not in §03. It is a CONSEQUENCE of
       the first two layers rather than the summit of them: the blended
       metric only surfaced because the record reproduced and because the
       definitions were interrogated. Placing it at the apex confused what
       was found with what the work now enables, and told the same story
       twice on a page with room for it once.

       A layer EXPLAINS what happened; it does not predict. The forward look
       is a consequence, not a claim: once history is structured and cycle
       times are defined, a deviation is measurable against an expectation
       early. In biologics, where lead times run 12 to 18 months, that
       margin is the entire business case.

       NDA: no figures, no partner names, no internal system values anywhere
       in the visible copy. Every claim here carries its weight through the
       judgment it names, never through a number.

       STYLE: no em dashes in visible copy. Colons and semicolons do that
       work instead. */
    thesis:
      "Visibility that arrives in time to change the outcome, not to explain it.",
    subThesis:
      "The metric that was about to be published was measuring the wrong thing. Establishing that took a record that reproduces, definitions that agree, and a route to the people who could act on it.",

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
          "External manufacturing had no governed view of its own shipments; the one in circulation belonged to another function and rested on a hand-maintained spreadsheet. I modelled the full lifecycle of a stock transfer against a pinned, tested snapshot, so any figure reproduces on demand rather than being re-argued.",
        tools: ["BATCH-KEY ENTITY RESOLUTION", "PINNED REPRODUCIBLE SNAPSHOT", "REGRESSION-TESTED PIPELINE"]
      },
      {
        n: "02",
        title: "DRAW THE CONNECTIONS",
        body:
          "A transaction records that material moved, never why it arrived late. That sat in a separate quality system, in vocabulary that did not survive the crossing: one code spanning two events, one metric carrying conflicting specifications. I set contracts and named owners; nothing compounds until the words agree.",
        tools: ["METRIC & DATA CONTRACTS", "CROSS-SYSTEM CAUSE MAPPING", "DEFINITION OWNERSHIP"]
      },
      {
        n: "03",
        title: "DRIVE THE DECISION",
        body:
          "Answering why a shipment slipped took days across two functions, against lead times where a late catch cannot be recovered. It now resolves against one governed record: leadership reads exception and cost, planning reads what to chase, and the same tables answer a direct question without an analyst.",
        tools: ["TIERED EXECUTIVE REPORTING", "EXCEPTION MANAGEMENT", "GOVERNED SELF-SERVE"]
      }
    ],

    takeaway:
      "In biologics, a slip caught late cannot be recovered. All of this exists to surface it earlier."
  }
];

export const getWork = (slug: string) => works.find((w) => w.slug === slug);
