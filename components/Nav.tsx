"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";

/* Coordinates are UCLA's */
const COORDS = "34.0689° N, 118.4452° W";

const ZONES = [
  { label: "LA", tz: "America/Los_Angeles" },
  { label: "Toronto", tz: "America/Toronto" }
];

function useClocks() {
  const [times, setTimes] = useState<string[]>(ZONES.map(() => "--:--:--"));
  useEffect(() => {
    const fmts = ZONES.map(z =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: z.tz
      }));
    const tick = () => setTimes(fmts.map(f => f.format(new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return times;
}

const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" }
];

/* 24px stroke icons, currentColor so they invert with the nav */
const ICONS: Record<string, JSX.Element> = {
  Contact: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M3 6l9 6.5L21 6" />
    </svg>
  ),
  GitHub: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3.01 8.57 7.18 9.96.53.1.72-.23.72-.5v-1.75c-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.19 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.08a9.9 9.9 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.52.1 2.79.67.74 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 22.5 12 10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4v11H3v-11ZM9.5 9.5h3.8v1.5h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76v5.69h-4v-5.05c0-1.2-.02-2.75-1.75-2.75-1.75 0-2.02 1.31-2.02 2.66v5.14h-4v-11Z" />
    </svg>
  )
};

const OUTBOUND = [
  { href: "mailto:frankfu1747@gmail.com", label: "Contact", external: false },
  { href: "https://github.com/frankf1747", label: "GitHub", external: true },
  { href: "https://www.linkedin.com/", label: "LinkedIn", external: true }
];

export default function Nav() {
  const times = useClocks();
  const pathname = usePathname();

  return (
    <header className="c-Nav">
      <div className="c-Nav-left">
        <TransitionLink href="/" className="c-Nav-logo" cursor="Home">
          frank fu
        </TransitionLink>
        <span className="c-Nav-meta">
          {ZONES.map((z, i) => (
            <span className="c-Nav-metaItem" key={z.tz}>
              {z.label} {times[i]}
            </span>
          ))}
          <span className="c-Nav-metaItem c-Nav-metaItem--coords">{COORDS}</span>
        </span>
      </div>

      <nav className="c-Nav-center" aria-label="Primary">
        {ROUTES.map(l => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <TransitionLink key={l.href} href={l.href} className="c-Nav-link" cursor={l.label}>
              <span className={"c-Nav-marker" + (active ? " is-active" : "")}>▸</span>
              {l.label}
            </TransitionLink>
          );
        })}
      </nav>

      <div className="c-Nav-right">
        {OUTBOUND.map(l => (
          <a
            key={l.href}
            href={l.href}
            className="c-Nav-icon"
            aria-label={l.label}
            title={l.label}
            data-cursor={l.label}
            {...(l.external ? { target: "_blank", rel: "noopener" } : {})}
          >
            {ICONS[l.label]}
          </a>
        ))}
      </div>
    </header>
  );
}
