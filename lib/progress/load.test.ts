import { describe, expect, it } from "vitest";
import { groupOverview } from "./load";
import type { TrackedMilestone, TrackedProject, TrackedUpdate } from "./types";

const project = (slug: string) => ({ slug }) as TrackedProject;
const milestone = (id: string, project_slug: string) => ({ id, project_slug }) as TrackedMilestone;
const update = (id: string, project_slug: string) => ({ id, project_slug }) as TrackedUpdate;

describe("groupOverview", () => {
  it("attaches each project's milestones and latest update, keeping project order", () => {
    const out = groupOverview(
      [project("b"), project("a")],
      [milestone("m1", "a"), milestone("m2", "b"), milestone("m3", "a")],
      [update("u1", "a")]
    );
    expect(out.map((s) => s.project.slug)).toEqual(["b", "a"]);
    expect(out[1].milestones.map((m) => m.id)).toEqual(["m1", "m3"]);
    expect(out[1].latest?.id).toBe("u1");
    expect(out[0].latest).toBeNull();
  });
});
