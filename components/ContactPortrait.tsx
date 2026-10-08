"use client";

import { useEffect, useRef } from "react";

/* Frank, printed as an ink halftone, standing on the footer rule beside
   SAY HELLO.

   He must never cover the type, and how much room the type leaves depends
   on the window: SAY HELLO is display-size mono, so its width does not
   track the column. So the size is measured, not guessed — the space right
   of the headline's last glyph sets how wide he can be, and the height
   follows from the photo's proportions. When that space gets too narrow
   (a short-wide window, a tablet), he steps down under the headline and
   stands to the right of the email instead. CSS keeps the phone layout. */

const RATIO = 826 / 1100;
const GAP = 40; // design px between the type and the outline
const MIN_H = 240; // below this he looks like a thumbnail; use the lower slot

export default function ContactPortrait() {
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = ref.current;
    const stage = img?.parentElement;
    const big = stage?.querySelector<HTMLElement>(".contact-section__big");
    const head = stage?.querySelector<HTMLElement>(".contact-section__head");
    const email = stage?.querySelector<HTMLElement>(".contact-section__email");
    if (!img || !stage || !big || !head || !email) return;

    /* the glyphs' own box, not the block's — SmartText wraps the line in
       full-width spans, so measure each text node and take the union */
    const inkBox = (el: HTMLElement) => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) {
          if (!q.width) continue;
          l = Math.min(l, q.left); t = Math.min(t, q.top);
          r = Math.max(r, q.right); b = Math.max(b, q.bottom);
        }
      }
      return { left: l, top: t, right: r, bottom: b };
    };

    const fit = () => {
      if (window.matchMedia("(max-width: 720px)").matches) {
        img.style.height = "";
        return;
      }
      const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) || 1;
      const gap = GAP * unit;
      const s = stage.getBoundingClientRect();
      const right = s.right - parseFloat(getComputedStyle(img).right || "0");
      const headBottom = head.getBoundingClientRect().bottom;
      const bigBox = inkBox(big);
      const mailBox = inkBox(email);

      /* beside the headline: as tall as the stage allows below the head
         row, and no wider than the space right of the type */
      const besideW = right - bigBox.right - gap;
      const besideH = Math.min(s.bottom - headBottom - gap, besideW / RATIO);

      /* under it: from below the headline to the rule, and clear of the
         email on its left */
      /* the text node's box runs a descent below the capitals; the line's
         own box (display leading of 0.65) is the visible bottom */
      const bigBottom = Math.min(bigBox.bottom, big.getBoundingClientRect().bottom);
      const underH = Math.min(s.bottom - bigBottom - gap * 0.5, (right - mailBox.right - gap) / RATIO);

      const h = besideH >= MIN_H * unit || besideH >= underH ? besideH : underH;
      img.style.height = `${Math.max(0, Math.floor(h))}px`;
      img.style.visibility = h < 120 * unit ? "hidden" : "";
    };

    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className="contact-section__me"
      src="/assets/portrait/frank-halftone.webp"
      alt="Portrait of Frank Fu"
      width={826}
      height={1100}
      loading="lazy"
      decoding="async"
    />
  );
}
