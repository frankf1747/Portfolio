"use client";

import { scrollToTop } from "@/lib/motion";
import TransitionLink from "./TransitionLink";

export default function Footer() {
  return (
    <footer className="c-Footer" aria-label="Contact">
      <h2 className="c-Footer-big">
        <span className="u-line"><span className="u-line-inner">Let&rsquo;s make</span></span>
        <span className="u-line"><span className="u-line-inner">something good.</span></span>
      </h2>

      <a href="mailto:frankfu1747@gmail.com" className="c-Footer-email" data-cursor="Email me">
        frankfu1747@gmail.com <span className="c-Footer-arrow">→</span>
      </a>

      <div className="c-Footer-cols">
        <div>
          <p className="u-eyebrow">Location</p>
          <p className="u-muted">Los Angeles, CA<br />open to full-time</p>
        </div>
        <div>
          <p className="u-eyebrow">Elsewhere</p>
          <p>
            <a href="https://github.com/frankf1747" target="_blank" rel="noopener" data-cursor="GitHub">GitHub</a><br />
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener" data-cursor="LinkedIn">LinkedIn</a>
          </p>
        </div>
        <div>
          <p className="u-eyebrow">Sitemap</p>
          <p>
            <TransitionLink href="/" cursor="Home">Home</TransitionLink><br />
            <TransitionLink href="/work" cursor="Work">Work</TransitionLink><br />
            <TransitionLink href="/about" cursor="About">About</TransitionLink>
          </p>
        </div>
      </div>

      <div className="c-Footer-bar">
        <span className="u-muted">© {new Date().getFullYear()} Frank Fu</span>
        <button className="c-Footer-top" onClick={() => scrollToTop(false)} data-cursor="Top">
          TOP ↑
        </button>
      </div>
    </footer>
  );
}
