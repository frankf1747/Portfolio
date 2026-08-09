import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import Footer from "@/components/Footer";
import TransitionLink from "@/components/TransitionLink";

export function generateStaticParams() {
  return projects.map(p => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = projects.find(x => x.slug === params.slug);
  return { title: p ? `${p.title} — Frank Fu` : "Project — Frank Fu" };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const i = projects.findIndex(x => x.slug === params.slug);
  if (i === -1) notFound();
  const p = projects[i];
  const next = projects[(i + 1) % projects.length];

  return (
    <>
      <article className="c-Detail">
        <div
          className="c-Detail-hero"
          style={{ background: `linear-gradient(130deg, ${p.palette[0]}, ${p.palette[1]} 40%, ${p.palette[2]} 75%, ${p.palette[3]})` }}
        >
          <h1 className="c-Detail-title">{p.title}</h1>
        </div>

        <dl className="c-Detail-meta">
          <div><dt className="u-eyebrow">Role</dt><dd>{p.role}</dd></div>
          <div><dt className="u-eyebrow">Year</dt><dd>{p.year}</dd></div>
          <div><dt className="u-eyebrow">Discipline</dt><dd>{p.discipline}</dd></div>
          <div><dt className="u-eyebrow">Deliverables</dt><dd>{p.deliverables}</dd></div>
        </dl>

        <div className="c-Detail-body">
          <p className="c-Detail-summary">{p.summary}</p>
          {p.body.map((b, j) =>
            b.kind === "prose" ? (
              <p className="c-Detail-prose u-muted" key={j}>{b.text}</p>
            ) : (
              <div
                key={j}
                className={`c-Detail-img ${b.kind === "full" ? "c-Detail-img--full" : "c-Detail-img--split"}`}
                style={{ background: `linear-gradient(${120 + j * 40}deg, ${p.palette[1]}, ${p.palette[3]})` }}
                role="img"
                aria-label={`${p.title} visual placeholder`}
              />
            )
          )}
        </div>
      </article>

      <TransitionLink href={`/work/${next.slug}`} className="c-Detail-next" cursor="Next">
        <span className="u-eyebrow">Next project</span>
        <span className="c-Detail-nextTitle">{next.title} →</span>
      </TransitionLink>

      <Footer />
    </>
  );
}
