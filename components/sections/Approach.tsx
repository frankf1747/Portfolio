import SmartText from "../SmartText";

/* §11 values / how I work — numbered list.
   --blue ground inversion: type and rules switch to --ink here. */

const ITEMS = [
  { n: "01", t: "EARN THE WORD CAUSAL", d: "Density tests, placebo thresholds, bandwidth sensitivity. The memo leads with what the analysis cannot claim." },
  { n: "02", t: "GIVE FAILURES NAMES", d: "Once errors have a taxonomy — tokenisation misses, modifier confusion, intent blindness — the fixes prioritise themselves." },
  { n: "03", t: "SHIP THE TEST WITH IT", d: "Every capability claim is backed by a test that fails when it regresses. Reliability is the feature, not the caveat." },
  { n: "04", t: "SAY WHAT IT CANNOT DO", d: "Scope a system to what its evidence supports, and make it answer honestly when a question falls outside that." },
  { n: "05", t: "DESIGN THE DECISION", d: "The interface is where the analysis either changes someone's mind or doesn't. That's the part worth getting right." }
];

export default function Approach() {
  return (
    <section className="approach is-invert-blue" id="approach">
      <div className="approach__head">
        <SmartText className="small">05 — HOW I WORK</SmartText>
        <SmartText className="small">FIVE RULES</SmartText>
      </div>
      <ol className="approach__list">
        {ITEMS.map((it) => (
          <li key={it.n}>
            <span className="approach__n">{it.n}</span>
            <SmartText as="span" className="h2 approach__t">
              {it.t}
            </SmartText>
            <span className="approach__d">{it.d}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
