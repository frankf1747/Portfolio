"use client";

/* Global systems: motion boot, gradient canvas, nav, cursor, preloader,
   page-transition wipe. Mounted once in the root layout — persists across
   route changes; only {children} swaps. */

import { useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { bootMotion, scrollToTop, prefersReduced, DUR } from "@/lib/motion";
import { gradient } from "@/lib/gradient";
import { onTransition } from "@/lib/transition";
import Nav from "./Nav";
import Cursor from "./Cursor";
import Preloader from "./Preloader";

export default function Shell({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pendingHref = useRef<string | null>(null);

  useEffect(() => {
    bootMotion();
    if (canvasRef.current) gradient.mount(canvasRef.current, prefersReduced());
  }, []);

  /* transition: wipe up → push route → (pathname effect) wipe off */
  useEffect(() => {
    onTransition((href) => {
      if (prefersReduced() || !wipeRef.current) { router.push(href); return; }
      pendingHref.current = href;
      gsap.fromTo(wipeRef.current,
        { yPercent: 100 },
        {
          yPercent: 0, duration: 0.6, ease: "expo.inOut",
          onComplete: () => router.push(href)
        });
    });
  }, [router]);

  useEffect(() => {
    scrollToTop(true);
    ScrollTrigger.refresh();
    if (pendingHref.current && wipeRef.current) {
      pendingHref.current = null;
      gsap.to(wipeRef.current, {
        yPercent: -100, duration: 0.6, ease: "expo.inOut", delay: 0.08,
        onComplete: () => { gsap.set(wipeRef.current, { yPercent: 100 }); }
      });
    }
  }, [pathname]);

  return (
    <>
      <canvas ref={canvasRef} className="c-Gradient" aria-hidden="true" />
      <Preloader />
      <Nav />
      <div className="c-Page">{children}</div>
      <div ref={wipeRef} className="c-Wipe" aria-hidden="true" />
      <Cursor />
    </>
  );
}
