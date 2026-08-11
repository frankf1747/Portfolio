/* ============================================================
   Per-focus motifs — faint structural drawings that surface inside the
   artwork when their state is active, giving DATA / PRODUCT / DESIGN a
   personality beyond palette. They sit behind the typography, at low
   opacity, and never carry meaning (state is announced by the h1 and
   the aria-pressed selector), so the whole group is decorative.
   ============================================================ */

export default function FocusMotifs() {
  return (
    <div className="c-motifs" aria-hidden="true">
      {/* DATA — dot lattice + a small network graph */}
      <svg className="c-motif" data-m="data" viewBox="0 0 260 200" style={{ left: "9%", top: "58%", width: "clamp(140px, 15vw, 240px)" }}>
        <g fill="var(--c-cyan)">
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={14 + (i % 6) * 26} cy={14 + Math.floor(i / 6) * 26} r="2.4" />
          ))}
        </g>
        <g stroke="var(--c-turquoise)" strokeWidth="1.4" fill="none">
          <path d="M30 150 L 86 122 L 148 156 L 204 118 L 244 146" />
          <path d="M86 122 L 148 96 L 204 118" />
        </g>
        <g fill="var(--c-turquoise)">
          <circle cx="30" cy="150" r="4" />
          <circle cx="86" cy="122" r="4" />
          <circle cx="148" cy="156" r="4" />
          <circle cx="148" cy="96" r="4" />
          <circle cx="204" cy="118" r="4" />
          <circle cx="244" cy="146" r="4" />
        </g>
      </svg>
      <svg className="c-motif" data-m="data" viewBox="0 0 220 140" style={{ left: "78%", top: "20%", width: "clamp(120px, 13vw, 200px)" }}>
        {/* tiny bar chart */}
        <g fill="var(--c-green)">
          <rect x="12" y="84" width="18" height="44" />
          <rect x="42" y="60" width="18" height="68" />
          <rect x="72" y="96" width="18" height="32" />
          <rect x="102" y="38" width="18" height="90" />
          <rect x="132" y="72" width="18" height="56" />
        </g>
        <path d="M8 30 C 50 44, 110 8, 168 24" stroke="var(--c-cyan)" strokeWidth="2" fill="none" />
      </svg>

      {/* PRODUCT — connected blocks + arrows */}
      <svg className="c-motif" data-m="product" viewBox="0 0 260 160" style={{ left: "74%", top: "62%", width: "clamp(140px, 15vw, 240px)" }}>
        <g fill="none" stroke="var(--c-amber)" strokeWidth="2">
          <rect x="10" y="18" width="52" height="34" rx="4" />
          <rect x="104" y="10" width="52" height="34" rx="4" />
          <rect x="104" y="70" width="52" height="34" rx="4" />
          <rect x="198" y="40" width="52" height="34" rx="4" />
          <path d="M62 35 L 100 27" />
          <path d="M62 40 L 100 84" />
          <path d="M156 27 L 194 52" />
          <path d="M156 87 L 194 62" />
        </g>
        <g fill="var(--c-orange)">
          <path d="M100 27 L 90 21 L 92 31 Z" />
          <path d="M100 84 L 90 78 L 91 89 Z" />
          <path d="M194 52 L 184 46 L 185 57 Z" />
          <path d="M194 62 L 184 58 L 185 68 Z" />
        </g>
        <path d="M20 130 L 120 130 M 120 130 L 108 122 M 120 130 L 108 138" stroke="var(--c-yellow)" strokeWidth="2.4" fill="none" />
      </svg>
      <svg className="c-motif" data-m="product" viewBox="0 0 180 120" style={{ left: "10%", top: "16%", width: "clamp(100px, 11vw, 170px)" }}>
        <g fill="none" stroke="var(--c-orange)" strokeWidth="2">
          <path d="M12 96 L 84 40 L 156 88" />
          <path d="M84 40 L 84 12 M 84 12 L 74 24 M 84 12 L 94 24" />
        </g>
      </svg>

      {/* DESIGN — free gesture lines */}
      <svg className="c-motif" data-m="design" viewBox="0 0 260 180" style={{ left: "10%", top: "22%", width: "clamp(140px, 15vw, 240px)" }}>
        <g fill="none" strokeLinecap="round">
          <path d="M12 140 C 60 40, 140 20, 180 74 C 214 118, 160 160, 118 132 C 84 110, 110 66, 150 70" stroke="var(--c-magenta)" strokeWidth="5" />
          <path d="M30 40 C 90 70, 180 40, 244 68" stroke="var(--c-cyan)" strokeWidth="3.4" />
          <path d="M60 164 C 120 148, 190 158, 240 140" stroke="var(--c-yellow)" strokeWidth="3" />
        </g>
      </svg>
      <svg className="c-motif" data-m="design" viewBox="0 0 200 140" style={{ left: "76%", top: "70%", width: "clamp(110px, 12vw, 190px)" }}>
        <g fill="none" strokeLinecap="round">
          <path d="M10 110 C 50 30, 120 20, 150 60 C 176 94, 140 126, 104 108" stroke="var(--c-violet)" strokeWidth="4.4" />
          <path d="M40 20 C 90 44, 150 28, 192 50" stroke="var(--c-pink)" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}
