/* Rows from the progress database (see progress-mcp/supabase/migrations).
   Named Tracked* so they aren't confused with data/projects.ts, which is the
   portfolio's own case-study content. */

export type ProjectStatus = "active" | "paused" | "done";
export type MilestoneStatus = "planned" | "in_progress" | "done" | "blocked";

export interface TrackedProject {
  slug: string;
  name: string;
  description: string;
  repo_url: string | null;
  status: ProjectStatus;
  start_date: string;
  target_date: string | null;
  /** What it is built with; shown as chips under the description. */
  stack: string[];
  created_at: string;
  updated_at: string;
}

export interface TrackedMilestone {
  id: string;
  project_slug: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  start_date: string;
  due_date: string;
  completed_at: string | null;
  sort_order: number;
  /** Size relative to the project's other milestones (e.g. task count). */
  weight: number;
}

export interface TrackedUpdate {
  id: string;
  project_slug: string;
  milestone_id: string | null;
  summary: string;
  details: string;
  commit_sha: string | null;
  created_at: string;
}

export interface ProjectSummary {
  project: TrackedProject;
  milestones: TrackedMilestone[];
  latest: TrackedUpdate | null;
}

export interface ProjectDetail {
  project: TrackedProject;
  milestones: TrackedMilestone[];
  updates: TrackedUpdate[];
}
