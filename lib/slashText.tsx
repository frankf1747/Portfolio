import { ReactNode } from "react";

/* Wrap every character in its own <i> so we get per-char animation hooks,
   and tag capital I's so they render as the slashed form. */
export function slashChars(text: string, keyPrefix: string): ReactNode[] {
  return text.split("").map((ch, i) => {
    const isI = ch === "I";
    const isSep = ch === "▸";
    const cls =
      "c-Char" + (isI ? " is-slashed" : "") + (isSep ? " is-sep" : "");
    return (
      <i className={cls} key={`${keyPrefix}-${i}`} aria-hidden="true">
        {ch === " " ? " " : ch}
      </i>
    );
  });
}

/** Accessible title text — the visual layer is aria-hidden per-char */
export const plainTitle = (client: string, descriptor: string) =>
  `${client} — ${descriptor}`;
