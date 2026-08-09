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

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "mailto:frankfu1747@gmail.com", label: "Contact", external: true },
  { href: "https://github.com/frankf1747", label: "GitHub", external: true }
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
          {LINKS.slice(0, 2).map(l => (
            <TransitionLink key={l.href} href={l.href} className="c-Nav-link" cursor={l.label}>
              <span className={"c-Nav-marker" + (pathname.startsWith(l.href) ? " is-active" : "")}>▸</span>
              {l.label}
            </TransitionLink>
          ))}
        </div>
        <div className="c-Nav-col">
          {LINKS.slice(2).map(l => (
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
