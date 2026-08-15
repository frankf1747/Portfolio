import { Arrow } from "../SketchFilters";

/* REPLACE-ME: placeholder copy from the wireframe. The shape is what
   matters — three areas, one line each, two bullets each. */
const AREAS = [
  {
    index: "( 01 )",
    title: "Interfaces",
    body: "Placeholder — one sentence on the interface work and what it produces.",
    items: [
      { label: "Web & mobile apps", wob: "wob3" as const },
      { label: "End-to-end flows", wob: "wob2" as const }
    ]
  },
  {
    index: "( 02 )",
    title: "Systems",
    body: "Placeholder — one sentence on design systems and the handoff they replace.",
    items: [
      { label: "Tokens & components", wob: "wob1" as const },
      { label: "Documentation", wob: "wob3" as const }
    ]
  },
  {
    index: "( 03 )",
    title: "Prototypes",
    body: "Placeholder — one sentence on building the real thing to answer the question.",
    items: [
      { label: "Front-end builds", wob: "wob2" as const },
      { label: "Motion studies", wob: "wob1" as const }
    ]
  }
];

export default function Focus() {
  return (
    <section className="sk-focus" aria-label="Focus">
      <div className="sk-focus__head">
        <span>Focus</span>
        <span>Three things, done properly</span>
      </div>
      <hr className="sketch-rule sk-focus__rule" />

      <div className="sk-focus__grid">
        {AREAS.map((a) => (
          <div key={a.title} className="sk-focus__col">
            <div className="sk-focus__idx">{a.index}</div>
            <h3 className="sk-focus__title">{a.title}</h3>
            <p className="sk-focus__body">{a.body}</p>
            <ul className="sk-focus__list">
              {a.items.map((it) => (
                <li key={it.label}>
                  <Arrow wob={it.wob} className="sk-arrow sk-arrow--sm" />
                  {it.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
