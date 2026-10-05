import { scrambleText } from "@/lib/smartText";
import { BOX, PINK, el, head, type Pointer, type Port, type Scene } from "./kit";
import { modelScene } from "./model";
import { dashboardScene } from "./dashboard";
import { agentScene } from "./agent";
import { appScene } from "./app";

/* §7 About figure — "the thing the analysis points to".

   Four sketches share one box; the outputs on the right choose which is
   drawn, and a pink arrow always runs from the sketch's own output to the
   label it produced. It cycles on its own, and any pointer in the figure
   (or focus on an output) holds it where it is.

   GEOMETRY. One SVG for the whole stage, viewBox in design px (STAGE). The
   stylesheet sizes the stage to 1400rem and the output labels in cqw, so
   the drawing and the HTML labels scale as one object at every width. At
   phone width the labels stack above and the viewBox crops to the box
   alone; the arrow has nowhere to go there, so it is hidden.

   TIME. Each sketch is driven by its own clock, which only advances while
   the figure is on screen. Off screen the loop stops entirely; back on
   screen it carries on where it was rather than jumping ahead. */

const STAGE = { w: 1400, h: 540 };
/* the band the labels sit in, and where the arrow lands */
const BAND = { y: 40, h: 460 };
const LAND_X = 1062;
const DWELL = 6500;
const PHONE = "(max-width: 720px)";

export type FigureParts = {
  stage: HTMLElement;
  svg: SVGSVGElement;
  outputs: HTMLButtonElement[];
  caption: HTMLElement;
  readout: HTMLElement;
};

export function mountAboutFigure({ stage, svg, outputs, caption, readout }: FigureParts): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia(PHONE);

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
  const cg = el(svg, "g", { class: "about__arrow", filter: "url(#wob2)", stroke: PINK, fill: "none", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const conn = el(cg, "path");
  const connHead = el(cg, "path");

  /* ---------- state ---------- */
  let active = 0;
  let sceneT = 0;
  let dwell = 0;
  let held = false; //   a pointer in the figure, or focus on an output
  let focused = false;
  const pointer: Pointer = { x: -1e4, y: -1e4, inside: false };
  let cp: Port | null = null;
  let landY = 0;
  let readHTML = "";

  const setViewBox = () =>
    svg.setAttribute("viewBox", phone.matches ? `${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}` : `0 0 ${STAGE.w} ${STAGE.h}`);
  setViewBox();

  const show = (i: number) => {
    groups.forEach((g, k) => g.classList.toggle("is-on", k === i));
    outputs.forEach((b, k) => {
      b.classList.toggle("is-on", k === i);
      b.setAttribute("aria-pressed", String(k === i));
    });
    caption.dataset.scrambleSource = scenes[i].caption;
    caption.textContent = scenes[i].caption;
  };
  const setActive = (i: number) => {
    dwell = 0;
    if (i === active) return;
    active = i;
    sceneT = 0;
    show(i);
    const label = outputs[i].querySelector<HTMLElement>(".about__outLabel");
    if (label) scrambleText(label, { duration: 420 });
    scrambleText(caption, { duration: 520 });
  };
  show(active);

  /* ---------- input ---------- */
  const toLocal = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = vb.width / r.width;
    pointer.x = (e.clientX - r.left) * k + vb.x - BOX.x;
    pointer.y = (e.clientY - r.top) * k + vb.y - BOX.y;
    pointer.inside = true;
  };
  const onMove = (e: PointerEvent) => {
    held = true;
    toLocal(e);
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
    const pick = () => setActive(i);
    b.addEventListener("mouseenter", pick);
    b.addEventListener("click", pick);
    b.addEventListener("focus", pick);
    return () => {
      b.removeEventListener("mouseenter", pick);
      b.removeEventListener("click", pick);
      b.removeEventListener("focus", pick);
    };
  });
  const onPhone = () => {
    setViewBox();
    cp = null;
  };
  phone.addEventListener("change", onPhone);

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
    if (!held && !focused && !reduced) {
      dwell += dt;
      if (dwell > DWELL) setActive((active + 1) % scenes.length);
    }
    outputs.forEach((b, k) => b.style.setProperty("--p", k === active ? Math.min(1, dwell / DWELL).toFixed(3) : "0"));

    const { port, readout: html } = scenes[active].frame(sceneT, pointer);
    if (html !== readHTML) {
      readout.innerHTML = html;
      readHTML = html;
    }

    /* the arrow: leaves along the sketch's own direction, lands level on its label */
    if (phone.matches) return;
    const px = port[0] + BOX.x, py = port[1] + BOX.y;
    const ty = BAND.y + (active + 0.5) * (BAND.h / scenes.length);
    if (!cp) {
      cp = [px, py, port[2]];
      landY = ty;
    }
    cp[0] += (px - cp[0]) * 0.16;
    cp[1] += (py - cp[1]) * 0.16;
    cp[2] += (port[2] - cp[2]) * 0.16;
    landY += (ty - landY) * 0.16;
    const reach = (LAND_X - cp[0]) * 0.42;
    conn.setAttribute(
      "d",
      `M${cp[0]},${cp[1]} C${cp[0] + Math.cos(cp[2]) * reach},${cp[1] + Math.sin(cp[2]) * reach} ${LAND_X - reach * 0.9},${landY} ${LAND_X},${landY}`
    );
    connHead.setAttribute("d", head([LAND_X, landY], 0, 15));
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
    io.disconnect();
    phone.removeEventListener("change", onPhone);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerdown", onMove);
    stage.removeEventListener("pointerleave", onLeave);
    stage.removeEventListener("focusin", onFocusIn);
    stage.removeEventListener("focusout", onFocusOut);
    offs.forEach((off) => off());
    svg.innerHTML = "";
  };
}

