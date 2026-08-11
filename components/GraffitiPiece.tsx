import type { Focus } from "./Hero";

/* ============================================================
   The piece — the rotating hero lettering, built like a throw-up:
     halo   : soft overspray glow behind everything
     block  : the 3D drop-block, offset down-right
     face   : textured fill (gradient + leopard spots) with a thick
              keyline via text-stroke
   plus paint drips hanging from the baseline. Each title carries its
   own colourway through CSS vars set by [data-p].
   ============================================================ */

export type PieceDef = {
  id: Focus;
  label: string;
  lines: [string, string];
  index: string;
};

export const PIECES: PieceDef[] = [
  { id: "data", label: "DATA ENTHUSIAST", lines: ["DATA", "ENTHUSIAST"], index: "01" },
  { id: "product", label: "PRODUCT CREATOR", lines: ["PRODUCT", "CREATOR"], index: "02" },
  { id: "design", label: "UX DESIGNER", lines: ["UX", "DESIGNER"], index: "03" }
];

function PieceWord({ p, state }: { p: PieceDef; state: string }) {
  return (
    <span className="g-piece__item" data-p={p.id} data-state={state}>
      {p.lines.map((line, li) => (
        <span key={li} className="g-piece__line">
          <span className="g-piece__halo">{line}</span>
          <span className="g-piece__block">{line}</span>
          <span className="g-piece__face">{line}</span>
        </span>
      ))}
      {/* drips off the baseline; the long one keeps slowly creeping */}
      {/* uniform scaling keeps the rounded drip tips round */}
      <svg className="g-piece__drips" viewBox="0 0 600 120" preserveAspectRatio="xMidYMin meet">
        <g fill="var(--p-drip)" opacity="0.92">
          <path className="g-drip" d="M86 0 h26 v40 c0 12 -6 20 -13 20 c-8 0 -13 -8 -13 -19 Z" />
          <path className="g-drip g-drip--slow" d="M258 0 h20 v76 c0 10 -4 16 -10 16 c-6 0 -10 -6 -10 -15 Z" />
          <path className="g-drip" d="M448 0 h24 v52 c0 11 -5 18 -12 18 c-7 0 -12 -7 -12 -17 Z" />
        </g>
      </svg>
    </span>
  );
}

export default function GraffitiPiece({
  focus,
  leaving,
  wordState
}: {
  focus: Focus;
  leaving: Focus | null;
  wordState: (id: Focus) => "active" | "leaving" | "idle";
}) {
  return (
    <h1 className="g-piece" id="hero-title">
      <span className="u-sr">
        Frank Fu — data enthusiast, product creator, UX designer.
      </span>
      <span className="g-piece__stack" aria-hidden="true">
        {PIECES.map((p) => (
          <PieceWord key={p.id} p={p} state={wordState(p.id)} />
        ))}
      </span>
    </h1>
  );
}
