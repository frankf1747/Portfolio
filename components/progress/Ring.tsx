const R = 26;
const C = 2 * Math.PI * R;

export default function Ring({ pct }: { pct: number }) {
  return (
    <svg className="pg-ring" viewBox="0 0 64 64" role="img" aria-label={`${pct}% complete`}>
      <circle className="pg-ring__track" cx="32" cy="32" r={R} />
      <circle
        className="pg-ring__fill"
        cx="32"
        cy="32"
        r={R}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct / 100)}
        transform="rotate(-90 32 32)"
      />
      <text className="pg-ring__label" x="32" y="32" textAnchor="middle" dominantBaseline="central">
        {pct}%
      </text>
    </svg>
  );
}
