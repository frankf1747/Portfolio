import { Arrow } from "../SketchFilters";

export default function Contact() {
  return (
    <section id="contact" className="sk-contact">
      <hr className="sketch-rule" />

      <p className="sk-contact__big">Say hello</p>

      <div className="sk-contact__ctas">
        <a href="mailto:hello@frankfu.design?subject=Starting%20a%20project">
          Start a project
          <Arrow wob="wob3" />
        </a>
        <a href="mailto:hello@frankfu.design?subject=Hello">
          Just say hi
          <Arrow wob="wob2" />
        </a>
      </div>

      <p className="sk-contact__email">
        <a href="mailto:hello@frankfu.design">hello@frankfu.design</a>
      </p>

      <hr className="sketch-rule" />

      <footer className="sk-foot">
        <span className="sk-foot__group">
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer noopener">LinkedIn</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer noopener">GitHub</a>
          <a href="https://www.are.na/" target="_blank" rel="noreferrer noopener">Are.na</a>
        </span>
        <span>San Francisco, CA — 37.7749°N</span>
        <span className="sk-foot__group">
          <span>©2026 Frank Fu</span>
          <a href="/privacy">Privacy</a>
        </span>
      </footer>
    </section>
  );
}
