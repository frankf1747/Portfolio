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

/* first column: routes. second column: outbound. */
const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" }
];
const OUTBOUND = [
  { href: "mailto:frankfu1747@gmail.com", label: "Contact" },
  { href: "https://github.com/frankf1747", label: "GitHub" },
  { href: "https://www.linkedin.com/", label: "LinkedIn" }
];

export default function Nav() {
  const times = useClocks();
  const pathname = usePathname();

  return (
    <header className="c-Nav">
      <TransitionLink href="/" className="c-Nav-logo" cursor="Home">
        frank fu
      </TransitionLink>

      <nav className="c-Nav-links" aria-label="Primary">
        <div className="c-Nav-col">
          {ROUTES.map(l => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <TransitionLink key={l.href} href={l.href} className="c-Nav-link" cursor={l.label}>
                <span className={"c-Nav-marker" + (active ? " is-active" : "")}>▸</span>
                {l.label}
              </TransitionLink>
            );
          })}
        </div>
        <div className="c-Nav-col">
          {OUTBOUND.map(l => (
            <a key={l.href} href={l.href} className="c-Nav-link" data-cursor={l.label}
               {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
              <span className="c-Nav-marker">▸</span>
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="c-Nav-clocks">
        {ZONES.map((z, i) => (
          <div className="c-Nav-clock" key={z.tz}>
            <span className="c-Nav-clockCity">{z.label}</span>
            <span className="c-Nav-clockTime">{times[i]}</span>
          </div>
        ))}
        <div className="c-Nav-clock c-Nav-clock--coords">
          <span className="c-Nav-clockTime">{COORDS}</span>
        </div>
      </div>
    </header>
  );
}
