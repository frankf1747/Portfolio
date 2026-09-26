import type { MilestoneStatus, TrackedMilestone } from "./types";

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked"
};

export function percentComplete(ms: Pick<TrackedMilestone, "progress">[]): number {
  if (!ms.length) return 0;
  return Math.round(ms.reduce((sum, m) => sum + m.progress, 0) / ms.length);
}

/* What is being worked on: the first in-progress milestone, else the first
   one not yet done. */
export function currentMilestone<T extends Pick<TrackedMilestone, "status" | "sort_order">>(ms: T[]): T | null {
  const sorted = [...ms].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.find((m) => m.status === "in_progress") ?? sorted.find((m) => m.status !== "done") ?? null;
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
