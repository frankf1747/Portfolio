"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import SmartText from "../SmartText";
import { ArrowOut } from "../SketchFilters";
import ProjectsHeading from "../progress/ProjectsHeading";
import { BioVisual, BrainVisual, ClinVisual, MooVisual, NextVisual, UclaVisual } from "../works/visuals";

/* §9 — projects as a staggered bento.

   The scattered wall this replaced — 3D covers, cursor parallax, hover
   reveal — is stored intact in components/works/parked/WorkWall.tsx.

   Twelve columns, three rows. The rows deliberately do NOT share their
   seams: row one splits in halves, row two in thirds, so the joins step
   like brickwork instead of running straight down the page. The tall card
   starts in row two and closes the right edge of rows two and three, and
   the wide card fills what is left of row three.

     ┌─────────────┬─────────────┐
     │ 01          │ 02          │   halves
     ├────────┬────┴───┬────────┤
     │ 03     │ 04     │ 05     │   thirds
     ├────────┴────────┤ tall   │
     │ 06              │        │
     └─────────────────┴────────┘

   Placement is DATA (`col` / `row`, grid-line syntax), not nth-child, so a
   card can be moved or added without touching the stylesheet. Below 1024px
   the stylesheet ignores these and lets the grid flow.

   Drawn, not filled. The cards are paper on paper, outlined in ink through
   the site's own wobble filters (SketchFilters, mounted in Landing) with hatching wherever a
   shape needs weight, and the accent as the single mark — the §2 rule of one
   ground and one mark holds inside the grid as everywhere else. An earlier
   pass on dark panels with a per-project palette read as a different site.

   Each card: a sketched visual on top, and a spotlight headline under it.
   The headline is the one line the card exists to say; the client name
   drops to a small eyebrow above it. Services come in on hover, so the
   resting card stays one idea. */

type Card = {
  n: string;
  client: string;
  /** Spotlight headline — the single claim this card makes. */
  headline: string;
  summary: string;
  services: string[];
  /** Grid lines on the 12-column desktop grid. */
  col: string;
  row: string;
  visual: ReactNode;
  status?: string;
  /** Detail route. Present = the card is a link. */
  href?: string;
  /** Larger headline, for the half-width and wide cards. */
  big?: boolean;
};

const CARDS: Card[] = [
  {
    n: "01",
    client: "BIOMARIN",
    headline: "The scorecard that builds itself.",
    summary: "SAP data piped bronze to gold and refreshed on schedule. An agent team runs the root cause analysis and writes the actions into the scorecard. Build time cut 85%.",
    services: ["MEDALLION ETL", "POWER AUTOMATE", "AGENT TEAM", "EVALS"],
    col: "1 / 7",
    row: "1",
    visual: <BioVisual />,
    status: "UPLOADING",
    big: true
  },
  {
    n: "02",
    client: "MOOBOX",
    headline: "One customer, 360°.",
    summary: "CRM, orders and fulfilment joined into one customer. Demand is forecast, segments act on their own, and agents escalate the exceptions. Repeat orders up ~11%.",
    services: ["LIFECYCLE CRM", "SEGMENTATION", "DEMAND FORECAST", "AGENTS"],
    col: "7 / 13",
    row: "1",
    visual: <MooVisual />,
    status: "UPLOADING",
    big: true
  },
  {
    n: "03",
    client: "UCLA ANDERSON",
    headline: "A Lean line you can run.",
    summary: "A spreadsheet-run production exercise rebuilt as a React app on Azure with a live what-if simulator.",
    services: ["REACT + AZURE", "AI SIMULATOR", "USAGE TELEMETRY"],
    col: "1 / 5",
    row: "2",
    visual: <UclaVisual />,
    status: "UPLOADING"
  },
  {
    n: "04",
    client: "CLINICAL TRIAL RISK",
    headline: "Open the riskiest trial first.",
    summary: "Regulatory filings unified Spark to Snowflake, then every trial ranked by termination risk.",
    services: ["SPARK ETL", "SNOWFLAKE", "RISK CLASSIFIER"],
    col: "5 / 9",
    row: "2",
    visual: <ClinVisual />,
    status: "UPLOADING"
  },
  {
    n: "05",
    client: "BRAIN",
    headline: "Throw anything in. Never forget it.",
    summary: "Anything I throw in stays findable and linked, so I can draw connections between ideas. Ask any time; every answer cites its source.",
    services: ["RAG", "HYBRID SEARCH", "KNOWLEDGE GRAPH", "MCP", "CLAIM CHECKS"],
    col: "9 / 13",
    row: "2 / 4",
    visual: <BrainVisual />,
    status: "IN USE"
  },
  {
    n: "06",
    client: "NEXT",
    headline: "More on the way.",
    summary: "Two builds in progress. This slot fills as they ship.",
    services: ["IN PROGRESS"],
    col: "1 / 9",
    row: "3",
    visual: <NextVisual />,
    big: true
  }
];

export default function Work() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  /* Reserve room for the hover details. The services row is added under
     the summary on hover, which grows the text block upward — and with the
     visual sized to the RESTING text, the headline slid up into it. So each
     card's visual is placed above the text block's OPEN height instead,
     measured here per card: tag rows wrap differently card to card (04's
     four tags take two lines), so no single reserve in CSS fits all.

     Measured with the card at rest (a hovered card is skipped, its numbers
     would already include the tags), and again whenever layout can change:
     fonts arriving and resize. */
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 1;
      for (const cell of cardRefs.current) {
        if (!cell || cell.matches(":hover")) continue;
        const foot = cell.querySelector<HTMLElement>(".bento__foot");
        const meta = cell.querySelector<HTMLElement>(".bento__meta");
        const tags = cell.querySelector<HTMLElement>(".bento__tags");
        if (!foot || !meta || !tags) continue;
        const fb = foot.getBoundingClientRect();
        /* resting text, eyebrow to bottom padding; + the tags; + the 8rem
           of padding they gain when they open (see .bento__tags:hover) */
        const rest = fb.bottom - meta.getBoundingClientRect().top;
        const open = Math.max(fb.height, rest + tags.scrollHeight + 8 * remPx);
        cell.style.setProperty("--foot-open", `${Math.ceil(open)}px`);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  /* Entry only — each card rises in as it reaches the viewport. */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="work" id="work">
      <h2 className="work__title">
        {/* The heading is the way in to /progress; LIVE says where it goes. */}
        <ProjectsHeading />
      </h2>

      <ul className="bento" role="list">
        {CARDS.map((c, i) => {
          const Frame = c.href ? Link : "div";
          const frameProps = c.href ? { href: c.href, "aria-label": `${c.client} — ${c.headline}` } : {};
          return (
            <li
              key={c.n}
              className={`bento__cell${c.big ? " is-big" : ""}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={
                {
                  "--col": c.col,
                  "--row": c.row,
                  "--i": i
                } as CSSProperties
              }
            >
              <Frame
                {...(frameProps as { href: string })}
                className={`bento__card${c.href ? " is-linked" : ""}`}
              >
                <span className="bento__visual" aria-hidden="true">
                  <span className="bento__stage">{c.visual}</span>
                </span>

                <span className="bento__foot">
                  <span className="bento__meta">
                    <span>
                      ({c.n}) {c.client}
                    </span>
                    {c.status && <span className="bento__flag">{c.status}</span>}
                    {c.href && (
                      <span className="bento__go">
                        <ArrowOut />
                      </span>
                    )}
                  </span>
                  <SmartText as="h3" className="h2 bento__hl">
                    {c.headline}
                  </SmartText>
                  <span className="bento__sum">{c.summary}</span>
                  <span className="bento__more">
                    <span className="bento__tags">
                      {c.services.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </span>
                  </span>
                </span>
              </Frame>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
