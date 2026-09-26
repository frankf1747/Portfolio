/* Gantt geometry. Everything is in UTC day timestamps and comes out as a
   percentage of the chart width, so the chart is plain positioned HTML that
   scales with its container and keeps its text crisp. */

const DAY = 86_400_000;

export interface Domain {
  start: number;
  end: number;
}

interface Spanned {
  start_date: string;
  due_date: string;
  completed_at: string | null;
}

/** "2026-09-05" or an ISO timestamp → UTC midnight of that date. */
export function parseDay(s: string): number {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function ganttDomain(ms: Spanned[], today: string, padDays = 3): Domain {
  let start = parseDay(today);
  let end = start;
  for (const m of ms) {
    start = Math.min(start, parseDay(m.start_date));
    end = Math.max(end, parseDay(m.due_date), m.completed_at ? parseDay(m.completed_at) : end);
  }
  return { start: start - padDays * DAY, end: end + padDays * DAY };
}

export function xPct(day: number, d: Domain): number {
  return ((day - d.start) / (d.end - d.start)) * 100;
}

/** A bar runs from the start of its first day to the end of its due day. */
export function barSpan(m: Spanned, d: Domain): { left: number; width: number } {
  const left = xPct(parseDay(m.start_date), d);
  return { left, width: xPct(parseDay(m.due_date) + DAY, d) - left };
}

export function monthTicks(d: Domain): { pct: number; label: string }[] {
  const first = new Date(d.start);
  const ticks: { pct: number; label: string }[] = [];
  for (let i = 1; ; i++) {
    const t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i, 1);
    if (t > d.end) break;
    const date = new Date(t);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
    ticks.push({ pct: xPct(t, d), label: date.getUTCMonth() === 0 ? `${month} ${date.getUTCFullYear()}` : month });
  }
  return ticks;
}
