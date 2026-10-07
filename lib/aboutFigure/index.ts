import { scrambleText } from "@/lib/smartText";
import { BOX, PINK, clamp, ease, el, head, type Pointer, type Port, type Scene } from "./kit";
import { modelScene } from "./model";
import { dashboardScene } from "./dashboard";
import { agentScene } from "./agent";
import { appScene } from "./app";

/* §7 About figure — "the thing the analysis points to".

   Four sketches share one box; the outputs in the rail beside it choose
   which is drawn, and a pink arrow always runs from the sketch's own output
   to the label it produced.

   TWO WAYS TO DRIVE IT.
   PINNED (laptop and up, tall enough to hold the frame): the section is a
   sticky frame and its scroll plays in parts — HOLD the statement (headline
   and paragraph, centred, so the reader lands on it without aiming), DOCK
   it (the headline shrinks into one line beside the section label, the
   paragraph steps aside, the figure rises in), then one STEP per output.
   Position is read off the pin container's rect every frame, not from
   scroll events: Lenis owns scrolling, and the rect is the truth either way.
   Left alone, the frame AUTOPLAYS: the page scrolls itself on — through
   the dock, then each output at its own reading pace — and stops at the
   end of the section. Any scroll, key, touch or click, or moving the
   pointer in the figure, hands control straight back; it resumes after a
   short quiet. The Pause button beside the progress turns it off.
   FLOWING (tablets, phones, short windows, reduced motion): everything sits
   in the page and the figure cycles on its own; a pointer in it or keyboard
   focus on an output holds it.

   SCALE. The drawing is laid out in design px. Its scale `s` (px per unit)
   is the largest that fits the room it is given — the stage's width less
   the rail, and when pinned the height under the docked headline — capped
   at S_MAX reading units. The arrow is a fixed run of the viewBox, so a
   wide screen grows the drawing rather than the gap between the drawing and
   its labels. Text in the sketches is floored in kit.tx; at a MacBook's
   scale that floor renders at 11px or more.

   TIME. Each sketch runs on its own clock, advanced only while the figure
   is on screen, so it never jumps ahead after being away. */

/* room around the box for strokes and labels that sit on its edge */
const PAD = { l: 10, t: 14, b: 14 };
/* the arrow's run from the box to the rail, in design units */
const ARROW_W = 92;
const VB = { x: BOX.x - PAD.l, y: BOX.y - PAD.t, w: PAD.l + BOX.w + ARROW_W, h: PAD.t + BOX.h + PAD.b };
/* compact: the box alone, no arrow — the outputs sit above it */
const VB_C = { x: BOX.x - PAD.l, y: BOX.y - PAD.t, w: PAD.l * 2 + BOX.w, h: PAD.t + BOX.h + PAD.b };
const S_MAX = 1.4;
/* the docked headline, in reading units */
const DOCK_SIZE = 30;
const DWELL = 6500;
const COMPACT = "(max-width: 1024px)";
/* keep in step with the pinned block in _about.scss */
export const PINNED = "(min-width: 1025px) and (min-height: 700px)";
/* The pin's scroll, in parts of its span. The total (with n = 4 outputs,
   15 + 45 + 4 × 50 = 260) must match the 260svh in _about.scss. */
const HOLD = 15;
const DOCK = 45;
const STEP = 50;
/* Autoplay pace. The statement waits longer than a step — it is there to
   be read — and each output runs about as long as its sketch takes to tell
   its story (the app's chat answers last). */
const AUTO_READ = 6000;
const AUTO_WAIT = 2600;
const AUTO_DOCK = 1800;
const AUTO_STEP = [7000, 5500, 7000, 9000];

export type FigureParts = {
  pin: HTMLElement;
  frame: HTMLElement;
  /** the section label row the headline docks into */
  label: HTMLElement;
  /** the headline's two lines */
  lines: HTMLElement[];
  lede: HTMLElement;
  fig: HTMLElement;
  stage: HTMLElement;
  rail: HTMLElement;
  svg: SVGSVGElement;
  outputs: HTMLButtonElement[];
  segs: HTMLElement[];
  caption: HTMLElement;
  readout: HTMLElement;
  count: HTMLElement;
  /** pauses and resumes the autoplay (and the cycle, when flowing) */
  auto: HTMLButtonElement;
};

export function mountAboutFigure(parts: FigureParts): () => void {
  const { pin, frame, label, lines, lede, fig, stage, rail, svg, outputs, segs, caption, readout, count, auto } = parts;
  const plate = svg.parentElement as HTMLElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact = window.matchMedia(COMPACT);
  const pinned = window.matchMedia(PINNED);
  const isPinned = () => pinned.matches && !reduced;

  svg.innerHTML = "";
  const defs = el(svg, "defs");
  defs.innerHTML =
    `<pattern id="abHatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="1.2" height="5" fill="rgb(38 32 72 / 0.5)"/></pattern>` +
    `<pattern id="abHatchPink" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="1.4" height="5" fill="rgb(242 36 122 / 0.8)"/></pattern>`;
  const box = el(svg, "g", { transform: `translate(${BOX.x} ${BOX.y})` });
  const groups = [0, 1, 2, 3].map(() => el(box, "g", { class: "about__scene" }));
  const scenes: Scene[] = [
    modelScene(groups[0], reduced),
    dashboardScene(groups[1], reduced),
    agentScene(groups[2], reduced),
    appScene(groups[3], reduced)
  ];
  const n = scenes.length;
  const total = HOLD + DOCK + n * STEP;
  const cg = el(svg, "g", { class: "about__arrow", filter: "url(#wob2)", stroke: PINK, fill: "none", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const conn = el(cg, "path");
  const connHead = el(cg, "path");

  /* ---------- state ---------- */
  let active = 0;
  let sceneT = 0;
  let dwell = 0;
  let held = false; //   a pointer in the figure
  let focused = false; // keyboard focus on an output
  const pointer: Pointer = { x: -1e4, y: -1e4, inside: false };
  let vb = VB;
  let s = 1;
  let cp: Port | null = null;
  let landY = 0;
  let readHTML = "";

  /* ---------- the dock ----------
     Measured from LAYOUT (offsetLeft/Top), never from rects: the lines
     carry the dock transform and their reveal transform, and neither may
     feed back into where the dock is aimed. */
  let dock = { k: 1, a: [0, 0], b: [0, 0] };
  let lastDock = -1;
  const offsetIn = (e: HTMLElement) => {
    let x = 0, y = 0;
    let c: HTMLElement | null = e;
    while (c && c !== frame) {
      x += c.offsetLeft;
      y += c.offsetTop;
      c = c.offsetParent as HTMLElement | null;
    }
    return [x, y];
  };
  const clearDock = () => {
    for (const e of [...lines, lede, fig]) {
      e.style.transform = "";
      e.style.opacity = "";
    }
    lede.style.visibility = "";
    frame.classList.remove("is-docked");
    fig.style.top = "";
    fig.style.pointerEvents = "";
    lastDock = -1;
  };
  const layoutDock = (unit: number) => {
    const fs = parseFloat(getComputedStyle(lines[0]).fontSize);
    const k = (DOCK_SIZE * unit) / fs;
    const [x1, y1] = offsetIn(lines[0]);
    const [x2, y2] = offsetIn(lines[1]);
    const [, ly] = offsetIn(label);
    const h = lines[0].offsetHeight * k;
    /* docked, the two lines run as one, centred on the label row */
    const top = ly + label.offsetHeight / 2 - h / 2;
    dock = { k, a: [0, top - y1], b: [x1 + lines[0].offsetWidth * k + 0.26 * fs * k - x2, top - y2] };
    /* the figure takes everything under the docked line */
    fig.style.top = `${Math.round(Math.max(ly + label.offsetHeight, top + h) + 26 * unit)}px`;
    lastDock = -1;
  };
  const applyDock = (d: number) => {
    const e = ease(d);
    if (e === lastDock) return;
    lastDock = e;
    const sc = 1 + (dock.k - 1) * e;
    lines[0].style.transform = `translate(${dock.a[0] * e}px, ${dock.a[1] * e}px) scale(${sc})`;
    lines[1].style.transform = `translate(${dock.b[0] * e}px, ${dock.b[1] * e}px) scale(${sc})`;
    /* the paragraph steps aside in the first half; the figure rises in the second */
    const out = clamp(d / 0.5, 0, 1);
    lede.style.opacity = String(1 - out);
    lede.style.transform = `translateY(${-24 * out}px)`;
    lede.style.visibility = out >= 1 ? "hidden" : "";
    /* docked, the label row is the top bar's neighbour — see _about.scss */
    frame.classList.toggle("is-docked", d > 0.5);
    const inn = ease(clamp((d - 0.35) / 0.65, 0, 1));
    fig.style.opacity = String(inn);
    fig.style.transform = `translateY(${(1 - inn) * 40}px)`;
    fig.style.pointerEvents = inn > 0.5 ? "" : "none";
  };

  /* ---------- scale ---------- */
  const fit = () => {
    const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) || 1;
    if (isPinned()) layoutDock(unit);
    else clearDock();
    if (compact.matches) {
      vb = VB_C;
      s = plate.clientWidth / vb.w;
    } else {
      vb = VB;
      s = Math.min(S_MAX * unit, (stage.clientWidth - rail.offsetWidth) / vb.w);
      if (isPinned()) {
        const gap = parseFloat(getComputedStyle(plate).rowGap) || 0;
        s = Math.min(s, (fig.clientHeight - readout.offsetHeight - caption.offsetHeight - 2 * gap) / vb.h);
      }
    }
    if (!(s > 0)) return;
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    svg.style.width = `${vb.w * s}px`;
    svg.style.height = `${vb.h * s}px`;
    plate.style.width = compact.matches ? "" : `${vb.w * s}px`;
    cp = null;
  };

  const show = (i: number) => {
    groups.forEach((g, k) => g.classList.toggle("is-on", k === i));
    outputs.forEach((b, k) => {
      b.classList.toggle("is-on", k === i);
      b.setAttribute("aria-pressed", String(k === i));
    });
    caption.dataset.scrambleSource = scenes[i].caption;
    caption.textContent = scenes[i].caption;
    count.textContent = `0${i + 1} / 0${n}`;
  };
  const setActive = (i: number) => {
    dwell = 0;
    if (i === active) return;
    active = i;
    sceneT = 0;
    show(i);
    const lab = outputs[i].querySelector<HTMLElement>(".about__outLabel");
    if (lab) scrambleText(lab, { duration: 420 });
    scrambleText(caption, { duration: 520 });
  };
  show(active);

  /* the pin's scroll range, and where in it the reader is, in parts of `total` */
  const pinState = () => {
    const r = pin.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return { f: span > 0 ? clamp(-r.top / span, 0, 1) * total : 0, top: r.top + window.scrollY, span, at: r.top };
  };

  /* ---------- autoplay (pinned) ---------- */
  let autoOff = false; //  the reader pressed Pause
  let lastInput = performance.now();
  let inPin = false;
  /* where autoplay last put the page — the source of truth while it runs,
     so rounding in the browser's scroll position cannot slow it down, and
     a page that is not where it was left means the reader moved it */
  let autoY: number | null = null;
  const poke = () => {
    lastInput = performance.now();
    autoY = null;
  };
  const autoplay = (now: number, dt: number, ps: ReturnType<typeof pinState>) => {
    const inside = ps.at <= 0.5 && ps.f < total - 0.01;
    if (!inside) {
      inPin = false;
      autoY = null;
      return;
    }
    /* arriving counts as input: the wait runs from when the frame pins */
    if (!inPin) {
      inPin = true;
      poke();
    }
    if (autoY !== null && Math.abs(window.scrollY - autoY) > 3) poke();
    if (autoOff || focused) return;
    if (now - lastInput < (ps.f < HOLD ? AUTO_READ : AUTO_WAIT)) return;
    const k = clamp(Math.floor((ps.f - HOLD - DOCK) / STEP), 0, n - 1);
    const rate = ps.f < HOLD + DOCK ? DOCK / AUTO_DOCK : STEP / AUTO_STEP[k];
    const from = autoY ?? window.scrollY;
    const y = Math.min(ps.top + ps.span, from + rate * dt * (ps.span / total));
    autoY = y;
    window.dispatchEvent(new CustomEvent("site:scroll-to", { detail: { y, immediate: true } }));
  };
  const setAutoOff = (off: boolean) => {
    autoOff = off;
    auto.textContent = off ? "Play" : "Pause";
    auto.setAttribute("aria-label", off ? "Play the figure" : "Pause the figure");
    auto.classList.toggle("is-off", off);
    /* Play means now, not after the usual quiet */
    if (off) poke();
    else {
      lastInput = -Infinity;
      autoY = null;
    }
  };
  const onAuto = () => setAutoOff(!autoOff);
  auto.addEventListener("click", onAuto);
  const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  inputs.forEach((t) => window.addEventListener(t, poke, { passive: true }));

  /* ---------- input ---------- */
  const toLocal = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    const k = vb.w / r.width;
    pointer.x = (e.clientX - r.left) * k + vb.x - BOX.x;
    pointer.y = (e.clientY - r.top) * k + vb.y - BOX.y;
    pointer.inside = true;
  };
  const onMove = (e: PointerEvent) => {
    held = true;
    toLocal(e);
    /* moving in the figure is reading it; a pointer merely resting there
       is not, or a parked mouse would stop the autoplay for good */
    poke();
  };
  const onLeave = () => {
    held = false;
    pointer.inside = false;
    pointer.x = pointer.y = -1e4;
  };
  /* keyboard focus holds the cycle; a mouse click's focus must not, or a
     clicked output would stay pinned until something else took focus */
  const onFocusIn = (e: FocusEvent) => (focused = (e.target as Element).matches(":focus-visible"));
  const onFocusOut = () => (focused = false);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerdown", onMove);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("focusin", onFocusIn);
  stage.addEventListener("focusout", onFocusOut);

  const offs = outputs.map((b, i) => {
    /* Pinned, scroll is the control: a click glides the page to the middle
       of that output's stretch rather than fighting the scroll position. */
    const go = () => {
      if (!isPinned()) return setActive(i);
      const { top, span } = pinState();
      const y = top + ((HOLD + DOCK + (i + 0.5) * STEP) / total) * span;
      window.dispatchEvent(new CustomEvent("site:scroll-to", { detail: { y } }));
    };
    const hover = () => {
      if (!isPinned()) setActive(i);
    };
    b.addEventListener("click", go);
    b.addEventListener("mouseenter", hover);
    b.addEventListener("focus", hover);
    return () => {
      b.removeEventListener("click", go);
      b.removeEventListener("mouseenter", hover);
      b.removeEventListener("focus", hover);
    };
  });

  /* deferred a frame, so a fit that resizes what is observed cannot loop */
  let fitRaf = 0;
  const refit = () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fit);
  };
  const ro = new ResizeObserver(refit);
  for (const e of [frame, fig, stage, rail, ...lines]) ro.observe(e);
  const onMode = () => {
    fit();
    dwell = 0;
  };
  compact.addEventListener("change", onMode);
  pinned.addEventListener("change", onMode);
  document.fonts?.ready.then(refit);
  fit();

  /* ---------- the loop ---------- */
  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    /* capped, so a stall (a background tab, a long task) never jumps a
       sketch or skips an output */
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    sceneT += dt;

    let progress: number;
    if (isPinned()) {
      const ps = pinState();
      autoplay(now, dt, ps);
      const { f } = ps;
      const d = clamp((f - HOLD) / DOCK, 0, 1);
      applyDock(d);
      /* the first sketch starts as the figure arrives, not while hidden */
      if (d < 0.6) sceneT = 0;
      const st = f - HOLD - DOCK;
      const k = clamp(Math.floor(st / STEP), 0, n - 1);
      if (k !== active) setActive(k);
      progress = st <= 0 ? 0 : clamp(st / STEP - k, 0, 1);
    } else {
      if (!held && !focused && !reduced && !autoOff) {
        dwell += dt;
        if (dwell > DWELL) setActive((active + 1) % n);
      }
      progress = Math.min(1, dwell / DWELL);
    }
    /* one segment per output: done, in progress, to come */
    segs.forEach((g, k) => g.style.setProperty("--p", k < active ? "1" : k === active ? progress.toFixed(3) : "0"));

    const { port, readout: html } = scenes[active].frame(sceneT, pointer);
    if (html !== readHTML) {
      readout.innerHTML = html;
      readHTML = html;
    }

    /* the arrow: leaves along the sketch's own direction, lands level on
       the active output in the rail beside the drawing */
    if (compact.matches) return;
    const px = port[0] + BOX.x, py = port[1] + BOX.y;
    const sr = svg.getBoundingClientRect();
    const br = outputs[active].getBoundingClientRect();
    const ty = vb.y + (br.top + br.height / 2 - sr.top) / s;
    const landX = vb.x + vb.w - 4;
    if (!cp) {
      cp = [px, py, port[2]];
      landY = ty;
    }
    cp[0] += (px - cp[0]) * 0.16;
    cp[1] += (py - cp[1]) * 0.16;
    cp[2] += (port[2] - cp[2]) * 0.16;
    landY += (ty - landY) * 0.16;
    const reach = (landX - cp[0]) * 0.5;
    conn.setAttribute(
      "d",
      `M${cp[0]},${cp[1]} C${cp[0] + Math.cos(cp[2]) * reach},${cp[1] + Math.sin(cp[2]) * reach} ${landX - reach * 0.9},${landY} ${landX},${landY}`
    );
    connHead.setAttribute("d", head([landX, landY], 0, 13));
  };
  const start = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  /* run only while on screen */
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: "120px 0px" });
  io.observe(stage);
  /* paint one frame now, so the figure is never empty before it is seen */
  tick(performance.now());
  stop();

  return () => {
    stop();
    cancelAnimationFrame(fitRaf);
    io.disconnect();
    ro.disconnect();
    compact.removeEventListener("change", onMode);
    pinned.removeEventListener("change", onMode);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerdown", onMove);
    stage.removeEventListener("pointerleave", onLeave);
    stage.removeEventListener("focusin", onFocusIn);
    stage.removeEventListener("focusout", onFocusOut);
    offs.forEach((off) => off());
    auto.removeEventListener("click", onAuto);
    inputs.forEach((t) => window.removeEventListener(t, poke));
    clearDock();
    svg.innerHTML = "";
  };
}
