/* ============================================================
   The wall itself — a dark painted-over brick wall carrying years of
   tags, buff patches, stickers and stains. Everything here is texture;
   meaning lives in the h1 and the nav, so the whole layer is hidden
   from assistive tech.

   Tags are real text in the marker face (rotated, faded) because
   convincing handstyles come from a handstyle font, not from paths
   I invent. Words are neutral studio-wall noise, not content.
   ============================================================ */

const TAGS = [
  { text: "north star", x: 6, y: 12, r: -8, s: 1.6, c: "--g-tag-cream", o: 0.42 },
  { text: "ship it", x: 74, y: 8, r: 5, s: 1.3, c: "--g-tag-red", o: 0.48 },
  { text: "no. 82", x: 88, y: 30, r: -12, s: 1.05, c: "--g-tag-teal", o: 0.46 },
  { text: "prototype ✕ polish", x: 4, y: 55, r: -90, s: 1.05, c: "--g-tag-cream", o: 0.32 },
  { text: "every pixel earns rent", x: 30, y: 91, r: -3, s: 1.1, c: "--g-tag-teal", o: 0.38 },
  { text: "why not?", x: 79, y: 62, r: 8, s: 1.15, c: "--g-tag-red", o: 0.4 },
  { text: "measure twice", x: 11, y: 72, r: -6, s: 0.95, c: "--g-tag-cream", o: 0.34 },
  { text: "LA ✦", x: 90, y: 88, r: -10, s: 1.4, c: "--g-tag-cream", o: 0.44 }
];

export default function GraffitiWall() {
  return (
    <div className="g-wall" aria-hidden="true">
      {/* painted-over patches where old pieces were buffed */}
      <div className="g-wall__buff g-wall__buff--a" />
      <div className="g-wall__buff g-wall__buff--b" />
      <div className="g-wall__buff g-wall__buff--c" />
      <div className="g-wall__buff g-wall__buff--d" />

      {/* runs of old paint bleeding down from the top edge */}
      <svg className="g-wall__drips" viewBox="0 0 1440 140" preserveAspectRatio="none">
        <g fill="var(--g-wall-drip)">
          <path d="M120 0 h26 v34 c0 8 -5 14 -12 14 c-8 0 -14 -7 -14 -16 Z" opacity="0.5" />
          <path d="M410 0 h14 v76 c0 6 -3 10 -7 10 c-4 0 -7 -4 -7 -11 Z" opacity="0.42" />
          <path d="M980 0 h20 v52 c0 7 -4 12 -10 12 c-6 0 -10 -5 -10 -13 Z" opacity="0.5" />
          <path d="M1280 0 h12 v40 c0 5 -2 9 -6 9 c-4 0 -6 -4 -6 -10 Z" opacity="0.38" />
        </g>
      </svg>

      {/* faded handstyle tags from previous visitors */}
      {TAGS.map((t, i) => (
        <span
          key={i}
          className="g-wall__tag"
          style={
            {
              left: `${t.x}%`,
              top: `${t.y}%`,
              "--tr": `${t.r}deg`,
              "--ts": t.s,
              "--tc": `var(${t.c})`,
              "--to": t.o
            } as React.CSSProperties
          }
        >
          {t.text}
        </span>
      ))}

      {/* small doodles: crown, stars, arrow */}
      <svg className="g-wall__doodle" style={{ left: "68%", top: "16%", width: "min(6vw, 74px)" }} viewBox="0 0 80 50">
        <path
          d="M8 42 L 12 16 L 26 30 L 40 8 L 54 30 L 68 16 L 72 42 Z"
          fill="none" stroke="var(--g-tag-cream)" strokeWidth="4" strokeLinejoin="round" opacity="0.4"
        />
      </svg>
      <svg className="g-wall__doodle" style={{ left: "17%", top: "34%", width: "min(3.4vw, 44px)" }} viewBox="0 0 40 40">
        <path
          d="M20 2 L 24 15 L 38 16 L 27 24 L 31 38 L 20 29 L 9 38 L 13 24 L 2 16 L 16 15 Z"
          fill="var(--g-tag-red)" opacity="0.34"
        />
      </svg>
      <svg className="g-wall__doodle" style={{ left: "83%", top: "45%", width: "min(7vw, 92px)" }} viewBox="0 0 100 40">
        <path
          d="M4 22 C 30 10, 58 10, 82 18 M 82 18 L 68 8 M 82 18 L 66 28"
          fill="none" stroke="var(--g-tag-teal)" strokeWidth="4" strokeLinecap="round" opacity="0.4"
        />
      </svg>
    </div>
  );
}
