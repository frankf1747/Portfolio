"use client";

/* Percentage counter 0–100 bottom-left, tracking real loading (fonts +
   first gradient frame). On complete: counter fades, gradient blooms,
   hero reveals (Hero listens for "preload:done"). Once per session.
   Always rendered on the server; the skip decision happens in the effect —
   branching on sessionStorage during render causes hydration mismatches. */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { gradient } from "@/lib/gradient";
import { prefersReduced } from "@/lib/motion";

export default function Preloader() {
  const elRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (sessionStorage.getItem("preloaded") === "1" || prefersReduced()) {
      gradient.state.opacity = 1;
      gradient.state.scale = 1;
      el.remove();
      dispatchEvent(new Event("preload:done"));
      return;
    }

    const state = { n: 0 };
    let fontsReady = false;
    document.fonts.ready.then(() => { fontsReady = true; });

    const draw = () => { if (numRef.current) numRef.current.textContent = String(Math.round(state.n)); };
    const tween = gsap.to(state, { n: 90, duration: 1.2, ease: "power1.inOut", onUpdate: draw });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      tween.kill();
      gsap.to(state, {
        n: 100, duration: 0.3, ease: "power1.out", onUpdate: draw,
        onComplete: () => {
          sessionStorage.setItem("preloaded", "1");
          gsap.to(el, {
            opacity: 0, duration: 0.4, ease: "power1.out",
            onComplete: () => el.remove()
          });
          gradient.bloom();
          dispatchEvent(new Event("preload:done"));
        }
      });
    };

    const check = setInterval(() => {
      if (state.n >= 89 && fontsReady && gradient.ok) { clearInterval(check); finish(); }
    }, 60);
    const cap = setTimeout(() => { clearInterval(check); finish(); }, 2200);

    return () => { clearInterval(check); clearTimeout(cap); };
  }, []);

  return (
    <div ref={elRef} className="c-Preloader" aria-hidden="true">
      <span className="c-Preloader-count"><span ref={numRef}>0</span>%</span>
    </div>
  );
}
