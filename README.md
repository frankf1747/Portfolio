# Frank Fu — portfolio

Personal portfolio. **v3 in progress** — a hand-drawn wireframe aesthetic:
ink on paper, wobbled sketch boxes, hatched placeholders, and a 12-column
review grid you can toggle with `G`. Ported from the Claude Design project
[Portfolio Wireframe](https://claude.ai/design/p/b4f712ca-02d6-46b0-9df1-9c76c0e07e89).

## Versions

| Version | Where | What it was |
|---|---|---|
| **v1** | tag `v1.0.0`, branch `v1` | Dark WebGL portfolio. One fullscreen animated grain-textured gradient as the only source of colour; motion as the design language. |
| **v2** | tag `v2.0.0`, branch `v2` | Graffiti wall. Rotating throw-up over painted-over brick, stencil nav, wheat-pasted poster, interactive spray-paint canvas. |
| **v3** | `main` | Hand-drawn wireframe. Ink on paper, wobbled sketch boxes, editorial layout. |

Browse or run an earlier version:

```bash
git checkout v1
```

v1's design spec lives at `docs/v1/2026-08-08-taste-discovery-design.md` and stays on
`main` for reference. Nothing about it constrains v3.

## Stack

- **Next.js 14 (App Router) + TypeScript**, static-exportable (`output: "export"`)
- **SCSS**, hand-written, no Tailwind
- **next/font** — Archivo (display) + IBM Plex Mono (everything else), self-hosted
- **GSAP + ScrollTrigger** and **Lenis** are still in `package.json` but unimported.
  v3 needs no motion library; drop them if nothing brings them back.

## The rem trick

The wireframe sets `html { font-size: calc(100vw / 1440) }`, so **1rem === 1px on a
1440 canvas** — every number in `wireframe.scss` is "pixels at 1440", scaling fluidly
with the viewport. That is kept verbatim for desktop. Below 1024 it can't hold (body
text would drop under 11px and the 1440-wide geometry would overflow), so each
breakpoint re-bases the canvas with a clamp that keeps body text in a 14–19px band,
and the desktop-only geometry is unwound — the scattered work canvas becomes a grid,
fixed widths go fluid, and the giant display type comes down to fit.

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
| `components/SketchFilters.tsx` | The three `feTurbulence`/`feDisplacementMap` wobble filters every hand-drawn edge references, plus shared `Arrow`/`ArrowOut`. |
| `components/GridOverlay.tsx` | The 12-column review grid — `G` key or the button. The only client component. |
| `components/sections/*` | One file per section: nav, hero, showreel, intro, focus, selected work, bio, manifesto, contact. |
| `app/styles/wireframe.scss` | Design tokens, sketch primitives, every section, and the responsive re-basing. |
| `data/projects.ts` | Real project content, kept from v1. Reshape the type freely. |
| `public/assets/` | Drop-in point for final artwork (see its README). |
| `public/work/` | Project images, 16:10. |
| `docs/v1/` | v1 design spec, for reference only. |
| `project_raw/` | Source material (decks, PDFs). Gitignored. |
