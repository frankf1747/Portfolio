/* A project can have two pages here: its write-up under /works (the
   whiteboard) and its live progress under /progress?p=<slug>. They are
   built separately — the progress page reads Supabase, the write-up is
   static — so this is where they learn about each other, and each links
   to the other from its breadcrumb row.

   Keyed by the progress slug. Add a line when a project gets both. */

export const PROJECT_PAGES: Record<string, string> = {
  "clinical-trial-risk": "/works/clinical-trial-risk"
};

export const progressPage = (slug: string) => `/progress?p=${slug}`;
