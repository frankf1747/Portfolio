import type { ReactNode } from "react";
import type { LiveState } from "@/lib/progress/useLive";

export default function LoadGate<T>({
  state,
  retry,
  children
}: {
  state: LiveState<T>;
  retry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === "loading") return <p className="small pg__note">LOADING…</p>;
  if (state.status === "error") {
    return (
      <p className="small pg__note">
        COULDN&apos;T LOAD PROGRESS.{" "}
        <button className="link-b" onClick={retry}>
          RETRY
        </button>
      </p>
    );
  }
  return <>{children(state.data)}</>;
}
