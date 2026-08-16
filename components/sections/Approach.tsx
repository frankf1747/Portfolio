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
        <SmartText className="small index">04 — APPROACH</SmartText>
        <SmartText className="small">FIVE RULES</SmartText>
      </div>
      <ol className="approach__list">
        {ITEMS.map((it) => (
          <li key={it.n}>
            <SmartText as="span" className="small approach__n">
              {it.n}
            </SmartText>
            <SmartText as="span" className="h2 approach__t">
              {it.t}
            </SmartText>
            {/* the description has to decode too — left plain it resolved
                instantly while its own heading was still scrambling, so the
                row read bottom-up */}
            <SmartText as="span" className="approach__d" isBody>
              {it.d}
            </SmartText>
          </li>
        ))}
      </ol>
    </section>
  );
}
