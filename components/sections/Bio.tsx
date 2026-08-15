import { ArrowOut } from "../SketchFilters";

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/", wob: "wob3" as const },
  { label: "GitHub", href: "https://github.com/", wob: "wob2" as const },
  { label: "Are.na", href: "https://www.are.na/", wob: "wob1" as const }
];

export default function Bio() {
  return (
    <section id="bio" className="sk-bio">
      <p className="sk-bio__hi">Hi — Frank.</p>

      <div className="sk-bio__body">
        {/* REPLACE-ME: portrait, 360×460. */}
        <div className="sketch-box sketch-media sketch-fill sk-bio__portrait">
          <span className="sk-label">portrait 360×460</span>
        </div>

        <div className="sk-bio__col">
          <h2 className="sk-bio__name">Frank Fu</h2>
          <p className="sk-bio__role">Product designer / design engineer</p>

          <div className="sk-bio__paras">
            <p>
              Placeholder — paragraph one: background, where the work started,
              the thread that runs through it.
            </p>
            <p>
              Placeholder — paragraph two: current focus, teams and companies
              worked with, what the day-to-day looks like.
            </p>
            <p>
              Placeholder — paragraph three: off-hours: drawing, tools, side
              projects, the sketchbook habit this site is named for.
            </p>
          </div>

          <ul className="sk-bio__links">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer noopener">
                  {s.label}
                  <ArrowOut wob={s.wob} className="sk-arrow-out sk-arrow-out--sm" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
