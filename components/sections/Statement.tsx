"use client";

import { useEffect, useRef } from "react";
import { mountMosaic } from "@/lib/mosaic";

/* §11 statement — ? → !

   Still the yellow inversion, still two words: CURIOSITY, LEARN. But set as
   a riso dot-grid poster in the mono — the first in question marks, the
   second in exclamation marks — and on repeat the ?s fly down and land as
   the !s, then back. Ink only, so the band keeps to one ground and one mark.

   The canvas is decorative; the words are in the section's label and in the
   visually-hidden line for anything that cannot see it. All the drawing is
   in lib/mosaic. */

export default function Statement() {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const seqRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const cv = cvRef.current, seq = seqRef.current;
    if (!cv || !seq) return;
    return mountMosaic(cv, Array.from(seq.querySelectorAll<HTMLElement>("[data-step]")));
  }, []);

  return (
    <section className="statement is-invert-yellow" aria-label="Curiosity, then learn, on repeat">
      <p className="u-sr">Curiosity. Learn. On repeat.</p>
      <canvas className="statement__cv" ref={cvRef} aria-hidden="true" />
      <div className="statement__foot" aria-hidden="true">
        <span className="small">FIG. 2 — ? → !</span>
        <span className="small statement__seq" ref={seqRef}>
          <span data-step="0" className="is-on">CURIOSITY</span> → <span data-step="1">LEARN.</span> →{" "}
          <span data-step="2">REPEAT</span>
        </span>
      </div>
    </section>
  );
}
