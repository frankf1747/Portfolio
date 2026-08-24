import Link from "next/link";
import ScrollProvider from "@/components/ScrollProvider";
import Cursor from "@/components/Cursor";
import SmartText from "@/components/SmartText";
import LayerStack from "./LayerStack";
import type { Work } from "@/data/works";

/* §13 — the experience page.

   ScrollProvider runs with intro={false}: the lock exists for the landing's
   launch and nothing here dispatches site:intro-end, so leaving it on would
   freeze the page until the 9s failsafe fired.

   No Preloader and no Nav. The loader is the landing's overture and replaying
   it on every sub-page would put a 5-second gate in front of a reader who has
   already arrived; the nav's folded stack is scroll-state machinery that
   belongs to the long page. A single way back is enough here.

   Three screens: the thesis, the stack, the exit. Nothing else. */

export default function WorkPage({ work }: { work: Work }) {
  return (
    <>
      <ScrollProvider intro={false} snap=".piece" />
      <Cursor />

      <main className="work-page">
        <header className="wp__head">
          <div className="wp__crumb">
            <SmartText className="small index">
              {`${work.n} — ${work.client}`}
            </SmartText>
            <Link className="small wp__back" href="/#work">
              ← ALL PROJECTS
            </Link>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="wp__logo" src={work.logo} alt={work.client} />

          <h1 className="wp__title">
            {work.descriptor.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <SmartText className="small wp__role">
            {`${work.role} · ${work.dates}`}
          </SmartText>

          {/* The fifteen-second read. If someone leaves here, this is what
              they leave with. */}
          <SmartText as="p" className="wp__thesis" isBody>
            {work.thesis}
          </SmartText>
          <SmartText as="p" className="wp__sub" isBody>
            {work.subThesis}
          </SmartText>

          <dl className="wp__facts">
            {work.facts.map((f) => (
              <div key={f.label}>
                {/* SmartText renders span-level tags only, so the list
                    semantics stay on the dt/dd and the engine goes inside. */}
                <dt>
                  <SmartText className="small">{f.label}</SmartText>
                </dt>
                {/* One SmartText per LINE. .smart-text is a block, so each
                    value sits on its own row — which is what keeps an item
                    from being split across a wrap ("... \u00b7 8 / commercial
                    products"). Never join these back into one string. */}
                <dd>
                  {f.value.map((v) => (
                    <SmartText key={v} className="small">{v}</SmartText>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <LayerStack pieces={work.pieces} />

        <footer className="wp__foot">
          <SmartText as="p" className="wp__takeaway" isBody>
            {work.takeaway}
          </SmartText>
          <div className="wp__exit">
            <Link className="small" href="/#work">
              ← ALL PROJECTS
            </Link>
            <Link className="small" href="/#contact">
              GET IN TOUCH ↗
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
