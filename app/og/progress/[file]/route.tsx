import { ogCard, themeAt } from "@/lib/og-card";
import { progressClient } from "@/lib/progress/client";
import type { TrackedProject } from "@/lib/progress/types";

/* One preview card per tracked project, at /og/progress/<slug>.png. The
   project list is read at build time, so a project added since the last
   deploy has no card yet — worker/index.ts falls back to the generic one. */
export const dynamic = "force-static";
export const dynamicParams = false;

type Card = Pick<TrackedProject, "slug" | "name" | "description">;

/* Oldest first, so each project's colour is fixed by when it was created and
   a new project takes the next colour without reshuffling the others. */

async function projects(): Promise<Card[]> {
  const db = progressClient();
  if (!db) return [];
  const { data, error } = await db
    .from("projects")
    .select("slug,name,description")
    .order("created_at", { ascending: true })
    .order("slug");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function generateStaticParams() {
  return (await projects()).map((p) => ({ file: `${p.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const slug = params.file.replace(/\.png$/, "");
  const all = await projects();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) return new Response("Not found", { status: 404 });
  const p = all[i];
  return ogCard({ seed: p.slug, headline: p.name, body: p.description, theme: themeAt(i) });
}
