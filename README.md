# Frank Fu — portfolio

Personal portfolio. **v4 in progress** — Valiente-style motion mechanics on
a two-colour ground. A scramble/rise text engine drives every heading, the
nav collapses to seven hairlines and re-decodes on hover, and the giant
headline is an overture that plays once and exits. No GSAP, no keyframes —
CSS transitions, class toggling, and one text-splitting utility.

## Versions

| Version | Where | What it was |
|---|---|---|
| **v1** | tag `v1.0.0`, branch `v1` | Dark WebGL portfolio. One fullscreen animated grain-textured gradient as the only source of colour; motion as the design language. |
| **v2** | tag `v2.0.0`, branch `v2` | Graffiti wall. Rotating throw-up over painted-over brick, stencil nav, wheat-pasted poster, interactive spray-paint canvas. |
| **v3** | tag `v3.0.0`, branch `v3` | Hand-drawn wireframe. Ink on paper, wobbled sketch boxes, editorial layout. |
| **v4** | `main` | Scramble/rise text engine, collapsing hairline nav, overture hero. Two colours plus two ground inversions. |

Browse or run an earlier version:

```bash
git checkout v1
```

v1's design spec lives at `docs/v1/2026-08-08-taste-discovery-design.md` and stays on
`main` for reference. Nothing about it constrains v4.

## Stack

- **Next.js 14 (App Router) + TypeScript**, static-exportable (`output: "export"`)
- **SCSS**, hand-written, no Tailwind
- **next/font** — IBM Plex Mono (display + UI) + Archivo (body/h2), self-hosted
- **Lenis** for smooth scroll — the only animation library. GSAP was removed:
  every motion here is a CSS transition plus class toggling, and there are
  **zero `@keyframes`** in the codebase.

## Two deliberate departures from the v4 spec

**Scramble space polarity.** The spec's verbatim CSS reads
`.scrambled .scrambled-space { width: 0.25em }` over a `0` default — gaps
*present* while scrambling. Its prose and its fidelity checklist both say
the opposite ("scrambled lines have NO word gaps; gaps grow as they
resolve"), and the prose visibly corrects itself mid-sentence. The
behaviour is implemented, not the literal block: gaps and word padding
both collapse to zero under `.scrambled` and animate open on resolve.
Measured — a hero line is 1317px scrambled, 1433px resolved.

**Display metrics.** GT Pressura Mono is unusually narrow (~0.5em
advance), which is what lets a literal 245rem carry a 13-character line
inside the 110% overture frame. Both named free substitutes are wider —
IBM Plex Mono 0.6em, Martian Mono 0.70em — so the literal size overflows
by 300–500px. `--mono-fit: 0.8` in `_tokens.scss` scales the three mono
display steps to restore the measured *line width*, which is what the
overture geometry and column spans actually depend on.

Also: `--column` is written as the standard 12-column formula. The spec
prints `100vw*100/12 - …`, which resolves to 8.3 viewport widths.

## The rem trick

§1 sets `html { font-size: calc(100vw / 1440) }`, so **1rem === 1 design pixel on a
1440 artboard, at every width**. Every dimension is authored in rem; px is reserved
for hairlines. That is kept verbatim for desktop. Below 1024 it can't hold — body
text would fall under 11px and the 1440-wide geometry would overflow — so each
breakpoint re-bases the canvas with a clamp and unwinds the desktop-only geometry:
the scattered work canvas becomes a grid, fixed widths go fluid, display type comes
down.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes a static export to `out/` via `.next-build`, so a production
build can never clobber a running dev server's chunks.

## What's here

| Path | Notes |
|---|---|
| `lib/smartText.ts` | §4 text engine — line splitting, rise, scramble, space unpacking, resize re-split. Everything else depends on it. |
| `components/SmartText.tsx` | React wrapper: `mount` / `view` / `manual` triggers. |
| `components/Nav.tsx` | §6 — seven items, hairline collapse, scramble replay on expand. |
| `components/Preloader.tsx` | §5 asset gate. Nothing drawn on it; `site:reveal` is t=0. |
| `components/ScrollProvider.tsx` | `data-touch`, frozen `--start-vh`, Lenis, `.is-start`/`.is-down`. |
| `components/sections/*` | Hero, Reel, About, Statement, Capabilities, Work, Approach, Subjects, Contact. |
| `app/styles/_tokens.scss` | §1 measurement, §2 colour, §3 type, §7 underlines, contrast fallback. |
| `app/styles/_smart-text.scss` | §4 CSS — the 0.73em mask and the unpacking. |
| `app/styles/_nav.scss` | §6 state machine + §8 contact button. |
| `app/styles/_sections.scss` | Section geometry, §9 portfolio, responsive. |
| `data/projects.ts` | Real project content, kept from v1. Reshape the type freely. |
| `public/assets/` | Drop-in point for final artwork (see its README). |
| `public/work/` | Project images, 16:10. |
| `docs/v1/` | v1 design spec, for reference only. |
| `project_raw/` | Source material (decks, PDFs). Gitignored. |
