export function applyAdminOrder<T extends { id: string }>(products: T[], ids: string[]): T[] {
  const ranks = new Map(ids.map((id, index) => [id, index]));
  return [...products].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity));
}

export function reorderFullList(ids: string[], visibleIds: string[], active: string, over: string, filtered = false): string[] | null {
  if (filtered || ids.length !== visibleIds.length || ids.some((id, i) => id !== visibleIds[i])) return null;
  const from = ids.indexOf(active), to = ids.indexOf(over);
  if (from < 0 || to < 0 || from === to) return null;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, active);
  return next;
}