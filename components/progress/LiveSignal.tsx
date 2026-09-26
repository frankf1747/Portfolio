import type { Ref } from "react";
import "./live-signal.scss";

/* The "LIVE" mark beside the landing page's PROJECTS heading — the way in to
   /progress. It is a static signal, not a connection: the landing page stays
   free of the Supabase client, and the progress page itself is what is live.

   Sized and set like the heading's (3) superscript so the two read as one
   caption; the dot is the only thing on the heading in the mark colour.
   `textRef` lets the heading re-decode the word on hover. */
export default function LiveSignal({ textRef }: { textRef?: Ref<HTMLSpanElement> }) {
  return (
    <span className="live-signal">
      <i className="live-signal__dot" aria-hidden="true" />
      <span className="live-signal__text" ref={textRef}>
        LIVE
      </span>
      <span className="live-signal__arrow" aria-hidden="true">
        ↗
      </span>
      <span className="u-sr"> — see live progress on every project</span>
    </span>
  );
}
