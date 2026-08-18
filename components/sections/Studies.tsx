"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SmartText, { type SmartTextHandle } from "../SmartText";
import StudyOverlay from "../StudyOverlay";
import { studies } from "@/data/studies";

/* §12 — was "Subjects".

   The original listed seven company names at .h1 under an
   "analyses, not engagements" disclaimer, which kept the visual form of a
   client logo wall while the fine print admitted they were not clients.
   These are framed now as what they always were: things taken apart.
   Projects (§9) is what was built; this is what was studied.

   TWO ROWS, the second inset. One row left the section shorter than its own
   180rem padding, so the gap to Contact read as a hole. Both rows live
   inside ONE scroller so they travel together — two independent scrollers
   would drift apart on drag and the inset would stop meaning anything.

   HIERARCHY: the written study sits at full strength and the rest are held
   back, so the eye lands on the one that pays off and the others read as
   available rather than as equals. Hover brings them up to full.

   The honesty note is NOT SmartText. The engine splits text into per-word
   spans with the spacing carried in CSS, so the note copied out of the page
   as one unbroken string — which is exactly the wrong behaviour for the one
   line on the site that exists to be read literally. */

const SPLIT = 4;

export default function Studies() {
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const active = studies.find((s) => s.slug === open) ?? null;

  /* One handle per name so a hover can re-decode that name and only that
     name — the same rule the nav follows. Scrambling a row's neighbours
     reads as the page malfunctioning rather than responding. */
  const handles = useRef<(SmartTextHandle | null)[]>([]);

  /* Cursor parallax, the same treatment the project cards get. Depth varies
     per name so the wall reacts as a field rather than sliding as one sheet
     — equal depths would just translate the whole strip.

     Kept small: 22rem against the cards' 42rem. These are words on a line,
     not framed images, and past roughly this the names stop reading as a row
     and start reading as loose. */
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const posRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX_SHIFT = 22;
    const LERP = 0.1;
    const DEPTH = [1, 0.55, 0.85, 0.35, 0.9, 0.45, 0.7];

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = wrap.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => { tx = 0; ty = 0; };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      cx += (tx - cx) * LERP;
      cy += (ty - cy) * LERP;
      posRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = DEPTH[i % DEPTH.length];
        el.style.setProperty("--px", `${cx * MAX_SHIFT * d}rem`);
        el.style.setProperty("--py", `${cy * MAX_SHIFT * d}rem`);
      });
    };

    raf = requestAnimationFrame(frame);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="subjects" id="studies">
      <div className="subjects__head">
        <SmartText className="small index">05 — STUDIES</SmartText>
        <div className="subjects__headRight">
          <SmartText className="small">WHAT I TOOK APART</SmartText>
          <p className="subjects__note">Coursework and independent analysis.</p>
        </div>
      </div>

      <div className="subjects__strip" role="list" ref={wrapRef}>
        {[studies.slice(0, SPLIT), studies.slice(SPLIT)].map((row, r) => (
          <div className={`subjects__row${r ? " is-inset" : ""}`} key={r}>
            {row.map((s) => {
              const i = studies.indexOf(s);
              return (
                <div
                  className="subjects__item"
                  role="listitem"
                  key={s.slug}
                  ref={(el) => {
                    posRefs.current[i] = el;
                  }}
                >
                  <button
                    className={`study__open${s.draft ? " is-draft" : ""}`}
                    style={{ "--brand": s.brand } as React.CSSProperties}
                    onClick={() => setOpen(s.slug)}
                    onMouseEnter={() =>
                      handles.current[i]?.play({ scrambleOnly: true })
                    }
                    aria-haspopup="dialog"
                  >
                    <SmartText
                      className="h1 study__name"
                      trigger="manual"
                      pace="hover"
                      instanceRef={{
                        get current() {
                          return handles.current[i] ?? null;
                        },
                        set current(v) {
                          handles.current[i] = v;
                        }
                      }}
                    >
                      {s.name}
                    </SmartText>
                    <span className="small study__openMeta">{s.topic}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {active && <StudyOverlay study={active} onClose={close} />}
    </section>
  );
}
