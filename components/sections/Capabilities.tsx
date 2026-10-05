"use client";

import { useEffect, useRef } from "react";
import SmartText from "../SmartText";
import { scrambleText } from "@/lib/smartText";

/* §8 — expertise, as a notebook cell you can query.

   The bare list of capability words this replaced is on every portfolio and
   nobody believes it; the tools are the part a reader can verify, so the
   tools are never hidden. The form is the one a data person actually works
   in: a cell that types its own query, and the frame it returns.

   The chips rewrite the WHERE clause — backspacing to where the old query
   and the new one diverge, then typing the rest — the gutter shows In [*]
   while it "runs", and the matching rows decode in. Filtered rows keep
   their original index, the way a filtered frame does.

   The server render is the finished state (full query, every row), so the
   section reads with no script at all. The first time it scrolls into view
   it replays: clears the cell, types the query, decodes the rows. */

type Domain = "DATA" | "AI" | "PRODUCT";
const FILTERS = ["ALL", "DATA", "AI", "PRODUCT"] as const;
type Filter = (typeof FILTERS)[number];

/* Order is the original capability order. Domain is one word on purpose:
   it is a column value, and the chips filter on it. */
const SKILLS: { t: string; d: Domain; tools: string[] }[] = [
  { t: "Data analytics", d: "DATA", tools: ["SQL", "Python", "Databricks", "Fabric", "Medallion ETL", "Semantic modeling"] },
  { t: "Machine learning", d: "DATA", tools: ["scikit-learn", "Random forest", "XGBoost", "Feature engineering", "Cross-validation", "Clustering"] },
  { t: "Agentic dev", d: "AI", tools: ["LangGraph", "LLM APIs", "Skills", "Evals", "Orchestration"] },
  { t: "Optimization", d: "DATA", tools: ["Gurobi", "Integer programming", "Forecasting"] },
  { t: "Experimentation", d: "DATA", tools: ["A/B testing", "Causal inference", "RDD"] },
  { t: "Visualization", d: "DATA", tools: ["Power BI", "DAX", "Tableau", "GA4"] },
  { t: "Product", d: "PRODUCT", tools: ["PRDs", "User flows", "Figma", "Agile"] },
  { t: "Frontend/backend", d: "PRODUCT", tools: ["React", "Next.js", "APIs"] },
  { t: "Productivity", d: "PRODUCT", tools: ["Microsoft 365", "Genie Space", "Power Automate"] },
  { t: "AI engineering", d: "AI", tools: ["AI governance", "MCP", "RAG", "Context engineering", "Eval loop"] }
];

/* the query as tokens; the typewriter works on the plain string and the
   highlighter re-colours whatever prefix is currently showing */
type Tok = [kind: "" | "kw" | "cm" | "str", text: string];
const query = (d: Filter): Tok[] => {
  const t: Tok[] = [
    ["cm", "-- what I work with, and the tools behind it\n"],
    ["kw", "SELECT "], ["", "capability, tools, domain\n"],
    ["kw", "  FROM "], ["", "frank.expertise"]
  ];
  if (d !== "ALL") t.push(["", "\n"], ["kw", " WHERE "], ["", "domain = "], ["str", `'${d}'`]);
  t.push(["", ";"]);
  return t;
};
const plain = (t: Tok[]) => t.map((x) => x[1]).join("");
const markup = (t: Tok[], n: number) => {
  let out = "", left = n;
  for (const [k, s] of t) {
    if (left <= 0) break;
    const part = s.slice(0, left);
    left -= part.length;
    out += k ? `<span class="nb__${k}">${part}</span>` : part;
  }
  return out + '<span class="nb__caret"></span>';
};
const FULL = query("ALL");

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const codeRef = useRef<HTMLPreElement | null>(null);
  const inRef = useRef<HTMLSpanElement | null>(null);
  const outRef = useRef<HTMLSpanElement | null>(null);
  const footRef = useRef<HTMLParagraphElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current, code = codeRef.current, inG = inRef.current, outG = outRef.current, foot = footRef.current;
    const rows = rowRefs.current.filter((r): r is HTMLDivElement => !!r);
    const chips = chipRefs.current.filter((c): c is HTMLButtonElement => !!c);
    if (!section || !code || !inG || !outG || !foot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cur: Filter = "ALL";
    let shown = plain(FULL);
    let runs = 1;
    let busy = 0;
    const timers = new Set<number>();
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          res();
        }, ms);
        timers.add(id);
      });

    const type = async (toks: Tok[], my: number) => {
      const target = plain(toks);
      let k = 0;
      while (k < shown.length && k < target.length && shown[k] === target[k]) k++;
      if (reduced) {
        code.innerHTML = markup(toks, target.length);
        shown = target;
        return true;
      }
      const prev = query(cur);
      let n = shown.length;
      while (n > k) {
        if (busy !== my) return false;
        n--;
        code.innerHTML = markup(prev, n);
        await wait(14);
      }
      while (n < target.length) {
        if (busy !== my) return false;
        n++;
        code.innerHTML = markup(toks, n);
        await wait(target[n - 1] === "\n" ? 90 : 24);
      }
      shown = target;
      return true;
    };

    const decode = (row: HTMLElement) => {
      const name = row.querySelector<HTMLElement>(".nb__name");
      if (name) scrambleText(name, { duration: 480 });
      row.querySelectorAll<HTMLElement>(".nb__tool").forEach((b) => scrambleText(b, { duration: 420 }));
    };

    const run = async (d: Filter) => {
      const my = ++busy;
      chips.forEach((c) => {
        const on = c.dataset.filter === d;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      if (!(await type(query(d), my))) return;
      cur = d;
      inG.textContent = "In [*]:";
      await wait(reduced ? 0 : 380);
      if (busy !== my) return;
      runs++;
      inG.textContent = `In [${runs}]:`;
      outG.textContent = `Out[${runs}]:`;
      let n = 0;
      rows.forEach((r) => {
        const on = d === "ALL" || r.dataset.domain === d;
        r.hidden = !on;
        if (on) {
          const delay = n++ * 55;
          const id = window.setTimeout(() => {
            timers.delete(id);
            decode(r);
          }, delay);
          timers.add(id);
        }
      });
      foot.textContent = `[${n} rows x 3 columns]`;
    };

    const onChip = (e: Event) => {
      const f = (e.currentTarget as HTMLElement).dataset.filter as Filter;
      if (f) run(f);
    };
    chips.forEach((c) => c.addEventListener("click", onChip));
    const onRow = (e: Event) =>
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(".nb__tool").forEach((b) => scrambleText(b, { duration: 380 }));
    rows.forEach((r) => r.addEventListener("mouseenter", onRow));

    /* first sight: replay the cell from empty */
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (reduced) return;
        shown = "";
        runs = 0;
        code.innerHTML = markup(FULL, 0);
        inG.textContent = "In [ ]:";
        run("ALL");
      },
      { threshold: 0 }
    );
    io.observe(code);

    return () => {
      busy = -1;
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      chips.forEach((c) => c.removeEventListener("click", onChip));
      rows.forEach((r) => r.removeEventListener("mouseenter", onRow));
    };
  }, []);

  return (
    <section className="caps" id="capabilities" ref={sectionRef}>
      <div className="caps__head">
        <SmartText className="small index">02 — EXPERTISE</SmartText>
        <SmartText className="small">QUERY ME</SmartText>
      </div>

      <div className="nb">
        <div className="nb__cell">
          <span className="nb__gutter" ref={inRef} aria-hidden="true">In [1]:</span>
          <div className="nb__in">
            <pre
              className="nb__code"
              ref={codeRef}
              aria-label="SQL query: select capability, tools and domain from frank.expertise"
              dangerouslySetInnerHTML={{ __html: markup(FULL, plain(FULL).length) }}
            />
            <div className="nb__chips" role="group" aria-label="Filter by domain">
              <span className="nb__chipsLabel" aria-hidden="true">domain</span>
              {FILTERS.map((f, i) => (
                <button
                  type="button"
                  key={f}
                  className={`nb__chip${f === "ALL" ? " is-on" : ""}`}
                  data-filter={f}
                  aria-pressed={f === "ALL"}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                >
                  <span>{f === "ALL" ? "All" : f === "AI" ? "AI" : f[0] + f.slice(1).toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="nb__cell nb__cell--out">
          <span className="nb__gutter" ref={outRef} aria-hidden="true">Out[1]:</span>
          <div className="nb__out">
          <div className="nb__df" role="table" aria-label="Expertise: capability, tools, domain">
            <div className="nb__row nb__row--head" role="row">
              <span role="columnheader" aria-label="Index" />
              <span role="columnheader">capability</span>
              <span role="columnheader">tools</span>
              <span role="columnheader" className="nb__domain">domain</span>
            </div>
            {SKILLS.map((s, i) => (
              <div
                className="nb__row"
                role="row"
                key={s.t}
                data-domain={s.d}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
              >
                <span className="nb__i" role="cell">{i}</span>
                <span className="nb__name" role="rowheader">{s.t}</span>
                <span className="nb__tools" role="cell">
                  {s.tools.map((x, k) => (
                    <span key={x}>
                      {k > 0 && <i aria-hidden="true"> / </i>}
                      <b className="nb__tool">{x}</b>
                    </span>
                  ))}
                </span>
                <span className="nb__domain" role="cell">{s.d}</span>
              </div>
            ))}
          </div>
          <p className="nb__foot" ref={footRef}>[10 rows x 3 columns]</p>
          </div>
        </div>
      </div>
    </section>
  );
}
