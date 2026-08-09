import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "About — Frank Fu" };

const TIMELINE = [
  { year: "2026", title: "UCLA MSBA", text: "Master of Science in Business Analytics. Causal inference, search, applied ML — with live cases for Starbucks, DoorDash, and Dell." },
  { year: "2025", title: "AI Joke Factory", text: "Designed and shipped an end-to-end AI product — flows, backend spec, and a v2 rebuilt on user feedback." },
  { year: "2024", title: "Product & UX work", text: "Prototypes, specs, and the habit of asking what the user was actually trying to do." },
  { year: "earlier", title: "The hybrid forms", text: "Analytics first, then product, then design — not a pivot each time, an accumulation." }
];

export default function AboutPage() {
  return (
    <>
      <section className="c-About" aria-label="About Frank Fu">
        <p className="u-eyebrow">About</p>
        <h1 className="c-About-title">
          I&rsquo;m Frank — I sit where the data,
          the product, and the interface meet.
        </h1>
        <p className="c-About-lede u-muted">
          Most teams split those into three jobs and lose something in the
          handoffs. I&rsquo;d rather carry one point of view across all three:
          measure honestly, decide deliberately, design plainly.
        </p>

        <ol className="c-About-timeline">
          {TIMELINE.map(t => (
            <li className="c-About-item" key={t.title}>
              <span className="u-eyebrow">{t.year}</span>
              <h2 className="c-About-itemTitle">{t.title}</h2>
              <p className="u-muted">{t.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <Footer />
    </>
  );
}
