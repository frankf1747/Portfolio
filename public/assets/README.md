# Final artwork assets

The hero currently paints everything with inline SVG placeholders. Real
painted assets drop in here and take over, keeping every animation:

| File | Replaces | How to wire it |
|---|---|---|
| `background.webp` | The CSS radial-gradient ground | Set it as `background-image` on `.c-hero__ground` in `app/styles/hero.scss` (search REPLACE-ME). |
| `character.png` | The placeholder SVG figure | Swap the `<svg>` in `components/CenterFigure.tsx` for `<img className="c-figure__art" src="/assets/character.png" alt="…" />`. |
| `strokes/back-01.png`, `strokes/mid-01.png`, `strokes/front-01.png`, … | Individual inline brush marks | In `lib/strokes.ts`, add `src: "/assets/strokes/mid-01.png"` to any instance. BrushField then renders the image instead of the inline path — position, parallax, drift and burst keep working unchanged. |

Guidelines for stroke assets: transparent PNG or WebP, trimmed tight to
the mark, roughly the aspect ratio of the `w`/`h` on the instance they
replace, 2× resolution of their largest on-screen size.
