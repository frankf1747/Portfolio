"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";

/* UCLA, Los Angeles */
const UCLA = { lat: "34.0689° N", lon: "118.4452° W", tz: "America/Los_Angeles" };

function useClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: UCLA.tz
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "mailto:frankfu1747@gmail.com", label: "Contact", external: true },
  { href: "https://github.com/frankf1747", label: "GitHub", external: true }
];

export default function Nav() {
  const time = useClock();
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
        <div className="c-Nav-clock">
          <span className="c-Nav-clockCity">UCLA</span>
          <span className="c-Nav-clockTime">{time}</span>
        </div>
        <div className="c-Nav-clock">
          <span className="c-Nav-clockCity">Lat</span>
          <span className="c-Nav-clockTime">{UCLA.lat}</span>
        </div>
        <div className="c-Nav-clock">
          <span className="c-Nav-clockCity">Long</span>
          <span className="c-Nav-clockTime">{UCLA.lon}</span>
        </div>
      </div>
    </header>
  );
}
