/* The statement band: CURIOSITY set in question marks, LEARN. set in
   exclamation marks, on a dot grid. On repeat, the ?s lift off, scramble in
   flight — the site's decode as a swarm — and land as the !s of LEARN.;
   then back. The cursor raises faint questions in the empty grid.

   Each word is a MASK: the text is drawn once, off screen, in the body face
   and stretched to its box, and every grid cell whose centre falls inside it
   belongs to that word. The two words never share a cell count, so a flight
   is paired from the DESTINATION side — every cell of the arriving word gets
   exactly one particle — and the departing word's surplus dissolves where it
   stands. (Pairing from the source side once left a quarter of LEARN. with
   no particle at all; it sat as a ghost until the flight ended and then
   snapped in on a single frame — the hitch that read as a one-second lag.)

   Like the About figure, this runs on its own clock, advanced only while the
   band is on screen. */

const GL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/";
const INK = "#262048";
const HOLD = 2600;

type Box = { x: number; y: number; w: number; h: number; text: string };
type Part = {
  si: number; di: number | null; x0: number; y0: number; x1: number; y1: number;
  delay: number; dur: number; arc: number; g0: string; g1: string; lose: boolean;
};
type Flight = { from: 0 | 1; parts: Part[]; t0: number; landed: Set<number> };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const rnd = () => GL[(Math.random() * GL.length) | 0];

export function mountMosaic(cv: HTMLCanvasElement, seq: HTMLElement[]): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const MONO = css.getPropertyValue("--font-mono").trim() || "monospace";
  const BODY = css.getPropertyValue("--font-body").trim() || "sans-serif";

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = 0, ch = 0;
  let A: number[] = [], B: number[] = [];
  let inA = new Set<number>(), inB = new Set<number>();
  let bg: HTMLCanvasElement | null = null;
  let font = "";
  let ready = false;

  /* ---------- layout ---------- */

  const maskOf = (bx: Box) => {
    const s = 0.5;
    const off = document.createElement("canvas");
    off.width = Math.ceil(W * s);
    off.height = Math.ceil(H * s);
    const o = off.getContext("2d");
    if (!o) return [];
    o.font = `700 100px ${BODY}`;
    const m = o.measureText(bx.text);
    const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const sx = (bx.w * W * s) / tw, sy = (bx.h * H * s) / th;
    o.setTransform(sx, 0, 0, sy, bx.x * W * s + m.actualBoundingBoxLeft * sx, bx.y * H * s + m.actualBoundingBoxAscent * sy);
    o.fillText(bx.text, 0, 0);
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const out: number[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        let hit = 0;
        for (let i = 0; i < 3; i++)
          for (let j = 0; j < 3; j++) {
            const px = Math.floor((c * cw + ((i + 0.5) * cw) / 3) * s);
            const py = Math.floor((r * ch + ((j + 0.5) * ch) / 3) * s);
            if (img[(py * off.width + px) * 4 + 3] > 128) hit++;
          }
        if (hit >= 5) out.push(r * cols + c);
      }
    return out;
  };

  const layout = () => {
    W = cv.clientWidth;
    H = cv.clientHeight;
    if (!W || !H) return;
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const unit = parseFloat(css.fontSize) || 1;
    /* On a phone the two words stack and the grid gets finer; at reading
       scale a 9-letter word in ten-rem cells would be four cells a letter. */
    const narrow = W < 640;
    const CW = narrow ? 6 : 10 * unit, CH = narrow ? 8.4 : 14 * unit;
    cols = Math.max(1, Math.floor(W / CW));
    rows = Math.max(1, Math.floor(H / CH));
    cw = W / cols;
    ch = H / rows;
    font = `700 ${(ch * 0.95).toFixed(1)}px ${MONO}`;
    const a: Box = narrow
      ? { x: 0, y: 0.04, w: 1, h: 0.4, text: "CURIOSITY" }
      : { x: 0, y: 0.03, w: 0.72, h: 0.41, text: "CURIOSITY" };
    const b: Box = narrow
      ? { x: 0.3, y: 0.56, w: 0.7, h: 0.4, text: "LEARN." }
      : { x: 0.47, y: 0.55, w: 0.53, h: 0.41, text: "LEARN." };
    A = maskOf(a);
    B = maskOf(b);
    inA = new Set(A);
    inB = new Set(B);
    bg = document.createElement("canvas");
    bg.width = cv.width;
    bg.height = cv.height;
    const g = bg.getContext("2d");
    if (g) {
      g.scale(dpr, dpr);
      g.fillStyle = "rgb(38 32 72 / 0.22)";
      const sz = Math.max(1, 1.5 * unit);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) g.fillRect(c * cw + cw / 2 - sz / 2, r * ch + ch / 2 - sz / 2, sz, sz);
    }
    /* a resize mid-flight would land particles on cells that no longer
       exist; settle on whichever word is solid and hold */
    flight = null;
    phaseT = clock;
    ready = true;
  };

  const cx = (i: number) => (i % cols) * cw + cw / 2;
  const cy = (i: number) => Math.floor(i / cols) * ch + ch / 2;

  /* ---------- the flight ---------- */

  let clock = 0;
  let solid: 0 | 1 = 0;
  let flight: Flight | null = null;
  let phaseT = 0;

  const startFlight = (from: 0 | 1) => {
    const src = from === 0 ? A : B, dst = from === 0 ? B : A;
    const g0 = from === 0 ? "?" : "!", g1 = from === 0 ? "!" : "?";
    /* pair roughly left-to-right so the swarm pours rather than tangles */
    const key = (i: number) => cx(i) + (Math.random() - 0.5) * W * 0.18;
    const s = [...src].sort((p, q) => key(p) - key(q));
    const d = [...dst].sort((p, q) => key(p) - key(q));
    const mk = (si: number, di: number | null): Part => {
      const x0 = cx(si), y0 = cy(si);
      const lead = from === 0 ? x0 / W : 1 - x0 / W;
      return {
        si, di, x0, y0,
        x1: di === null ? x0 + (Math.random() - 0.3) * 0.14 * W : cx(di),
        y1: di === null ? y0 + 0.18 * H : cy(di),
        delay: lead * 650 + Math.random() * 350,
        dur: 1000 + Math.random() * 450,
        arc: (0.05 + Math.random() * 0.13) * H,
        g0, g1, lose: di === null
      };
    };
    const parts: Part[] = [];
    const used = new Set<number>();
    for (let j = 0; j < d.length; j++) {
      const si = s[Math.floor((j * s.length) / d.length)];
      used.add(si);
      parts.push(mk(si, d[j]));
    }
    for (const si of s) if (!used.has(si)) parts.push(mk(si, null));
    flight = { from, parts, t0: phaseT + HOLD, landed: new Set() };
  };

  /* ---------- input ---------- */

  let mx = -1e4, my = -1e4;
  const onMove = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  };
  const onLeave = () => {
    mx = my = -1e4;
  };
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerleave", onLeave);

  const mark = (k: number) => seq.forEach((s, i) => s.classList.toggle("is-on", i === k));

  /* ---------- draw ---------- */

  const draw = () => {
    if (!ready || !bg) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;

    const unit = parseFloat(css.fontSize) || 1;
    const R = 80 * unit;
    const put = (i: number, glyph: string, alpha: number) => {
      const x = cx(i), y = cy(i);
      ctx.clearRect(x - cw / 2, y - ch / 2, cw, ch);
      ctx.globalAlpha = alpha;
      ctx.fillText(glyph, x, y + ch * 0.04);
    };

    if (reduced) {
      A.forEach((i) => put(i, "?", 1));
      B.forEach((i) => put(i, "!", 1));
      ctx.globalAlpha = 1;
      return;
    }

    if (!flight && clock - phaseT > HOLD) startFlight(solid);

    const solidSet = solid === 0 ? A : B;
    const ghostSet = solid === 0 ? B : A;
    const gS = solid === 0 ? "?" : "!", gG = solid === 0 ? "!" : "?";
    const f = flight;

    /* the other word as a ghost, so the composition holds while one rests */
    ghostSet.forEach((i) => {
      if (!f || !f.landed.has(i)) put(i, gG, 0.2);
    });

    if (!f) {
      solidSet.forEach((i) => {
        const dx = cx(i) - mx, dy = cy(i) - my;
        put(i, dx * dx + dy * dy < R * R && Math.random() < 0.35 ? rnd() : gS, 1);
      });
    } else {
      const el = clock - f.t0;
      f.landed.forEach((i) => put(i, gG, 1));
      let done = true;
      for (const p of f.parts) {
        const q = clamp((el - p.delay) / p.dur, 0, 1);
        if (q < 1) done = false;
        if (q === 0) {
          put(p.si, gS, 1);
          continue;
        }
        if (q === 1) {
          /* drawn on the frame it lands, not the next one, or every cell
             blinks back to its ghost for a frame on arrival */
          if (p.di !== null && !f.landed.has(p.di)) {
            f.landed.add(p.di);
            put(p.di, p.g1, 1);
          }
          continue;
        }
        const e = ease(q);
        ctx.globalAlpha = p.lose ? 1 - q : 1;
        ctx.fillText(
          q < 0.3 ? p.g0 : q > 0.8 ? p.g1 : rnd(),
          p.x0 + (p.x1 - p.x0) * e,
          p.y0 + (p.y1 - p.y0) * e - Math.sin(Math.PI * q) * p.arc
        );
      }
      if (done) {
        solid = solid === 0 ? 1 : 0;
        phaseT = f.t0 + Math.max(...f.parts.map((p) => p.delay + p.dur));
        flight = null;
        mark(solid);
        if (solid === 0) {
          seq[2]?.classList.add("is-on");
          window.setTimeout(() => seq[2]?.classList.remove("is-on"), 900);
        }
      }
    }

    /* the cursor raises questions in the empty grid */
    if (mx > -1e3) {
      const c0 = Math.max(0, Math.floor((mx - R) / cw)), c1 = Math.min(cols - 1, Math.ceil((mx + R) / cw));
      const r0 = Math.max(0, Math.floor((my - R) / ch)), r1 = Math.min(rows - 1, Math.ceil((my + R) / ch));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c;
          if (inA.has(i) || inB.has(i)) continue;
          const dx = cx(i) - mx, dy = cy(i) - my;
          const fall = 1 - Math.sqrt(dx * dx + dy * dy) / R;
          if (fall > 0) put(i, "?", Math.min(0.75, fall * fall * 1.2));
        }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- lifecycle ---------- */

  let raf = 0, last = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    clock += last ? Math.min(100, now - last) : 16;
    last = now;
    draw();
  };
  const start = () => {
    if (raf || reduced) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  let visible = false;
  const io = new IntersectionObserver((es) =>
    es.forEach((e) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    })
  );
  let width = 0;
  const ro = new ResizeObserver(() => {
    if (Math.abs(cv.clientWidth - width) < 1 && ready) return;
    width = cv.clientWidth;
    layout();
    draw();
  });

  /* the masks are measured in the body face — wait for it, or the words are
     cut from the fallback's shapes */
  let alive = true;
  Promise.all([document.fonts.load(`700 100px ${BODY}`), document.fonts.load(`700 12px ${MONO}`)])
    .catch(() => undefined)
    .then(() => document.fonts.ready)
    .then(() => {
      if (!alive) return;
      width = cv.clientWidth;
      layout();
      mark(0);
      draw();
      ro.observe(cv);
      io.observe(cv);
    });

  return () => {
    alive = false;
    stop();
    io.disconnect();
    ro.disconnect();
    cv.removeEventListener("pointermove", onMove);
    cv.removeEventListener("pointerleave", onLeave);
  };
}
