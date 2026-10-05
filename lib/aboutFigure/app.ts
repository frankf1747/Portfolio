import {
  INK, PINK, PAPER, MUTE, FAINT, HATCH, ease, win, inW, el, rr, tx, head, curve, wob, node, lit, wire, along,
  type Scene, type Wire, type Pt, type NodeRefs
} from "./kit";

/* AN APP — the screen an operations team works in.

   Left, grouped by job. DATA IN: sources reach the app's live views through
   connectors. AI ACCESS: the assistant never touches a backend directly — an
   MCP server exposes TOOLS, and each tool is one kind of reach: data (SQL),
   knowledge (RAG over a vector index), actions (APIs).

   Right, the app: a live map rather than another number, a summary that says
   what it was grounded in, and a chat that answers by calling those tools in
   turn. All generic — placeholder accounts, placeholder figures. */

const WIN = { x: 214, y: 6, w: 486, h: 388 };
const MX = 256, MR = 688;
const LOOP = 9000;
const SUMMARY = ["142 shipments moving.", "3 running late, all RTM.", "2 orders at risk.", "Suggest: notify early."];
const QUESTION = "Why are 3 shipments late?";
const ANSWER = "Port congestion at RTM. Carrier ETA +2 days. Notify customers?";
const TOOLS = [
  { t: "sql.query", g: "Data", be: "Warehouse", bs: "SQL", y: 254, win: [3750, 4350] },
  { t: "rag.search", g: "Knowledge · RAG", be: "Docs", bs: "Vector index", y: 302, win: [4350, 4950] },
  { t: "api.call", g: "Actions", be: "APIs", bs: "External", y: 350, win: [4950, 5550] }
] as const;

/* a rough world in (lon, lat) rings — only ever drawn as a dot grid, so the
   coastlines can afford to be approximate */
const LAND: [number, number][][] = [
  [[-165,66],[-155,71],[-125,70],[-95,73],[-80,68],[-62,58],[-55,48],[-70,43],[-76,35],[-81,25],[-90,29],[-97,24],[-97,17],[-88,14],[-83,9],[-80,8],[-92,15],[-105,20],[-112,29],[-118,33],[-124,40],[-124,48],[-133,55],[-150,60],[-160,58]],
  [[-50,60],[-42,60],[-22,70],[-20,78],[-60,78],[-55,70]],
  [[-80,9],[-72,12],[-62,10],[-50,0],[-35,-6],[-39,-15],[-42,-23],[-48,-26],[-53,-33],[-58,-38],[-65,-42],[-68,-50],[-72,-53],[-75,-48],[-73,-38],[-71,-30],[-70,-18],[-76,-14],[-81,-5],[-80,0]],
  [[-9,37],[-9,43],[-2,44],[-4,48],[2,51],[8,54],[10,58],[5,62],[12,66],[20,70],[30,71],[40,67],[42,60],[40,48],[30,45],[28,41],[24,38],[18,40],[12,44],[8,44],[3,42],[-2,37]],
  [[-6,50],[2,51],[0,54],[-3,58],[-6,56]],
  [[-17,15],[-17,21],[-13,28],[-9,32],[-6,36],[10,37],[11,33],[20,31],[32,31],[35,28],[43,12],[51,12],[48,4],[40,-3],[40,-15],[35,-24],[32,-29],[27,-34],[19,-35],[16,-28],[12,-17],[13,-6],[9,1],[9,4],[3,6],[-8,4],[-14,10]],
  [[44,-25],[50,-15],[49,-13],[43,-17]],
  [[28,41],[36,36],[35,32],[43,13],[52,16],[57,23],[60,25],[67,24],[73,20],[77,8],[80,15],[88,22],[92,22],[97,16],[98,8],[103,1],[104,10],[109,12],[107,20],[115,23],[121,30],[122,37],[126,38],[128,35],[130,42],[140,48],[143,52],[156,58],[162,62],[180,65],[180,70],[160,71],[140,73],[110,77],[90,76],[70,73],[60,70],[50,68],[42,60],[40,48],[30,45]],
  [[131,32],[136,34],[141,38],[142,44],[140,42],[135,35]],
  [[96,5],[106,-6],[115,-8],[125,-9],[131,-3],[120,1],[110,-2],[100,1]],
  [[114,-22],[122,-17],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[135,-35],[129,-32],[116,-35],[114,-28]],
  [[172,-35],[178,-38],[174,-41],[168,-46]]
];
const HUBS: Record<string, Pt> = { LAX: [-118, 34], NYC: [-74, 41], SAO: [-46, -24], RTM: [4, 52], DXB: [55, 25], SIN: [104, 1], SHA: [121, 31], SYD: [151, -34] };
/* from, to, late? — the three late ones all run into Rotterdam */
const ROUTES: [string, string, boolean][] = [
  ["SHA", "RTM", true], ["SIN", "RTM", true], ["NYC", "RTM", true], ["SHA", "SIN", false], ["LAX", "NYC", false],
  ["SAO", "NYC", false], ["DXB", "SIN", false], ["SIN", "SYD", false], ["DXB", "RTM", false], ["SHA", "LAX", false]
];
const MAP = { x: MX + 8, y: 86, w: 246, h: 122 };

const inside = (lon: number, lat: number, ring: [number, number][]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const proj = ([lon, lat]: Pt): Pt => [MAP.x + ((lon + 170) / 350) * MAP.w, MAP.y + ((78 - lat) / 134) * MAP.h];

/* the dot grid is pure geometry, so it is computed once per page load */
let LAND_DOTS = "";
const landDots = () => {
  if (LAND_DOTS) return LAND_DOTS;
  const STEP = 3.3, sz = 1.5;
  for (let y = MAP.y; y <= MAP.y + MAP.h; y += STEP)
    for (let x = MAP.x; x <= MAP.x + MAP.w; x += STEP) {
      const lon = ((x - MAP.x) / MAP.w) * 350 - 170, lat = 78 - ((y - MAP.y) / MAP.h) * 134;
      if (LAND.some((r) => inside(lon, lat, r)))
        LAND_DOTS += `M${(x - sz / 2).toFixed(1)},${(y - sz / 2).toFixed(1)}h${sz}v${sz}h${-sz}Z`;
    }
  return LAND_DOTS;
};

export function appScene(g: SVGGElement, reduced: boolean): Scene {
  const arrow = (to: Pt, ang: number) => el(g, "path", { d: head(to, ang, 7), stroke: INK, "stroke-width": 1.2, fill: "none" });
  const group = (y: number, h: number, label: string) => {
    el(g, "path", { d: rr(-8, y, 206, h, 10), fill: "none", stroke: "rgb(38 32 72 / 0.3)", "stroke-width": 1, "stroke-dasharray": "3 3" });
    tx(g, -2, y - 6, label, { size: 8.5, weight: 700, fill: MUTE });
  };

  /* ---- DATA IN: sources → connectors → the app's live views ---- */
  group(30, 112, "Data in");
  const cf: Wire[] = [];
  ([["CRM", 40], ["ERP", 74], ["IoT / GPS", 108]] as const).forEach(([t, y], i) => {
    cf.push(wire(g, curve([74, y + 13], [95, 86]), { filter: wob(i) }));
    node(g, { x: 0, y, w: 74, h: 26, t }, i, { size: 9.5 });
  });
  arrow([95, 86], 0);
  const conn = node(g, { x: 98, y: 62, w: 94, h: 48, t: "Connectors", s: "Managed sync" }, 1, { size: 10 });
  cf.push(wire(g, curve([192, 86], [WIN.x - 3, 120]), { filter: wob(2) }));
  arrow([WIN.x - 3, 120], 0);
  const cpk = cf.flatMap(() => [0, 1].map(() => el(g, "rect", { width: 5, height: 5, fill: PINK, opacity: 0 })));

  /* ---- AI ACCESS: the assistant → MCP → tools → backends ---- */
  group(198, 190, "AI access");
  const mcp: NodeRefs = {
    frame: el(g, "path", { d: rr(98, 206, 94, 174, 8), fill: PAPER, stroke: INK, "stroke-width": 1.8, filter: "url(#wob2)" }),
    inner: el(g, "path", { d: rr(102, 210, 86, 166, 6), fill: "none", stroke: INK, "stroke-width": 1, filter: "url(#wobS)" }),
    t: tx(g, 145, 226, "MCP server", { size: 10.5, weight: 700, anchor: "middle" }),
    s: tx(g, 145, 238, "Exposes tools", { size: 7.5, fill: MUTE, anchor: "middle" })
  };
  const tw: Wire[] = [];
  const trow = TOOLS.map((tl, k) => {
    if (k) el(g, "path", { d: `M106,${tl.y - 22} L184,${tl.y - 22}`, stroke: "rgb(38 32 72 / 0.18)", "stroke-width": 1 });
    const name = tx(g, 108, tl.y, tl.t, { size: 9, weight: 700 });
    const grp = tx(g, 108, tl.y + 11, tl.g, { size: 7.5, fill: MUTE });
    node(g, { x: 0, y: tl.y - 17, w: 74, h: 34, t: tl.be, s: tl.bs }, k, { size: 9.5 });
    /* straight and unfiltered: a displacement filter sized off a zero-height
       box clips a horizontal line away entirely */
    tw.push(wire(g, `M74,${tl.y} L98,${tl.y}`));
    return { name, grp };
  });
  const ml = wire(g, curve([192, 290], [WIN.x - 3, 322]), { "stroke-dasharray": "4 3", filter: wob(3) });
  arrow([WIN.x - 3, 322], 0);
  arrow([195, 290], Math.PI);
  const mtok = el(g, "circle", { r: 4.2, fill: PINK, stroke: PINK, "stroke-width": 1.6, opacity: 0 });

  /* ---- the window ---- */
  el(g, "path", { d: rr(WIN.x, WIN.y, WIN.w, WIN.h, 10), fill: PAPER, stroke: INK, "stroke-width": 1.6, filter: "url(#wob2)" });
  el(g, "path", { d: `M${WIN.x},${WIN.y + 30} L${WIN.x + WIN.w},${WIN.y + 30}`, stroke: INK, "stroke-width": 1.1, filter: "url(#wob1)" });
  [0, 1, 2].forEach((k) => el(g, "circle", { cx: WIN.x + 16 + k * 14, cy: WIN.y + 15, r: 4, fill: "none", stroke: INK, "stroke-width": 1 }));
  el(g, "path", { d: rr(WIN.x + 70, WIN.y + 7, 180, 16, 8), fill: "none", stroke: FAINT, "stroke-width": 1 });
  tx(g, WIN.x + 82, WIN.y + 18.5, "ops.app / today", { size: 8, fill: MUTE });
  ["CS", "PM", "OP"].forEach((t, k) => {
    const cx = WIN.x + WIN.w - 22 - k * 18, cy = WIN.y + 15, me = k === 2;
    el(g, "circle", { cx, cy, r: 9, fill: me ? PINK : PAPER, stroke: me ? PINK : INK, "stroke-width": 1.1 });
    tx(g, cx, cy + 2.8, t, { size: 7.5, weight: 700, fill: me ? PAPER : INK, anchor: "middle", ls: 0 });
  });
  el(g, "path", { d: `M${WIN.x + 30},${WIN.y + 30} L${WIN.x + 30},${WIN.y + WIN.h}`, stroke: INK, "stroke-width": 1, filter: "url(#wob3)" });
  [0, 1, 2, 3].forEach((k) =>
    el(g, "path", { d: rr(WIN.x + 9, WIN.y + 44 + k * 26, 12, 12, 3), fill: k ? "none" : PINK, stroke: k ? "rgb(38 32 72 / 0.45)" : PINK, "stroke-width": 1 })
  );
  tx(g, MX, WIN.y + 46, "Today", { size: 14, weight: 700 });
  const syncDot = el(g, "circle", { cx: MR - 98, cy: WIN.y + 42, r: 3.5, fill: PINK });
  const sync = tx(g, MR - 90, WIN.y + 45, "", { size: 8.5, fill: MUTE });

  /* ---- live map ---- */
  el(g, "path", { d: rr(MX, 60, 262, 188, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob1)" });
  tx(g, MX + 10, 76, "Shipments · live", { size: 8.5, fill: MUTE });
  el(g, "path", { d: landDots(), fill: "rgb(38 32 72 / 0.5)" });
  const routes = ROUTES.map(([a, b, late], k) => {
    const p0 = proj(HUBS[a]), p1 = proj(HUBS[b]);
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dist = Math.hypot(dx, dy);
    let nx = -dy / dist, ny = dx / dist;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const c: Pt = [(p0[0] + p1[0]) / 2 + nx * dist * 0.22, (p0[1] + p1[1]) / 2 + ny * dist * 0.22];
    const w = wire(g, `M${p0} Q${c} ${p1}`, { stroke: late ? "rgb(242 36 122 / 0.55)" : "rgb(38 32 72 / 0.4)", "stroke-width": 0.9, "stroke-dasharray": "2.5 2.5" });
    return { ...w, late, k };
  });
  Object.entries(HUBS).forEach(([code, ll]) => {
    const [hx, hy] = proj(ll);
    const rtm = code === "RTM";
    el(g, "circle", { cx: hx, cy: hy, r: 2.6, fill: PAPER, stroke: rtm ? PINK : INK, "stroke-width": 1.2 });
    if (["RTM", "SHA", "NYC", "SIN", "LAX"].includes(code)) tx(g, hx + 4, hy - 4, code, { size: 6.5, weight: 700, fill: rtm ? PINK : MUTE, ls: 0 });
  });
  const ships = routes.flatMap((r) =>
    (r.late ? [0] : [0, 0.5]).map((ph) => ({
      r, ph,
      c: el(g, "circle", { r: r.late ? 3 : 2.2, fill: r.late ? PINK : INK }),
      ring: r.late ? el(g, "circle", { r: 3, fill: "none", stroke: PINK, "stroke-width": 1 }) : null
    }))
  );
  tx(g, MX + 10, 240, "", { size: 8.5 }).innerHTML =
    `142 in transit &#160;·&#160; <tspan fill="${PINK}" font-weight="700">3 late</tspan> &#160;·&#160; 98% on time`;

  /* ---- grounded summary ---- */
  el(g, "path", { d: rr(526, 60, 162, 188, 6), fill: "none", stroke: PINK, "stroke-width": 1.2, filter: "url(#wob3)" });
  tx(g, 536, 76, "✦ AI summary", { size: 8.5, weight: 700, fill: PINK });
  const sum = SUMMARY.map((_, k) => tx(g, 536, 100 + k * 16, "", { size: 8.5 }));
  const sumBars = [[124, 170], [92, 182]].map(([w, y]) => el(g, "rect", { x: 536, y, width: w, height: 6, fill: HATCH, opacity: 0 }));
  const cite = tx(g, 536, 236, "Grounded in sql · docs · api", { size: 7.5, fill: MUTE });

  /* ---- chat: answers by calling the tools ---- */
  el(g, "path", { d: rr(MX, 256, MR - MX, 132, 6), fill: "none", stroke: INK, "stroke-width": 1.2, filter: "url(#wob2)" });
  const ub = el(g, "g", { opacity: 0 });
  el(ub, "path", { d: rr(MR - 172, 264, 162, 21, 10.5), fill: INK });
  tx(ub, MR - 91, 278, QUESTION, { size: 8.5, fill: PAPER, anchor: "middle" });
  const chips = TOOLS.map((tl, k) => {
    const gg = el(g, "g", { opacity: 0 });
    const x = MX + 10 + k * 114;
    const f = el(gg, "path", { d: rr(x, 292, 108, 18, 9), fill: "none", stroke: INK, "stroke-width": 1, "stroke-dasharray": "3 2" });
    const t = tx(gg, x + 10, 304.5, "", { size: 8, weight: 700 });
    return { gg, f, t, name: tl.t };
  });
  tx(g, MX + 356, 304.5, "via MCP", { size: 8, fill: MUTE });
  const ab = el(g, "g", { opacity: 0 });
  el(ab, "path", { d: rr(MX + 10, 316, 344, 22, 11), fill: PAPER, stroke: PINK, "stroke-width": 1.2 });
  const abT = tx(ab, MX + 22, 330.5, "", { size: 8.5 });
  const ac = el(g, "g", { opacity: 0 });
  el(ac, "path", { d: rr(MX + 10, 344, 108, 17, 8.5), fill: PINK });
  tx(ac, MX + 64, 355.5, "Notify customers", { size: 8, weight: 700, fill: PAPER, anchor: "middle" });
  el(ac, "path", { d: rr(MX + 124, 344, 100, 17, 8.5), fill: "none", stroke: PINK, "stroke-width": 1 });
  tx(ac, MX + 174, 355.5, "Open shipments", { size: 8, weight: 700, fill: PINK, anchor: "middle" });
  el(g, "path", { d: rr(MX + 10, 366, MR - MX - 20, 17, 8.5), fill: "none", stroke: FAINT, "stroke-width": 1 });
  const inT = tx(g, MX + 20, 377.5, "", { size: 8.5, fill: MUTE });
  const sx = MR - 19, sy = 374.5;
  el(g, "circle", { cx: sx, cy: sy, r: 6.5, fill: PINK });
  el(g, "path", { d: `M${sx - 2.5},${sy} L${sx + 2.5},${sy} M${sx + 0.5},${sy - 2} L${sx + 2.5},${sy} L${sx + 0.5},${sy + 2}`, stroke: PAPER, "stroke-width": 1.2, fill: "none", "stroke-linecap": "round" });

  const show = (n: Element, on: boolean | number) => n.setAttribute("opacity", String(+on));

  return {
    caption: "Fig. 1d — Live map, summary, AI with tools.",
    frame(t: number) {
      const tt = reduced ? 7600 : t % LOOP;

      /* connectors: always syncing */
      cf.forEach((f, i) =>
        [0, 1].forEach((k) => {
          const c = cpk[i * 2 + k];
          const p = reduced ? 0.5 : (t / (1300 + i * 160) + k / 2 + i * 0.23) % 1;
          along(c, f, p, 2.5);
          c.setAttribute("opacity", String(reduced ? 1 : Math.min(1, Math.sin(Math.PI * p) * 3)));
        })
      );
      const fresh = inW(tt, 500, 2200);
      sync.textContent = fresh ? "Synced just now" : `Synced ${Math.floor(((tt - 500 + LOOP) % LOOP) / 1000)}s ago`;
      syncDot.setAttribute("opacity", String(fresh ? 0.4 + 0.6 * Math.abs(Math.sin(tt / 140)) : 0.35));
      lit(conn, inW(tt, 300, 900));

      /* the map never stops; the late ones crawl and pulse */
      ships.forEach(({ r, ph, c, ring }, i) => {
        const period = r.late ? 14000 : 6000 + (r.k % 4) * 1300;
        const p = reduced ? 0.6 : (t / period + ph + r.k * 0.13) % 1;
        const q = along(c, r, r.late ? 0.35 + p * 0.5 : p);
        /* fade at both ends so a loop never reads as a jump */
        c.setAttribute("opacity", String(reduced ? 1 : Math.min(1, Math.sin(Math.PI * p) * 4)));
        if (ring) {
          const pulse = reduced ? 0.5 : (t / 1200 + i * 0.3) % 1;
          ring.setAttribute("cx", String(q.x));
          ring.setAttribute("cy", String(q.y));
          ring.setAttribute("r", String(3 + pulse * 7));
          ring.setAttribute("opacity", String(1 - pulse));
        }
      });

      const live = reduced ? 1 : 1 - win(tt, 8500, 8950);

      /* summary types itself, then says what it was grounded in */
      const total = SUMMARY.join("").length;
      let left = Math.floor(win(tt, 1200, 2600) * total);
      sum.forEach((s, k) => {
        s.textContent = SUMMARY[k].slice(0, Math.max(0, Math.min(SUMMARY[k].length, left)));
        left -= SUMMARY[k].length;
        show(s, live);
      });
      sumBars.forEach((b) => show(b, (tt > 2600 ? 1 : 0) * live));
      show(cite, (tt > 2700 ? 1 : 0) * live);

      /* a question */
      const qn = Math.floor(win(tt, 2700, 3400) * QUESTION.length);
      const sent = tt >= 3500;
      const typing = !sent && qn > 0;
      inT.textContent = typing ? QUESTION.slice(0, qn) + "▌" : "Ask about today…";
      inT.setAttribute("fill", typing ? INK : MUTE);
      show(ub, sent ? live : 0);

      /* three tool calls through MCP: data, then knowledge, then an action */
      const calling = inW(tt, 3550, 5800);
      lit(mcp, calling);
      let tok: { w: Wire; p: number; back: boolean } | null = null;
      const leg = (w: Wire, a: number, b: number, back: boolean) => {
        if (!inW(tt, a, b)) return;
        const e = ease(win(tt, a, b));
        tok = { w, p: back ? e : 1 - e, back };
      };
      leg(ml, 3550, 3750, false);
      leg(ml, 5600, 5800, true);
      TOOLS.forEach((tl, k) => {
        const [a, b] = tl.win, mid = (a + b) / 2;
        const on = inW(tt, a, b);
        trow[k].name.setAttribute("fill", on ? PINK : INK);
        trow[k].grp.setAttribute("fill", on ? PINK : MUTE);
        /* the request leaves the MCP row for the backend, the result comes back */
        leg(tw[k], a, mid, false);
        leg(tw[k], mid, b, true);
        const ch = chips[k];
        show(ch.gg, tt >= a ? live : 0);
        const done = tt >= b;
        ch.t.textContent = `⚙ ${ch.name} ${done ? "✓" : "…"}`;
        ch.t.setAttribute("fill", done ? INK : PINK);
        ch.f.setAttribute("stroke", done ? INK : PINK);
      });
      const tk = tok as { w: Wire; p: number; back: boolean } | null;
      if (tk) {
        along(mtok, tk.w, tk.p);
        mtok.setAttribute("fill", tk.back ? PAPER : PINK);
        show(mtok, 1);
      } else show(mtok, 0);

      /* the answer, then what to do about it */
      show(ab, tt >= 5850 ? live : 0);
      abT.textContent = ANSWER.slice(0, Math.floor(win(tt, 5900, 7200) * ANSWER.length));
      show(ac, tt >= 7300 ? live : 0);

      return { port: [WIN.x + WIN.w, 200, 0], readout: "<b>3</b> connectors &nbsp;·&nbsp; <b>3</b> tools via MCP" };
    }
  };
}
