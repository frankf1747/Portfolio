"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRESETS } from "@/data/starbucks";
import { constraintChips, constraintJson, products, run } from "@/lib/starbucks";

/* The Starbucks study as a working demo, in the report's own plain style.

   01 TRY IT — the customer's side: pick a request, it types itself, and
   the ranked drinks come back with what the system understood.
   02 UNDER THE HOOD — the same request, taken apart: the constraint JSON
   the LLM extracts, the 115-product menu filtered down to what passes, and
   the TF-IDF scores that order what is left. Then the numbers.

   Filtering and ranking really run here, on the real catalog. Extraction is
   the one step not re-run: each preset carries the labelled constraints,
   which is exactly what the extractor is asked to return. */

const TOP = 5;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* plays once when scrolled into view, and again whenever `key` changes */
function usePlay(key: string) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) return setT(1e9);
    setT(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setT(now - t0);
      if (now - t0 < 6000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, key]);
  return { ref, t: seen ? t : 0 };
}

const fmt = (p: { price: number; cal: number; caffeine: number }) => `$${p.price.toFixed(2)} · ${p.cal} cal · ${p.caffeine} mg caffeine`;


/* The whole pipeline as a flowchart: what runs per query, what is built
   once, and how it was scored. Report style — rules and mono, the green on
   the path a request actually travels. */
const BOX = 108, GAP = 20, X0 = 4;
const bx = (i: number) => X0 + i * (BOX + GAP);
const ROW = [
  { t: "QUERY", d: ["free text", "from the user"] },
  { t: "PROMPT", d: ["schema + vocab", "+ few-shot"] },
  { t: "LLM", d: ["Llama 3.1 70B", "via Groq"] },
  { t: "VALIDATE", d: ["JSON schema,", "allowed values"] },
  { t: "FILTER", d: ["one predicate", "per field"] },
  { t: "RANK", d: ["TF-IDF ·", "cosine"] },
  { t: "TOP K", d: ["ranked", "drinks"] }
];

function Flowchart() {
  const y = 48, h = 62, mid = y + h / 2;
  return (
    <figure className="fig sbx__flowfig">
      <div className="sbx__flowscroll">
        <svg className="sbx__flow" viewBox="0 0 900 318" role="img" aria-label="Pipeline: query, prompt, LLM, validate, filter, rank, top K; catalog and TF-IDF index built once; scored with NDCG against labelled queries.">
          {/* the request's path, under the boxes so it shows in the gaps */}
          <path className="sbx__live" d={`M${bx(0)},${mid} H${bx(6) + BOX}`} />
          <text x={0} y={24} className="sbx__lane">PER QUERY</text>
          {ROW.map((r, i) => (
            <g key={r.t} className={i === 2 ? "is-model" : ""}>
              <rect x={bx(i)} y={y} width={BOX} height={h} />
              <text x={bx(i) + 10} y={y + 20} className="sbx__ft">{r.t}</text>
              <text x={bx(i) + 10} y={y + 38} className="sbx__fd">{r.d[0]}</text>
              <text x={bx(i) + 10} y={y + 52} className="sbx__fd">{r.d[1]}</text>
              {i < ROW.length - 1 && <path className="sbx__arrow" d={`M${bx(i) + BOX},${mid} H${bx(i + 1) - 4} m-5,-4 l5,4 l-5,4`} />}
            </g>
          ))}
          {/* a bad parse goes back to the model, once */}
          <path className="sbx__arrow is-dash" d={`M${bx(3) + BOX / 2},${y} V${y - 14} H${bx(2) + BOX / 2} V${y - 4} m-4,-5 l4,5 l4,-5`} />
          <text x={(bx(2) + bx(3) + BOX) / 2} y={y - 18} textAnchor="middle" className="sbx__fd">invalid → retry</text>

          <text x={bx(4)} y={182} className="sbx__lane">BUILT ONCE</text>
          <rect x={bx(4)} y={186} width={BOX} height={52} />
          <text x={bx(4) + 10} y={206} className="sbx__ft">CATALOG</text>
          <text x={bx(4) + 10} y={224} className="sbx__fd">115 products</text>
          <rect x={bx(5)} y={186} width={BOX} height={52} />
          <text x={bx(5) + 10} y={206} className="sbx__ft">INDEX</text>
          <text x={bx(5) + 10} y={224} className="sbx__fd">TF-IDF vectors</text>
          <path className="sbx__arrow" d={`M${bx(4) + BOX},212 H${bx(5) - 4} m-5,-4 l5,4 l-5,4`} />
          <path className="sbx__arrow" d={`M${bx(4) + BOX / 2},186 V${y + h + 4} m-4,5 l4,-5 l4,5`} />
          <path className="sbx__arrow" d={`M${bx(5) + BOX / 2},186 V${y + h + 4} m-4,5 l4,-5 l4,5`} />
          <text x={bx(4) - 8} y={150} textAnchor="end" className="sbx__fd">columns</text>
          <text x={bx(5) + BOX / 2 + 8} y={150} className="sbx__fd">vectors</text>

          <text x={bx(6) + BOX + 4} y={182} textAnchor="end" className="sbx__lane">SCORED</text>
          <rect x={bx(6)} y={186} width={BOX} height={52} />
          <text x={bx(6) + 10} y={206} className="sbx__ft">EVAL</text>
          <text x={bx(6) + 10} y={224} className="sbx__fd">NDCG@5, @10</text>
          <path className="sbx__arrow" d={`M${bx(6) + BOX / 2},${y + h} V182 m-4,-5 l4,5 l4,-5`} />
          <rect x={bx(6)} y={262} width={BOX} height={44} className="is-soft" />
          <text x={bx(6) + 10} y={280} className="sbx__fd">100 labelled</text>
          <text x={bx(6) + 10} y={294} className="sbx__fd">train queries</text>
          <path className="sbx__arrow" d={`M${bx(6) + BOX / 2},262 V${242} m-4,5 l4,-5 l4,5`} />
        </svg>
      </div>
      <figcaption className="fig__cap">
        One model call, then nothing but table lookups and arithmetic. The model only ever fills a fixed schema with
        allowed values, so a bad parse is caught before it can filter anything.
      </figcaption>
    </figure>
  );
}

export default function StarbucksDemo() {
  const [i, setI] = useState(0);
  const preset = PRESETS[i];
  const { kept, ranked } = useMemo(() => run(preset.text, preset.c), [preset]);
  const top = ranked.slice(0, TOP);
  const maxScore = ranked[0]?.score || 1;

  /* ---- 01: typing, then results ---- */
  const a = usePlay(`a${i}`);
  const typed = Math.min(preset.text.length, Math.floor(a.t / 22));
  const typing = typed < preset.text.length;
  const doneAt = preset.text.length * 22;
  const showChips = a.t > doneAt + 250;
  const showResults = a.t > doneAt + 650;

  /* ---- 02: extract → filter → rank ---- */
  const b = usePlay(`b${i}`);
  const json = JSON.stringify(constraintJson(preset.c), null, 2);
  const jsonShown = json.slice(0, Math.floor(b.t / 9));
  const filtered = b.t > json.length * 9 + 300;
  const rankedIn = b.t > json.length * 9 + 1500;

  return (
    <>
      <section className="study__block sbx">
        <h3 className="small study__label">01 — TRY IT</h3>
        <p className="sbx__lede">Pick a request. This is what the customer gets back.</p>

        <div className="sbx__presets" role="group" aria-label="Example requests">
          {PRESETS.map((p, k) => (
            <button key={p.id} type="button" className={`sbx__preset${k === i ? " is-on" : ""}`} aria-pressed={k === i} onClick={() => setI(k)}>
              {p.text}
            </button>
          ))}
        </div>

        <div className="sbx__app" ref={a.ref as React.RefObject<HTMLDivElement>}>
          <div className="sbx__search" aria-live="polite">
            <span className="sbx__q">
              {preset.text.slice(0, typed)}
              {typing && <i className="sbx__caret" />}
            </span>
          </div>

          <div className={`sbx__chips${showChips ? " is-in" : ""}`}>
            <span className="small sbx__k">UNDERSTOOD</span>
            {constraintChips(preset.c).map((c) => (
              <span key={c} className="sbx__chip">
                {c}
              </span>
            ))}
          </div>

          <ol className={`sbx__results${showResults ? " is-in" : ""}`}>
            {top.map(({ p }, k) => (
              <li key={p.id} style={{ "--k": k } as React.CSSProperties}>
                <span className="sbx__rank">{k + 1}</span>
                <span className="sbx__name">{p.name}</span>
                <span className="small sbx__meta">{fmt(p)}</span>
              </li>
            ))}
          </ol>
          {ranked.length > TOP && <p className={`small sbx__more${showResults ? " is-in" : ""}`}>+ {ranked.length - TOP} MORE THAT FIT</p>}
        </div>
      </section>

      <section className="study__block sbx" ref={b.ref}>
        <h3 className="small study__label">02 — UNDER THE HOOD</h3>
        <p className="sbx__lede">The same request, one step at a time.</p>

        <div className="sbx__steps">
          <div className="sbx__step">
            <span className="small sbx__stepK">1 · EXTRACT</span>
            <span className="sbx__stepT">The LLM turns the sentence into fields.</span>
            <pre className="sbx__json">{jsonShown}</pre>
            <span className="small sbx__note">LLAMA 3.1 70B · FIXED JSON SCHEMA</span>
          </div>

          <div className="sbx__step">
            <span className="small sbx__stepK">2 · FILTER</span>
            <span className="sbx__stepT">
              Every field is a hard rule. <b>115 → {filtered ? kept.size : 115}</b>
            </span>
            <div className="sbx__dots" aria-label={`${kept.size} of 115 products pass`}>
              {products.map((p, k) => (
                <i key={p.id} className={filtered ? (kept.has(p.id) ? "is-kept" : "is-out") : ""} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </div>
            <span className="small sbx__note">DETERMINISTIC · NO MODEL</span>
          </div>

          <div className="sbx__step">
            <span className="small sbx__stepK">3 · RANK</span>
            <span className="sbx__stepT">What&apos;s left is scored against the words.</span>
            <ul className="sbx__bars">
              {ranked.slice(0, 7).map(({ p, score }, k) => (
                <li key={p.id} className={k < TOP ? "is-top" : ""}>
                  <span className="sbx__barN">{p.name}</span>
                  <span className="sbx__bar">
                    <i style={{ width: rankedIn ? `${Math.max(4, (score / maxScore) * 100)}%` : "0%", transitionDelay: `${k * 70}ms` }} />
                  </span>
                  <span className="sbx__barV">{rankedIn ? score.toFixed(2) : ""}</span>
                </li>
              ))}
            </ul>
            <span className="small sbx__note">TF-IDF · COSINE SIMILARITY</span>
          </div>
        </div>

        <h4 className="small sbx__sub">THE FULL PIPELINE</h4>
        <Flowchart />

        <div className="study__stats sbx__stats">
          {[
            ["0.936", "NDCG@5"],
            ["0.932", "NDCG@10"],
            ["115", "PRODUCTS"],
            ["100", "TEST QUERIES"]
          ].map(([v, l]) => (
            <div className="study__stat" key={l}>
              <span className="study__statV">{v}</span>
              <span className="small study__statL">{l}</span>
            </div>
          ))}
        </div>

        <figure className="fig">
          <div className="fig__bar">
            <span className="fig__seg fig__seg--a">LLM EXTRACTION</span>
            <span className="fig__seg fig__seg--b">FILTER + RANK</span>
          </div>
          <figcaption className="fig__cap">
            Where the time goes. Filter and rank are effectively free; nearly all the latency is the one model call, so the
            next moves are there: cache common requests, distil the extractor, move to a vector store as the menu grows.
            Proportions indicative.
          </figcaption>
        </figure>
      </section>
    </>
  );
}
