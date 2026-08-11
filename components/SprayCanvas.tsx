"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   The interactive layer: visitors can spray the wall.

   Pointer down + drag lays paint — a cloud of soft specks whose
   density follows speed, with heavy occasional droplets. Linger in
   one spot and the paint starts to run. `color` comes from the cap
   selector in Hero; `onFirstSpray` retires the hint label.

   Decorative play only: the canvas is aria-hidden and sits below
   every interactive control, so it never traps clicks or focus.
   ============================================================ */

export type SprayHandle = { clear: () => void };

export default function SprayCanvas({
  color,
  onFirstSpray,
  handleRef
}: {
  color: string;
  onFirstSpray: () => void;
  handleRef: React.MutableRefObject<SprayHandle | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  const sprayedRef = useRef(false);
  const onFirstRef = useRef(onFirstSpray);
  onFirstRef.current = onFirstSpray;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      /* keep existing paint on resize by copying it across */
      const prev = document.createElement("canvas");
      prev.width = canvas.width;
      prev.height = canvas.height;
      prev.getContext("2d")?.drawImage(canvas, 0, 0);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(prev, 0, 0, prev.width / dpr, prev.height / dpr);
    };
    resize();

    let down = false;
    let lastX = 0;
    let lastY = 0;
    let stillSince = 0;
    let dripRaf = 0;

    const gauss = () =>
      (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

    const burst = (x: number, y: number, speed: number) => {
      const c = colorRef.current;
      /* faint overspray halo */
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      /* speck cloud — tighter and denser when moving slowly */
      const n = speed > 18 ? 14 : 26;
      const spread = speed > 18 ? 22 : 13;
      for (let i = 0; i < n; i++) {
        const dx = gauss() * spread;
        const dy = gauss() * spread;
        ctx.globalAlpha = 0.1 + Math.random() * 0.22;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 0.6 + Math.random() * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      /* the odd heavy droplet */
      if (Math.random() < 0.16) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x + gauss() * 9, y + gauss() * 9, 2.6 + Math.random() * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drip = (x: number, y: number, len: number) => {
      ctx.fillStyle = colorRef.current;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x - 1.2, y, 2.4, len);
      ctx.beginPath();
      ctx.arc(x, y + len, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const dripLoop = (t: number) => {
      if (down && t - stillSince > 380) {
        drip(lastX + gauss() * 5, lastY + 6, 5 + Math.random() * 16);
        stillSince = t; // one run per linger, then wait again
      }
      dripRaf = requestAnimationFrame(dripLoop);
    };

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      down = true;
      if (!sprayedRef.current) {
        sprayedRef.current = true;
        onFirstRef.current();
      }
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointers can't be captured — spraying works regardless */
      }
      const { x, y } = toLocal(e);
      lastX = x;
      lastY = y;
      stillSince = performance.now();
      burst(x, y, 0);
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const { x, y } = toLocal(e);
      const speed = Math.hypot(x - lastX, y - lastY);
      /* stamp along the segment so fast strokes stay continuous */
      const steps = Math.max(1, Math.floor(speed / 7));
      for (let i = 1; i <= steps; i++) {
        burst(lastX + ((x - lastX) * i) / steps, lastY + ((y - lastY) * i) / steps, speed);
      }
      if (speed > 2.5) stillSince = performance.now();
      lastX = x;
      lastY = y;
    };

    const onUp = () => {
      down = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", resize);
    dripRaf = requestAnimationFrame(dripLoop);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(dripRaf);
    };
  }, []);

  useEffect(() => {
    handleRef.current = {
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  return <canvas ref={canvasRef} className="g-spray" aria-hidden="true" />;
}
