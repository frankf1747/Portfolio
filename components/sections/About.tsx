"use client";

import { useEffect, useRef } from "react";
import SmartText from "../SmartText";
import { scrambleText } from "@/lib/smartText";
import { mountAboutFigure } from "@/lib/aboutFigure";

/* §7 — the statement, and the figure that makes it literal.

   The headline says it: I build the thing the analysis points to. The figure
   under it then does exactly that — four sketches of the kinds of thing the
   work turns into (a model, a dashboard, an agent, an app), each with a pink
   arrow running from the sketch out to its name. "The thing" is set in the
   same pink as that arrow, so the headline and the figure read as one claim.

   The paragraph keeps the prose voice; the figure carries the evidence. The
   education rows are the figure's sources — set as a chart footnote, since
   that is literally what they are to the analysis above them.

   All the drawing lives in lib/aboutFigure (one module per sketch); this
   component only lays out the stage and hands it the elements. */

const OUTPUTS: { label: string; icon: React.ReactNode }[] = [
  { label: "A model", icon: <><path d="M6 40 H44 M6 40 V6" /><path d="M8 36 C20 36 22 12 42 10" /></> },
  { label: "A dashboard", icon: <><rect x="5" y="7" width="38" height="34" rx="3" /><path d="M14 33 V24 M22 33 V16 M30 33 V21 M38 33 V13" /></> },
  { label: "An agent", icon: <><rect x="15" y="4" width="18" height="11" rx="2" /><circle cx="8" cy="38" r="4" /><circle cx="24" cy="38" r="4" /><circle cx="40" cy="38" r="4" /><path d="M20 15 L9 34 M24 15 V34 M28 15 L39 34" /></> },
  { label: "An app", icon: <><rect x="4" y="7" width="40" height="34" rx="3" /><path d="M4 15 H44 M13 15 V41 M19 22 H38 M19 29 H32 M19 35 H36" /></> }
];

const SOURCES = [
  { degree: "MASTER OF BUSINESS ANALYTICS", school: "UCLA ANDERSON SCHOOL OF MANAGEMENT", dates: "2025.09 — 2026.12" },
  { degree: "APPLIED STATISTICS & UX DESIGN", school: "UNIVERSITY OF TORONTO", dates: "2021.09 — 2025.05" }
];

export default function About() {
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const thingRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const capRef = useRef<HTMLSpanElement | null>(null);
  const readRef = useRef<HTMLSpanElement | null>(null);
  const outRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* the headline rises in, and "the thing" decodes as it lands */
  useEffect(() => {
    const h = headRef.current;
    if (!h) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        h.classList.add("is-in");
        if (thingRef.current) scrambleText(thingRef.current, { duration: 900 });
        io.disconnect();
      },
      { threshold: 0 }
    );
    io.observe(h);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current, svg = svgRef.current, caption = capRef.current, readout = readRef.current;
    const outputs = outRefs.current.filter((b): b is HTMLButtonElement => !!b);
    if (!stage || !svg || !caption || !readout || outputs.length !== OUTPUTS.length) return;
    return mountAboutFigure({ stage, svg, outputs, caption, readout });
  }, []);

  return (
    <section className="about" id="about">
      <div className="about__head">
        <SmartText className="small index">01 — ABOUT</SmartText>
        <SmartText className="small">LOS ANGELES, CA</SmartText>
      </div>

      <div className="about__top">
        <h2 className="about__h" ref={headRef}>
          <span className="about__hl">
            I build <em ref={thingRef}>the thing</em>
          </span>
          <span className="about__hl">the analysis points to.</span>
        </h2>
        <SmartText as="p" className="about__p" isBody>
          Finding the cause is half the job. The other half is deciding what&apos;s
          worth fixing and shipping something people will actually use: a model, a
          dashboard, an agent, an app. The best ones stop being tools and become how
          the work runs.
        </SmartText>
      </div>

      <div className="about__stage" ref={stageRef}>
        <span className="about__cap" ref={capRef} aria-hidden="true" />
        <span className="about__read" ref={readRef} aria-hidden="true" />
        <svg className="about__svg" ref={svgRef} aria-hidden="true" focusable="false" />
        <ul className="about__outs" aria-label="What the analysis turns into">
          {OUTPUTS.map((o, i) => (
            <li key={o.label}>
              <button
                type="button"
                className={`about__out${i === 0 ? " is-on" : ""}`}
                aria-pressed={i === 0}
                ref={(el) => {
                  outRefs.current[i] = el;
                }}
              >
                <svg className="about__outIcon" viewBox="0 0 48 48" aria-hidden="true">
                  <g>{o.icon}</g>
                </svg>
                <span className="about__outLabel">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="about__src">
        <SmartText as="span" className="small about__srcHead">SOURCES</SmartText>
        <ol className="about__srcList">
          {SOURCES.map((s, i) => (
            <li className="about__srcRow" key={s.school}>
              <SmartText as="span" className="small about__srcName">{`[${i + 1}] ${s.degree} — ${s.school}`}</SmartText>
              <SmartText as="span" className="small about__srcDates">{s.dates}</SmartText>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
