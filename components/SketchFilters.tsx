/* ============================================================
   The wobble. Every hand-drawn edge in the wireframe — box borders,
   rules, circles, arrows — is a straight CSS/SVG shape pushed off
   course by one of these displacement filters. Three seeds so
   repeated elements don't wobble identically.

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
