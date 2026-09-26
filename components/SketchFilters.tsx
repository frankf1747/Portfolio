/* ============================================================
   The wobble. Every hand-drawn edge in the wireframe — box borders,
   rules, circles, arrows — is a straight CSS/SVG shape pushed off
   course by one of these displacement filters. Three seeds so
   repeated elements don't wobble identically, plus wobS for marks
   too small for them.

   Mounted once, at the top of the page; referenced as filter:url(#wob1).
   ============================================================ */

export default function SketchFilters() {
  return (
    <svg width="0" height="0" className="sketch-defs" aria-hidden="true" focusable="false">
      <filter id="wob1" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.022"
          numOctaves={2}
          seed={3}
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={7} />
      </filter>
      <filter id="wob2" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02 0.014"
          numOctaves={2}
          seed={11}
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={6} />
      </filter>
      <filter id="wob3" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.016 0.03"
          numOctaves={2}
          seed={27}
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={8} />
      </filter>
      {/* wobS — for SMALL marks, like the 34px contact ring. The three above
          vary over ~80px, so on a mark this size they slide the whole shape
          instead of roughening its edge. This one varies every ~11 units
          (≈3 bumps round the ring) and pushes less. Its region is padded
          wider too: on a small box the default ±8% leaves the displacement
          no room, and the wobbled stroke gets shaved flat. */}
      <filter id="wobS" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.09"
          numOctaves={2}
          seed={5}
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} />
      </filter>
      {/* wobS2 / wobS3 — the same small-mark wobble on two more seeds.
          Cycling a mark through all three is a hand-drawn "boil": the
          outline redraws itself a few times a second, as if each frame had
          been traced again by hand. The cursor uses it. */}
      <filter id="wobS2" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={19} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} />
      </filter>
      <filter id="wobS3" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={41} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} />
      </filter>
    </svg>
  );
}

/* Shared bits of sketch furniture, so the wobble filter and the
   viewBox live in one place rather than being re-typed per section. */

export function Arrow({
  wob = "wob3",
  className = "sk-arrow"
}: {
  wob?: "wob1" | "wob2" | "wob3";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 34 14" className={className} style={{ filter: `url(#${wob})` }} aria-hidden="true">
      <path d="M1 7 H31 M24 2 L32 7 L24 12" fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function ArrowOut({
  wob = "wob2",
  className = "sk-arrow-out"
}: {
  wob?: "wob1" | "wob2" | "wob3";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 14 14" className={className} style={{ filter: `url(#${wob})` }} aria-hidden="true">
      <path d="M3 11 L11 3 M4.5 3 H11 V9.5" fill="none" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}
