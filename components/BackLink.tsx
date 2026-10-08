"use client";

/* The ← BACK pill at the start of every breadcrumb row.

   Back means back: if the reader arrived from another page of this site,
   it returns them there (their scroll position and all) through history.
   A direct visit — a shared link, a new tab — has nothing on this site to
   go back to, so the link's own href takes them one level up the trail.

   A real <a> with a real href, so it still works with JS off, opens in a
   new tab on cmd-click, and is announced as a link. */

export default function BackLink({ fallback }: { fallback: string }) {
  return (
    <a
      className="crumbs__back"
      href={fallback}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const fromSite = document.referrer.startsWith(window.location.origin);
        if (fromSite && window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      }}
    >
      <span aria-hidden="true">←</span> Back
    </a>
  );
}
