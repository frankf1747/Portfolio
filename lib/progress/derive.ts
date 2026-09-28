import type { MilestoneStatus, TrackedMilestone } from "./types";

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked"
};

/* Weighted by each milestone's size, so finishing a 13-task milestone moves
   the project further than finishing a 3-task one. A missing weight counts
   as 1, which reduces to the plain average. */
export function percentComplete(
  ms: (Pick<TrackedMilestone, "progress"> & { weight?: number })[]
): number {
  const total = ms.reduce((sum, m) => sum + (m.weight ?? 1), 0);
  if (!total) return 0;
  return Math.round(ms.reduce((sum, m) => sum + m.progress * (m.weight ?? 1), 0) / total);
}

/* What is being worked on: the first in-progress milestone; else the first
   planned one (what's queued up next); else the first blocked one (nothing
   is queued, but something needs attention); else null when it's all done. */
export function currentMilestone<T extends Pick<TrackedMilestone, "status" | "sort_order">>(ms: T[]): T | null {
  const sorted = [...ms].sort((a, b) => a.sort_order - b.sort_order);
  return (
    sorted.find((m) => m.status === "in_progress") ??
    sorted.find((m) => m.status === "planned") ??
    sorted.find((m) => m.status !== "done") ??
    null
  );
}

export function relativeTime(iso: string, now: Date): string {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function isFresh(iso: string, now: Date, windowMs = 60 * 60 * 1000): boolean {
  return now.getTime() - new Date(iso).getTime() < windowMs;
}

export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
