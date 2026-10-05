import {
  INK, PINK, PAPER, MUTE, ease, win, inW, el, tx, head, curve, vcurve, wob, node, lit, wire, along,
  type Scene, type Wire, type Pt
} from "./kit";

/* AN AGENT — one orchestrator, four sub-agents.

   The orchestrator plans, fans three sub-agents out in parallel, checks what
   comes back, then hands the writer the job alone: parallel, then
   sequential, which is the part a straight pipeline cannot show. Tasks go
   out as filled dots, results come back hollow — the same convention the
   app sketch uses for its tool calls. */

const TRIG = { x: 0, y: 52, w: 140, h: 48, t: "Request", s: "A question · a schedule" };
const ORCH = { x: 250, y: 42, w: 200, h: 68, t: "Orchestrator", s: "Plans · routes · checks" };
const OUT = { x: 560, y: 52, w: 140, h: 48, t: "Answer", s: "Back to the team" };
const SUBS = [
  { t: "Retriever", s: "Docs · RAG" },
  { t: "Analyst", s: "SQL · metrics" },
  { t: "Forecaster", s: "Trends · forecast" },
  { t: "Writer", s: "Drafts the answer" }
].map((n, i) => ({ ...n, x: i * 183.33, y: 262, w: 150, h: 56 }));
/* per sub-agent: dispatch, working, return — ms into a 7s run. Three go out
   together, the writer only once their results are checked. */
const RUNS: [number, number][][] = [0, 1, 2]
  .map((k) => [[1300 + k * 120, 1900 + k * 120], [1900 + k * 120, 2900 + k * 120], [2900 + k * 120, 3500 + k * 120]] as [number, number][])
  .concat([[[4000, 4600], [4600, 5300], [5300, 5800]]]);
const LOOP = 7000;

export function agentScene(g: SVGGElement, reduced: boolean): Scene {
  const edge = (d: string, k: number, headAt: Pt, ang: number): Wire => {
    const w = wire(g, d, { "stroke-width": 1.3, filter: wob(k) });
    el(g, "path", { d: head(headAt, ang, 8), stroke: INK, "stroke-width": 1.3, fill: "none" });
    return w;
  };
  const inE = edge(curve([TRIG.x + TRIG.w, 76], [ORCH.x - 3, 76]), 0, [ORCH.x - 3, 76], 0);
  const outE = edge(curve([ORCH.x + ORCH.w, 76], [OUT.x - 3, 76]), 1, [OUT.x - 3, 76], 0);
  const legs = SUBS.map((n, i) => {
    const end: Pt = [n.x + n.w / 2, n.y - 3];
    return edge(vcurve([ORCH.x + 40 + i * 40, ORCH.y + ORCH.h], end), i + 2, end, Math.PI / 2);
  });
  const nTrig = node(g, TRIG, 0);
  const nOrch = node(g, ORCH, 1, { double: true, sw: 1.8, size: 13 });
  const nOut = node(g, OUT, 2);
  const nSubs = SUBS.map((n, i) => node(g, n, i));
  tx(g, 0, 344, "Sub-agents", { size: 9, fill: MUTE });
  const sent = tx(g, OUT.x + OUT.w / 2, OUT.y + OUT.h + 22, "✓ Delivered", { size: 11, weight: 700, fill: PINK, anchor: "middle" });
  const log = tx(g, 0, 388, "", { size: 10, fill: MUTE });
  const toks = Array.from({ length: 6 }, () => el(g, "circle", { r: 5, fill: PINK, stroke: PINK, "stroke-width": 2, opacity: 0 }));

  const send = (c: SVGCircleElement, w: Wire, p: number, hollow = false) => {
    along(c, w, p);
    c.setAttribute("fill", hollow ? PAPER : PINK);
    c.setAttribute("opacity", "1");
  };

  return {
    caption: "Fig. 1c — One orchestrator, four sub-agents.",
    frame(t: number) {
      const tt = reduced ? 6400 : t % LOOP;
      const run = 128 + (reduced ? 0 : Math.floor(t / LOOP));
      lit(nTrig, inW(tt, 0, 800));
      lit(nOrch, inW(tt, 700, 1400) || inW(tt, 3500, 4100) || inW(tt, 5700, 6200));
      lit(nOut, inW(tt, 6200, 6950));
      toks.forEach((c) => c.setAttribute("opacity", "0"));
      if (inW(tt, 300, 800)) send(toks[4], inE, ease(win(tt, 300, 800)));
      if (inW(tt, 5800, 6300)) send(toks[5], outE, ease(win(tt, 5800, 6300)));
      RUNS.forEach(([go, work, back], i) => {
        lit(nSubs[i], inW(tt, work[0], work[1]));
        if (inW(tt, go[0], go[1])) send(toks[i], legs[i], ease(win(tt, go[0], go[1])));
        else if (inW(tt, back[0], back[1])) send(toks[i], legs[i], 1 - ease(win(tt, back[0], back[1])), true);
      });
      sent.setAttribute("opacity", inW(tt, 6250, 6980) ? "1" : "0");
      const [line, state] =
        tt < 700 ? [`› run #${run} · request in`, "request in"]
        : tt < 1300 ? ["› plan: retrieve, analyse, forecast in parallel, then write", "planning"]
        : tt < 3500 ? ["› 3 sub-agents working", "3 agents working"]
        : tt < 4000 ? ["› results back · orchestrator checks them", "checking"]
        : tt < 5800 ? ["› writer drafting the answer", "writing"]
        : ["› delivered · checked against the plan", "delivered"];
      log.textContent = line;
      return { port: [OUT.x + OUT.w, 76, 0], readout: `Run <b>#${run}</b> &nbsp;·&nbsp; <b>${state}</b>` };
    }
  };
}
