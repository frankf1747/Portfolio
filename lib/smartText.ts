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
     RISE      translateY(window × 1.21) → 0, --ease, staggered per line
     SCRAMBLE  in lockstep with the rise, so each line resolves at the
               same instant it stops travelling.

   ⚠ THE DECODE IS LAYOUT-NEUTRAL. Every letter cycles inside a slot
   pinned to its own final width, so the line measures the same on every
   frame of the scramble as it does when settled. Nothing reflows, so
   nothing can re-wrap, spill its container, or feed a width change back
   into the ResizeObserver in components/SmartText.tsx.

   This is what the nav has always done — its labels are single words, so
   there was never a gap to animate — and it is the only place the effect
   read correctly. An earlier build collapsed the word gaps to zero and
   re-opened them behind the lock front, so the line began as one dense
   slab and unpacked as it resolved. It looked good in isolation and was
   structurally fatal: collapsing the gaps changes the element's width,
   which in any shrink-to-fit container (every section head, every grid
   row title) resized the box, tripped the ResizeObserver, and made the
   engine tear down and force-resolve the animation it had just started.

   0.885em: the rise distance is 121% of the 0.73em clip window
   (0.73 × 1.21 = 0.883), which is 216.7rem on a 245rem line — glyphs
   fully clear of the mask, nothing peeking. Body copy keeps its natural
   leading, so it rides on translateY(100%) instead — see _smart-text.
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

/* Two paces, because the two contexts are not the same problem.

   "landing" is the overture: the viewer is already looking at it, so the
   decode starts immediately and finishes with the rise.

   "scroll" is everything below the fold. The block is triggered before a
   single pixel of it is visible, so it is ALREADY mid-scramble when it
   enters frame and never appears to park and then perform. That needs a
   later lock-start and a longer tail — the length is what sells it as
   scroll-linked rather than as a canned animation. */
export type ScramblePace = "landing" | "scroll" | "overture" | "slow";

const PACE: Record<ScramblePace, { scrambleMs: number; lockStartMs: number; staggerMs: number }> = {
  landing: { scrambleMs: SCRAMBLE_MS, lockStartMs: 300, staggerMs: LINE_STAGGER_MS },
  /* lockStartMs is the beat before the FIRST character locks — until then
     the line is pure noise. At 650 against a rise that was itself slow to
     show ink, a scrolled-to block made you wait twice over. Pulled in so
     the line starts becoming readable almost as soon as it is visible. */
  scroll: { scrambleMs: 1250, lockStartMs: 420, staggerMs: 90 },
  /* An unhurried decode for a heading that is its own moment on the page
     and is not competing with anything else on screen — but only about a
     third longer than the scroll pace now. It has been pulled in twice:
     the tail on a short word like PROJECTS was doing the damage, and the
     lock curve above carries most of that fix. */
  slow: { scrambleMs: 1700, lockStartMs: 500, staggerMs: 140 },
  /* The overture is the one block the viewer is guaranteed to be watching
     from its first frame, so it decodes slower than anything triggered by
     a scroll — but it is also the gate on the entire landing. The three
     lines start 100ms apart, so the last character locks at
     scrambleMs + 200, and the HOLD, the exit and everything after it are
     measured from that instant. Change this number and the constants in
     sections/Hero.tsx have to move with it. */
  overture: { scrambleMs: 2200, lockStartMs: 500, staggerMs: 160 }
};
const GLYPH_SWAP_MS = 55;

export type SmartTextInstance = {
  /** True from play() until the last line locks. */
  isPlaying: () => boolean;
  /** Re-measure line breaks and rebuild. Called on resize. */
  resplit: () => void;
  /** Run the rise + scramble. `scrambleOnly` decodes in place with no
      rise; `riseOnly` travels in with the glyphs already settled. */
  play: (opts?: { delay?: number; scrambleOnly?: boolean; riseOnly?: boolean }) => void;
  /** Render fully resolved, no motion (reduced-motion, or pre-play state). */
  resolve: () => void;
  destroy: () => void;
};

/* `w` is the glyph's own final width, used to pin the slot while that
   letter is still cycling. In a MONOSPACE face this is a no-op — every
   advance is identical, so the slab already measures the same as the
   finished line. In a PROPORTIONAL face it is essential: a random W
   standing in for an i changes the line width every 55ms, which measured
   as an 88px (16.9%) swing on the Approach titles and flipped the About
   paragraph between one and two rendered rows mid-scramble. */
type Letter = { el: HTMLElement; final: string; resolveAt: number; done: boolean; w: number };

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
type Cancelable = HTMLElement & { __stCancel?: () => void };

export function scrambleText(el: HTMLElement, opts: { duration?: number } = {}) {
  const final = (el.dataset.scrambleSource ??= el.textContent || "");
  const ms = opts.duration ?? SCRAMBLE_MS;

  /* Re-entry has to kill the run in flight. These fire on hover, and a
     second hover before the first finished used to leave two loops
     writing the same node from different start times — the label would
     churn indefinitely, each loop undoing the other's locks. */
  (el as Cancelable).__stCancel?.();

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
    else {
      el.textContent = final;
      delete (el as Cancelable).__stCancel;
    }
  };
  raf = requestAnimationFrame(tick);

  const cancel = () => {
    cancelAnimationFrame(raf);
    el.textContent = final;
    delete (el as Cancelable).__stCancel;
  };
  (el as Cancelable).__stCancel = cancel;
  return cancel;
}

export function smartText(root: HTMLElement, pace: ScramblePace = "landing"): SmartTextInstance {
  const source = (root.dataset.stSource ??= (root.textContent || "").trim());
  const { scrambleMs, lockStartMs, staggerMs } = PACE[pace];

  let lines: HTMLElement[] = [];
  let letters: Letter[][] = [];
  /* one handle PER LINE. A single shared handle only ever cancelled the
     last line to start, so a resize or replay mid-decode left the other
     lines' loops running against detached nodes. */
  let rafs: number[] = [];
  let timers: number[] = [];
  /* set for the whole of a play() so the host's ResizeObserver can tell a
     real container resize from one of our own frames */
  let playing = false;

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

      line.style.setProperty("--line-delay", `${gi * staggerMs}ms`);
      root.appendChild(line);
      lines.push(line);

      const ls = Array.from(text.querySelectorAll<HTMLElement>(".letter-inner"));

      /* The RESOLVED COUNT rises on an ease-out, so per-character the lock
         time is that curve inverted: a burst of letters settles early and
         the tail draws out. A linear ramp reads mechanical.

         ⚠ Sample to i/len, NOT i/(len-1). The curve has a vertical tangent
         at x = 1, so feeding the last letter x = 1 exactly puts it on that
         tangent and it inherits an enormous share of the decode: on
         PROJECTS the final glyph held for 529ms of a 1400ms resolve
         window — 38% of the whole decode spent on one character, which
         reads as the word hanging on its last letters instead of
         finishing. Sampling one step short keeps every letter off the
         tangent; dividing through by the final letter's own value then
         rescales the curve so it still ARRIVES exactly on scrambleMs.
         That last part is load-bearing — the landing timeline in
         sections/Hero.tsx derives its hold and exit from the assumption
         that the overture's last character locks on scrambleMs. */
      const span = Math.max(1, ls.length);
      const endValue = 1 - Math.sqrt(1 - (span - 1) / span);
      const ease = (i: number) =>
        endValue > 0 ? (1 - Math.sqrt(1 - i / span)) / endValue : 1;

      /* measured here, while the letters still hold their real glyphs and
         a layout pass is already being taken for the line grouping */
      const lineLetters: Letter[] = ls.map((el, i) => ({
        el,
        final: el.textContent || "",
        resolveAt: lockStartMs + (scrambleMs - lockStartMs) * ease(i),
        done: false,
        w: el.getBoundingClientRect().width
      }));
      letters.push(lineLetters);
    });
  }

  /* ---- motion ----------------------------------------------------- */

  function clearTimers() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    rafs.forEach((r) => r && cancelAnimationFrame(r));
    rafs = [];
    playing = false;
  }

  function scrambleLine(li: number) {
    const set = letters[li];
    if (!set || !set.length) return;
    /* state hook only — no CSS rule may change this element's METRICS
       while it is set, or the decode starts fighting layout again */
    const text = lines[li].querySelector<HTMLElement>(".text");
    text?.classList.add("scrambled");
    set.forEach((l) => {
      l.done = false;
      /* pin the slot to the letter's OWN final width, so a wide stand-in
         glyph cannot widen the line. Released on lock, where the natural
         advance is identical — there is no jump to see. */
      l.el.style.width = `${l.w}px`;
      l.el.style.textAlign = "center";
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
          l.el.style.width = "";
          l.el.style.textAlign = "";
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
        rafs[li] = requestAnimationFrame(tick);
      } else {
        rafs[li] = 0;
        text?.classList.remove("scrambled");
        if (rafs.every((r) => !r)) playing = false;
      }
    };
    rafs[li] = requestAnimationFrame(tick);
  }

  function play(opts: { delay?: number; scrambleOnly?: boolean; riseOnly?: boolean } = {}) {
    clearTimers();
    const base = opts.delay ?? 0;

    if (prefersReduced()) {
      resolve();
      return;
    }

    playing = true;

    if (!opts.scrambleOnly) {
      root.classList.remove("is-revealed");
      /* force style flush so the reset transform is committed */
      void root.offsetWidth;
      root.classList.add("is-revealed");
    }

    /* Rise with the glyphs already settled — for lines that should travel
       in but not decode. Note this still has to WRITE the finals: the
       instance may be replaying after a scramble that was cut short, so
       the letters cannot be assumed to be holding their real characters. */
    if (opts.riseOnly) {
      letters.forEach((set) =>
        set.forEach((l) => {
          l.el.textContent = l.final;
          l.el.style.width = "";
          l.el.style.textAlign = "";
          l.done = true;
        })
      );
      playing = false;
      return;
    }

    lines.forEach((_, li) => {
      const at = base + li * staggerMs;
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
        l.el.style.width = "";
        l.el.style.textAlign = "";
        l.done = true;
      });
    });
    root.classList.add("is-revealed");
  }

  split();

  return {
    isPlaying: () => playing,
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
