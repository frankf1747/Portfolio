import Link from "next/link";
import type { ReactNode } from "react";

/* The trail at the top-left of every page below the homepage —
   FRANK FU / LIVE PROJECTS / CLINICAL TRIAL RISK — each step a link back up,
   the last one the page you are on. Replaces the single "← back" links the
   sub-pages used to carry on the right: one row, every level reachable.

   A <nav> landmark around an ordered list, with aria-current on the last
   step, which is the pattern screen readers announce as a breadcrumb. The
   separators are drawn in CSS so they are not read out.

   `after` is for anything that belongs on the same row after the trail —
   the progress page's live badge. */

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ trail, after }: { trail: Crumb[]; after?: ReactNode }) {
  return (
    <div className="crumbs">
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
      {after}
    </div>
  );
}
