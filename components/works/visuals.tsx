/* §9 card covers — one sketch per project, drawn in the About figure's
   hand: ink lines through the wobble filter, mono labels, hatching for
   weight, and the accent spent on the ONE thing each card is about.

   Every figure shown is from the resume (85%, 50K+, ~11% / ~13%, ~600 / 7
   courses, ~35%), except the clinical card, which uses the pipeline repo's
   own figures (118 GB, 111K trials, AUC 0.71). Everything else — row names, IDs,
   the sample question — is illustrative filler, not a claim.

   Drawn as SVG in a viewBox close to the card's own size, so 1 unit ≈ 1px
   and the type stays legible; `meet` scaling keeps the whole sketch in view
   at any card shape. All decorative: the headline and summary carry the
   meaning, so every cover is aria-hidden at the card level. */

import type { CSSProperties, ReactNode } from "react";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/* mono label; `k` picks the tone — mute (default), ink, or the accent */
const T = ({ x, y, k, a, s, w, children }: { x: number; y: number; k?: "ink" | "pk"; a?: "middle" | "end"; s?: number; w?: number; children: ReactNode }) => (
  <text x={x} y={y} className={k ? `sk-${k}` : undefined} textAnchor={a} fontSize={s} fontWeight={w}>
    {children}
  </text>
);

/* a hatch pattern per sketch (ids must be unique on the page) */
const Hatch = ({ id, pk }: { id: string; pk?: boolean }) => (
  <defs>
    <pattern id={id} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <rect width="1.3" height="5" className={pk ? "sk-hpk" : "sk-hink"} />
    </pattern>
  </defs>
);

/* ---------- 01 BIOMARIN — SAP to gold, an agent team reads it, and the
   scorecard arrives with the actions already on it ---------- */

export function BioVisual() {
  const med = [
    { x: 134, t: "BRONZE", f: "url(#skh-bio)" },
    { x: 192, t: "SILVER", f: "none" },
    { x: 250, t: "GOLD", f: "none" }
  ];
  const agents: [number, number, string][] = [
    [340, 56, "TRENDS"],
    [382, 42, "ROOT CAUSE"],
    [424, 56, "ACTIONS"]
  ];
  return (
    <svg className="sk sk-bio" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet">
      <Hatch id="skh-bio" />
      <g className="sk-ln">
        {/* SAP, as a database drum */}
        <path d="M16,76 V156 M96,76 V156 M16,156 C16,171 96,171 96,156" />
        <ellipse cx="56" cy="76" rx="40" ry="13" />
        <path d="M16,104 C16,118 96,118 96,104 M16,130 C16,144 96,144 96,130" className="sk-faint" />
        {/* medallion, bronze → silver → gold */}
        {med.map((m) => (
          <rect key={m.t} x={m.x} y="98" width="52" height="48" rx="7" fill={m.f} />
        ))}
        <path d="M100,122 H128 M186,122 H192 M244,122 H250 M302,122 H328 M432,122 H456" />
        <path d="M122,116 L128,122 L122,128 M322,116 L328,122 L322,128 M450,116 L456,122 L450,128" />
        {/* the scorecard, refreshed on a schedule, actions included */}
        <rect x="462" y="58" width="128" height="150" rx="8" />
        <path d="M462,88 H590" />
        <rect x="472" y="98" width="50" height="30" rx="4" />
        <rect x="530" y="98" width="50" height="30" rx="4" />
        <rect x="480" y="110" width="30" height="8" rx="2" fill="url(#skh-bio)" />
        <rect x="538" y="110" width="22" height="8" rx="2" fill="url(#skh-bio)" />
        <path d="M486,154 H576 M486,176 H560 M486,198 H568" className="sk-faint" />
        <circle cx="578" cy="37" r="12" />
        <path d="M578,30 V37 L583,41" />
      </g>
      {/* the agent team: three hands, one orchestrator */}
      <g className="sk-ln sk-pkline">
        <rect x="334" y="96" width="96" height="52" rx="8" />
        <rect x="338" y="100" width="88" height="44" rx="6" className="sk-thin" />
        {agents.map(([x, y]) => (
          <g key={x}>
            <path d={`M${x},${y + 7} L${382 + (x - 382) * 0.4},96`} />
            <circle cx={x} cy={y} r="7" fill="var(--paper)" />
          </g>
        ))}
        <path d="M474,150 l5,4 l-5,4 M474,172 l5,4 l-5,4 M474,194 l5,4 l-5,4" />
      </g>
      <circle r="4" className="sk-tok">
        <animateMotion dur="3.6s" repeatCount="indefinite" path="M100,122 H456" />
      </circle>
      <T x={56} y={80} k="ink" a="middle" s={13} w={700}>SAP</T>
      <T x={56} y={188} a="middle">PRODUCTION</T>
      <T x={56} y={201} a="middle">QUALITY · LOGISTICS</T>
      {med.map((m) => (
        <T key={m.t} x={m.x + 26} y={126} a="middle" k="ink" w={700}>
          {m.t}
        </T>
      ))}
      <T x={218} y={172} a="middle">DATABRICKS · DELTA</T>
      <T x={218} y={76} a="middle" k="pk" s={15} w={700}>−85% BUILD TIME</T>
      {agents.map(([x, y, t]) => (
        <T key={t} x={x} y={y - 12} a="middle" s={8.5}>
          {t}
        </T>
      ))}
      <T x={382} y={120} a="middle" k="pk" w={700}>AGENT</T>
      <T x={382} y={133} a="middle" k="pk" w={700}>TEAM</T>
      <T x={382} y={172} a="middle">CHECKED BY EVALS</T>
      <T x={474} y={78} k="ink" w={700}>SCORECARD</T>
      <T x={486} y={146} k="pk" s={8.5} w={700}>ACTIONS</T>
      <T x={562} y={41} a="end">MONTHLY · AUTO</T>
    </svg>
  );
}

/* ---------- 02 MOOBOX — one customer, and the next move predicted.
   Who they are (CRM), what they ordered, what reached the door
   (fulfilment), joined on the customer; the lifecycle runs on its own. ---------- */

export function MooVisual() {
  const C = { x: 488, y: 118, r: 58 };
  const stages: [string, number, number][] = [
    ["NEW", C.x, C.y - C.r],
    ["ACTIVE", C.x + C.r, C.y],
    ["AT RISK", C.x, C.y + C.r],
    ["WON BACK", C.x - C.r, C.y]
  ];
  const src: [string, string][] = [
    ["CRM", "WHO"],
    ["ORDERS", "WHAT"],
    ["FULFILMENT", "DELIVERED"]
  ];
  return (
    <svg className="sk sk-moo" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet">
      <Hatch id="skh-moo" />
      <g className="sk-ln">
        {src.map(([s], i) => (
          <rect key={s} x="10" y={54 + i * 52} width="112" height="36" rx="18" />
        ))}
        <path d="M122,72 C152,72 150,122 178,124 M122,124 H178 M122,176 C152,176 150,126 178,124" />
        <path d="M172,118 L178,124 L172,130" />
        {/* the customer, at last in one place */}
        <rect x="184" y="44" width="172" height="160" rx="10" />
        {/* a milk bottle, standing in for the avatar */}
        <path d="M206,64 h12 v8 c6,4 8,8 8,14 v28 h-28 v-28 c0,-6 2,-10 8,-14 Z" />
        <path d="M198,96 h28" className="sk-faint" />
        <path d="M200,146 H340" className="sk-faint" />
        <rect x="200" y="178" width="140" height="12" rx="3" />
        <rect x="200" y="178" width="96" height="12" rx="3" fill="url(#skh-moo)" />
        {/* the lifecycle */}
        <circle cx={C.x} cy={C.y} r={C.r} />
        {stages.map(([t, x, y]) => (
          <circle key={t} cx={x} cy={y} r="6" fill="var(--paper)" />
        ))}
      </g>
      <circle r="6" className="sk-tok">
        <animateMotion dur="6s" repeatCount="indefinite" path={`M${C.x},${C.y - C.r} A${C.r},${C.r} 0 1,1 ${C.x - 0.1},${C.y - C.r}`} />
      </circle>
      <T x={269} y={30} a="middle">50K+ ORDERS / DAY</T>
      <T x={240} y={74} k="ink" w={700}>CUSTOMER</T>
      <T x={240} y={89}>#48213</T>
      <T x={240} y={110} k="pk" w={700}>REPEAT</T>
      <T x={200} y={140}>NEXT ORDER · TUE</T>
      <T x={200} y={156} k="pk" w={700}>↑ PREDICTED</T>
      {src.map(([s, sub], i) => (
        <g key={s}>
          <T x={66} y={70 + i * 52} a="middle" k="ink" w={700}>
            {s}
          </T>
          <T x={66} y={82 + i * 52} a="middle" s={8}>
            {sub}
          </T>
        </g>
      ))}
      <T x={C.x} y={C.y - C.r - 12} a="middle" k="ink">NEW</T>
      <T x={C.x + C.r + 12} y={C.y + 4} k="ink">ACTIVE</T>
      <T x={C.x} y={C.y + C.r + 20} a="middle" k="ink">AT RISK</T>
      <T x={C.x - C.r - 12} y={C.y - 10} a="end" k="ink">WON</T>
      <T x={C.x - C.r - 12} y={C.y + 2} a="end" k="ink">BACK</T>
      <T x={C.x} y={C.y - 6} a="middle" k="pk" s={15} w={700}>+11%</T>
      <T x={C.x} y={C.y + 8} a="middle">REPEAT</T>
      <T x={C.x} y={C.y + 26} a="middle" k="pk" w={700}>+13%</T>
      <T x={C.x} y={C.y + 39} a="middle">CROSS-SELL</T>
    </svg>
  );
}

/* ---------- 03 UCLA — a Lean line, running as an app ---------- */

export function UclaVisual() {
  const st = [44, 134, 224, 314];
  return (
    <svg className="sk sk-ucla" viewBox="0 0 380 250" preserveAspectRatio="xMidYMid meet">
      <Hatch id="skh-ucla" />
      <g className="sk-ln">
        <rect x="8" y="10" width="364" height="230" rx="10" />
        <path d="M8,38 H372" />
        <circle cx="24" cy="24" r="4" />
        <circle cx="38" cy="24" r="4" />
        <circle cx="52" cy="24" r="4" />
        {/* the line: four stations on a conveyor */}
        <path d="M24,150 H356" />
        {st.map((x, i) => (
          <rect key={x} x={x - 26} y="98" width="52" height="40" rx="6" fill={i === 2 ? "none" : "var(--paper)"} />
        ))}
        {/* work piling up in front of the bottleneck */}
        {[0, 1, 2].map((k) => (
          <rect key={k} x={170 + k * 10} y={144 - k * 9} width="9" height="9" rx="1.5" fill="url(#skh-ucla)" />
        ))}
        <path d="M34,206 H346" className="sk-faint" />
      </g>
      <g className="sk-ln sk-pkline">
        <rect x="198" y="98" width="52" height="40" rx="6" />
      </g>
      <rect width="9" height="9" rx="1.5" className="sk-tok" y="-4.5" x="-4.5">
        <animateMotion dur="4s" repeatCount="indefinite" path="M24,146 H356" />
      </rect>
      <T x={70} y={28} k="ink" w={700}>LEAN OPS SIM</T>
      <T x={358} y={28} a="end">ROUND 3 / 5</T>
      {["CUT", "SEW", "QC", "PACK"].map((t, i) => (
        <T key={t} x={st[i]} y={122} a="middle" k={i === 2 ? "pk" : "ink"} w={700}>
          {t}
        </T>
      ))}
      <T x={224} y={86} a="middle" k="pk">BOTTLENECK</T>
      <T x={24} y={180}>CYCLE 42s · WIP 6 · WHAT-IF ▸</T>
      <T x={24} y={226} k="ink" w={700}>~600 PEOPLE · 7 COURSES</T>
      <T x={356} y={226} a="end" k="pk" w={700}>~35% FASTER</T>
    </svg>
  );
}

/* ---------- 04 CLINICAL — every trial, ranked by risk ---------- */

export function ClinVisual() {
  const rows: [string, number][] = [
    ["NCT·····214", 0.91],
    ["NCT·····087", 0.74],
    ["NCT·····530", 0.58],
    ["NCT·····361", 0.41],
    ["NCT·····902", 0.22]
  ];
  return (
    <svg className="sk sk-clin" viewBox="0 0 380 250" preserveAspectRatio="xMidYMid meet">
      <Hatch id="skh-clin" />
      <Hatch id="skh-clin-pk" pk />
      <g className="sk-ln">
        {rows.map(([, r], i) => (
          <rect key={i} x="98" y={44 + i * 34} width={r * 110} height="14" rx="3" fill={i === 0 ? "url(#skh-clin-pk)" : "url(#skh-clin)"} />
        ))}
        {/* the ROC, for the reader who wants to know if it is any good */}
        <path d="M262,196 V64 M262,196 H366" />
        <path d="M262,196 L366,64" className="sk-faint" strokeDasharray="3 3" />
      </g>
      <g className="sk-ln sk-pkline">
        <rect x="6" y="36" width="244" height="30" rx="6" />
        <path d="M262,196 C268,128 292,92 366,72" />
      </g>
      <T x={6} y={22} k="ink" w={700}>TRIALS · BY TERMINATION RISK</T>
      {rows.map(([id, r], i) => (
        <g key={id}>
          <T x={14} y={55 + i * 34} k={i === 0 ? "pk" : "ink"}>{id}</T>
          <T x={244} y={55 + i * 34} a="end" k={i === 0 ? "pk" : undefined} w={i === 0 ? 700 : undefined}>
            {r.toFixed(2).slice(1)}
          </T>
        </g>
      ))}
      <T x={256} y={55} k="pk" w={700}>← OPEN FIRST</T>
      <T x={314} y={214} a="middle">ROC</T>
      <T x={330} y={150} a="middle" k="pk" s={15} w={700}>.71</T>
      <T x={330} y={164} a="middle">AUC</T>
      <T x={374} y={22} a="end">118 GB · 111K TRIALS</T>
    </svg>
  );
}

/* ---------- 05 BRAIN — throw anything in; ask for it back any time,
   and get it with receipts ---------- */

const INTAKE = ["NOTES", "JDS", "PAPERS", "EXPERTS", "CHATS"];

export function BrainVisual() {
  /* The example asks across sources rather than for one fact: the answer
     is drawn from job posts and research together, which is the point of
     keeping everything in one place. */
  const passages: [string, string, string, boolean?][] = [
    ["P1", ".88", "JD", true],
    ["P2", ".81", "EXPERT"],
    ["P3", ".77", "PAPER"]
  ];
  return (
    <svg className="sk sk-brain" viewBox="0 0 370 524" preserveAspectRatio="xMidYMid meet">
      {/* anything goes in — and stays */}
      <g className="sk-ln">
        {INTAKE.map((t, i) => (
          <rect key={t} x={10 + i * 70} y="8" width="62" height="26" rx="13" />
        ))}
        {INTAKE.map((t, i) => (
          <path key={t} d={`M${41 + i * 70},34 C${41 + i * 70},50 185,46 185,62`} className="sk-faint" />
        ))}
        <ellipse cx="185" cy="66" rx="70" ry="10" />
        <path d="M115,66 V86 C115,99 255,99 255,86 V66" />
      </g>
      {INTAKE.map((t, i) => (
        <T key={t} x={41 + i * 70} y={25} a="middle" k="ink" s={9}>
          {t}
        </T>
      ))}
      <T x={185} y={88} a="middle" k="pk" w={700}>NEVER FORGETS</T>
      <g transform="translate(0 104)">
      <g className="sk-ln">
        {/* search: three ways in, one ranking out */}
        <path d="M185,70 V84" />
        {[60, 185, 310].map((x) => (
          <rect key={x} x={x - 52} y="86" width="104" height="28" rx="14" />
        ))}
        <path d="M60,114 C60,130 185,124 185,140 M185,114 V140 M310,114 C310,130 185,124 185,140" />
        <rect x="120" y="140" width="130" height="28" rx="6" />
        <path d="M185,168 V196" />
        {/* passages, ranked */}
        {passages.map(([p], i) => (
          <g key={p}>
            <rect x="20" y={198 + i * 40} width="330" height="32" rx="6" fill="var(--paper)" />
            <path d={`M146,${210 + i * 40} H${330 - i * 40} M146,${219 + i * 40} H${290 - i * 30}`} className="sk-faint" />
          </g>
        ))}
        {/* the three shown are the top of a deeper pile */}
        <path d="M24,314 H346 M30,318 H340" className="sk-faint" />
        <path d="M185,320 V328" />
        <rect x="20" y="330" width="330" height="64" rx="10" />
      </g>
      <g className="sk-ln sk-pkline">
        <rect x="20" y="16" width="330" height="54" rx="27" />
        <rect x="20" y="198" width="330" height="32" rx="6" />
      </g>
      <circle r="4" className="sk-tok">
        <animateMotion dur="3.6s" repeatCount="indefinite" path="M185,70 V140 M185,168 V196" />
      </circle>
      <T x={185} y={40} a="middle" k="ink" s={12} w={700}>“WHAT IS PHARMA TRYING</T>
      <T x={185} y={56} a="middle" k="ink" s={12} w={700}>TO SOLVE WITH AI?”</T>
      {["VECTOR", "KEYWORD", "GRAPH"].map((t, i) => (
        <T key={t} x={60 + i * 125} y={104} a="middle" k="ink">
          {t}
        </T>
      ))}
      <T x={185} y={158} a="middle" k="ink" w={700}>RERANK</T>
      {passages.map(([p, sc, src, top], i) => (
        <g key={p}>
          <T x={96} y={218 + i * 40} k={top ? "pk" : undefined}>{src}</T>
          <T x={34} y={218 + i * 40} k={top ? "pk" : "ink"} w={700}>
            [{p}]
          </T>
          <T x={64} y={218 + i * 40} k={top ? "pk" : undefined}>{sc}</T>
        </g>
      ))}
      <T x={36} y={354} k="ink">FASTER TRIALS, SILOED DATA,</T>
      <T x={36} y={369} k="ink">AI THEY CAN VALIDATE. [P1–P45]</T>
      <T x={36} y={386}>30 JDS · 5 PAPERS · 10 EXPERTS</T>
      <T x={350} y={324} a="end">+42 MORE</T>
      <T x={336} y={386} a="end" k="pk" w={700}>✓ VERIFIED</T>
      <T x={185} y={412} a="middle">SERVED TO CLAUDE OVER MCP</T>
      </g>
    </svg>
  );
}

/* ---------- 06 NEXT — a roadmap line, the next builds on it ---------- */

export function NextVisual() {
  const stops = [
    { x: 12, y: 62, t: "SCOPING", s: "done" },
    { x: 50, y: 38, t: "BUILD", s: "now" },
    { x: 88, y: 62, t: "SHIP", s: "next" }
  ];
  return (
    <div className="v-next">
      <svg className="v-wires v-wires--road" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 70 C6 70 8 62 12 62 C28 62 34 38 50 38 C66 38 72 62 88 62 C92 62 94 70 100 70" />
      </svg>
      {stops.map((s) => (
        <span key={s.t} className={`v-stop is-${s.s}`} style={v({ "--x": `${s.x}%`, "--y": `${s.y}%` })}>
          <i />
          <span className="v-cap">{s.t}</span>
        </span>
      ))}
    </div>
  );
}
