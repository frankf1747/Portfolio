import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fetchOverview, fetchProject, groupOverview } from "./load";
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

/* A minimal stand-in for a Supabase query builder: every filter/order
   method records its call and returns itself for chaining, and the
   builder resolves like a promise (as the real one does) once awaited. */
function makeQuery(data: unknown) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {
    select: (...a: unknown[]) => {
      calls.push(["select", a]);
      return builder;
    },
    eq: (...a: unknown[]) => {
      calls.push(["eq", a]);
      return builder;
    },
    order: (...a: unknown[]) => {
      calls.push(["order", a]);
      return builder;
    },
    limit: (...a: unknown[]) => {
      calls.push(["limit", a]);
      return builder;
    },
    maybeSingle: async (...a: unknown[]) => {
      calls.push(["maybeSingle", a]);
      return { data, error: null };
    },
    then: (resolve: (v: unknown) => void) => resolve({ data, error: null })
  };
  return { builder, calls };
}

describe("fetchOverview ordering", () => {
  it("breaks milestone ties by sort_order, then start_date, then id", async () => {
    const projects = makeQuery([]);
    const milestones = makeQuery([]);
    const latest = makeQuery([]);
    const db = {
      from: (table: string) => (table === "projects" ? projects.builder : table === "milestones" ? milestones.builder : latest.builder)
    } as unknown as SupabaseClient;

    await fetchOverview(db);

    expect(milestones.calls.filter(([name]) => name === "order")).toEqual([
      ["order", ["sort_order"]],
      ["order", ["start_date"]],
      ["order", ["id"]]
    ]);
  });
});

describe("fetchProject ordering", () => {
  it("breaks milestone ties the same way as the overview", async () => {
    const projectQ = makeQuery({ slug: "demo" });
    const milestones = makeQuery([]);
    const updates = makeQuery([]);
    const db = {
      from: (table: string) => (table === "projects" ? projectQ.builder : table === "milestones" ? milestones.builder : updates.builder)
    } as unknown as SupabaseClient;

    await fetchProject(db, "demo");

    expect(milestones.calls.filter(([name]) => name === "order")).toEqual([
      ["order", ["sort_order"]],
      ["order", ["start_date"]],
      ["order", ["id"]]
    ]);
  });

  it("breaks update ties by created_at desc, then id desc", async () => {
    const projectQ = makeQuery({ slug: "demo" });
    const milestones = makeQuery([]);
    const updates = makeQuery([]);
    const db = {
      from: (table: string) => (table === "projects" ? projectQ.builder : table === "milestones" ? milestones.builder : updates.builder)
    } as unknown as SupabaseClient;

    await fetchProject(db, "demo");

    expect(updates.calls.filter(([name]) => name === "order")).toEqual([
      ["order", ["created_at", { ascending: false }]],
      ["order", ["id", { ascending: false }]]
    ]);
  });
});
