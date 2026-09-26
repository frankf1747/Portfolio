import { describe, expect, it } from "vitest";
import { currentMilestone, isFresh, localDay, percentComplete, relativeTime } from "./derive";

const ms = (status: string, sort_order: number, progress = 0) =>
  ({ status, sort_order, progress }) as { status: "planned" | "in_progress" | "done" | "blocked"; sort_order: number; progress: number };

describe("percentComplete", () => {
  it("is 0 with no milestones", () => expect(percentComplete([])).toBe(0));
  it("is the rounded mean of milestone progress", () => {
    expect(percentComplete([ms("done", 1, 100), ms("in_progress", 2, 50), ms("planned", 3, 0)])).toBe(50);
    expect(percentComplete([ms("done", 1, 100), ms("planned", 2, 0), ms("planned", 3, 0)])).toBe(33);
  });
});

describe("currentMilestone", () => {
  it("prefers the first in-progress milestone by order", () => {
    expect(currentMilestone([ms("in_progress", 3), ms("planned", 1), ms("in_progress", 2)])?.sort_order).toBe(2);
  });
  it("falls back to the first one not done", () => {
    expect(currentMilestone([ms("done", 1), ms("blocked", 2), ms("planned", 3)])?.sort_order).toBe(2);
  });
  it("is null when everything is done", () => {
    expect(currentMilestone([ms("done", 1)])).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-09-26T12:00:00Z");
  it.each([
    ["2026-09-26T11:59:30Z", "just now"],
    ["2026-09-26T11:15:00Z", "45m ago"],
    ["2026-09-26T09:00:00Z", "3h ago"],
    ["2026-09-20T12:00:00Z", "6d ago"],
    ["2026-07-01T12:00:00Z", "Jul 1, 2026"]
  ])("%s → %s", (iso, want) => expect(relativeTime(iso, now)).toBe(want));
  it("treats clock skew as just now", () => expect(relativeTime("2026-09-26T12:00:05Z", now)).toBe("just now"));
});

describe("isFresh", () => {
  const now = new Date("2026-09-26T12:00:00Z");
  it("is true inside the last hour only", () => {
    expect(isFresh("2026-09-26T11:30:00Z", now)).toBe(true);
    expect(isFresh("2026-09-26T10:59:00Z", now)).toBe(false);
  });
});

describe("localDay", () => {
  it("formats the local calendar day", () => {
    expect(localDay(new Date(2026, 8, 5, 23, 30))).toBe("2026-09-05");
  });
});
