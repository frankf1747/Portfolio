# Frank Fu — portfolio

Personal portfolio. **v2 in progress** — a graffiti-wall hero: a dark
painted-over brick wall carrying a rotating throw-up (DATA ENTHUSIAST /
PRODUCT CREATOR / UX DESIGNER), stencilled navigation, a wheat-pasted
statement poster, faded handstyle tags — and an interactive spray layer:
visitors click-drag to spray the wall, pick from three caps, and BUFF to
clear. (The earlier painted-explosion direction lives in git history at
`22035f4`.)

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
| `components/Hero.tsx` | Orchestration: title rotation, entrance, reduced-motion, cap/buff state. |
| `components/GraffitiPiece.tsx` | The rotating h1 throw-up: halo / 3D block / textured face / drips, per-title colourways. |
| `components/GraffitiWall.tsx` | The wall: brick + buff patches + faded tags + doodles (all decorative). |
| `components/SprayCanvas.tsx` | Interactive spray layer — pointer drag paints, linger drips, BUFF clears. |
| `app/styles/graffiti.scss` | The whole look: wall texture, piece layering, spray-in transition, furniture, responsive + reduced-motion. |
| `data/projects.ts` | Real project content, kept from v1. Reshape the type freely. |
| `public/assets/` | Drop-in point for final artwork (see its README). |
| `public/work/` | Project images, 16:10. |
| `docs/v1/` | v1 design spec, for reference only. |
| `project_raw/` | Source material (decks, PDFs). Gitignored. |
