# Frank Fu — portfolio

Personal portfolio. **v2 is in progress — the design direction is not chosen yet.**
The repo is currently a blank canvas on the v1 toolchain.

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
| `app/` | `layout.tsx`, `page.tsx`, `styles/globals.scss` — minimal placeholders. `globals.scss` is a bare reset with no palette, type scale, or motion tokens; v2 defines those. |
| `data/projects.ts` | Real project content, kept. Some fields are v1-specific (`palette`, `descriptor`, `index`) and were shaped for the gradient and filmstrip. Reshape the type freely for v2. |
| `public/work/` | Project images, 16:10. |
| `docs/v1/` | v1 design spec, for reference only. |
| `project_raw/` | Source material (decks, PDFs). Gitignored. |
