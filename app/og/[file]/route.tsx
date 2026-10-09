import { OG_THEMES, ogCard, type OgTheme } from "@/lib/og-card";

/* Preview cards for the pages that aren't a single project. The homepage's
   card is a drawn panel, not a generated one: a static file at
   public/og/home.jpg. Per-project cards live under og/progress. */
export const dynamic = "force-static";
export const dynamicParams = false;

const CARDS: Record<string, { headline: string; body: string; theme: OgTheme }> = {
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
