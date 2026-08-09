# Frank Fu — portfolio

Dark, WebGL-driven personal portfolio. One animated grain-textured gradient
is the only source of colour; motion is the design language.

## Stack

- **Next.js 14 (App Router) + TypeScript**, static-exportable (`output: "export"`)
- **SCSS**, hand-written, BEM-ish `c-Component-element` naming — no Tailwind
- **GSAP + ScrollTrigger** — all scroll choreography
- **Lenis** — smooth scroll, driven from `gsap.ticker` (one clock), auto-disabled
  on touch and `prefers-reduced-motion`
- **Hand-rolled WebGL2** fullscreen shader (no three/OGL dependency)

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to out/
```

## Architecture

| Piece | File | Notes |
|---|---|---|
| Gradient singleton | `lib/gradient.ts` | Fullscreen triangle, GLSL ES 3.0, simplex noise inlined, double domain warp, film-grain dither. Persists across routes — mounted once in `Shell`, never unmounts. |
| Motion core | `lib/motion.ts` | Lenis + ScrollTrigger wiring, ease tokens, line-split utility. |
| Global shell | `components/Shell.tsx` | Nav, cursor, preloader, wipe-panel page transitions. Route content swaps inside it. |
| Transitions | `lib/transition.ts` + `components/TransitionLink.tsx` | Black panel wipes up, route pushes, panel wipes off. Canvas never flashes. |
| Content | `data/projects.ts` | **The only file you need to touch to change projects.** Typed; each project carries its own 4-colour gradient palette. |

## Swapping things

- **Palette**: edit a project's `palette` in `data/projects.ts`; the pinned
  Selected Work deck crossfades the background to it via `gradient.setPalette()`.
  The home palette lives in `PALETTES.home` in `lib/gradient.ts`.
- **Fonts**: the Fontshare `<link>` in `app/layout.tsx` + the `font-family`
  stack in `app/styles/globals.scss`. Weights 400/800 only, by design.
- **Gradient character**: `state` defaults in `lib/gradient.ts` —
  `displacement` (warp depth), `spacing` (noise frequency), `zoom`,
  `colorSpread` (falloff sharpness), `noiseIntensity` (grain).

## Accessibility / performance

- `prefers-reduced-motion`: Lenis off, gradient frozen to a static frame,
  reveals instant, no cursor lens, deck unpinned.
- WebGL2 unavailable → pure-black page remains fully readable (all text is DOM).
- DPR capped at 1 for the gradient (coarse grain is intentional and cheap);
  RAF pauses when the tab is hidden.
- Semantic HTML, real links/buttons, visible focus rings, keyboard-reachable
  pinned section (it is normal scroll, never hijacked).

## Known gaps (deliberate, v1)

- Project "images" are palette gradients — swap in real media per project
  when demo videos are ready (each `body` block of kind `full`/`split`).
- The hero lens is a CSS `clip-path` reveal, not a refractive shader; the
  upgrade path is rasterising the alt headline into a texture the gradient
  shader samples.
- `?debug` tuning panel not yet built; tune uniforms in `lib/gradient.ts`.
