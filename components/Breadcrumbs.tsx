import Link from "next/link";
import type { ReactNode } from "react";
import BackLink from "./BackLink";

/* The trail at the top-left of every page below the homepage —
   FRANK FU / LIVE PROJECTS / CLINICAL TRIAL RISK — each step a link back up,
   the last one the page you are on. Replaces the single "← back" links the
   sub-pages used to carry on the right: one row, every level reachable.

   A <nav> landmark around an ordered list, with aria-current on the last
   step, which is the pattern screen readers announce as a breadcrumb. The
   separators are drawn in CSS so they are not read out.

   `links` are the page's way out sideways, drawn as pills after the trail:
   a project's code and live demo (new tab, ↗), or the same project's other
   page on this site — its write-up and its live progress point at each
   other (same tab, →). `after` is anything else that belongs on the row,
   like the progress page's live badge.

   Every trail opens with the same ← BACK pill (BackLink), so getting out of
   a sub-page works the same way everywhere. Without history to return to,
   it goes one step up the trail: the last step that has a link. */

export type Crumb = { label: string; href?: string };
export type CrumbLink = { label: string; href: string };

export default function Breadcrumbs({ trail, links = [], after }: { trail: Crumb[]; links?: CrumbLink[]; after?: ReactNode }) {
  const up = [...trail].reverse().find((c, i) => i > 0 && c.href)?.href ?? "/";
  return (
    <div className="crumbs">
      <BackLink fallback={up} />
      <nav aria-label="Breadcrumb">
        <ol className="crumbs__list">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={`${i}-${c.label}`} className="crumbs__item">
                {c.href && !last ? (
                  <Link className="link-a" href={c.href}>
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>{c.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {links.length > 0 && (
        <span className="crumbs__links">
          {links.map((l) =>
            l.href.startsWith("/") ? (
              <Link key={l.href} href={l.href}>
                {l.label} <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            )
          )}
        </span>
      )}
      {after}
    </div>
  );
}
