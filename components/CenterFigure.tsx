/* ============================================================
   Central figure — PLACEHOLDER ARTWORK.

   REPLACE-ME: swap this whole SVG for the final character asset.
   Keep the wrapper markup in Hero.tsx (`.c-figure`) so the parallax,
   entrance and layering keep working. A transparent PNG/WebP drops in
   as <img className="c-figure__art" alt="" />; an SVG can replace the
   <svg> below directly.

   The silhouette is deliberately near-black and small. In the reference
   the figure reads as a hole punched through the colour, not an object
   sitting on top of it — keeping it dark and compact is what preserves
   the focal point.
   ============================================================ */

export default function CenterFigure() {
  return (
    <svg
      className="c-figure__art"
      viewBox="0 0 240 560"
      role="img"
      aria-label="Illustration of a standing figure at the centre of the composition"
      focusable="false"
    >
      <g fill="var(--figure-ink)">
        {/* erupting hair */}
        <path d="M90 110 C 86 92, 88 74, 94 60 L 97 86 L 106 38 L 111 78 L 120 28 L 129 78 L 138 40 L 143 84 L 152 56 L 155 90 L 163 70 C 157 92, 153 104, 151 114 Z" />
        {/* head */}
        <ellipse cx="120" cy="110" rx="29" ry="33" />
        {/* torso */}
        <path d="M120 140 C 100 142, 86 156, 80 184 C 74 214, 74 268, 78 306 C 80 330, 82 348, 84 362 L 156 362 C 158 348, 160 330, 162 306 C 166 268, 166 214, 160 184 C 154 156, 140 142, 120 140 Z" />
        {/* arms */}
        <path d="M84 168 C 72 186, 64 220, 62 254 C 61 278, 62 300, 64 316 L 78 316 C 76 300, 75 278, 76 254 C 78 222, 84 192, 94 176 Z" />
        <path d="M156 168 C 168 186, 176 220, 178 254 C 179 278, 178 300, 176 316 L 162 316 C 164 300, 165 278, 164 254 C 162 222, 156 192, 146 176 Z" />
        {/* legs */}
        <path d="M86 362 C 84 400, 84 452, 86 496 L 104 496 C 106 452, 108 402, 110 364 Z" />
        <path d="M154 362 C 156 400, 156 452, 154 496 L 136 496 C 134 452, 132 402, 130 364 Z" />
      </g>

      <g fill="var(--figure-hi)">
        {/* eyes */}
        <ellipse cx="110" cy="108" rx="4" ry="5.5" />
        <ellipse cx="131" cy="108" rx="4" ry="5.5" />
        {/* buttons */}
        <circle cx="120" cy="178" r="3.6" />
        <circle cx="120" cy="208" r="3.6" />
        <circle cx="120" cy="238" r="3.6" />
        <circle cx="120" cy="268" r="3.6" />
        <circle cx="120" cy="298" r="3.6" />
        {/* hands */}
        <ellipse cx="70" cy="324" rx="9" ry="12" />
        <ellipse cx="170" cy="324" rx="9" ry="12" />
        {/* feet */}
        <ellipse cx="95" cy="502" rx="15" ry="7" />
        <ellipse cx="145" cy="502" rx="15" ry="7" />
      </g>

      {/* whiskers — the fine radiating lines that make the head read as a source */}
      <g stroke="var(--figure-hi)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M89 98 L 60 84" />
        <path d="M87 110 L 55 110" />
        <path d="M90 123 L 62 137" />
        <path d="M151 98 L 180 84" />
        <path d="M153 110 L 185 110" />
        <path d="M150 123 L 178 137" />
      </g>
    </svg>
  );
}
