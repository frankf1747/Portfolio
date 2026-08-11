# Taste Discovery Workflow — Design

**Date:** 2026-08-08
**Status:** approved, running
**Purpose:** Convert Frank Fu's unarticulated visual taste into a reproducible token set for his portfolio site, via a structured specimen-and-hypothesis loop.

## Problem

Frank knows what he likes when he sees it but cannot specify it up front. Asking "what's your style?" yields vibe words that don't compile into design decisions. The workflow must extract specifics from examples, and must survive being turned into a reusable skill afterward.

## Architecture — two layers

**Layer 1: Specimen ledger (immutable).** One card per artifact Frank supplies. Written once on intake, appended to only with his verdict. Never retro-edited. Preserves the record of wrong hypotheses, which is the highest-value data for skill extraction.

**Layer 2: Taste Profile (living).** Aggregates specimens into traits, each carrying a confidence tier. Rewritten freely.

Storage: `Obsidian/General/Portfolio/` — the vault is the brain; the GitHub repo holds only site code and this spec. The vault is not under git, so specs mirror into `docs/`.

```
Portfolio/
├── Taste Profile.md        living, single source of truth
├── Specimens/S01…Sxx.md    immutable cards
├── Probes/P01…Pxx.md       checkpoint results
├── Design Tokens/          compiled output (written at exit)
└── Content/                phase 2
```

## The rubric

Six fixed dimensions, applied identically to every specimen. Fixed ordering matters more than completeness — consistency across cards is what makes patterns visible.

1. **Color** — dominant hues, saturation/value character, contrast *strategy*, temperature, where accent is permitted to appear
2. **Typography** — family/classification, weight set actually in use, size:line-height ratio, case, tracking, signature glyph treatments
3. **Layout** — grid, density, margin strategy, symmetry, where content starts
4. **Geometry & texture** — radii, borders, flat vs. depth, shadow model, grain/noise and *how it is produced*
5. **Motion & interaction** — what moves, ambient vs. reactive, easing, triggers, interaction density
6. **Mood** — exactly three adjectives

Numbers over adjectives wherever measurable. "Negative leading at 0.93" beats "tight type."

## Confidence tiers

`hypothesis` → proposed, untested · `recurring` → 2+ specimens · `confirmed` → Frank explicitly agreed · `contested` → Frank pushed back

Anti-taste tracked with equal weight; rejections constrain the design space as much as preferences.

## The loop

**Per drop (~2 min).** Frank sends an artifact, optionally with one line of context. I extract against the rubric → write the immutable card → surface 1–2 **falsifiable** hypotheses in chat. Falsifiable means naming the *specific* attribute responsible, not "you like this." Frank confirms or corrects. Verdict logged verbatim. Profile updated.

**Investigate, don't assume.** Where a claim is checkable (fonts, weights, ratios, whether grain is a PNG or a shader), check it. Report failed investigations as failed — see S01, where cursor-reactivity could not be isolated from ambient animation and was recorded as unproven rather than asserted.

**Every ~5 specimens — checkpoint probe.** Render 2–3 low-fidelity style tiles predicting Frank's taste; he ranks them. Cheap inline SVG, no polish. Logged to `Probes/` with a stability readout (traits confirmed / contested / unknown).

**Exit:** Frank calls it. The stability readout informs the call but does not gate it.

## Compilation

On exit, the Taste Profile compiles to `Design Tokens/tokens.yaml` — palette with usage roles, type scale, spacing, radii, motion vocabulary — plus a one-paragraph style brief. Phase 2 (site build) consumes that file directly, with no reinterpretation.

## Skill extraction

After compilation, the rubric + loop + probe protocol are extracted into a reusable `taste-discovery` skill, stripped of Frank-specific data. The specimen ledger's record of corrected hypotheses is the evidence base for tuning that skill's extraction prompts.

## Non-goals

- Not a design system. Tokens describe *taste*, not components.
- Not content strategy. Portfolio content is phase 2 and deliberately excluded.
- Not accessibility auditing. Contrast is analyzed as an aesthetic strategy here; a11y review happens at build time.
