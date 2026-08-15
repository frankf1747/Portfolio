import SmartText from "../SmartText";

/* §11 reel band — full-bleed. Media is untinted: the reference lets its
   imagery be the only non-brand colour on the page.
   REPLACE-ME: drop a <video muted loop playsinline> in place of .reel__media. */

export default function Reel() {
  return (
    <section className="reel" aria-label="Showreel">
      <div className="reel__media">
        <button type="button" className="reel__play">
          <span className="reel__playLabel">PLAY</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6 L18 12 L9 18 Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="reel__meta">
        <SmartText className="small">SELECTED WORK — 2024/2026</SmartText>
        <SmartText className="small">01 — REEL</SmartText>
      </div>
    </section>
  );
}
