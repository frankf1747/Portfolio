import SmartText from "../SmartText";

/* §11 values / how I work — numbered list.
   --blue ground inversion: type and rules switch to --ink here. */

const ITEMS = [
  { n: "01", t: "WHAT, WHY NOW, SO WHAT", d: "Three questions before I open anything. If I can't answer why now and so what, I'm not ready to start." },
  { n: "02", t: "REBUILD, DON'T PATCH", d: "Adding another layer to a broken workflow just makes it heavier. The spreadsheet didn't need macros. It needed to stop being a spreadsheet." },
  { n: "03", t: "A NUMBER ISN'T AN ANSWER", d: "A status figure says what happened. I don't hand it over until it also says why, and what to do about it." },
  { n: "04", t: "ADOPTION IS THE PROOF", d: "Delivery isn't the finish line. I'd rather measure whether people came back to the thing than whether I shipped it on time." },
  { n: "05", t: "SHIP, LEARN, ITERATE", d: "Shipping is how I learn what I built. Version one is a hypothesis. I rebuild it on what people do with it, not what they say about it." }
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
