"use client";

import { useEffect, useState } from "react";

/* §5 — nothing is drawn on it. No logo, no counter, no percentage.
   The ~1.3s before the fade is an asset gate, not a timer: fonts and
   the load event, floored at 1.3s so the intro can't start mid-swap. */

const MIN_MS = 1300;

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const started = performance.now();
    let done = false;

    const go = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(() => {
        document.documentElement.dataset.loaded = "true";
        setHidden(true);
        /* t = 0 for the whole landing sequence */
        window.dispatchEvent(new Event("site:reveal"));
      }, wait);
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const ready = fonts ? fonts.ready.catch(() => undefined) : Promise.resolve();

    if (document.readyState === "complete") {
      ready.then(go);
    } else {
      window.addEventListener("load", () => ready.then(go), { once: true });
      /* never let a stalled asset hold the page hostage */
      window.setTimeout(go, 4000);
    }
  }, []);

  return (
    <div className={`preloader${hidden ? " hide" : ""}`} aria-hidden="true">
      <div className="_bg" />
    </div>
  );
}
