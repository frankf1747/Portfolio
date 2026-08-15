export default function Showreel() {
  return (
    <section className="sk-showreel" aria-label="Showreel">
      {/* REPLACE-ME: swap the placeholder box for the real 16:9 reel
          (<video> or a poster image + play control). */}
      <div className="sketch-box sketch-media sketch-fill sk-showreel__box">
        <span className="sk-label">( showreel — 16:9 )</span>
        <button type="button" className="sk-showreel__play">
          Play
        </button>
      </div>
    </section>
  );
}
