"use client";

import { useEffect, useState } from "react";

/* ============================================================
   The 12-column review grid. Ported from the wireframe's DCLogic:
   state.grid toggles on the [G] key or the button, and the overlay
   is the design's own self-documentation — a design-engineer
   portfolio that shows its scaffolding on request.

   Ignores the key while typing in a field, same as the source.
   ============================================================ */

export default function GridOverlay() {
  const [grid, setGrid] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if ((e.key || "").toLowerCase() !== "g") return;
      setGrid((g) => !g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="sk-grid" data-on={grid ? "true" : "false"} aria-hidden="true">
        <div className="sk-grid__inner">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="sk-grid__col" />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="sk-gridbtn"
        aria-pressed={grid}
        onClick={() => setGrid((g) => !g)}
      >
        [ G ] 12-col grid
      </button>
    </>
  );
}
