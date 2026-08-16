/* ============================================================
   §4 THE TEXT ENGINE

   Rewrites a text node as:

     .smart-text
       └ .line                 (one per visual line, re-split on resize)
           └ .text             (the moving element)
               └ .word
                   └ .letter-inner
               └ .scrambled-space

   Two motions run concurrently per line:
     RISE      translateY(0.885em) → 0, 1.5s, --ease, 120ms/line
     SCRAMBLE  1.5s — in lockstep with the rise, so each line resolves at
               the same instant it stops travelling.

   The line starts as one dense unreadable run of glyphs (word gaps
   collapsed to zero) and unpacks into words as it resolves.

   0.885em: the rise distance is 121% of the 0.73em clip window
   (0.73 × 1.21 = 0.883), which is 216.7rem on a 245rem line — glyphs
   fully clear of the mask, nothing peeking.
   ============================================================ */

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/* Landing spec: the reveal and the decode run in LOCKSTEP — each line
   settles at the same instant it finishes travelling, at 1.5s, stagger
   0.12s. This replaces the earlier deliberate offset, where the scramble
   finished at ~68% of the travel so the word was already legible while
   still rising. Both are defensible; the lockstep one is what was asked
   for, and it makes the resolve land on the stop rather than before it. */
const RISE_MS = 1500;
const SCRAMBLE_MS = 1500;
const LINE_STAGGER_MS = 120;
const GLYPH_SWAP_MS = 55;

export type SmartTextInstance = {
  /** Re-measure line breaks and rebuild. Called on resize. */
  resplit: () => void;
  /** Run the rise + scramble. */
  play: (opts?: { delay?: number; scrambleOnly?: boolean }) => void;
  /** Render fully resolved, no motion (reduced-motion, or pre-play state). */
  resolve: () => void;
  destroy: () => void;
};

type Letter = { el: HTMLElement; final: string; resolveAt: number; done: boolean };

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Decode a plain element's text in place — no line splitting, no clip
   window, no rise.

   The full engine cannot be used everywhere it would be nice to have. It
   rewrites its host into .line > .text > .word boxes whose sizing assumes
   horizontal flow and a fixed-height mask; drop that into a rotated or
   shrink-to-fit context and the boxes resolve to zero. Anything that wants
   only the scramble — the vertical contact button, for one — takes this
   instead. Same pool, same left-to-right resolve, same duration.

   Monospace hosts keep their width for free; the caller is responsible for
   reserving space if the face is proportional. */
export function scrambleText(el: HTMLElement, opts: { duration?: number } = {}) {
  const final = (el.dataset.scrambleSource ??= el.textContent || "");
  const ms = opts.duration ?? SCRAMBLE_MS;
  if (prefersReduced()) {
    el.textContent = final;
    return () => {};
  }

  const chars = [...final];
  const n = Math.max(1, chars.length - 1);
  const resolveAt = chars.map((_, i) => ms * (0.2 + 0.8 * (i / n)));
  const started = performance.now();
  let raf = 0;
  let lastSwap = 0;

  const tick = (now: number) => {
    const t = now - started;
    const swap = now - lastSwap > GLYPH_SWAP_MS;
    if (swap) lastSwap = now;

    let remaining = 0;
    const out = chars.map((ch, i) => {
      if (t >= resolveAt[i]) return ch;
      remaining++;
      /* whitespace and punctuation never scramble */
      if (!/[A-Za-z0-9]/.test(ch)) return ch;
      return swap ? POOL[(Math.random() * POOL.length) | 0] : el.textContent?.[i] || ch;
    });
    el.textContent = out.join("");

    if (remaining > 0) raf = requestAnimationFrame(tick);
    else el.textContent = final;
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    el.textContent = final;
  };
}

export function smartText(root: HTMLElement): SmartTextInstance {
  const source = (root.dataset.stSource ??= (root.textContent || "").trim());

  let lines: HTMLElement[] = [];
  let letters: Letter[][] = [];
  let raf = 0;
  let timers: number[] = [];

  /* ---- build ------------------------------------------------------ */

  function buildWord(word: string) {
    const w = document.createElement("span");
    w.className = "word";
    for (const ch of word) {
      const l = document.createElement("span");
      l.className = "letter-inner";
      l.textContent = ch;
      w.appendChild(l);
    }
    return w;
  }

  /* Words are laid out flat first so the browser can break them, then
     grouped by offsetTop into the real .line/.text wrappers. */
  function split() {
    root.textContent = "";
    const words = source.split(/\s+/).filter(Boolean);

    const flat: HTMLElement[] = [];
    words.forEach((word, i) => {
      const w = buildWord(word);
      if (i > 0) w.classList.add("left-space");
      if (i < words.length - 1) w.classList.add("right-space");
      root.appendChild(w);
      flat.push(w);
      if (i < words.length - 1) {
        const sp = document.createElement("span");
        sp.className = "scrambled-space";
        root.appendChild(sp);
      }
    });

    /* group by visual line */
    const groups: HTMLElement[][] = [];
    let lastTop: number | null = null;
    flat.forEach((w) => {
      const top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 1) {
        groups.push([w]);
        lastTop = top;
      } else {
        groups[groups.length - 1].push(w);
      }
    });

    root.textContent = "";
    lines = [];
    letters = [];

    groups.forEach((group, gi) => {
      const line = document.createElement("span");
      line.className = "line";
      const text = document.createElement("span");
      text.className = "text";
      line.appendChild(text);

      group.forEach((w, wi) => {
        if (wi > 0) {
          const sp = document.createElement("span");
          sp.className = "scrambled-space";
          text.appendChild(sp);
        }
        /* first/last word of a *visual* line carries no outer padding */
        w.classList.toggle("left-space", wi > 0);
        w.classList.toggle("right-space", wi < group.length - 1);
        text.appendChild(w);
      });

      line.style.setProperty("--line-delay", `${gi * LINE_STAGGER_MS}ms`);
      root.appendChild(line);
      lines.push(line);

      const ls = Array.from(text.querySelectorAll<HTMLElement>(".letter-inner"));
      const n = Math.max(1, ls.length - 1);
      letters.push(
        ls.map((el, i) => ({
          el,
          final: el.textContent || "",
          /* resolve left-to-right across the line, last letter at t=1 */
          resolveAt: SCRAMBLE_MS * (0.2 + 0.8 * (i / n)),
          done: false
        }))
      );
    });
  }

  /* ---- motion ----------------------------------------------------- */

  function clearTimers() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function scrambleLine(li: number) {
    const set = letters[li];
    if (!set || !set.length) return;
    const text = lines[li].querySelector<HTMLElement>(".text");
    text?.classList.add("scrambled");
    set.forEach((l) => {
      l.done = false;
    });

    const started = performance.now();
    let lastSwap = 0;

    const tick = (now: number) => {
      const t = now - started;
      const swap = now - lastSwap > GLYPH_SWAP_MS;
      if (swap) lastSwap = now;

      let remaining = 0;
      for (const l of set) {
        if (l.done) continue;
        if (t >= l.resolveAt) {
          l.el.textContent = l.final;
          l.done = true;
          continue;
        }
        remaining++;
        /* whitespace and punctuation never scramble */
        if (swap && /[A-Za-z0-9]/.test(l.final)) {
          l.el.textContent = POOL[(Math.random() * POOL.length) | 0];
        }
      }

      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        /* resolved: word gaps unpack over 1s (--ease-space) */
        text?.classList.remove("scrambled");
      }
    };
    raf = requestAnimationFrame(tick);
  }

  function play(opts: { delay?: number; scrambleOnly?: boolean } = {}) {
    clearTimers();
    const base = opts.delay ?? 0;

    if (prefersReduced()) {
      resolve();
      return;
    }

    if (!opts.scrambleOnly) {
      root.classList.remove("is-revealed");
      /* force style flush so the reset transform is committed */
      void root.offsetWidth;
      root.classList.add("is-revealed");
    }

    lines.forEach((_, li) => {
      const at = base + li * LINE_STAGGER_MS;
      timers.push(window.setTimeout(() => scrambleLine(li), at));
    });
  }

  function resolve() {
    clearTimers();
    letters.forEach((set, li) => {
      const text = lines[li].querySelector<HTMLElement>(".text");
      text?.classList.remove("scrambled");
      set.forEach((l) => {
        l.el.textContent = l.final;
        l.done = true;
      });
    });
    root.classList.add("is-revealed");
  }

  split();

  return {
    resplit: () => {
      const wasRevealed = root.classList.contains("is-revealed");
      clearTimers();
      split();
      if (wasRevealed) resolve();
    },
    play,
    resolve,
    destroy: () => {
      clearTimers();
      root.textContent = source;
    }
  };
}
