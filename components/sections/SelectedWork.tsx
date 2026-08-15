/* ============================================================
   Selected work — five cards scattered across a tall canvas.

   Positions come straight from the wireframe (values are px at a
   1440 canvas, carried as custom properties so the responsive
   rules can drop them and let the cards flow instead).

   The wireframe exposed `showWorkMeta` as a global review switch to
   reveal every card's meta at once. That's a review affordance, not
   a product one — here the same `max-height` reveal runs per card on
   hover and on keyboard focus, which is what the pattern is for.
   ============================================================ */

type WorkItem = {
  n: string;
  title: string;
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
  wob?: "v2" | "v3";
  roles: string[];
};

/* REPLACE-ME: placeholder projects. Real content drops straight in —
   only `title`, `href`, `roles` and the impact line change. */
const WORK: WorkItem[] = [
  { n: "1", title: "Project name", href: "/work/project-1", x: 50, y: 0, w: 510, h: 400, roles: ["Product design", "Front-end build", "Design system"] },
  { n: "2", title: "Project name", href: "/work/project-2", x: 780, y: 250, w: 400, h: 314, wob: "v2", roles: ["Identity", "Art direction"] },
  { n: "3", title: "Project name", href: "/work/project-3", x: 170, y: 620, w: 510, h: 401, wob: "v3", roles: ["Product design", "Prototyping"] },
  { n: "4", title: "Project name", href: "/work/project-4", x: 910, y: 980, w: 510, h: 401, roles: ["Motion", "Front-end build"] },
  { n: "5", title: "Project name", href: "/work/project-5", x: 750, y: 1480, w: 310, h: 227, wob: "v2", roles: ["Experiment", "Writing"] }
];

export default function SelectedWork() {
  return (
    <section id="work" className="sk-work">
      <div className="sk-work__head">
        <hr className="sketch-rule" />
        <h2 className="sk-work__title">
          <span>Selected work</span>
          <span className="sk-work__count">( {WORK.length} )</span>
        </h2>
      </div>

      <div className="sk-work__canvas">
        {WORK.map((item) => (
          <article
            key={item.n}
            className="sk-card"
            style={
              {
                "--x": `${item.x}rem`,
                "--y": `${item.y}rem`,
                "--w": `${item.w}rem`,
                "--h": `${item.h}rem`,
                /* unitless, so the flowed layout can use aspect-ratio */
                "--ar": item.w / item.h
              } as React.CSSProperties
            }
          >
            {/* Routes don't exist yet — swap to next/link once they do. */}
            <a className="sk-card__link" href={item.href}>
              <span
                className={`sketch-box sketch-media sketch-fill sk-card__media${
                  item.wob ? ` ${item.wob}` : ""
                }`}
              >
                <span className="sk-label">
                  img {item.w}×{item.h}
                </span>
              </span>
              <span className="sk-card__name">
                ( {item.n} ) {item.title}
              </span>
              <span className="sk-card__meta">
                <span className="sk-card__impact">
                  Impact line — one sentence on the outcome.
                </span>
                <span className="sk-card__roles">
                  {item.roles.map((r) => (
                    <span key={r}>→ {r}</span>
                  ))}
                </span>
              </span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
