/* Gantt geometry. Everything is in UTC day timestamps and comes out as a
   percentage of the chart width, so the chart is plain positioned HTML that
   scales with its container and keeps its text crisp.

   The time axis is not linear. Each milestone brings the same share of
   width, spread over its own days, and every day also gets a small base
   share. A busy week with three short milestones therefore opens up, and a
   quiet three-month stretch covered by one long milestone closes down,
   instead of one long phase pushing every other bar into a sliver. Time
   still only moves forward, so bars keep their order and overlaps; the
   month ticks show where the axis is stretched or squeezed. */

import { localDay } from "./derive";

const DAY = 86_400_000;

export interface Domain {
  start: number;
  end: number;
  /** Width carried by each whole day of the domain, from its start. Absent
      means a plain linear axis. */
  dayWeights?: number[];
}

/* Share of the width every day gets regardless of milestones, as a fraction
   of what the milestones bring in total. Keeps empty stretches (padding,
   gaps between phases) visible without letting them dominate. */
const BASE_SHARE = 0.3;

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

/* start_date/due_date are plain calendar days, the same everywhere. But
   completed_at is a real instant (a trigger sets it to "now"), so its date
   depends on the viewer: slicing its UTC ISO string can land it a day off
   from what the milestone's own timezone-naive dates mean. Converting
   through the viewer's local day keeps the diamond on the day the person
   looking at the chart would call "completed". */
export function completedDay(iso: string): number {
  return parseDay(localDay(new Date(iso)));
}

export function ganttDomain(ms: Spanned[], today: string, padDays = 3): Domain {
  let start = parseDay(today);
  let end = start;
  for (const m of ms) {
    start = Math.min(start, parseDay(m.start_date));
    end = Math.max(end, parseDay(m.due_date), m.completed_at ? completedDay(m.completed_at) : end);
  }
  const domain = { start: start - padDays * DAY, end: end + padDays * DAY };
  const days = Math.round((domain.end - domain.start) / DAY);
  const base = (BASE_SHARE * Math.max(ms.length, 1)) / days;
  const dayWeights = new Array<number>(days).fill(base);
  for (const m of ms) {
    const first = Math.round((parseDay(m.start_date) - domain.start) / DAY);
    const last = Math.round((parseDay(m.due_date) - domain.start) / DAY);
    const len = last - first + 1;
    for (let i = first; i <= last; i++) dayWeights[i] += 1 / len;
  }
  return { ...domain, dayWeights };
}

export function xPct(day: number, d: Domain): number {
  const w = d.dayWeights;
  if (!w) return ((day - d.start) / (d.end - d.start)) * 100;
  const total = w.reduce((a, b) => a + b, 0);
  const at = Math.min(Math.max((day - d.start) / DAY, 0), w.length);
  const whole = Math.floor(at);
  let sum = 0;
  for (let i = 0; i < whole; i++) sum += w[i];
  if (whole < w.length) sum += (at - whole) * w[whole];
  return (sum / total) * 100;
}

/** A bar runs from the start of its first day to the end of its due day. */
export function barSpan(m: Spanned, d: Domain): { left: number; width: number } {
  const left = xPct(parseDay(m.start_date), d);
  return { left, width: xPct(parseDay(m.due_date) + DAY, d) - left };
}

/* Rough label widths in percent of the chart, at the chart's minimum width,
   so labels squeezed together by a compressed stretch don't overprint. */
const PCT_PER_CHAR = 1.1;
const LABEL_GAP_PCT = 1.5;

/** Month starts inside the domain. Where two would overprint, the earlier
    label is blanked (its tick line stays) unless the later is the plainer
    one; a January label, which carries the year, always wins. */
export function monthTicks(d: Domain): { pct: number; label: string }[] {
  const first = new Date(d.start);
  const ticks: { pct: number; label: string }[] = [];
  for (let i = 0; ; i++) {
    const t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i, 1);
    if (t > d.end) break;
    if (t < d.start) continue;
    const date = new Date(t);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
    ticks.push({ pct: xPct(t, d), label: date.getUTCMonth() === 0 ? `${month} ${date.getUTCFullYear()}` : month });
  }
  let shown = -1;
  for (let i = 0; i < ticks.length; i++) {
    if (shown >= 0 && ticks[i].pct - ticks[shown].pct < ticks[shown].label.length * PCT_PER_CHAR + LABEL_GAP_PCT) {
      const keepLater = ticks[i].label.length > ticks[shown].label.length;
      if (keepLater) ticks[shown] = { ...ticks[shown], label: "" };
      else {
        ticks[i] = { ...ticks[i], label: "" };
        continue;
      }
    }
    shown = i;
  }
  return ticks;
}
