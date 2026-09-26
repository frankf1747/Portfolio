import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectDetail, ProjectSummary, TrackedMilestone, TrackedProject, TrackedUpdate
} from "./types";

type Result<T> = { data: T | null; error: { message: string } | null };

function must<T>(r: Result<T>): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export function groupOverview(
  projects: TrackedProject[],
  milestones: TrackedMilestone[],
  latest: TrackedUpdate[]
): ProjectSummary[] {
  return projects.map((project) => ({
    project,
    milestones: milestones.filter((m) => m.project_slug === project.slug),
    latest: latest.find((u) => u.project_slug === project.slug) ?? null
  }));
}

export async function fetchOverview(db: SupabaseClient): Promise<ProjectSummary[]> {
  const [p, m, u] = await Promise.all([
    db.from("projects").select("*").order("updated_at", { ascending: false }),
    db.from("milestones").select("*").order("sort_order"),
    db.from("latest_updates").select("*")
  ]);
  return groupOverview(
    must<TrackedProject[]>(p),
    must<TrackedMilestone[]>(m),
    must<TrackedUpdate[]>(u)
  );
}

export async function fetchProject(db: SupabaseClient, slug: string): Promise<ProjectDetail | null> {
  const project = must<TrackedProject | null>(await db.from("projects").select("*").eq("slug", slug).maybeSingle());
  if (!project) return null;
  const [m, u] = await Promise.all([
    db.from("milestones").select("*").eq("project_slug", slug).order("sort_order"),
    db.from("updates").select("*").eq("project_slug", slug).order("created_at", { ascending: false }).limit(50)
  ]);
  return { project, milestones: must<TrackedMilestone[]>(m), updates: must<TrackedUpdate[]>(u) };
}
