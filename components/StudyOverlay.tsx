"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SmartText from "./SmartText";
import type { Study } from "@/data/studies";

/* §12 — the study window.

   A study opens OVER the homepage, which stays visible behind it at low
   opacity. That is the whole point: it should read as part of the page
   rather than as a destination, so there is no route change and no
   transition away from the scroll position.

   Three things this must not break:

   1. NO KEYFRAMES. There are none anywhere else on the site — the caps
      strip is a real overflow scroller specifically to avoid a CSS
      marquee — so the arrival is a transition on a mounted element.
   2. Lenis is scoped inside ScrollProvider's effect and cannot be reached
      from here, so the scroll lock goes through site:lock / site:unlock
      rather than by setting data-locked directly. Setting the attribute
      alone would stop the native document but leave Lenis running.
   3. The panel is PORTALLED to body. Rendered in place it would sit
      inside <main>, which is the element being dimmed, so the report
      would fade out along with the page behind it. */

/* The figures are diagrams, not charts. They carry no scale and no axis
   because the underlying deck reported this qualitatively; anything with
   a real number belongs in `stats`, where it is traceable to source. */

function PipelineFigure() {
  const stages = [
    { n: "1", t: "EXTRACT", d: "Llama 3.1 70B, fixed JSON schema" },
    { n: "2", t: "FILTER", d: "Column predicates, 115 → 5–20" },
    { n: "3", t: "RANK", d: "TF-IDF, cosine similarity" }
  ];
  return (
    <figure className="fig">
      <div className="fig__flow">
        <span className="fig__end">QUERY</span>
        {stages.map((s) => (
          <div className="fig__stage" key={s.n}>
            <span className="fig__stageN">{s.n}</span>
            <span className="fig__stageT">{s.t}</span>
            <span className="fig__stageD">{s.d}</span>
          </div>
        ))}
        <span className="fig__end">RANKED</span>
      </div>
      <figcaption className="fig__cap">
        The model reads the sentence. Everything after that is deterministic.
      </figcaption>
    </figure>
  );
}

function LatencyFigure() {
  return (
    <figure className="fig">
      <div className="fig__bar">
        <span className="fig__seg fig__seg--a">LLM CONSTRAINT EXTRACTION</span>
        <span className="fig__seg fig__seg--b">FILTER + RANK</span>
      </div>
      <figcaption className="fig__cap">
        Time per query. Proportions are indicative, not measured: the source
        deck reported this split qualitatively.
      </figcaption>
    </figure>
  );
}

export default function StudyOverlay({
  study,
  onClose
}: {
  study: Study;
  onClose: () => void;
}) {
  /* A transition needs two states and there is no keyframe to fall back
     on, so the panel mounts at rest and is flipped on the next frame. */
  const [shown, setShown] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  /* Restores to whatever opened the panel, so closing with Escape puts the
     caret back on the study you were just reading rather than at the top
     of the document. */
  const returnTo = useRef<HTMLElement | null>(null);

  /* onClose arrives as a fresh arrow on every parent render. Depending on
     it directly re-runs the mount effect each time, which cancels the entry
     frame before it fires and thrashes is-study-open on and off — the panel
     stays at opacity 0 and the page never dims. Read it through a ref and
     keep the effect on an empty dep list. */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null;

    document.documentElement.classList.add("is-study-open");
    window.dispatchEvent(new Event("site:lock"));
    document.addEventListener("keydown", onKey);

    /* Focus lands on the close control rather than the panel itself, so the
       first Tab moves forward through the report instead of out of it. */
    closeRef.current?.focus();

    const raf = requestAnimationFrame(() => setShown(true));

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("is-study-open");
      window.dispatchEvent(new Event("site:unlock"));
      document.removeEventListener("keydown", onKey);
      returnTo.current?.focus?.();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const body = (
    <div className={`study${shown ? " is-in" : ""}`} role="presentation">
      {/* the dimmed surround is the click target for dismissal */}
      <div className="study__scrim" onClick={onClose} />

      <div
        className="study__panel"
        style={{ "--brand": study.brand } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-title"
        ref={panelRef}
      >
        <div className="study__head">
          <div className="study__ident">
            {/* Reserved at a fixed size whether or not art exists, so
                dropping the real mark in later cannot reflow the head. */}
            <span className="study__logo" aria-hidden="true">
              {study.logo ? <img src={study.logo} alt="" /> : null}
            </span>
            <span className="small study__n">({study.n})</span>
            <h2 className="h1 study__title" id="study-title">
              {study.name}
            </h2>
          </div>
          <button
            className="study__close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close study"
          >
            <span aria-hidden="true">CLOSE ×</span>
          </button>
        </div>

        <div className="study__meta">
          <SmartText as="span" className="small">{study.descriptor}</SmartText>
          <SmartText as="span" className="small">{study.role}</SmartText>
          <SmartText as="span" className="small">{study.year}</SmartText>
        </div>

        <p className="study__context">{study.context}</p>

        <div className="study__report">
          <section className="study__block">
            <SmartText as="h3" className="small study__label">WHAT IT IS</SmartText>
            <p className="study__body">{study.what}</p>
          </section>

          {!study.draft && (
            <>
              <section className="study__block">
                <SmartText as="h3" className="small study__label">PROBLEM</SmartText>
                <p className="study__body">{study.problem}</p>
              </section>

              <section className="study__block">
                <SmartText as="h3" className="small study__label">SOLUTION</SmartText>
                <ol className="study__steps">
                  {study.solution.map((s, i) => (
                    <li key={i}>
                      <span className="study__stepN">{String(i + 1).padStart(2, "0")}</span>
                      <span className="study__body">{s}</span>
                    </li>
                  ))}
                </ol>
                {study.figures?.includes("pipeline") && <PipelineFigure />}
              </section>

              <section className="study__block">
                <SmartText as="h3" className="small study__label">TAKEAWAY</SmartText>
                {study.stats && (
                  <div className="study__stats">
                    {study.stats.map((s) => (
                      <div className="study__stat" key={s.label}>
                        <span className="study__statV">{s.value}</span>
                        <span className="small study__statL">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="study__body">{study.takeaway}</p>
                {study.figures?.includes("latency") && <LatencyFigure />}
              </section>
            </>
          )}
        </div>

        <p className="study__note">
          Coursework and independent analysis on public and provided data. Not
          client work.
        </p>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
