"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Shared parts for the study reports, so every study reads as one system:
   1px rules, mono labels, the subject's colour (--brand) as the only
   accent. Styles live in _studies.scss under .sbx / .cdx. */

export function useSeen<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, seen };
}

export function Block({ n, title, lede, children }: { n: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="study__block sbx">
      <h3 className="small study__label">
        {n} — {title}
      </h3>
      {lede && <p className="sbx__lede">{lede}</p>}
      {children}
    </section>
  );
}

/* horizontal bars that grow in when seen; `lead` takes the full accent */
export function Bars({ rows, max = 100, unit = "%", cap, lead = 0 }: { rows: [string, number][]; max?: number; unit?: string; cap?: string; lead?: number | null }) {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <div className={`cdx__bars${seen ? " is-in" : ""}`} ref={ref}>
      {rows.map(([r, v], k) => (
        <div className={`cdx__bar${k === lead ? " is-lead" : ""}`} key={r} style={{ "--k": k } as React.CSSProperties}>
          <span className="cdx__barL">{r}</span>
          <span className="cdx__barT">
            <i style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="cdx__barV">
            {v}
            {unit}
          </span>
        </div>
      ))}
      {cap && <p className="fig__cap">{cap}</p>}
    </div>
  );
}

export function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="study__stats sbx__stats">
      {items.map(([v, l]) => (
        <div className="study__stat" key={l}>
          <span className="study__statV">{v}</span>
          <span className="small study__statL">{l}</span>
        </div>
      ))}
    </div>
  );
}

/* a row of labelled cells, left to right, re-animating when `k` changes */
export function Chain({ cells, k, widths }: { cells: [string, ReactNode][]; k?: string | number; widths?: string }) {
  return (
    <ol className="cdx__chain" key={k} style={widths ? { gridTemplateColumns: widths } : undefined} aria-live="polite">
      {cells.map(([label, v], n) => (
        <li key={label} style={{ "--k": n } as React.CSSProperties}>
          <span className="small sbx__stepK">{label}</span>
          <span className={n === 0 ? "cdx__cause" : "cdx__v"}>{v}</span>
        </li>
      ))}
    </ol>
  );
}

export function Picker<T>({ items, i, onPick, label, render }: { items: T[]; i: number; onPick: (k: number) => void; label: string; render: (t: T) => ReactNode }) {
  return (
    <div className="sbx__presets" role="group" aria-label={label}>
      {items.map((t, k) => (
        <button key={k} type="button" className={`sbx__preset${k === i ? " is-on" : ""}`} aria-pressed={k === i} onClick={() => onPick(k)}>
          {render(t)}
        </button>
      ))}
    </div>
  );
}

export function Panels({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="cdx__gaps" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(([k, v]) => (
        <div key={k}>
          <span className="small sbx__stepK">{k}</span>
          <p>{v}</p>
        </div>
      ))}
    </div>
  );
}

export function Phases({ items, live = 1 }: { items: [string, string, string, number?][]; live?: number }) {
  return (
    <div className="cdx__time">
      {items.map(([k, d, s, grow], n) => (
        <div className={`cdx__phase${n === live ? " is-live" : ""}`} key={k} style={{ flexGrow: grow ?? 1 }}>
          <span className="small sbx__stepK">{k}</span>
          <b>{d}</b>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

/* `limits` marks them as caveats (–) rather than commitments (✓) */
export function Rules({ items, limits }: { items: string[]; limits?: boolean }) {
  return (
    <ul className={`cdx__rules${limits ? " is-limits" : ""}`}>
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

export const Sub = ({ children }: { children: ReactNode }) => <h4 className="small sbx__sub">{children}</h4>;
export const Cap = ({ children }: { children: ReactNode }) => <p className="fig__cap">{children}</p>;
