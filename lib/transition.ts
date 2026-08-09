/* Page-transition bus: TransitionLink asks for a wipe; Shell owns the panel.
   The WebGL canvas lives outside the swapped tree and never unmounts. */

type Handler = (href: string) => void;
let handler: Handler | null = null;

export const onTransition = (h: Handler) => { handler = h; };
export const requestTransition = (href: string) => {
  if (handler) handler(href);
  else window.location.assign(href);
};
