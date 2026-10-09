import { OG_THEMES, ogCard, type OgTheme } from "@/lib/og-card";

/* Preview cards for the pages that aren't a single project: the homepage
   and the project list. Per-project cards live under og/progress. */
export const dynamic = "force-static";
export const dynamicParams = false;

const CARDS: Record<string, { headline: string; body: string; theme: OgTheme }> = {
  "home.png": {
    headline: "Data & Product",
    body: "Scoping a fuzzy problem, finding its cause, then building the fix and measuring whether people keep using it.",
    theme: OG_THEMES.paper
  },
  "progress.png": {
    headline: "Live Projects",
    body: "Live progress on what Frank Fu is building, updated as the work happens.",
    theme: OG_THEMES.ink
  }
};

export function generateStaticParams() {
  return Object.keys(CARDS).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const card = CARDS[params.file];
  if (!card) return new Response("Not found", { status: 404 });
  return ogCard({ seed: params.file, ...card });
}
