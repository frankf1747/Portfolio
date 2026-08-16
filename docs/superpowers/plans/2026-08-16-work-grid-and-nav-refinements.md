# Work Grid + Nav Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revert the low-contrast blue experiment, give the wordmark and section indices weight in the theme colour, rebuild the Work section around a large heading plus reference-format card titles, fix the card suppression trigger, tighten the card scatter, add cursor-relative frame parallax, and make the contact button vertical with a scroll-driven fold.

**Architecture:** All motion stays CSS transitions plus class toggling — the codebase has zero `@keyframes` and that stays true. The one new piece of JS is a single `requestAnimationFrame` loop in `Work.tsx` that owns both the existing scroll parallax and the new cursor parallax, writing to two CSS custom properties on `.card__pos`. Combining them in one loop avoids two systems fighting over the same `transform`.

**Tech Stack:** Next.js 14 App Router, TypeScript, SCSS, next/font (IBM Plex Mono + Archivo), Lenis.

**Verification note:** This repo has no test runner — `package.json` defines no test script and there is no test directory. TDD in the usual sense does not apply. Every task therefore verifies with (a) `npm run build`, and (b) a measured assertion in the browser preview via `javascript_tool`, which is how every prior fix in this codebase was confirmed. Measured assertions are written out in full; do not substitute eyeballing a screenshot.

**Known environment limitation:** The preview pane runs backgrounded, which freezes `requestAnimationFrame` and `IntersectionObserver`. Hover states and scroll-driven motion **cannot** be exercised by automation here. Tasks that depend on them are marked ⚠️ MANUAL and must be confirmed by the user in a real browser. Do not report them as verified.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `app/layout.tsx` | font loading | Modify — add weight 700 to both families |
| `app/styles/_tokens.scss` | type scale, palette, `.index` | Modify — index weight, drop the blue override |
| `app/styles/_nav.scss` | nav + contact button | Modify — wordmark colour/weight, vertical contact, scroll fold |
| `app/styles/_sections.scss` | section layout, work grid | Modify — statement colour revert, work heading, card geometry, suppression fix |
| `components/Nav.tsx` | nav markup | Modify — wordmark weight class only |
| `components/sections/Work.tsx` | work section | Modify — heading markup, card title format, unified parallax loop |

No new files. No new dependencies.

---

## Task 1: Revert the blue, add weight to the wordmark and indices

**Files:**
- Modify: `app/layout.tsx:13-25`
- Modify: `app/styles/_tokens.scss` (the `.index` block, added earlier this session)
- Modify: `app/styles/_nav.scss` (`.nav__logo`, `.nav__logoText`)
- Modify: `app/styles/_sections.scss` (`.statement`)

- [ ] **Step 1: Load the bold weight**

Both families currently load only 400 and 500. Asking for `font-weight: 700` without it produces a synthesised faux-bold, which smears mono letterforms badly. In `app/layout.tsx`, change both `weight` arrays:

```tsx
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono"
});

const body = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-body"
});
```

- [ ] **Step 2: Revert the statement colour**

In `app/styles/_sections.scss`, delete the `color` declaration and its comment from `.statement`, leaving the tightened padding in place:

```scss
.statement {
  /* was 200/220 with a 100 gutter between the two lines — 806rem tall at
     1440, most of it empty yellow. Tightened ~15%. */
  padding: 150rem var(--margin) 170rem;

  &__a {
    width: calc(var(--column) * 8 + var(--gap) * 7);
  }
```

`PROOF FIRST.` then inherits `--mark`, which on the yellow ground is `--ink` — 11.9:1, the value it had before the blue experiment.

- [ ] **Step 3: Make the indices bold and theme-coloured**

In `app/styles/_tokens.scss`, replace the whole `.index` block (the one carrying the ⚠ contrast note and the `.is-invert-*` overrides) with:

```scss
/* Section indices: theme mark, bold. --mark already resolves per section
   — accent on paper, --ink on the yellow and blue inversions — so there
   is no override to maintain and no ground this can go invisible on. */
.index {
  color: var(--mark);
  font-weight: 700;
}
```

- [ ] **Step 4: Wordmark to theme colour and bold**

In `app/styles/_nav.scss`, change `.nav__logo`'s colour and add weight to `.nav__logoText`:

```scss
.nav__logo {
  pointer-events: auto;
  color: var(--mark);
}

.nav__logoText {
  display: block;
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 34rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  transform-origin: 50% 0;
  transform: scale(1) translateY(0);
  transition: transform 1s var(--ease);
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no SCSS errors.

- [ ] **Step 6: Verify colours and weights measured, not eyeballed**

Reload the preview, wait past the 5.4s landing, then run:

```js
(async () => {
  await document.fonts.ready; await new Promise(r=>setTimeout(r,6500));
  const hex = c => { const m=c.match(/\d+/g); return '#'+m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join(''); };
  const logo = document.querySelector('.nav__logoText');
  const st = document.querySelector('.statement__a');
  return {
    logo: { color: hex(getComputedStyle(logo).color), weight: getComputedStyle(logo).fontWeight },
    statement: hex(getComputedStyle(st).color),
    indices: [...document.querySelectorAll('.smart-text.index')].map(el => ({
      txt: el.dataset.stSource,
      color: hex(getComputedStyle(el).color),
      weight: getComputedStyle(el).fontWeight }))
  };
})()
```

Expected: `logo.color` `#f2247a`, `logo.weight` `"700"`. `statement` `#262048`. Every index on a paper section `#f2247a` weight `"700"`; `04 — APPROACH` `#262048` weight `"700"` (blue ground, mark is ink).

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/styles/_tokens.scss app/styles/_nav.scss app/styles/_sections.scss
git commit -m "revert display blue, set indices and wordmark to theme mark at 700"
```

---

## Task 2: Large PROJECTS heading above the Work grid

Per the answered question: Work keeps its `03 — PROJECTS` index **and** gains a large display heading with a superscript count, in the site's own mono display type rather than the reference's grotesque.

**Files:**
- Modify: `components/sections/Work.tsx:85-89`
- Modify: `app/styles/_sections.scss` (`.work` block)

- [ ] **Step 1: Replace the head markup**

In `components/sections/Work.tsx`, replace the `work__head` block. The count lives outside `SmartText` — the engine takes a plain string child and would scramble the parentheses:

```tsx
      <div className="work__head">
        <SmartText className="small index">03 — PROJECTS</SmartText>
      </div>

      <h2 className="work__title">
        <SmartText className="h1" as="span">PROJECTS</SmartText>
        <span className="work__count" aria-hidden="true">({CARDS.length})</span>
      </h2>
```

`CARDS.length` replaces the hand-typed `( 5 )`, so the count can never drift from the array.

- [ ] **Step 2: Style the heading**

In `app/styles/_sections.scss`, replace the `.work` block:

```scss
.work {
  padding: 120rem 0 200rem;

  &__head {
    display: flex;
    justify-content: space-between;
    margin: 0 var(--margin) 24rem;
  }

  /* image 7: the section name at display size with the count set as a
     superscript beside it, not a second column */
  &__title {
    display: flex;
    align-items: flex-start;
    gap: 10rem;
    margin: 0 var(--margin) 80rem;
    font-weight: 700;
  }

  &__count {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 16rem;
    line-height: 1;
    padding-top: 6rem;
    letter-spacing: -0.01em;
  }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Verify the heading renders at display size and the count matches**

```js
(() => {
  const t = document.querySelector('.work__title .smart-text');
  const c = document.querySelector('.work__count');
  return { headingText: t.dataset.stSource, fontSize: getComputedStyle(t).fontSize,
           count: c.textContent, indexStillPresent: !!document.querySelector('.work__head .index') };
})()
```

Expected: `headingText` `"PROJECTS"`, `fontSize` `"76px"` at a 1440 viewport, `count` `"(5)"`, `indexStillPresent` `true`.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Work.tsx app/styles/_sections.scss
git commit -m "add display-size PROJECTS heading with derived count above the work grid"
```

---

## Task 3: Card titles in reference format

Per the answered question: `⁽¹⁾ STARBUCKS` below the frame; the number overlaid on the media goes away.

**Files:**
- Modify: `components/sections/Work.tsx:109-124`
- Modify: `app/styles/_sections.scss` (`.card__media`, `.card__n`, `.card .bottom`, `.card__client`)

- [ ] **Step 1: Move the number out of the media**

In `components/sections/Work.tsx`, replace the anchor's contents:

```tsx
            <a className="card" href={c.href}>
              <span className="card__media" aria-hidden="true" />
              <span className="bottom">
                <span className="card__title">
                  <span className="card__n">({c.n})</span>
                  <span className="card__client">{c.client}</span>
                </span>
                <span className="subtitle">{c.descriptor}</span>
                <span className="services">
                  {c.services.map((s, si) => (
                    <span key={s} style={{ "--i": si } as React.CSSProperties}>
                      {s}
                    </span>
                  ))}
                </span>
              </span>
            </a>
```

Note the order change: the title now comes **first** inside `.bottom`, with `.subtitle` and `.services` below it. Previously `.subtitle` sat above the client name.

- [ ] **Step 2: Restyle the title row**

In `app/styles/_sections.scss`, replace the `.card__media`, `.card__n`, `.card .bottom` and `.card__client` rules with:

```scss
.card__media {
  display: block;
  height: var(--h);
  background: #d9d5cb;
}

.card .bottom {
  display: block;
  padding-top: 14rem;
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 16rem;
  text-transform: uppercase;
}

/* image 1: "(1) RIO LIFE" — index and name on one line, under the frame */
.card__title {
  display: flex;
  gap: 8rem;
}

.card__n,
.card__client {
  display: block;
}
```

The old `.card__n` was absolutely positioned inside `.card__media` in `--paper`; both of those declarations are gone, so it now inherits `--mark` like the rest of the row.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Verify the title is one line below the frame, not overlaid**

```js
(() => {
  const card = document.querySelector('.card');
  const media = card.querySelector('.card__media').getBoundingClientRect();
  const title = card.querySelector('.card__title').getBoundingClientRect();
  const n = card.querySelector('.card__n');
  return {
    titleBelowMedia: title.top >= media.bottom - 1,
    sameLine: Math.abs(title.height - card.querySelector('.card__n').getBoundingClientRect().height) < 2,
    numberText: n.textContent,
    numberPosition: getComputedStyle(n).position
  };
})()
```

Expected: `titleBelowMedia` `true`, `sameLine` `true`, `numberText` `"(01)"`, `numberPosition` `"static"` — i.e. no longer absolutely positioned over the image.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Work.tsx app/styles/_sections.scss
git commit -m "set card titles to (n) CLIENT below the frame, drop the media overlay number"
```

---

## Task 4: Fade the others only when a card is actually hovered

This is a live bug, not just a preference. The suppression selector keys off `.cards:hover`, which matches whenever the pointer is anywhere inside the 1900rem-tall container — including the large empty gaps between the scattered frames. In that case no card matches `:has(.card:hover)`, so `:not(...)` matches **every** card and all five blur at once with nothing in focus.

**Files:**
- Modify: `app/styles/_sections.scss` (the suppression rule)

- [ ] **Step 1: Key the suppression off a hovered card, not a hovered container**

Replace the suppression rule:

```scss
/* Suppression is blur + scale only — opacity NEVER changes — and it fires
   only when a card is genuinely hovered. Keyed off `.cards:hover` it also
   matched the empty space between the scattered frames, blurring all five
   with nothing selected. The reset stays bound to .cards so moving between
   two cards never passes through a neutral frame. */
html[data-touch="false"] .cards:has(.card:hover) .card__pos:not(:has(.card:hover)) .card {
  filter: blur(17rem);
  transform: scale(0.8);
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Verify the selector is present and no card is suppressed at rest**

```js
(() => {
  const rules = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch { return [] } })
    .filter(r => r.selectorText && r.selectorText.includes('card__pos') && r.selectorText.includes('blur') === false
                 && r.style && r.style.filter);
  return {
    selectors: rules.map(r => r.selectorText),
    anySuppressedAtRest: [...document.querySelectorAll('.card')]
      .filter(c => getComputedStyle(c).filter !== 'none').length
  };
})()
```

Expected: the selector string contains `.cards:has(.card:hover)` and **not** `.cards:hover .card__pos`. `anySuppressedAtRest` is `0`.

- [ ] **Step 4: ⚠️ MANUAL — confirm hover behaviour**

The preview pane cannot deliver hover. Ask the user to confirm in a real browser: moving the pointer into the empty space between frames leaves all five sharp; moving onto one frame blurs the other four.

- [ ] **Step 5: Commit**

```bash
git add app/styles/_sections.scss
git commit -m "fix card suppression firing on empty space between frames"
```

---

## Task 5: Tighten the card scatter

**Files:**
- Modify: `components/sections/Work.tsx:29-35` (the `CARDS` array `x` values)
- Modify: `app/styles/_sections.scss` (`.cards` height, `.card__pos:nth-child` tops)

- [ ] **Step 1: Pull the vertical rhythm in**

In `app/styles/_sections.scss`, replace the `.cards` height and the five `top` rules:

```scss
.cards {
  position: relative;
  /* tightened from 1900rem — the reference clusters the frames into a
     readable two-column rhythm rather than a long sparse column */
  height: 1500rem;
  margin: 0 var(--margin);
}

.card__pos {
  position: absolute;
  left: var(--x);
  width: var(--w);
  transform: translateY(var(--py, 0rem));
}

/* stacked tops, matching the reference's scatter */
.card__pos:nth-child(1) { top: 0; }
.card__pos:nth-child(2) { top: 180rem; }
.card__pos:nth-child(3) { top: 520rem; }
.card__pos:nth-child(4) { top: 800rem; }
.card__pos:nth-child(5) { top: 1160rem; }
```

- [ ] **Step 2: Nudge the horizontal positions into two columns**

In `components/sections/Work.tsx`, change only the `x` values in `CARDS` — widths, heights, parallax and services are unchanged:

```tsx
const CARDS: Card[] = [
  { n: "01", client: "STARBUCKS", descriptor: "SEARCH RELEVANCE — RANKING", href: "/work/starbucks-search", x: 40, w: 510, h: 400, p: -120, services: ["QUERY UNDERSTANDING", "RANKING MODEL", "OFFLINE EVALUATION", "ERROR TAXONOMY"] },
  { n: "02", client: "DOORDASH", descriptor: "CAUSAL INFERENCE — RDD", href: "/work/doordash-rdd", x: 800, w: 400, h: 314, p: 0, services: ["IDENTIFICATION", "ROBUSTNESS SUITE", "DECISION MEMO"] },
  { n: "03", client: "MULTI-AGENT RAG", descriptor: "RETRIEVAL — ACTIVATION", href: "/work/multi-agent-rag", x: 120, w: 510, h: 401, p: 8, services: ["AGENT PIPELINE", "VECTOR STORE", "TEST SUITE"] },
  { n: "04", client: "AI JOKE FACTORY", descriptor: "PRODUCT DESIGN — IDENTITY", href: "/work/ai-joke-factory", x: 830, w: 510, h: 401, p: 0, services: ["USER FLOWS", "BACKEND SPEC", "V2 REDESIGN"] },
  { n: "05", client: "DELL", descriptor: "M&A STRATEGY — VALUATION", href: "/work/dell-ma", x: 300, w: 310, h: 227, p: 53, services: ["VALUATION", "MARKET ANALYSIS"] }
];
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Verify nothing overflows the container or the viewport**

```js
(() => {
  const wrap = document.querySelector('.cards').getBoundingClientRect();
  const cards = [...document.querySelectorAll('.card__pos')].map(el => {
    const r = el.getBoundingClientRect();
    return { bottomOverflow: +(r.bottom - wrap.bottom).toFixed(1),
             rightOverflow: +(r.right - wrap.right).toFixed(1) };
  });
  return { cards,
    worstBottom: Math.max(...cards.map(c => c.bottomOverflow)),
    worstRight: Math.max(...cards.map(c => c.rightOverflow)),
    pageHorizOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
})()
```

Expected: `worstBottom` ≤ 0, `worstRight` ≤ 0, `pageHorizOverflow` `0`. If `worstBottom` is positive, raise `.cards` height by that many rem and re-run.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Work.tsx app/styles/_sections.scss
git commit -m "tighten card scatter into a closer two-column rhythm"
```

---

## Task 6: Cursor-relative frame parallax

The frames should drift slightly with the pointer so the grid feels responsive. The existing scroll parallax already owns `--py` on `.card__pos`; a second independent writer would fight it. This task replaces both with one rAF loop writing `--px` and `--py`, and lerps the cursor term so the frames trail the pointer instead of snapping to it.

**Files:**
- Modify: `components/sections/Work.tsx` (the `Card` type, `CARDS` array, the whole parallax effect)
- Modify: `app/styles/_sections.scss` (`.card__pos` transform)

- [ ] **Step 1: Add a depth field to the card type and data**

In `components/sections/Work.tsx`, add `d` to the `Card` type:

```tsx
type Card = {
  n: string;
  client: string;
  descriptor: string;
  href: string;
  x: number;
  w: number;
  h: number;
  /** scroll parallax offset in design px */
  p: number;
  /** cursor parallax depth, 0 = pinned, 1 = full travel */
  d: number;
  services: string[];
};
```

Then add a `d` value to each entry, varying them so the frames separate in depth rather than sliding as one sheet — larger frames read as nearer, so they move more:

```tsx
const CARDS: Card[] = [
  { n: "01", client: "STARBUCKS", descriptor: "SEARCH RELEVANCE — RANKING", href: "/work/starbucks-search", x: 40, w: 510, h: 400, p: -120, d: 1, services: ["QUERY UNDERSTANDING", "RANKING MODEL", "OFFLINE EVALUATION", "ERROR TAXONOMY"] },
  { n: "02", client: "DOORDASH", descriptor: "CAUSAL INFERENCE — RDD", href: "/work/doordash-rdd", x: 800, w: 400, h: 314, p: 0, d: 0.45, services: ["IDENTIFICATION", "ROBUSTNESS SUITE", "DECISION MEMO"] },
  { n: "03", client: "MULTI-AGENT RAG", descriptor: "RETRIEVAL — ACTIVATION", href: "/work/multi-agent-rag", x: 120, w: 510, h: 401, p: 8, d: 0.8, services: ["AGENT PIPELINE", "VECTOR STORE", "TEST SUITE"] },
  { n: "04", client: "AI JOKE FACTORY", descriptor: "PRODUCT DESIGN — IDENTITY", href: "/work/ai-joke-factory", x: 830, w: 510, h: 401, p: 0, d: 0.6, services: ["USER FLOWS", "BACKEND SPEC", "V2 REDESIGN"] },
  { n: "05", client: "DELL", descriptor: "M&A STRATEGY — VALUATION", href: "/work/dell-ma", x: 300, w: 310, h: 227, p: 53, d: 0.3, services: ["VALUATION", "MARKET ANALYSIS"] }
];
```

- [ ] **Step 2: Replace the effect with a single unified loop**

Replace the entire `useEffect` in `components/sections/Work.tsx` with:

```tsx
  /* One loop owns both parallax terms. Two independent writers would each
     clobber the other's transform on `.card__pos`. Scroll is read straight
     from layout; the cursor term is lerped so the frames trail the pointer
     rather than snapping to it. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-in");
      },
      { threshold: 0.15 }
    );
    posRefs.current.forEach((el) => el && io.observe(el));

    if (reduced) return () => io.disconnect();

    /* MAX_SHIFT is in design px, so it scales with the rem trick like
       everything else. 26 is roughly 5% of the widest frame — enough to
       register as motion, small enough that the scatter never reads as
       unstable. */
    const MAX_SHIFT = 26;
    const LERP = 0.08;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;
    let pointerInside = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = wrap.getBoundingClientRect();
      pointerInside = true;
      /* -1 → 1 across the block in both axes */
      targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
      targetY = ((e.clientY - r.top) / r.height) * 2 - 1;
    };

    const onLeave = () => {
      pointerInside = false;
      targetX = 0;
      targetY = 0;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);

      curX += (targetX - curX) * LERP;
      curY += (targetY - curY) * LERP;

      const r = wrap.getBoundingClientRect();
      /* -1 → 1 as the block travels through the viewport */
      const progress =
        1 - (r.top + r.height / 2) / (window.innerHeight / 2 + r.height / 2);

      posRefs.current.forEach((el, i) => {
        if (!el) return;
        const c = CARDS[i];
        el.style.setProperty("--py", `${c.p * progress + curY * MAX_SHIFT * c.d}rem`);
        el.style.setProperty("--px", `${curX * MAX_SHIFT * c.d}rem`);
      });
    };

    raf = requestAnimationFrame(frame);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      void pointerInside;
    };
  }, []);
```

The old `scroll` and `resize` listeners are gone — the loop now samples layout every frame, which is what makes the cursor lerp and the scroll term stay in sync. `pointerInside` is retained and voided so the leave handler's intent stays legible without an unused-variable lint error.

- [ ] **Step 3: Consume the horizontal term**

In `app/styles/_sections.scss`, change `.card__pos`'s transform to read both axes:

```scss
.card__pos {
  position: absolute;
  left: var(--x);
  width: var(--w);
  transform: translate3d(var(--px, 0rem), var(--py, 0rem), 0);
}
```

`translate3d` keeps the frames on their own compositor layers, which matters now that they update every frame rather than only on scroll.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. TypeScript must accept `PointerEvent` and the `d` field with no errors.

- [ ] **Step 5: Verify both custom properties are written and depth differs per card**

```js
(async () => {
  const wrap = document.querySelector('.cards');
  const r = wrap.getBoundingClientRect();
  wrap.dispatchEvent(new PointerEvent('pointermove', {
    clientX: r.left + r.width, clientY: r.top + r.height, pointerType: 'mouse', bubbles: true }));
  await new Promise(res => setTimeout(res, 900));
  return [...document.querySelectorAll('.card__pos')].map(el => ({
    px: el.style.getPropertyValue('--px'), py: el.style.getPropertyValue('--py') }));
})()
```

Expected: every entry has a non-empty `--px` and `--py`. The `--px` magnitudes must differ between cards — card 1 (`d: 1`) largest, card 5 (`d: 0.3`) smallest. If every `--px` is `0rem`, the rAF loop is frozen because the pane is backgrounded; take a screenshot first to force a paint, then re-run.

- [ ] **Step 6: ⚠️ MANUAL — confirm the feel**

Automation cannot move a real pointer. Ask the user to confirm the drift reads as subtle interaction rather than drag, and to say if `MAX_SHIFT` (26) should go up or down.

- [ ] **Step 7: Commit**

```bash
git add components/sections/Work.tsx app/styles/_sections.scss
git commit -m "add cursor-relative frame parallax on a unified rAF loop"
```

---

## Task 7: Vertical contact button with a scroll fold

Per the answered question: vertical from the start; on scroll the text folds away, and the circle shifts up and rotates into place.

**Files:**
- Modify: `app/styles/_nav.scss` (`.nav__contact`, `.buttonText`, the collapsed rule)

- [ ] **Step 1: Stand the button up**

Replace the `.nav__contact` block in `app/styles/_nav.scss`:

```scss
.nav__contact {
  pointer-events: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rem;
  /* NO overflow:hidden here. It clipped the ring's :hover scale — and so
     did the 40×40 viewBox, where an r=18 circle with a 2-wide stroke
     already reaches 19 of the 20 available. The clip is scoped to the text
     alone (.textMask), and the svg paints past its viewport so the ring
     has somewhere to grow. */
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 14rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  svg {
    width: 40rem;
    height: 40rem;
    flex: none;
    overflow: visible;
    transition: transform 1s var(--ease);
  }

  .ring,
  .arrow {
    transition: transform 1s var(--ease);
    transform-origin: 50% 50%;
  }

  &:hover .ring {
    transform: scale(1.15);
  }

  &:hover .arrow {
    transform: scale(0.8) translate(-5%, -5%);
  }
}

/* Vertical run. writing-mode rotates Latin glyphs 90° CLOCKWISE, which puts
   the bottom of each letter toward the LEFT — the mirror of the reference,
   which is what was asked for. Do not add rotate(180deg); that flips it
   back to the reference's orientation. */
.buttonText {
  display: inline-flex;
  writing-mode: vertical-rl;
  transition: transform 1s var(--ease);
}
```

- [ ] **Step 2: Fold the text and lift the circle on scroll**

Replace the collapsed contact rule:

```scss
/* Scrolled down: the label folds up into its own mask, the ring rises into
   the freed space and rotates a quarter turn. --contact-fold is the text
   run's height plus the flex gap, so the ring lands where the text began.
   Hovering the button brings the label back. */
.nav__contact {
  --contact-fold: 136rem;
}

html.is-down:not(.is-start) .nav__contact:not(:hover) {
  .textMask > span:first-child {
    transform: translateY(-110%);
    transition-duration: 1s;
    transition-delay: 0s;
  }

  svg {
    transform: translateY(calc(var(--contact-fold) * -1)) rotate(-90deg);
  }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Verify orientation and that the fold distance matches the text run**

```js
(() => {
  const btn = document.querySelector('.nav__contact');
  const txt = document.querySelector('.nav__contact .buttonText');
  const svg = document.querySelector('.nav__contact svg');
  const tr = txt.getBoundingClientRect(), sr = svg.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(btn).gap);
  const fold = parseFloat(getComputedStyle(btn).getPropertyValue('--contact-fold'));
  return {
    writingMode: getComputedStyle(txt).writingMode,
    textIsTallerThanWide: tr.height > tr.width,
    circleBelowText: sr.top >= tr.bottom - 1,
    measuredRun: +(tr.height + gap).toFixed(1),
    declaredFold: fold,
    foldMatchesRun: Math.abs((tr.height + gap) - fold) < 12
  };
})()
```

Expected: `writingMode` `"vertical-rl"`, `textIsTallerThanWide` `true`, `circleBelowText` `true`, `foldMatchesRun` `true`. If `foldMatchesRun` is `false`, set `--contact-fold` to the reported `measuredRun` value in rem and re-run — the ring must land exactly where the text started, or the fold looks arbitrary.

- [ ] **Step 5: ⚠️ MANUAL — confirm the fold and the rotation direction**

Scroll-driven state and hover cannot be exercised in the preview. Ask the user to confirm: scrolling down folds the label and lifts the ring with a quarter-turn; scrolling up reverses it; hovering the button while scrolled brings the label back. Confirm `rotate(-90deg)` turns the arrow the way they want — `rotate(90deg)` is the other option.

- [ ] **Step 6: Commit**

```bash
git add app/styles/_nav.scss
git commit -m "stand the contact button vertical with a scroll-driven text fold and ring lift"
```

---

## Task 8: Full-width regression sweep

Every earlier fix in this codebase was a width-dependent overflow. The card geometry and the vertical contact button both change layout, so the sweep runs again before this is called done.

**Files:** none — verification only.

- [ ] **Step 1: Sweep the widths**

For each of 320, 390, 430, 768, 1024, 1440: resize the preview, then run:

```js
(async () => {
  await new Promise(r=>setTimeout(r,900));
  const vw = document.documentElement.clientWidth;
  const hits = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > vw + 0.5) {
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        if (getComputedStyle(p).overflowX !== 'visible') { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped) hits.push({ cls: (el.className||'').toString().slice(0,40), over: +(r.right-vw).toFixed(1) });
    }
  });
  return { vw, horizOverflow: document.documentElement.scrollWidth - vw, offenders: hits.slice(0,8) };
})()
```

Expected at every width: `horizOverflow` `0`, `offenders` `[]`.

- [ ] **Step 2: Confirm no text clips at any width**

At 390 and 1440, force every line settled and check ink against the clip window:

```js
(async () => {
  document.querySelectorAll('.smart-text').forEach(s=>s.classList.add('is-revealed'));
  await new Promise(r=>setTimeout(r,2600));
  const ctx = document.createElement('canvas').getContext('2d');
  const bad = [];
  document.querySelectorAll('.smart-text:not(.is-body).is-revealed').forEach(st => {
    const fs = parseFloat(getComputedStyle(st).fontSize);
    st.querySelectorAll('.line').forEach(l => {
      const t = l.querySelector('.text');
      if (!t || t.classList.contains('scrambled')) return;
      const cs = getComputedStyle(st);
      ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      const m = ctx.measureText(t.textContent || 'HXO');
      const lr = l.getBoundingClientRect(), tr = t.getBoundingClientRect();
      const hl = (parseFloat(cs.lineHeight) - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const base = tr.top + hl + m.fontBoundingBoxAscent;
      const below = (base + m.actualBoundingBoxDescent) - lr.bottom;
      const above = lr.top - (base - m.actualBoundingBoxAscent);
      if (below > 0.06 || above > 0.06) bad.push({ cls: st.className, txt: (t.textContent||'').slice(0,18) });
    });
  });
  return { clipped: bad.length, sample: bad.slice(0,6) };
})()
```

Expected: `clipped` `0`. Weight 700 changes glyph metrics, so this must be re-run rather than assumed from the earlier pass — bolder letterforms have wider ink boxes and can newly collide with the `--st-window` clip.

- [ ] **Step 3: Commit any fallout**

If a width regressed, fix it and commit separately:

```bash
git add -A
git commit -m "fix <width> regression from work grid and contact button changes"
```

---

## Self-Review

**Spec coverage:**

| Request | Task |
|---|---|
| PROOF FIRST back to previous colour | 1 |
| Bold name, theme colour | 1 |
| Other headings back to pink and bold | 1 |
| Selected work heading like image 7, index kept | 2 |
| Card title before hover, reference format | 3 |
| Fade the rest only when one is selected | 4 |
| Details on hover "like we have now" | unchanged — `.subtitle` / `.services` already do this; Task 3 keeps them and only reorders the title above them |
| Boxes closer together | 5 |
| Frames move with cursor | 6 |
| Contact vertical, text bottom toward left | 7 |
| Contact fold + ring lift and rotate on scroll | 7 |

**Type consistency:** `d` is added to the `Card` type in Task 6 Step 1 and read as `c.d` in Step 2. `--px` is written in Task 6 Step 2 and consumed in Step 3. `--contact-fold` is declared and read in the same block in Task 7. `.card__title` is introduced in Task 3 Step 1 and styled in Step 2.

**Open risk, flagged not hidden:** Task 1 adds weight 700 to both families, which increases the font payload and changes ink metrics site-wide. Task 8 Step 2 exists specifically to catch clip-window collisions that the bolder letterforms could newly cause. If it fires, the fix is a per-class `--st-shift` / `--st-window` adjustment, the same mechanism already used for `.super` and `.h1`.
