/* The owner's hand-picked order for the overview: pure helpers, so the drag
   UI only has to say "this card moved from i to j". */

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* Positions run 1..n in the new order. Only rows whose stored position
   differs are returned, so a move writes as few rows as it can. */
export function positionChanges(
  order: string[],
  current: Record<string, number | null>
): { slug: string; position: number }[] {
  return order
    .map((slug, i) => ({ slug, position: i + 1 }))
    .filter(({ slug, position }) => current[slug] !== position);
}
