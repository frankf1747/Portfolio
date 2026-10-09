"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* A cookie banner, taken literally.

   It looks like every consent banner on the web and asks the usual
   question, then answers it with an actual cookie. ACCEPT: the cookie
   leaves the banner, flies to the middle of the screen growing as it
   comes, and gets a bite taken out of it. DECLINE: a bin pops up over the
   banner, opens its lid, and the cookie is lobbed into it.

   The site sets no cookies (Cloudflare Web Analytics is cookieless), so
   the answer changes nothing, and the closing line says so.

   Asked on every visit, on purpose: nothing is remembered, so there is
   always a cookie to give. Arrives after the overture, with the nav
   (html[data-nav="in"]). */

type Phase = "wait" | "ask" | "yes" | "no" | "gone";

/* flight timings, in ms; the CSS reads the same numbers from --fly */
const FLY = { yes: 900, no: 750 };
const CLOSE = { yes: 3600, no: 3000 };

function Cookie({ bite = false }: { bite?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {bite && (
        <defs>
          <mask id="ck-bite">
            <rect width="100" height="100" fill="#fff" />
            <g className="ck-bite">
              <circle cx="90" cy="20" r="17" />
              <circle cx="74" cy="6" r="12" />
              <circle cx="98" cy="40" r="12" />
            </g>
          </mask>
        </defs>
      )}
      <g mask={bite ? "url(#ck-bite)" : undefined}>
        <circle className="ck-dough" cx="50" cy="50" r="43" />
        <g className="ck-chips">
          <path d="M30 34 l7 -3 l3 6 l-6 4 z" />
          <path d="M58 26 l6 1 l0 6 l-7 1 z" />
          <path d="M44 56 l7 -2 l2 7 l-7 2 z" />
          <path d="M66 54 l6 2 l-2 6 l-6 -2 z" />
          <path d="M28 64 l5 -1 l2 5 l-6 1 z" />
          <path d="M52 76 l6 0 l0 5 l-6 1 z" />
        </g>
      </g>
    </svg>
  );
}

function Bin() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true">
      <g className="ck-lid">
        <rect x="6" y="14" width="68" height="9" rx="2" />
        <path d="M30 14 v-6 h20 v6" fill="none" />
      </g>
      <path className="ck-body" d="M12 28 H68 L62 96 H18 Z" />
      <path d="M30 38 L32 86 M40 38 V86 M50 38 L48 86" fill="none" />
    </svg>
  );
}

export default function CookieBanner() {
  const [phase, setPhase] = useState<Phase>("wait");
  const [fly, setFly] = useState<CSSProperties | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const binRef = useRef<HTMLSpanElement | null>(null);

  /* ask once the overture has handed over to the nav, after a beat */
  useEffect(() => {
    let t = 0;
    const ready = () => document.documentElement.dataset.nav === "in";
    const go = () => {
      t = window.setTimeout(() => setPhase("ask"), 1400);
    };
    if (ready()) {
      go();
      return () => window.clearTimeout(t);
    }
    const mo = new MutationObserver(() => {
      if (ready()) {
        mo.disconnect();
        go();
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-nav"] });
    return () => {
      mo.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (phase !== "yes" && phase !== "no") return;
    const t = window.setTimeout(() => setPhase("gone"), CLOSE[phase]);
    return () => window.clearTimeout(t);
  }, [phase]);

  const answer = (yes: boolean) => {
    const icon = iconRef.current?.getBoundingClientRect();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (icon && !reduce) {
      const x = icon.left + icon.width / 2;
      const y = icon.top + icon.height / 2;
      let dx: number, dy: number, scale: number;
      if (yes) {
        /* to the middle of the screen, a little above centre */
        dx = window.innerWidth / 2 - x;
        dy = window.innerHeight * 0.45 - y;
        scale = Math.min(5, (Math.min(window.innerWidth, window.innerHeight) * 0.32) / icon.width);
      } else {
        /* into the bin's mouth, just under the lid */
        const bin = binRef.current?.getBoundingClientRect();
        dx = bin ? bin.left + bin.width / 2 - x : 0;
        dy = bin ? bin.top + bin.height * 0.3 - y : 0;
        scale = 0.7;
      }
      setFly({
        left: x,
        top: y,
        width: icon.width,
        height: icon.height,
        ["--dx" as string]: `${dx}px`,
        ["--dy" as string]: `${dy}px`,
        /* the top of the arc: always rises a bit above wherever it lands */
        ["--peak" as string]: `${Math.min(dy, 0) - (yes ? 60 : 110)}px`,
        ["--s" as string]: scale,
        ["--fly" as string]: `${yes ? FLY.yes : FLY.no}ms`
      });
    }
    setPhase(yes ? "yes" : "no");
  };

  if (phase === "wait" || phase === "gone") return null;

  return (
    <>
      <section className={`ck is-${phase}`} aria-label="Cookie notice">
        <span className="ck__bin" ref={binRef}>
          <Bin />
        </span>

        <div className="ck__row">
          <span className="ck__icon" ref={iconRef}>
            <Cookie />
          </span>
          <p className="ck__t" aria-live="polite">
            {phase === "ask" && (
              <>
                <b>We use cookies</b> to make your visit a little sweeter. Do you accept?
              </>
            )}
            {phase === "yes" && (
              <>
                <b>Here&apos;s yours.</b> It&apos;s the only cookie on this site.
              </>
            )}
            {phase === "no" && (
              <>
                <b>Fair enough.</b> Into the bin it goes. Nothing changes either way.
              </>
            )}
          </p>
        </div>

        {phase === "ask" && (
          <div className="ck__btns">
            <button type="button" className="ck__btn is-yes" onClick={() => answer(true)}>
              Accept
            </button>
            <button type="button" className="ck__btn" onClick={() => answer(false)}>
              Decline
            </button>
          </div>
        )}
      </section>

      {fly && (
        <span className={`ck-fly is-${phase}`} style={fly} aria-hidden="true">
          <span className="ck-fly__x">
            <span className="ck-fly__y">
              <span className="ck-fly__spin">
                <Cookie bite={phase === "yes"} />
                {phase === "yes" && (
                  <span className="ck-crumbs">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </span>
            </span>
          </span>
        </span>
      )}
    </>
  );
}
