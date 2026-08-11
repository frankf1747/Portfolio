import { strokes, burstVector, isStroked, type Stroke, type StrokeLayer } from "@/lib/strokes";

/* Every mark here is decoration. The hero's meaning lives in the <h1> and the
   nav, so the whole field is hidden from assistive tech.

   The #fx-rough-* displacement filters referenced below are defined once in
   Hero.tsx — they warp each path's silhouette so it reads as paint. */

function Mark({ s }: { s: Stroke }) {
  const { bx, by } = burstVector(s);
  const stroked = isStroked(s.kind);

  const lineProps = {
    fill: "none",
    stroke: `var(${s.color})`,
    strokeWidth: s.width ?? 8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1
  };

  let art: React.ReactNode;

  if (s.src) {
    /* REPLACE-ME branch: a prepared transparent asset (PNG/WebP/SVG file)
       stands in for the inline path. Positioning/motion stay identical. */
    art = null;
  } else if (stroked) {
    const paths = s.paths ?? [s.d ?? ""];
    art = (
      <g filter={`url(#fx-rough-${s.fx})`}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            {...lineProps}
            className="c-mark__draw"
            style={{ "--sub": `${i * 70}ms` } as React.CSSProperties}
          />
        ))}
      </g>
    );
  } else {
    /* Filled painted shapes. Grouped `paths` (dry-brush slivers, splash
       droplets) build up unevenly via decreasing opacity. */
    const paths = s.paths ?? [s.d ?? ""];
    art = (
      <g filter={`url(#fx-rough-${s.fx})`}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={`var(${s.color})`} opacity={1 - i * 0.1} />
        ))}
      </g>
    );
  }

  return (
    <div
      className="c-mark"
      data-family={s.family}
      data-shed={s.shed}
      style={
        {
          "--x": `${s.x}%`,
          "--y": `${s.y}%`,
          "--s": s.scale,
          "--r": `${s.rotate}deg`,
          "--o": s.opacity,
          "--bx": bx,
          "--by": by,
          "--dur": `${s.dur}s`,
          "--order": s.order
        } as React.CSSProperties
      }
    >
      <div className="c-mark__burst">
        <div className="c-mark__drift" data-drift={s.drift}>
          {s.src ? (
            <img src={s.src} width={s.w} height={s.h} alt="" loading="lazy" />
          ) : (
            <svg viewBox={s.vb} width={s.w} height={s.h} focusable="false">
              {art}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrushField({ layer }: { layer: StrokeLayer }) {
  return (
    <div className="c-field" data-layer={layer} aria-hidden="true">
      {strokes
        .filter((s) => s.layer === layer)
        .map((s) => (
          <Mark key={s.id} s={s} />
        ))}
    </div>
  );
}
