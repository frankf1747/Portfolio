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

describe("the weighted axis", () => {
  /* One long quiet phase between two short busy ones, like a project that
     was piloted, paused for months, then picked back up. */
  const ms = [m("2026-01-01", "2026-01-07"), m("2026-01-08", "2026-06-30"), m("2026-07-01", "2026-07-07")];
  const d = ganttDomain(ms, "2026-07-07");
  const width = (i: number) => barSpan(ms[i], d).width;

  it("keeps the domain's ends at 0 and 100", () => {
    expect(xPct(d.start, d)).toBeCloseTo(0);
    expect(xPct(d.end, d)).toBeCloseTo(100);
  });

  it("gives a long milestone far less than its share of calendar time", () => {
    const linear = ((parseDay("2026-07-01") - parseDay("2026-01-08")) / (d.end - d.start)) * 100;
    expect(linear).toBeGreaterThan(90);
    expect(width(1)).toBeLessThan(60);
  });

  it("lets a one-week milestone stay readable next to a six-month one", () => {
    expect(width(0)).toBeGreaterThan(15);
    expect(width(1) / width(0)).toBeLessThan(3);
  });

  it("keeps bars in order without overlapping their neighbours", () => {
    const spans = ms.map((x) => barSpan(x, d));
    expect(spans[0].left + spans[0].width).toBeCloseTo(spans[1].left);
    expect(spans[1].left + spans[1].width).toBeCloseTo(spans[2].left);
  });

  it("only ever moves forward", () => {
    let prev = -1;
    for (let t = d.start; t <= d.end; t += DAY / 2) {
      const x = xPct(t, d);
      expect(x).toBeGreaterThan(prev);
      prev = x;
    }
  });
});

describe("monthTicks on a squeezed axis", () => {
  it("blanks labels that would overprint, keeping the tick and the year", () => {
    const ms = [m("2025-12-16", "2025-12-24"), m("2025-12-25", "2026-01-03"), m("2026-01-04", "2026-09-30"), m("2026-10-01", "2026-10-06")];
    const ticks = monthTicks(ganttDomain(ms, "2026-10-07"));
    expect(ticks.map((t) => t.pct)).toHaveLength(10);
    expect(ticks.find((t) => t.label === "JAN 2026")).toBeTruthy();
    const shown = ticks.filter((t) => t.label);
    for (let i = 1; i < shown.length; i++) {
      expect(shown[i].pct - shown[i - 1].pct).toBeGreaterThanOrEqual(shown[i - 1].label.length * 1.1 + 1.5);
    }
  });
});
