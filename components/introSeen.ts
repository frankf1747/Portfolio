/* One overture per session.

   The landing plays a ~5.8s launch with the scroll locked the whole way —
   right for a first arrival, hostile on every return: browser back from a
   project page or the ALL PROJECTS link remounts the landing, replayed the
   full launch, and ate ~7s of scroll input (the "page won't scroll" bug).

   sessionStorage, not localStorage, on purpose: a fresh session should get
   the overture again. Guarded because storage access throws in some
   private-browsing modes — a visitor there just sees the overture on every
   visit, which is the pre-existing behaviour, not a break. */

const KEY = "ff:intro-seen";

export const introSeen = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const markIntroSeen = (): void => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* private mode — see above */
  }
};
