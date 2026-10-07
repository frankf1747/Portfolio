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

   On a laptop and up the section is one PINNED frame that plays in two
   acts. First the statement: headline and paragraph, centred and held, so
   the reader lands on it without aiming. Then the headline DOCKS — it
   shrinks into one line beside the section label at the top — the
   paragraph steps aside, and the figure takes the screen, where further
   scroll steps it through its four outputs. The headline never leaves, so
   it cannot be overshot, and the figure gets the height it needs to be
   read. Left alone it plays itself, scrolling the page on at reading pace;
   any scroll takes over, and Pause stops it. Phones, tablets and short
   windows get the same content in flow.

   All the drawing and the scroll logic live in lib/aboutFigure; this
   component only lays out the frame and hands it the elements. */

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
  const pinRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ledeRef = useRef<HTMLDivElement | null>(null);
  const figRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const capRef = useRef<HTMLSpanElement | null>(null);
  const readRef = useRef<HTMLSpanElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const autoRef = useRef<HTMLButtonElement | null>(null);
  const outRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const segRefs = useRef<(HTMLElement | null)[]>([]);

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
    const pin = pinRef.current, frame = frameRef.current, label = labelRef.current, lede = ledeRef.current;
    const fig = figRef.current, stage = stageRef.current, rail = railRef.current, svg = svgRef.current;
    const caption = capRef.current, readout = readRef.current, count = countRef.current, auto = autoRef.current;
    const lines = lineRefs.current.filter((l): l is HTMLSpanElement => !!l);
    const outputs = outRefs.current.filter((b): b is HTMLButtonElement => !!b);
    const segs = segRefs.current.filter((s): s is HTMLElement => !!s);
    if (!pin || !frame || !label || !lede || !fig || !stage || !rail || !svg || !caption || !readout || !count || !auto) return;
    if (lines.length !== 2 || outputs.length !== OUTPUTS.length || segs.length !== OUTPUTS.length) return;
    return mountAboutFigure({ pin, frame, label, lines, lede, fig, stage, rail, svg, outputs, segs, caption, readout, count, auto });
  }, []);

  return (
    <section className="about" id="about">
      <div className="about__pin" ref={pinRef}>
        <div className="about__frame" ref={frameRef}>
          <div className="about__head" ref={labelRef}>
            <SmartText className="small index">01 — ABOUT</SmartText>
            <SmartText className="small">LOS ANGELES, CA</SmartText>
          </div>

          <div className="about__intro">
            <h2 className="about__h" ref={headRef}>
              <span className="about__hl">
                <span className="about__line" ref={(el) => { lineRefs.current[0] = el; }}>
                  I build <em ref={thingRef}>the thing</em>
                </span>
              </span>{" "}
              <span className="about__hl">
                <span className="about__line" ref={(el) => { lineRefs.current[1] = el; }}>
                  the analysis points to.
                </span>
              </span>
            </h2>
            <div className="about__lede" ref={ledeRef}>
              {/* Three beats, your words unchanged: the claim, the work, the
                  payoff. The four outputs are set in the figure's own mono,
                  numbered as its rail is, so the sentence reads as a key. */}
              <p className="about__p">
                <strong>Finding the cause is half the job.</strong> The other half is deciding
                what&apos;s worth fixing and shipping something people will actually use:{" "}
                {["a model", "a dashboard", "an agent", "an app"].map((k, i, all) => (
                  <span key={k}>
                    <span className="about__k">
                      {k}
                      <sup>{`0${i + 1}`}</sup>
                    </span>
                    {i < all.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
              <p className="about__close">
                The best ones stop being tools and become <em>how the work runs.</em>
              </p>
            </div>
          </div>

          <div className="about__fig" ref={figRef}>
            <div className="about__stage" ref={stageRef}>
              <div className="about__plate">
                <span className="about__read" ref={readRef} aria-hidden="true" />
                <svg className="about__svg" ref={svgRef} aria-hidden="true" focusable="false" />
                <span className="about__cap" ref={capRef} aria-hidden="true" />
              </div>
              <div className="about__rail" ref={railRef}>
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
                        <span className="about__outN" aria-hidden="true">{`0${i + 1}`}</span>
                        <svg className="about__outIcon" viewBox="0 0 48 48" aria-hidden="true">
                          <g>{o.icon}</g>
                        </svg>
                        <span className="about__outLabel">{o.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="about__steps">
                  <span className="about__count" ref={countRef} aria-hidden="true">01 / 04</span>
                  <span className="about__track" aria-hidden="true">
                    {OUTPUTS.map((o, i) => (
                      <i
                        key={o.label}
                        ref={(el) => {
                          segRefs.current[i] = el;
                        }}
                      />
                    ))}
                  </span>
                  <button type="button" className="about__auto" ref={autoRef} aria-label="Pause the figure">
                    Pause
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toronto to LA, drawn on the sources' rule: the CN Tower on the
          left, the beach and a palm on the right, and a little car driving
          the road between them. Decoration only. */}
      <div className="about__trip" aria-hidden="true">
        <svg className="about__cn" viewBox="0 0 70 150">
          <g>
            <path d="M24,149 L32,62 M46,149 L38,62" />
            <path d="M23,57 Q35,49 47,57 L44,64 L26,64 Z" />
            <path d="M33,50 L34,27 M37,50 L36,27" />
            <path d="M31,21 h8 v6 h-8 Z" />
            <path d="M35,21 V2" />
            <path d="M2,149 V128 h14 V149 M52,149 V118 h14 V149 M56,124 h6 M56,132 h6 M6,134 h6" />
          </g>
        </svg>
        <svg className="about__car" viewBox="-18 0 88 36">
          <g>
            <path className="about__carBody" d="M4,26 L4,18 Q6,14 12,13 L20,12 L28,4 L46,4 L54,12 L63,14 Q67,15 67,20 L67,26 Z" />
            <path className="about__carGlass" d="M30,7 L44,7 L50,12 L25,12 Z" />
            <path d="M37,7 L37,12" />
            <path className="about__carFx" d="M-16,16 h10 M-13,21 h8 M-16,26 h11" />
            <g className="about__wheel"><circle cx="18" cy="27" r="5.5" /><path d="M18,23 V31" /></g>
            <g className="about__wheel"><circle cx="54" cy="27" r="5.5" /><path d="M54,23 V31" /></g>
          </g>
        </svg>
        <svg className="about__palm" viewBox="0 0 170 100">
          <g>
            <circle cx="122" cy="40" r="13" />
            <path d="M68,92 q8,-6 16,0 t16,0 t16,0 t16,0 t16,0 t16,0" />
            <path d="M84,82 q6,-4 12,0 t12,0 t12,0" />
            <path d="M8,99 Q34,90 66,99" />
            <path d="M40,99 C43,76 47,56 58,37" />
            <path d="M43,86 l5,1 M45,74 l5,1.5 M48,62 l5,2 M52,50 l5,2" />
            <path d="M58,37 C48,27 34,27 23,36 M58,37 C54,23 44,17 33,17 M58,37 C64,23 76,19 87,24 M58,37 C70,31 82,34 90,45 M58,37 C60,26 64,19 70,13" />
            <circle cx="55" cy="41" r="2.6" />
            <circle cx="61" cy="41.5" r="2.6" />
          </g>
        </svg>
      </div>

      <div className="about__src">
        <SmartText as="span" className="small about__srcHead">SOURCES</SmartText>
        <ol className="about__srcList">
          {SOURCES.map((s, i) => (
            <li className="about__srcRow" key={s.school}>
              {/* plain inline text, not the scramble engine: it lays each
                  part out as its own block line, which pushed the school
                  below the degree whenever the row ran short of room */}
              <span className="small about__srcName">
                <span className="about__srcDeg">{`[${i + 1}] ${s.degree}`}</span> — {s.school}
              </span>
              <SmartText as="span" className="small about__srcDates">{s.dates}</SmartText>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
