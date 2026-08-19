# Portfolio content design

Date: 2026-08-17
Status: for review

Replaces the placeholder copy across every section with content grounded in
Frank Fu's actual record (BioMarin, UCLA Anderson, MOOBOX, the LangGraph
dispatch agent) and in the positioning decided during brainstorming.

---

## 1. Positioning

**Target role:** product analyst / analytics PM. Business oriented,
human centric.

**Through-line:** one continuous pipeline, one owner. Evidence to decision to
interface. The analysis is not finished until someone can act on it.

**The line the whole site is built on**, taken from Frank's own resume summary:

> visibility from the number to the cause, then build the agents, semantic
> models, and applications that close the gap. Ambiguous problems from
> scoping through adoption.

**What changed from the placeholder site.** The old copy positioned Frank as
search relevance plus causal inference plus agents, built on three course
cases (Starbucks, DoorDash, Dell). That is coursework standing where
professional work should be. The real spine is operations and product data in
regulated and high-volume environments, and the differentiator is owning the
two ends nobody else wants: framing the ambiguous problem at the front, and
getting the thing actually used at the back.

**Publishability rule.** Anything already on the resume is site-safe, since
that document goes to strangers. Anything beyond it (partner names, real
figures, screenshots) stays off.

---

## 2. Voice

Warm and direct. First person, contractions allowed, precise but not austere.
Sounds like Frank explaining his work to a smart colleague, not a manifesto.

Rules:

- "I", not "the work"
- No verdict-style aphorisms
- Specifics and numbers over adjectives
- **No em dashes in prose.** Use periods, commas, or colons. Em dashes survive
  only as typographic separators in card descriptors and the hero subtitle
  prefix, where they are marks rather than writing.
- US spelling. The placeholder copy used British forms (prioritise,
  tokenisation, behaviour), which reads as an error on a Los Angeles job hunt.

Voice governs prose only: About, Approach glosses, project bodies. The display
slots (hero overture, Statement, Expertise, Domains) are caps-set units and
stay hard by design. The contrast is intentional.

---

## 3. Navigation

Five items, one word each, 5 to 9 characters, so the folded hairline stack
reads as a set.

| Label | Href | Note |
|---|---|---|
| ABOUT | #about | unchanged |
| EXPERTISE | #capabilities | unchanged |
| PROJECTS | #work | unchanged |
| APPROACH | #approach | unchanged |
| STUDIES | #studies | was SUBJECTS |

Wordmark stays `Frank Fu`. CTA stays `GET IN TOUCH`.

---

## 4. Hero

Overture: three lines, two words, 11 to 13 characters, near equal, so the
dense scramble block reads as one object. All three are 13.

```
GOAL ORIENTED
TOTAL CLARITY
REAL ADOPTION
```

Subtitle: `— DATA-CENTRIC PRODUCT DREAMER` (30 chars).

It began as PRODUCT-CENTRIC DATA DREAMER and was inverted. The two are the
same length, so nothing about the fit changes, but the noun order decides
which job is being claimed: product-centric data dreamer is an analyst who
thinks about product; data-centric product dreamer is a product person who
works from evidence. The second is the role this site is aimed at.

It replaced `— SCOPE THROUGH ADOPTION`, which stated the method rather than
the person. The line sets at `.h1`, and 30 characters is the ceiling before
it breaks at 1440 — this sits exactly on it, so the wording cannot grow.

Alternatives written and rejected: DREAMER WITH A DEPLOY BUTTON, VISIONARY
WITH A BACKLOG, DREAMS WITH A DEADLINE, I MAKE DASHBOARDS OBSOLETE, PRODUCT
BRAIN DATA HEART.

Meta row:

```
SCOPE · EVIDENCE · ADOPTION      SCROLL TO VIEW MORE ↓      ©2026
```

Screen-reader h1 (the overture is decorative):

> Frank Fu, product analyst. Goal oriented, total clarity, real adoption.
> Scope through adoption.

**Noted risk, accepted by Frank.** "GOAL ORIENTED" is the most common phrase
on the resume pile, and at 245rem it lands hard. Flagged during brainstorming;
Frank chose it deliberately. Documented here so the decision is not
relitigated later.

---

## 5. About (section 01)

Head: `01 — ABOUT` / `LOS ANGELES, CA`

Body, 51 words:

> I work at both ends of the same job. Someone hands me a fuzzy problem; I
> scope it, find what's actually causing it, then build the thing that fixes
> it: a model, a pipeline, an app, an agent. The part I care about most is
> whether people still use it afterward.

---

## 6. Statement

Two words at 245rem, 8 and 7 column spans. Metric target is roughly 7 and 6
characters.

```
CURIOSITY
          LEARN.
```

CURIOSITY is 9 characters against a span this file's own note says holds
about 7, so the line measures 988 against a 927 box. It does not clip: the
overflow runs into the margin gap. Flagged rather than fixed, because
shrinking this line alone would break scale with LEARN. beside it.

Note: LEARN also appears in Approach rule 05 (SHIP, LEARN, ITERATE). Read as
resonance rather than repetition; flag if it grates in situ.

---

## 7. Expertise (section 02)

Head: `02 — EXPERTISE` / `WHAT I WORK WITH`

Was eight abstract capability words with nothing behind them. Every portfolio
has that list and nobody believes any of it. Each capability now carries the
tools it is actually practised with, which is the form a hiring manager can
verify at a glance.

| # | Capability | Tools |
|---|---|---|
| 01 | DATA ANALYTICS | SQL, Python, Databricks, Fabric, Snowflake, Spark, Medallion ETL, semantic modeling |
| 02 | AGENTIC DEV | LangGraph, LLM APIs, RAG, evals, prompt engineering |
| 03 | EXPERIMENTATION | A/B testing, causal inference, RDD |
| 04 | OPTIMIZATION | Gurobi, integer programming, forecasting |
| 05 | VISUALIZATION | Power BI (DAX), Tableau, GA4 |
| 06 | PRODUCT | PRDs, user flows, Figma, Agile |
| 07 | FRONTEND / BACKEND | React, Next.js, APIs |
| 08 | PRODUCTIVITY | Microsoft 365, Genie Space, MCP, Power Automate |

Row 01 absorbed three earlier rows (data analytics, ETL and pipelines, semantic
modeling), so it carries roughly twice the tools of any other. If it reads
heavy in situ, ETL and semantic modeling split back out.

Labels run 7 to 18 characters. The existing strip already carries items of
8 to 20, so there is no width problem here.

**Two rows of four, no horizontal scroll.** Eight capabilities behind a drag
handle read as eight; eight on screen at once read as a lot, which is the
point of the section. Measured at 1400rem per row inside 1440.

**Colour: the names are `--ink`, not `--mark`.** §2 allows one ground and one
mark, and the mark is spoken for by every small label, index and rule on the
page. At 55rem Anton the capability names were shouting in the same voice, so
the section head and the items read as one undifferentiated block of pink and
the hierarchy collapsed. The ink is the other half of the palette and is
otherwise only used on the inverted grounds.

**Vertical rhythm.** The distance between the two rows is NOT the row gap, it
is the reserved reverse face — the empty box under each name waiting for its
tools. Tool leading tightened to 1.2 brings four rows down to ~82rem, so the
reserve came from 104rem to 84rem and the row gap to 12rem.

**Space below the section went back up**, 60rem to 170rem. It was cut when
the names were 40rem mono, which was right then; at 55rem Anton the block
carries far more weight and crowds whatever follows it.

**Type: mono at 700, 40rem, tracking -0.06em.** Bolder and tighter than the
.h1 default it started from.

Archivo 700 was tried first and is the wrong instrument. Bold grotesk caps
are WIDER than the mono's fixed 0.6em advance, not narrower: a row measured
1961 against a 1400 budget and the size had to come straight back down.
Monospace weight, by contrast, is free — 700 and 400 share an advance — so
the weight costs nothing and every pixel of width comes from tracking and
from the item gap, which was cut 48rem to 36rem and spent on size.

**55rem is the ceiling, not a preference.** Row one binds at 1373 of a 1400
budget; row two has 123rem of slack, so shortening labels there buys
nothing. Only row one's four labels matter.

**Superseded note — 40rem was the ceiling in the mono.** 41rem measures 1403 against a
1400 budget, and three pixels over is still a scrollbar. Both rows now
measure exactly 1400. Any longer capability label, or a fifth item in a row,
forces the size back down.

If more presence is wanted than this, the lever is three rows rather than
two — three items per row allows roughly 54rem — not a bigger font at two
rows, which does not fit.

**Two faces in one slot.** At rest the item shows the capability; on hover
the capability leaves and the tools take its place, with the scramble
carrying the swap. Not a 3D flip: the decode is already the site's transition
of record.

- The faces are STACKED, sharing one box. Laid out in flow underneath, each
  item took the width of its longest tool run and the strip became enormous,
  a paragraph on its side.
- The reverse is a BALANCED COLUMN LIST, not a run of body copy. Set as a
  sentence at 14rem it read as leftover text under a 76rem word rather than
  as the other side of the same card. Each tool is its own element at 16rem
  uppercase mono against a 38rem name — a 2.4:1 ratio rather than 5.4:1.
- Columns come from CSS `columns`, not a height-capped flex column. Flex
  fills the first column to its cap before starting the second, which left
  the five-tool item as four and then a lonely fifth. `column-fill: balance`
  gives 3 and 2.
- The two faces OVERLAP in transition: name out over 0.26s, tools in over
  0.3s starting at 0.08s. An earlier version delayed the incoming face until
  the outgoing one had fully cleared, which left the box momentarily empty
  and read as a flicker rather than as a turn.
- `.caps__face` reserves 132rem so the swap never reflows the row, and
  `.caps__item` has a 440rem floor so short names like PRODUCT still have
  room for their reverse.
- Tools scramble through `scrambleText` rather than SmartText. One engine
  instance per tool would be roughly 40 across the section, for an effect
  that only ever plays on hover.
- Only the ARRIVING face decodes. Scrambling the one on its way out reads as
  two things failing at once.

**Confirmed:** PRODUCTIVITY keeps its name. Genie Space and MCP are two
separate entries. Telemetry is dropped entirely rather than moved.


---

## 8. Projects (section 03)

No index head. One was added and then removed: it put the word PROJECTS
twice within a few lines, since the large `work__title` sits directly below.

The numbering instead lives in the display title, as `PROJECTS (3)`. The 3 is
the SECTION number, closing the 01, 02, 04 gap in the rail. It was previously
bound to `CARDS.length`, which read as an inventory count and would have
silently changed with the roster.

The large title keeps its slower decode pace. It is the block the page is
built around, and that was a deliberate choice in the existing build.

Five cards. Slot order is a ranking, and the frame geometry carries it.

**Geometry change:** slot 02 goes from 400x314 to 510x400 so MOOBOX, the only
founder card, gets a large frame without disturbing the BioMarin, MOOBOX, UCLA
sequence. At x=800, w=510 clears slot 01 (x=40, w=510) with room to spare.

### (01) BIOMARIN — 2026

- Descriptor: `EXTERNAL MANUFACTURING — VISIBILITY`
- Services: `PROCESS MONITORING` `SEMANTIC MODELING` `AGENTIC REPORTING`
- Role: Insights & Analytics Intern, Digital Transformation
- Deliverables: STO reporting view, gold-layer semantic model, agentic reporting workflow

**Corrected 2026-08-18.** The card said ONTOLOGY DESIGN, taken from the
resume line "defined the ontology and entity standards behind 11 external
partner data sources". Frank does not claim that as his design work, so the
service is now PROCESS MONITORING, which matches the STO tracking he did own.
NOTE: the resume still carries the stronger ontology claim in both variants —
site and resume now disagree, and the resume is the one a reader will check
it against.

> Manufacturing data shows up from eleven external partners in whatever shape
> they keep it: spreadsheets, email threads, 200-page PDFs. The fix wasn't a
> dashboard. It was deciding what a record is, keying every one to a single
> batch identifier, so the same figure means the same thing everywhere
> downstream.

> Then the part I actually care about. It had to land in a meeting. The
> reporting workflow ships into the monthly leadership cycle, so the team
> arrives with causes and recommendations instead of spending the week
> assembling the pack.

Confidentiality: resume-level detail only. No partner names, no real figures,
no screenshots.

### (02) MOOBOX — 2025

- Descriptor: `DEMAND & DISTRIBUTION — FOUNDER`
- Services: `LIFECYCLE MODEL` `SEGMENTATION` `A/B TESTING` `FORECASTING`
- Role: Founder, strategy lead
- Deliverables: Lifecycle data model, segment definitions, demand forecast, promotion rules

> I started MOOBOX, which meant I had to answer my own questions. CRM,
> purchases, and fulfillment lived in three separate places, so I pulled them
> into one lifecycle view and found the segments that genuinely behaved
> differently, then rebuilt the campaigns and service tiers around them.
> Repeat purchase conversion went up about 11% among returning buyers.

> Forecasting was the harder half. SKU-level demand across a 50,000-order day,
> with AI escalating exceptions and proposing the fix. Resetting promotion
> rules at the weakest stages moved cross-sell roughly 13%.

### (03) UCLA ANDERSON — 2026

- Descriptor: `LEAN OPS SIMULATION — PRODUCT BUILD`
- Services: `REACT APP` `USAGE TELEMETRY` `ADAPTIVE SCENARIOS`
- Role: Research Assistant, Operations
- Deliverables: React application, telemetry instrumentation, two release cycles

> The simulation ran on spreadsheets and needed someone babysitting it. I
> rebuilt it as a React app, moving setup, role permissions, and scenario state
> into the product, so about 600 participants across 7 MBA courses could run it
> unattended.

> Then I instrumented it. Completion, decision latency, drop-off stage. An
> exercise nobody could measure became a dataset the teaching team queries
> every term. Two release cycles later, measured efficiency was up around 35%
> on the spreadsheet version.

### (04) DISPATCH AGENT — 2026

Renamed from "Multi-agent RAG", which would have put Frank in a pile of
thousands. Named for what it does.

- Descriptor: `OPERATIONS INTELLIGENCE — AUTOMATED REPORTING`
- Services: `LANGGRAPH ORCHESTRATION` `RAG` `ANOMALY DETECTION` `DELIVERY`
- Role: Builder
- Deliverables: Agent graph, retrieval layer, tool suite, smoke tests

> Five agents on a graph. One reads the business context and KPI definitions
> out of the playbook PDFs, one runs the ops data for KPIs and anomalies, one
> turns the weather forecast into dispatch risk. They hand off to a writer that
> assembles a leadership-ready report.

> Then it emails it. That's the part I'd defend. Most agent demos end at a
> terminal, and a report nobody receives is a report nobody reads.

Source: `project_raw/Agents/`. Built, tooled, tested.

### (05) COMPETITIVE ANALYSIS AGENT — IN PROGRESS

Small frame. Carries a visible IN PROGRESS marker and does **not** link out
until it ships.

- Descriptor: `MARKET INTELLIGENCE — AUTOMATION`
- Services: `SCOPING` `SOURCE DESIGN` `EVAL PLAN`

> In progress. Working out what a competitive read has to contain to be worth
> reading: which sources, how often, and which decision it feeds. The card
> links out when it ships.

**Not on the wall**, surviving only in Domains: Camping in Ontario (GA4 funnel,
+15% landing-to-action, -13% booking abandonment), Clinical Trial Risk (100GB+,
50K+ trials, 0.82 AUC), SKU Assortment Optimization (Gurobi MIP), Supply Signal
Agent, and the course cases (Starbucks, DoorDash, Dell, Apple, Cedar, Meta).

---

## 9. Approach (section 04)

Head: `04 — APPROACH` / `FIVE RULES`

Rules 01 and 02 are Frank's own, verbatim in substance. The arc is frame,
rebuild, explain, get used, do it again, which restates scope-through-adoption
as method. Rules 01 and 05 are both triads, so the list opens and closes on the
same shape.

```
01  WHAT, WHY NOW, SO WHAT
    Three questions before I open anything. If I can't answer why now and
    so what, I'm not ready to start.

02  REBUILD, DON'T PATCH
    Adding another layer to a broken workflow just makes it heavier. The
    spreadsheet didn't need macros. It needed to stop being a spreadsheet.

03  A NUMBER ISN'T AN ANSWER
    A status figure says what happened. I don't hand it over until it also
    says why, and what to do about it.

04  ADOPTION IS THE PROOF
    Delivery isn't the finish line. I'd rather measure whether people came
    back to the thing than whether I shipped it on time.

05  SHIP, LEARN, ITERATE
    Shipping is how I learn what I built. Version one is a hypothesis. I
    rebuild it on what people do with it, not what they say about it.
```

No em dashes, per Frank's direction.

---

## 10. Studies (section 05)

Head: `05 — STUDIES` / `WHAT I TOOK APART`

**The axis.** Projects at 03 is what Frank built. Studies at 05 is what he
analysed. Built versus studied is a distinction a reader grasps immediately,
and it is the one framing of this section that does not overlap Projects or
Expertise.

This section went through three framings before landing here, recorded so the
reasoning is not lost:

1. **SUBJECTS** (original): seven company names at h1 size under an
   "analyses, not engagements" disclaimer. Kept the visual form of a client
   logo wall while the fine print admitted they were not clients.
2. **DOMAINS**: industry labels with case captions. Removed the borrowed
   prestige but put the section on a breadth axis that never fully earned its
   place, and the industry labels broke the strip width.
3. **STUDIES** (final): the case studies themselves, each opening to an
   executive summary. The company names return, but as the subject of an
   analysis rather than as a client list, which is what they always were.

**Content template**, per Frank. Four blocks each:

| Block | Contains |
|---|---|
| WHAT IT IS | One line. The case and its source. |
| PROBLEM | What was actually being asked. |
| SOLUTION | Method and what was built or argued. |
| TAKEAWAY | What it concluded, and what it could not claim. |

**The seven studies.** Source material is in `project_raw/`.

| Study | Focus | Source |
|---|---|---|
| STARBUCKS | Search relevance, query ranking | UCLA challenge PDFs, query and product CSVs |
| DOORDASH | Causal inference, RDD on a fee threshold | RDD deck and write-up |
| DELL | M&A strategy, valuation | Group 4 M&A PDF |
| APPLE | M&A | `Apple_MA7.pptx`, contents not yet read |
| MICROSOFT | Not yet determined | `Microsoft Presentation.pptx`, contents not yet read |
| CEDAR | Healthcare payments, not yet determined | `Cedar.pptx.pdf`, contents not yet read |
| META | AI entry points | Seminar docs, script, and slides |

Three of the seven need their source material read before their focus line can
be written. That is a content-production pass, not a copy swap, and it is the
largest single piece of work remaining.

**What this drops.** The industry-breadth axis disappears with DOMAINS. Judged
acceptable: the studies name real companies, which carry their industries
implicitly, and breadth was the weakest justification of the three framings.

**Honesty note.** These are coursework and independent analysis on public and
provided data, not client engagements. With the company names back in the
section, a short line saying so is required, not optional.

**The clip window has a knock-on cost.** Widening `--st-window` adds real box
below the ink, not just headroom: at 1.05em the line box is 80px while the
glyphs occupy 4.6 to 59.6px, leaving ~20px of dead space before any margin
applies. That is why the topic line appeared detached from its own name and
why its margin is now NEGATIVE (-4rem) rather than positive. Note that
`getBoundingClientRect` cannot measure this — it returns the line box, ink
included or not — so the value is derived from the window and shift, not
measured.

**Clipping under parallax, fixed.** The study names inherit `.h1`, whose
0.73em `--st-window` sits almost exactly on the cap height. That is fine in
normal flow, but the cursor parallax puts every item on its own compositor
layer and the clip is then applied against a rounded layer edge, which
sliced the tops off STARBUCKS and META as soon as the cursor moved. Window
widened to 1.05em with a 0.06em shift; verified at zero overflow top and
bottom under hard parallax. **Any new transform on a SmartText host needs
this check** — the failure only appears once the layer exists.

**Delivery: scrim overlay.** A study opens as a window over the homepage. The
surrounding page dims via opacity and stays visible behind it, so the study
reads as part of the page rather than as a separate destination. No route
change, no page transition.

| Aspect | Decision |
|---|---|
| Trigger | Click a study in the strip |
| Background | Page dimmed by opacity, still visible, not replaced |
| Scroll lock | Reuse `html[data-locked="true"]`, which already exists in `_tokens.scss:74` for the intro sequence |
| Motion | CSS transitions only. The site has no keyframes anywhere and this must not be the exception |
| Content | The four blocks: what it is, problem, solution, takeaway |
| Text treatment | Blocks decode through SmartText on open, consistent with every other arrival on the site |
| Close | Click the dimmed surround, Escape, or an explicit control |
| Accessibility | Focus trap while open, `aria-modal`, focus returns to the trigger on close |

**Strip layout.** Two rows, 4 then 3, the second inset by 220rem — roughly
half a name, so it reads as a continuation rather than a separate list. Both
rows sit in one horizontal scroller so they travel together on drag. One row
left the section shorter than its own 180rem padding and the gap to Contact
read as a hole.

**Per-case brand colour.** Each study carries the subject company's colour on
its name and logo chip. This is a deliberate exception to §2 (one ground and
one mark per viewport, never three), on the same principle as the per-project
palette already in `data/projects.ts`. A 44rem logo slot is reserved at fixed
size whether or not art exists, so dropping real logos in later cannot reflow
the row.

Draft studies signal through an outline-only chip and a SOON label, NOT
through opacity. Dimming the card to 0.45 drained the brand colour it had
just been given: DoorDash red read as salmon.

**Strip shows name + key topic**, two to four words, always visible and in the
subject's colour. It replaced a hover-only READ/SOON label: state told the
reader nothing about the work, and hiding it until hover left the wall as
seven bare company names, which is the logo-wall reading this section exists
to avoid. The logo slot lives beside the title INSIDE the window, not on the
strip, for the same reason.

**CORRECTION — three cases were misfiled.** "MA" in the source filenames is
the MA Team cohort designation, not mergers and acquisitions. The placeholder
`data/projects.ts` described Dell as M&A valuation and that was invented. What
the decks actually contain:

| Study | Actually | Was recorded as |
|---|---|---|
| DELL | Meeting-prep assistant: a project-manager agent coordinating expert worker agents for research, deck building and role-play Q&A | M&A strategy, valuation |
| APPLE | Winback offer A/B test, 180,000 returning subscribers, 4 storefronts. Free trial +6% signups, -8% trial-to-paid; hybrid routing by time-since-churn for +10% payers | M&A |
| MICROSOFT | Copilot productization: an Amazon-review UGC analyzer taken from notebook to modular system with validation agents, personas and a Power BI action loop | unknown |
| CEDAR | Nurse attrition and burnout, with an AI staffing and demand-forecasting response | unknown |

Frank said at the time that Dell was "orchestration agents dev" and was
correct; the placeholder data was trusted over him. Anything still sourced
from the old `data/projects.ts` should be treated as unverified until checked
against `project_raw/`.

**Unverified brand values.** CEDAR is almost certainly Cedars-Sinai, not Cedar
the payments company — the deck is a hospital nursing case. Its colour is a
guess and wrong for that reason. Apple has no single
brand colour and is set to near-black. Both need checking against the real
marks before launch.

**Tension worth naming.** With brand colours and logo slots, this section now
looks more like a client logo wall than the original SUBJECTS did, which is
the thing the DOMAINS detour was meant to avoid. The framing carries it —
STUDIES against PROJECTS, plus the honesty note — but that note is now
load-bearing and must not be cut.

**Built and verified**, 2026-08-17. Starbucks is written from source; the
other six render in the strip and open a stub marked SOON.

Two things the build turned up:

- `onClose` arrives as a fresh arrow on every parent render. Depending the
  mount effect on it re-runs the effect constantly, cancelling the entry
  frame and thrashing `is-study-open`. Handlers are read through a ref and
  the effect is on an empty dep list. Do not "fix" the lint warning by
  adding the dep back.
- The panel is portalled to `body`. Rendered in place it sits inside
  `<main>`, which is the element being dimmed, so the report would fade out
  along with the page behind it.

**Open on the overlay:**

- **What goes in the window.** "Decks" is ambiguous: the four-block summary
  alone, or the actual slides from `project_raw/` shown as images. The summary
  is written content; the slides are the original artifact and need no writing
  but do need extraction and hosting.
- **Deep linking.** A pure overlay cannot be linked to. A hash such as
  `#studies/starbucks` would make a single study shareable in a job
  application without introducing a routing layer or breaking the
  part-of-the-homepage feel. Worth having; not yet decided.


---

## 10b. Page metadata

Both fields were stale and describe the placeholder positioning.

| Field | Was | Now |
|---|---|---|
| `title` | Frank Fu — Data-led product design | Frank Fu — Data-centric product dreamer |
| `description` | "...search relevance, causal inference and agent systems..." | The About paragraph's framing: scope, cause, build, adoption |

This is the browser tab and the search result, so it ships with everything
else in `app/layout.tsx`.

---

## 11. Contact (section 06)

Head: `06 — CONTACT` / `OPEN TO JAN 2027 ROLES`

Was `OPEN TO 2026 ROLES`, which is wrong: the MSBA completes December 2026, so
full-time availability starts January 2027.

Big word: `SAY HELLO`. Email: `frankfu1747@gmail.com`.

Footer links, **currently broken** and pointing at bare homepages:

| Label | Was | Should be |
|---|---|---|
| LINKEDIN | `https://www.linkedin.com/` | `https://www.linkedin.com/in/frank-fu-jiajun` |
| GITHUB | `https://github.com/` | `https://github.com/frankf1747` |
| EMAIL | `mailto:frankfu1747@gmail.com` | unchanged |

Footer meta: `LOS ANGELES, CA` / `©2026 FRANK FU`.

---

## 12. Files affected

| File | Change |
|---|---|
| `components/Nav.tsx` | SUBJECTS to DOMAINS, href to #domains |
| `components/sections/Hero.tsx` | LINES array, subtitle, meta row, sr-only h1 |
| `components/sections/About.tsx` | body paragraph |
| `components/sections/Statement.tsx` | PROOF/FIRST. to CURIOUS/LEARN. |
| `components/sections/Capabilities.tsx` | ITEMS array to capability+tools pairs, all eight |
| `components/sections/Work.tsx` | CARDS array rewritten, slot 02 geometry 400x314 to 510x400, IN PROGRESS state on card 05, new `work__head` index row |
| `components/sections/Approach.tsx` | ITEMS array, all five |
| `components/sections/Subjects.tsx` | rename to `Studies.tsx`, rebuilt around seven case studies with four-block summaries, head copy, honesty note |
| `app/styles/_sections.scss` | new `.work__head`; `.caps__item` two-line for tools; `.subjects__item` rebuilt for study summaries |
| `components/StudyOverlay.tsx` | new. Scrim overlay, focus trap, Escape and click-away close |
| `app/styles/_study-overlay.scss` | new. Dimmed surround, window, four-block layout |
| `components/sections/Contact.tsx` | availability line, LINKS hrefs |
| `data/projects.ts` | full roster rewrite, six placeholder entries to five real ones |
| `app/page.tsx` | import rename Subjects to Studies |

Card 05 needs a new visual state (IN PROGRESS marker, non-linking) that does
not exist yet. Everything else is copy substitution into existing structures.

---

## 13. Decisions log

| Decision | Choice | Note |
|---|---|---|
| Audience | Both data and product capability | The hybrid, made specific |
| Through-line | One continuous pipeline | Evidence to decision to interface |
| Target role | Product analyst / analytics PM | Business oriented, human centric |
| Voice | Warm and direct | First person, no em dashes, US spelling |
| Section 05 content | Seven case studies with exec summaries | Clickable, four blocks each |
| Study delivery | Scrim overlay over the homepage | Page dims by opacity, stays visible |
| Expertise format | Capability plus tools, two faces | Replaces an unsupported skills list |
| Expertise scale | mono 700, 40rem, -0.06em, no scroll | All eight visible; 40rem is the fitting ceiling |
| Hover decode | New `hover` pace, 520ms | Nav keeps 1500ms; it is the benchmark |
| Expertise rows | Eight, ETL and semantic modeling folded into row 01 | Frontend/backend and productivity added |
| Hero | GOAL ORIENTED / TOTAL CLARITY / REAL ADOPTION | Cliche risk flagged, accepted |
| Hero subtitle | DATA-CENTRIC PRODUCT DREAMER | 30 chars, exactly on the ceiling |
| Statement | CURIOSITY / LEARN. | 9 chars runs 61px past the 8-column span; does not clip |
| Roster | BioMarin, MOOBOX, UCLA, Dispatch Agent, Competitive Agent | Last one in progress |
| BioMarin scope | Resume-level detail only | Resume-safe equals site-safe |
| Approach rules | Frank's own two lead | Framing and anti-incrementalism |
| Projects index | `03 — PROJECTS` head added | Closes the 01, 02, 04 numbering gap |
| Section 05 name | STUDIES | Built vs studied; no overlap with Projects |
| Section order | Unchanged | Approach stays next to the work it describes |

---

## 14. Open

- Studies overlay: whether the window carries the written summary alone or
  the original slides alongside it. See section 10.
- Studies overlay: whether to add a hash for deep linking.
- Apple, Microsoft, and Cedar source files have not been read. Their focus
  lines and summaries cannot be written until they are.

- Competitive analysis agent is unbuilt. Card 05 ships with an IN PROGRESS
  marker and no outbound link until it exists.
- Project detail routes (`/work/<slug>`) do not exist. Cards currently use
  plain anchors; swap to `next/link` when the routes land.
- No employment history section exists anywhere on the site. Deliberate for
  now, since Projects and Domains carry the record, but worth revisiting if
  the site is used for applications rather than as a portfolio link.
- Geometry verified: slot 02 at x=800 with w=510 reaches 1310, inside the
  reach of the existing slot 04 (x=830, w=510, reaches 1340). No collision,
  and the container is 1500rem tall against slot 05 bottoming at 1387.
