import { describe, expect, it } from "vitest";
import { barSpan, ganttDomain, monthTicks, parseDay, xPct } from "./scale";

const DAY = 86_400_000;
const m = (start_date: string, due_date: string, completed_at: string | null = null) => ({ start_date, due_date, completed_at });

describe("ganttDomain", () => {
  it("spans every milestone and today, padded 3 days each side", () => {
    const d = ganttDomain([m("2026-09-01", "2026-09-10")], "2026-09-05");
    expect(d.start).toBe(parseDay("2026-08-29"));
    expect(d.end).toBe(parseDay("2026-09-13"));
  });

  it("stretches to a late completion and to today", () => {
    const d = ganttDomain([m("2026-09-01", "2026-09-10", "2026-09-15T18:00:00Z")], "2026-09-20");
    expect(d.end).toBe(parseDay("2026-09-23"));
  });

  it("reads completed_at as the viewer's local day, not its UTC date", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      /* 2026-09-16T03:30:00Z is still 2026-09-15 evening in Los Angeles
         (UTC-7 in September) — the domain must stretch to the 15th, not
         the 16th the UTC slice alone would give. */
      const d = ganttDomain([m("2026-09-01", "2026-09-10", "2026-09-16T03:30:00Z")], "2026-09-01");
      expect(d.end).toBe(parseDay("2026-09-18"));
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe("xPct and barSpan", () => {
  const d = { start: parseDay("2026-08-29"), end: parseDay("2026-09-13") };
  it("maps the domain edges to 0 and 100", () => {
    expect(xPct(d.start, d)).toBe(0);
    expect(xPct(d.end, d)).toBe(100);
  });
  it("a bar covers its due day in full", () => {
    const s = barSpan(m("2026-09-01", "2026-09-10"), d);
    expect(s.left).toBeCloseTo(20);
    expect(s.width).toBeCloseTo(66.667, 2);
  });
  it("a one-day milestone still has width", () => {
    expect(barSpan(m("2026-09-01", "2026-09-01"), d).width).toBeCloseTo((DAY / (d.end - d.start)) * 100);
  });
});

describe("monthTicks", () => {
  it("marks each month start inside the domain", () => {
    const d = { start: parseDay("2026-08-29"), end: parseDay("2026-10-05") };
    expect(monthTicks(d).map((t) => t.label)).toEqual(["SEP", "OCT"]);
    expect(monthTicks(d)[0].pct).toBeCloseTo(xPct(parseDay("2026-09-01"), d));
  });
  it("adds the year on January", () => {
    const d = { start: parseDay("2026-12-20"), end: parseDay("2027-01-10") };
    expect(monthTicks(d).map((t) => t.label)).toEqual(["JAN 2027"]);
  });
  it("keeps the first month when the domain starts on the 1st", () => {
    const d = { start: parseDay("2026-09-01"), end: parseDay("2026-10-05") };
    expect(monthTicks(d).map((t) => t.label)).toEqual(["SEP", "OCT"]);
  });
});
