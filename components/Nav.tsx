"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";

const CITIES: { label: string; tz: string }[] = [
  { label: "Los Angeles", tz: "America/Los_Angeles" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "New York", tz: "America/New_York" }
];

function useClocks() {
  const [times, setTimes] = useState<string[]>(CITIES.map(() => "--:--:--"));
  useEffect(() => {
    const fmts = CITIES.map(c =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: c.tz
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
        {CITIES.map((c, i) => (
          <div className="c-Nav-clock" key={c.tz}>
            <span className="c-Nav-clockCity">{c.label}</span>
            <span className="c-Nav-clockTime">{times[i]}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
