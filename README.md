# Frank Fu — portfolio

Personal portfolio. **v2 in progress** — a maximalist painted-explosion hero:
a dark abstract painting erupting around a central figure, with giant
DATA / PRODUCT / DESIGN typography embedded in the artwork. All marks are
inline SVG roughened by displacement filters; see `public/assets/README.md`
for swapping in final painted assets.

## Versions

| Version | Where | What it was |
|---|---|---|
| **v1** | tag `v1.0.0`, branch `v1` | Dark WebGL portfolio. One fullscreen animated grain-textured gradient as the only source of colour; motion as the design language. Filmstrip Recent Work, wipe-panel route transitions, custom cursor. |
| **v2** | `main` | Being designed now. Deliberately unrelated to v1's style. |

Browse or run v1:

```bash
git checkout v1
```

Its design spec lives at `docs/v1/2026-08-08-taste-discovery-design.md` and stays on
`main` for reference. Nothing about v1 needs to constrain v2.

## Stack

Carried over from v1 on purpose — the toolchain was fine, the aesthetic is what's being replaced.

- **Next.js 14 (App Router) + TypeScript**, static-exportable (`output: "export"`)
- **SCSS**, hand-written, no Tailwind
- **GSAP + ScrollTrigger** and **Lenis** are still in `package.json`. Nothing imports
  them right now. Keep them if v2 wants motion; drop them from `package.json` if it doesn't.

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
| `components/Hero.tsx` | Hero orchestration: focus rotation, burst, parallax, entrance, reduced-motion. |
| `components/BrushField.tsx` | Renders the brush-mark layers; supports swapping any mark for a raster asset. |
| `components/CenterFigure.tsx` | Placeholder central character (REPLACE-ME). |
| `components/FocusMotifs.tsx` | Per-focus structural motifs (grids/charts, flow blocks, gestures). |
| `lib/strokes.ts` | The whole painted composition as data: shape library + instance table. |
| `app/styles/hero.scss` | Layering, typography transitions, burst/drift animation, responsive + reduced-motion. |
| `data/projects.ts` | Real project content, kept from v1. Reshape the type freely. |
| `public/assets/` | Drop-in point for final painted artwork (see its README). |
| `public/work/` | Project images, 16:10. |
| `docs/v1/` | v1 design spec, for reference only. |
| `project_raw/` | Source material (decks, PDFs). Gitignored. |
