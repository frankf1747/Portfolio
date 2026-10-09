import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/* Link-preview cards, styled after the project report covers: a small
   wordmark, the name in heavy condensed capitals, a one-line pitch in ink,
   and a field of mono characters fading in from the right with a few lit in
   the accent. Rendered at build time and written out as real .png files
   (see app/og), since Cloudflare types assets by extension. */
export const ogSize = { width: 1200, height: 630 };

const PAPER = "#f5f3ec";
const ACCENT = "#f2247a";
const INK = "#262048";
const YELLOW = "#ffe500";
const BLUE = "#7fdcf2";

/* Each card takes one of the site's grounds, so cards shared side by side
   read as a set without being copies. Following §2, the headline and the lit
   characters share one mark colour. field is the strength of the faint
   characters, raised on the dark grounds where they would otherwise vanish. */
export type OgTheme = { ground: string; mark: string; text: string; field: number };
export const OG_THEMES = {
  paper: { ground: PAPER, mark: ACCENT, text: INK, field: 0.13 },
  ink: { ground: INK, mark: ACCENT, text: PAPER, field: 0.16 },
  yellow: { ground: YELLOW, mark: INK, text: INK, field: 0.14 },
  pink: { ground: ACCENT, mark: PAPER, text: PAPER, field: 0.2 },
  blue: { ground: BLUE, mark: INK, text: INK, field: 0.14 }
} satisfies Record<string, OgTheme>;
const THEME_ORDER: OgTheme[] = Object.values(OG_THEMES);
export const themeAt = (i: number) => THEME_ORDER[i % THEME_ORDER.length];

/* Satori needs TTF/WOFF (not WOFF2), so the faces are kept here rather than
   taken from next/font. Archivo 900 at width 62.5 is the condensed display
   face; Archivo is also the site's body face. */
const FONT_DIR = path.join(process.cwd(), "lib/og-fonts");
type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
let fonts: Promise<Fonts> | undefined;
function loadFonts() {
  fonts ??= Promise.all(
    [
      ["Display", "archivo-condensed-900.woff", 900],
      ["Archivo", "archivo-500.woff", 500],
      ["Archivo", "archivo-700.woff", 700],
      ["Mono", "plex-mono-500.woff", 500]
    ].map(async ([name, file, weight]) => ({
      name: name as string,
      data: await readFile(path.join(FONT_DIR, file as string)),
      weight: weight as 500 | 700 | 900,
      style: "normal" as const
    }))
  );
  return fonts;
}

/* Cut on a word boundary so the ellipsis never splits a word. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

/* The largest size at which the headline, wrapped greedily, fits the box.
   CHAR is the condensed face's average capital advance in em. */
const CHAR = 0.45;
const LINE = 0.86;
function fitHeadline(text: string, maxW: number, maxH: number) {
  const words = text.split(/\s+/);
  for (let size = 190; size > 56; size -= 4) {
    const perLine = Math.floor(maxW / (size * CHAR));
    if (words.some((w) => w.length > perLine)) continue;
    let lines = 1;
    let len = 0;
    for (const w of words) {
      const next = len ? len + 1 + w.length : w.length;
      if (next > perLine) { lines++; len = w.length; } else len = next;
    }
    if (lines * size * LINE <= maxH) return size;
  }
  return 56;
}

/* Deterministic per card, so a rebuild doesn't reshuffle the field. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/;:,.";
const COLS = 26;
const ROWS = 15;
const CELL_W = 25.5;
const CELL_H = 38;

function Field({ seed, theme }: { seed: string; theme: OgTheme }) {
  const rand = rng(seed);
  return (
    <div style={{ position: "absolute", top: 26, right: -4, display: "flex", flexDirection: "column" }}>
      {Array.from({ length: ROWS }, (_, r) => (
        <div key={r} style={{ display: "flex", height: CELL_H }}>
          {Array.from({ length: COLS }, (_, c) => {
            /* Fades in left to right, and a little toward the bottom-left. */
            const t = Math.max(0, Math.min(1, (c / (COLS - 1)) * 1.5 - 0.35 - (r / ROWS) * 0.15));
            const lit = rand() < 0.08 && t > 0.55;
            const ch = GLYPHS[Math.floor(rand() * GLYPHS.length)];
            return (
              <div
                key={c}
                style={{
                  width: CELL_W,
                  display: "flex",
                  justifyContent: "center",
                  fontFamily: "Mono",
                  fontSize: 27,
                  color: lit ? theme.mark : theme.text,
                  opacity: lit ? 0.35 + t * 0.6 : t * theme.field
                }}
              >
                {ch}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export async function ogCard({
  seed, headline, body, theme = OG_THEMES.paper
}: { seed: string; headline: string; body: string; theme?: OgTheme }) {
  const title = headline.toUpperCase();
  const size = fitHeadline(title, 1040, 330);
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "52px 72px 54px",
          background: theme.ground,
          color: theme.text,
          fontFamily: "Archivo"
        }}
      >
        <Field seed={seed} theme={theme} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: theme.mark, letterSpacing: -1.2 }}>Frank Fu</div>
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r="21.5" fill={theme.ground} stroke={theme.text} strokeWidth="2" />
            <path d="M17 29 L29 17 M19.5 17 H29 V26.5" fill="none" stroke={theme.text} strokeWidth="2" />
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Display",
              fontWeight: 900,
              fontSize: size,
              lineHeight: LINE,
              color: theme.mark,
              maxWidth: 1060
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.32, maxWidth: 600 }}>{clip(body, 110)}</div>
      </div>
    ),
    { ...ogSize, fonts: await loadFonts() }
  );
}
