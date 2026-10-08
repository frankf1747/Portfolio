import { ogCard } from "@/lib/og-card";
import { progressClient } from "@/lib/progress/client";
import type { TrackedProject } from "@/lib/progress/types";

/* One preview card per tracked project, at /og/progress/<slug>.png. The
   project list is read at build time, so a project added since the last
   deploy has no card yet — worker/index.ts falls back to the generic one. */
export const dynamic = "force-static";
export const dynamicParams = false;

type Card = Pick<TrackedProject, "slug" | "name" | "description">;

async function projects(): Promise<Card[]> {
  const db = progressClient();
  if (!db) return [];
  const { data, error } = await db.from("projects").select("slug,name,description");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function generateStaticParams() {
  return (await projects()).map((p) => ({ file: `${p.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const slug = params.file.replace(/\.png$/, "");
  const p = (await projects()).find((x) => x.slug === slug);
  if (!p) return new Response("Not found", { status: 404 });
  return ogCard({ kicker: "LIVE PROJECT", headline: p.name, body: p.description });
}
