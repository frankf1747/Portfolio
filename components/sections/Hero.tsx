import { Arrow } from "../SketchFilters";

export default function Hero() {
  return (
    <section className="sk-hero">
      <h1 className="sk-hero__title">
        Product designer &amp; design engineer — interfaces drawn first, built right
      </h1>
      <div className="sk-hero__foot">
        <span>Portfolio — phase 1</span>
        <span className="sk-hero__scroll">
          Scroll
          <Arrow className="sk-arrow sk-arrow--down" />
        </span>
        <span>©2026</span>
      </div>
    </section>
  );
}
