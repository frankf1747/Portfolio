import SmartText from "../SmartText";

const ITEMS = [
  "SEARCH RELEVANCE",
  "CAUSAL INFERENCE",
  "EXPERIMENT DESIGN",
  "AGENT SYSTEMS",
  "EVALUATION HARNESSES",
  "PRODUCT STRATEGY",
  "INTERFACE DESIGN",
  "PROTOTYPING"
];

/* Horizontal slider. Drag/scroll — no keyframes anywhere on the site,
   so this is a real overflow strip rather than a CSS marquee. */

export default function Capabilities() {
  return (
    <section className="caps" id="capabilities">
      <div className="caps__head">
        <SmartText className="small">03 — CAPABILITIES</SmartText>
        <SmartText className="small">WHAT I DO</SmartText>
      </div>
      <div className="caps__strip" role="list">
        {ITEMS.map((it, i) => (
          <div className="caps__item" role="listitem" key={it}>
            <span className="caps__idx">{String(i + 1).padStart(2, "0")}</span>
            <SmartText className="h1">{it}</SmartText>
          </div>
        ))}
      </div>
    </section>
  );
}
